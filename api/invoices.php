<?php
// invoices.php - Invoicing API (lock-and-track)
// An invoice snapshots a board's unbilled time for a period: one line per task with
// billed minutes, the rate at creation, and amount. Linked time entries are locked.
//
// Billing rule (matches the client): each task's daily total rounds UP to 15 min.
// Unbilled minutes for a task-day = billed(all finished time) - billed(already invoiced time),
// so time added to an already-invoiced day bills only what it adds.
require_once 'config.php';
require_once __DIR__ . '/journal_helper.php';

startSecureSession();

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
    validateCsrf();
}

if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Authentication required'], 401);
}

$database = new Database();
$pdo = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$userId = (int)$_SESSION['user_id'];

switch ($method) {
    case 'GET':
        if (($_GET['action'] ?? '') === 'preview') {
            previewInvoice($pdo, $userId);
        } else {
            listInvoices($pdo, $userId);
        }
        break;
    case 'POST':
        $action = $_GET['action'] ?? 'create';
        if ($action === 'create') {
            createInvoice($pdo, $userId);
        } elseif ($action === 'status') {
            setInvoiceStatus($pdo, $userId);
        } else {
            sendResponse(['error' => 'Invalid action'], 400);
        }
        break;
    case 'DELETE':
        deleteInvoice($pdo, $userId);
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

// ── Helpers ─────────────────────────────────────────────────────────

function invBilledMinutes($seconds) {
    return $seconds <= 0 ? 0 : (int)ceil($seconds / 900) * 15;
}

function invFormatMinutes($minutes) {
    $h = intdiv($minutes, 60);
    $m = $minutes % 60;
    if ($h === 0) return $m . 'm';
    return $m === 0 ? $h . 'h' : $h . 'h ' . $m . 'm';
}

function invTimezone($value) {
    try {
        return new DateTimeZone(is_string($value) && $value !== '' ? $value : 'UTC');
    } catch (Exception $e) {
        return new DateTimeZone('UTC');
    }
}

function requireDate($value, $field) {
    if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        sendResponse(['error' => "Field '$field' must be YYYY-MM-DD"], 400);
    }
    return $value;
}

function requireOwnedBoard($pdo, $userId, $boardId) {
    $stmt = $pdo->prepare("SELECT id, name FROM boards WHERE id = ? AND user_id = ?");
    $stmt->execute([$boardId, $userId]);
    $board = $stmt->fetch();
    if (!$board) {
        sendResponse(['error' => 'Board not found or access denied'], 404);
    }
    return $board;
}

/** Strip characters that aren't allowed in file names (the number doubles as a PDF name). */
function filenameSafe($text) {
    return trim(preg_replace('/[\\\\\/:*?"<>|]+/', '', $text));
}

/**
 * Compute unbilled lines for a board over local dates [start, end].
 * Returns ['lines' => [...], 'entryIds' => [...], 'minutes' => int, 'total' => float].
 */
function computeUnbilled($pdo, $userId, $boardId, $start, $end, DateTimeZone $tz) {
    $utc = new DateTimeZone('UTC');
    $from = (new DateTime($start . ' 00:00:00', $tz))->setTimezone($utc)->format('Y-m-d H:i:s');
    $to = (new DateTime($end . ' 00:00:00', $tz))->modify('+1 day')->setTimezone($utc)->format('Y-m-d H:i:s');

    $stmt = $pdo->prepare("
        SELECT te.id, te.task_id, te.started_at, te.invoice_id,
               TIMESTAMPDIFF(SECOND, te.started_at, te.ended_at) AS seconds,
               t.title, t.position, t.hourly_rate AS task_rate, b.hourly_rate AS board_rate
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        JOIN boards b ON t.board_id = b.id
        WHERE te.user_id = ? AND b.id = ? AND b.user_id = ?
          AND te.ended_at IS NOT NULL
          AND te.started_at >= ? AND te.started_at < ?
        ORDER BY te.started_at ASC
    ");
    $stmt->execute([$userId, $boardId, $userId, $from, $to]);

    $tasks = [];
    foreach ($stmt->fetchAll() as $row) {
        $taskId = (int)$row['task_id'];
        if (!isset($tasks[$taskId])) {
            $rate = $row['task_rate'] !== null ? (float)$row['task_rate']
                  : ($row['board_rate'] !== null ? (float)$row['board_rate'] : null);
            $tasks[$taskId] = ['title' => $row['title'], 'rate' => $rate, 'days' => [], 'entryIds' => []];
        }
        $day = (new DateTime($row['started_at'], $utc))->setTimezone($tz)->format('Y-m-d');
        if (!isset($tasks[$taskId]['days'][$day])) {
            $tasks[$taskId]['days'][$day] = ['all' => 0, 'invoiced' => 0];
        }
        $seconds = (int)$row['seconds'];
        $tasks[$taskId]['days'][$day]['all'] += $seconds;
        if ($row['invoice_id'] !== null) {
            $tasks[$taskId]['days'][$day]['invoiced'] += $seconds;
        } else {
            $tasks[$taskId]['entryIds'][] = (int)$row['id'];
        }
    }

    $lines = [];
    $entryIds = [];
    $totalMinutes = 0;
    $total = 0.0;
    foreach ($tasks as $taskId => $task) {
        if (!$task['entryIds']) continue; // nothing unbilled on this task
        $entryIds = array_merge($entryIds, $task['entryIds']);

        $minutes = 0;
        foreach ($task['days'] as $d) {
            $minutes += invBilledMinutes($d['all']) - invBilledMinutes($d['invoiced']);
        }
        if ($minutes <= 0) continue; // covered by already-invoiced rounding — lock entries, no line

        $amount = $task['rate'] === null ? 0.0 : round($minutes / 60 * $task['rate'], 2);
        $lines[] = [
            'taskId'      => $taskId,
            'description' => $task['title'],
            'minutes'     => $minutes,
            'rate'        => $task['rate'],
            'amount'      => $amount,
        ];
        $totalMinutes += $minutes;
        $total += $amount;
    }

    usort($lines, fn($a, $b) => $b['minutes'] <=> $a['minutes']);

    return ['lines' => $lines, 'entryIds' => $entryIds, 'minutes' => $totalMinutes, 'total' => round($total, 2)];
}

function formatInvoice($row, $lines) {
    return [
        'id'          => (int)$row['id'],
        'boardId'     => (int)$row['board_id'],
        'boardName'   => $row['board_name'],
        'number'      => $row['number'],
        'status'      => $row['status'],
        'issueDate'   => $row['issue_date'],
        'periodStart' => $row['period_start'],
        'periodEnd'   => $row['period_end'],
        'minutes'     => (int)$row['minutes'],
        'total'       => (float)$row['total'],
        'paidAt'      => toIsoUtc($row['paid_at']),
        'lines'       => array_map(fn($l) => [
            'taskId'      => $l['task_id'] !== null ? (int)$l['task_id'] : null,
            'description' => $l['description'],
            'minutes'     => (int)$l['minutes'],
            'rate'        => $l['rate'] !== null ? (float)$l['rate'] : null,
            'amount'      => (float)$l['amount'],
        ], $lines),
    ];
}

function fetchInvoice($pdo, $userId, $invoiceId) {
    $stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ? AND user_id = ?");
    $stmt->execute([$invoiceId, $userId]);
    $invoice = $stmt->fetch();
    if (!$invoice) {
        sendResponse(['error' => 'Invoice not found or access denied'], 404);
    }
    return $invoice;
}

function fetchLines($pdo, $invoiceId) {
    $stmt = $pdo->prepare("SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY position ASC, id ASC");
    $stmt->execute([$invoiceId]);
    return $stmt->fetchAll();
}

// ── Endpoints ───────────────────────────────────────────────────────

function listInvoices($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM invoices WHERE user_id = ? ORDER BY issue_date DESC, id DESC");
        $stmt->execute([$userId]);
        $invoices = $stmt->fetchAll();

        $linesByInvoice = [];
        if ($invoices) {
            $ids = array_map(fn($i) => (int)$i['id'], $invoices);
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $lineStmt = $pdo->prepare("SELECT * FROM invoice_lines WHERE invoice_id IN ($placeholders) ORDER BY position ASC, id ASC");
            $lineStmt->execute($ids);
            foreach ($lineStmt->fetchAll() as $line) {
                $linesByInvoice[(int)$line['invoice_id']][] = $line;
            }
        }

        sendResponse(array_map(fn($i) => formatInvoice($i, $linesByInvoice[(int)$i['id']] ?? []), $invoices));
    } catch (PDOException $e) {
        error_log("List invoices error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch invoices'], 500);
    }
}

function previewInvoice($pdo, $userId) {
    $boardId = (int)($_GET['board_id'] ?? 0);
    $start = requireDate($_GET['start'] ?? null, 'start');
    $end = requireDate($_GET['end'] ?? null, 'end');
    if ($start > $end) {
        sendResponse(['error' => 'start must be on or before end'], 400);
    }

    try {
        requireOwnedBoard($pdo, $userId, $boardId);
        $result = computeUnbilled($pdo, $userId, $boardId, $start, $end, invTimezone($_GET['tz'] ?? ''));
        sendResponse([
            'lines'      => $result['lines'],
            'minutes'    => $result['minutes'],
            'total'      => $result['total'],
            'entryCount' => count($result['entryIds']),
        ]);
    } catch (PDOException $e) {
        error_log("Preview invoice error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to preview invoice'], 500);
    }
}

function createInvoice($pdo, $userId) {
    $data = getJsonInput() ?? [];
    $boardId = (int)($data['board_id'] ?? 0);
    $start = requireDate($data['start'] ?? null, 'start');
    $end = requireDate($data['end'] ?? null, 'end');
    $issueDate = requireDate($data['issueDate'] ?? null, 'issueDate');
    if ($start > $end) {
        sendResponse(['error' => 'start must be on or before end'], 400);
    }
    $tz = invTimezone($data['tz'] ?? '');

    try {
        $board = requireOwnedBoard($pdo, $userId, $boardId);

        $pdo->beginTransaction();

        $result = computeUnbilled($pdo, $userId, $boardId, $start, $end, $tz);
        if (!$result['entryIds']) {
            $pdo->rollBack();
            sendResponse(['error' => 'No unbilled time for this board and period'], 400);
        }

        // Number: Invoice-{Name}-{Company}-{YYYYMMDD}{NN}, NN = sequence for that issue date
        $nameStmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
        $nameStmt->execute([$userId]);
        $userName = filenameSafe((string)$nameStmt->fetchColumn());
        $datePart = str_replace('-', '', $issueDate);

        $seqStmt = $pdo->prepare("SELECT number FROM invoices WHERE user_id = ? AND issue_date = ?");
        $seqStmt->execute([$userId, $issueDate]);
        $maxSeq = 0;
        foreach ($seqStmt->fetchAll(PDO::FETCH_COLUMN) as $existing) {
            if (preg_match('/' . $datePart . '(\d{2,})$/', $existing, $m)) {
                $maxSeq = max($maxSeq, (int)$m[1]);
            }
        }
        $number = 'Invoice-' . $userName . '-' . filenameSafe($board['name']) . '-' . $datePart . str_pad($maxSeq + 1, 2, '0', STR_PAD_LEFT);

        $pdo->prepare("
            INSERT INTO invoices (user_id, board_id, board_name, number, status, issue_date, period_start, period_end, minutes, total)
            VALUES (?, ?, ?, ?, 'invoiced', ?, ?, ?, ?, ?)
        ")->execute([$userId, $boardId, $board['name'], $number, $issueDate, $start, $end, $result['minutes'], $result['total']]);
        $invoiceId = (int)$pdo->lastInsertId();

        $lineStmt = $pdo->prepare("
            INSERT INTO invoice_lines (invoice_id, task_id, description, minutes, rate, amount, position)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($result['lines'] as $i => $line) {
            $lineStmt->execute([$invoiceId, $line['taskId'], $line['description'], $line['minutes'], $line['rate'], $line['amount'], $i]);
        }

        $placeholders = implode(',', array_fill(0, count($result['entryIds']), '?'));
        $pdo->prepare("UPDATE time_entries SET invoice_id = ? WHERE user_id = ? AND invoice_id IS NULL AND id IN ($placeholders)")
            ->execute(array_merge([$invoiceId, $userId], $result['entryIds']));

        insertJournalAutoLog($pdo, $userId, 'invoice_created',
            'Invoiced ' . $board['name'] . ' ' . $number . ' · ' . invFormatMinutes($result['minutes']) . ' · $' . number_format($result['total'], 2),
            $boardId, $board['name'], null, null, null, 2);

        $pdo->commit();

        $invoice = fetchInvoice($pdo, $userId, $invoiceId);
        sendResponse(formatInvoice($invoice, fetchLines($pdo, $invoiceId)), 201);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log("Create invoice error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to create invoice'], 500);
    }
}

function setInvoiceStatus($pdo, $userId) {
    $data = getJsonInput() ?? [];
    $invoiceId = (int)($data['id'] ?? 0);
    $status = $data['status'] ?? '';
    if (!in_array($status, ['invoiced', 'paid'], true)) {
        sendResponse(['error' => "Status must be 'invoiced' or 'paid'"], 400);
    }

    try {
        $invoice = fetchInvoice($pdo, $userId, $invoiceId);
        if ($status === 'paid') {
            $pdo->prepare("UPDATE invoices SET status = 'paid', paid_at = UTC_TIMESTAMP() WHERE id = ? AND user_id = ?")
                ->execute([$invoiceId, $userId]);
            if ($invoice['status'] !== 'paid') {
                insertJournalAutoLog($pdo, $userId, 'invoice_paid',
                    'Paid: ' . $invoice['board_name'] . ' ' . $invoice['number'] . ' · $' . number_format((float)$invoice['total'], 2),
                    (int)$invoice['board_id'], $invoice['board_name'], null, null, 'win', 2);
            }
        } else {
            $pdo->prepare("UPDATE invoices SET status = 'invoiced', paid_at = NULL WHERE id = ? AND user_id = ?")
                ->execute([$invoiceId, $userId]);
        }
        sendResponse(formatInvoice(fetchInvoice($pdo, $userId, $invoiceId), fetchLines($pdo, $invoiceId)));
    } catch (PDOException $e) {
        error_log("Set invoice status error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to update invoice'], 500);
    }
}

function deleteInvoice($pdo, $userId) {
    $invoiceId = (int)($_GET['id'] ?? 0);
    try {
        $invoice = fetchInvoice($pdo, $userId, $invoiceId);
        if ($invoice['status'] === 'paid') {
            sendResponse(['error' => 'Mark the invoice unpaid before deleting it'], 409);
        }

        $pdo->beginTransaction();
        $pdo->prepare("UPDATE time_entries SET invoice_id = NULL WHERE invoice_id = ? AND user_id = ?")
            ->execute([$invoiceId, $userId]);
        $pdo->prepare("DELETE FROM invoice_lines WHERE invoice_id = ?")->execute([$invoiceId]);
        $pdo->prepare("DELETE FROM invoices WHERE id = ? AND user_id = ?")->execute([$invoiceId, $userId]);
        insertJournalAutoLog($pdo, $userId, 'invoice_deleted',
            'Deleted invoice ' . $invoice['number'] . ' — time is unbilled again',
            (int)$invoice['board_id'], $invoice['board_name'], null, null, null, 1);
        $pdo->commit();

        sendResponse(['message' => 'Invoice deleted']);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log("Delete invoice error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to delete invoice'], 500);
    }
}
