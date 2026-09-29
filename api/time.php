<?php
// time.php - Time Tracking API (per-task time entries + hourly rates)
// Timestamps are stored in UTC. Billing (15-min rounding of each day's total)
// is computed client-side so "day" follows the user's local timezone.
require_once 'config.php';
require_once __DIR__ . '/journal_helper.php';

// Start secure session
startSecureSession();

// Validate CSRF token on state-changing requests
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

const TIME_NOTE_MAX = 500;
const HOURLY_RATE_MAX = 99999999.99;

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? '';
        if ($action === 'running') {
            getRunningEntry($pdo, $userId);
        } elseif (isset($_GET['task_id'])) {
            getTaskEntries($pdo, $userId, (int)$_GET['task_id']);
        } elseif (isset($_GET['board_id'])) {
            getBoardEntries($pdo, $userId, (int)$_GET['board_id']);
        } else {
            sendResponse(['error' => 'task_id or board_id is required'], 400);
        }
        break;
    case 'POST':
        $action = $_GET['action'] ?? 'create';
        switch ($action) {
            case 'start':
                startTimer($pdo, $userId);
                break;
            case 'stop':
                stopTimer($pdo, $userId);
                break;
            case 'create':
                createEntry($pdo, $userId);
                break;
            case 'task_rate':
                setTaskRate($pdo, $userId);
                break;
            default:
                sendResponse(['error' => 'Invalid action'], 400);
        }
        break;
    case 'PUT':
        updateEntry($pdo, $userId);
        break;
    case 'DELETE':
        deleteEntry($pdo, $userId);
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatEntry($row) {
    return [
        'id'        => (int)$row['id'],
        'taskId'    => (int)$row['task_id'],
        'startedAt' => toIsoUtc($row['started_at']),
        'endedAt'   => toIsoUtc($row['ended_at']),
        'note'      => $row['note'] ?? null,
    ];
}

/** Returns the task row (with board rate) if the user owns it, else sends 404. */
function requireOwnedTask($pdo, $userId, $taskId) {
    $stmt = $pdo->prepare("
        SELECT t.id, t.title, t.board_id, t.hourly_rate, b.name AS board_name, b.hourly_rate AS board_rate
        FROM tasks t
        JOIN boards b ON t.board_id = b.id
        WHERE t.id = ? AND b.user_id = ?
    ");
    $stmt->execute([$taskId, $userId]);
    $task = $stmt->fetch();
    if (!$task) {
        sendResponse(['error' => 'Task not found or access denied'], 404);
    }
    return $task;
}

function requireOwnedEntry($pdo, $userId, $entryId) {
    $stmt = $pdo->prepare("SELECT * FROM time_entries WHERE id = ? AND user_id = ?");
    $stmt->execute([$entryId, $userId]);
    $entry = $stmt->fetch();
    if (!$entry) {
        sendResponse(['error' => 'Time entry not found or access denied'], 404);
    }
    return $entry;
}

/** Parse an ISO 8601 string into a UTC MySQL datetime, or send 400. */
function parseUtc($value, $field) {
    if (!is_string($value) || trim($value) === '') {
        sendResponse(['error' => "Field '$field' is required"], 400);
    }
    try {
        $dt = new DateTime($value);
    } catch (Exception $e) {
        sendResponse(['error' => "Field '$field' is not a valid date"], 400);
    }
    $dt->setTimezone(new DateTimeZone('UTC'));
    return $dt->format('Y-m-d H:i:s');
}

function parseRate($value) {
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_numeric($value) || (float)$value < 0 || (float)$value > HOURLY_RATE_MAX) {
        sendResponse(['error' => 'Hourly rate must be a positive number'], 400);
    }
    return round((float)$value, 2);
}

function rateOrNull($value) {
    return $value === null ? null : (float)$value;
}

/** Validate a start/end range and reject overlaps with the user's other entries. */
function validateRange($pdo, $userId, $start, $end, $excludeId = 0) {
    $nowStmt = $pdo->query("SELECT UTC_TIMESTAMP()");
    $now = $nowStmt->fetchColumn();

    if ($start > $now) {
        sendResponse(['error' => 'Start time cannot be in the future'], 400);
    }
    if ($end !== null) {
        if ($end <= $start) {
            sendResponse(['error' => 'End time must be after start time'], 400);
        }
        if ($end > $now) {
            sendResponse(['error' => 'End time cannot be in the future'], 400);
        }
    }

    $effectiveEnd = $end ?? $now;
    $stmt = $pdo->prepare("
        SELECT te.id, t.title
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        WHERE te.user_id = ?
          AND te.id != ?
          AND te.started_at < ?
          AND COALESCE(te.ended_at, UTC_TIMESTAMP()) > ?
        LIMIT 1
    ");
    $stmt->execute([$userId, $excludeId, $effectiveEnd, $start]);
    $overlap = $stmt->fetch();
    if ($overlap) {
        sendResponse(['error' => 'Overlaps an existing entry on "' . $overlap['title'] . '"'], 409);
    }
}

function normalizeNote($data) {
    if (!array_key_exists('note', $data) || $data['note'] === null) {
        return null;
    }
    $note = trim((string)$data['note']);
    if (mb_strlen($note) > TIME_NOTE_MAX) {
        sendResponse(['error' => "Field 'note' exceeds maximum length of " . TIME_NOTE_MAX . " characters"], 400);
    }
    return $note === '' ? null : $note;
}

function fetchRunning($pdo, $userId) {
    $stmt = $pdo->prepare("
        SELECT te.*, t.title AS task_title, t.board_id, b.name AS board_name
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        JOIN boards b ON t.board_id = b.id
        WHERE te.user_id = ? AND te.ended_at IS NULL
        ORDER BY te.started_at DESC
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }
    return formatEntry($row) + [
        'taskTitle' => $row['task_title'],
        'boardId'   => (int)$row['board_id'],
        'boardName' => $row['board_name'],
    ];
}

/** 83 minutes → "1h 23m" */
function formatLoggedMinutes($minutes) {
    $h = intdiv($minutes, 60);
    $m = $minutes % 60;
    if ($h === 0) return $m . 'm';
    return $m === 0 ? $h . 'h' : $h . 'h ' . $m . 'm';
}

/** Write a "time_logged" journal auto-entry for a finished time entry (skips < 1 min). */
function logTimeToJournal($pdo, $userId, $entryId, $manual = false) {
    try {
        $stmt = $pdo->prepare("
            SELECT te.note, TIMESTAMPDIFF(SECOND, te.started_at, te.ended_at) AS seconds,
                   t.id AS task_id, t.title AS task_title, b.id AS board_id, b.name AS board_name
            FROM time_entries te
            JOIN tasks t ON te.task_id = t.id
            JOIN boards b ON t.board_id = b.id
            WHERE te.id = ? AND te.user_id = ? AND te.ended_at IS NOT NULL
        ");
        $stmt->execute([$entryId, $userId]);
        $row = $stmt->fetch();
        if (!$row) return;

        $minutes = intdiv((int)$row['seconds'], 60);
        if ($minutes < 1) return;

        $content = 'Logged ' . formatLoggedMinutes($minutes) . ' on "' . $row['task_title'] . '"';
        if ($manual) {
            $content .= ' (manual entry)';
        }
        if (!empty($row['note'])) {
            $content .= ' — ' . $row['note'];
        }

        insertJournalAutoLog($pdo, $userId, 'time_logged', $content,
            (int)$row['board_id'], $row['board_name'], (int)$row['task_id'], $row['task_title'],
            null, 2);
    } catch (PDOException $e) {
        error_log("Time journal log error: " . $e->getMessage());
    }
}

/** Stop any running timer for the user and journal the finished entries. */
function stopRunningAndLog($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id FROM time_entries WHERE user_id = ? AND ended_at IS NULL");
    $stmt->execute([$userId]);
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (!$ids) return;

    $pdo->prepare("UPDATE time_entries SET ended_at = UTC_TIMESTAMP() WHERE user_id = ? AND ended_at IS NULL")
        ->execute([$userId]);
    foreach ($ids as $id) {
        logTimeToJournal($pdo, $userId, (int)$id);
    }
}

// ── Endpoints ───────────────────────────────────────────────────────

function getRunningEntry($pdo, $userId) {
    try {
        sendResponse(['entry' => fetchRunning($pdo, $userId)]);
    } catch (PDOException $e) {
        error_log("Get running entry error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch running timer'], 500);
    }
}

function getTaskEntries($pdo, $userId, $taskId) {
    try {
        $task = requireOwnedTask($pdo, $userId, $taskId);
        $stmt = $pdo->prepare("
            SELECT * FROM time_entries
            WHERE task_id = ? AND user_id = ?
            ORDER BY started_at DESC
        ");
        $stmt->execute([$taskId, $userId]);
        sendResponse([
            'entries'   => array_map('formatEntry', $stmt->fetchAll()),
            'taskRate'  => rateOrNull($task['hourly_rate']),
            'boardRate' => rateOrNull($task['board_rate']),
        ]);
    } catch (PDOException $e) {
        error_log("Get task entries error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch time entries'], 500);
    }
}

function getBoardEntries($pdo, $userId, $boardId) {
    try {
        $stmt = $pdo->prepare("SELECT id FROM boards WHERE id = ? AND user_id = ?");
        $stmt->execute([$boardId, $userId]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Board not found or access denied'], 404);
        }
        $stmt = $pdo->prepare("
            SELECT te.* FROM time_entries te
            JOIN tasks t ON te.task_id = t.id
            WHERE t.board_id = ? AND te.user_id = ?
            ORDER BY te.started_at ASC
        ");
        $stmt->execute([$boardId, $userId]);
        sendResponse(array_map('formatEntry', $stmt->fetchAll()));
    } catch (PDOException $e) {
        error_log("Get board entries error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch time entries'], 500);
    }
}

function startTimer($pdo, $userId) {
    $data = getJsonInput();
    $taskId = (int)($data['task_id'] ?? 0);
    if (!$taskId) {
        sendResponse(['error' => "Field 'task_id' is required"], 400);
    }

    try {
        requireOwnedTask($pdo, $userId, $taskId);

        $running = fetchRunning($pdo, $userId);
        if ($running && $running['taskId'] === $taskId) {
            sendResponse(['entry' => $running]);
        }

        // Only one timer at a time — stop whatever is running
        stopRunningAndLog($pdo, $userId);

        $pdo->prepare("INSERT INTO time_entries (user_id, task_id, started_at) VALUES (?, ?, UTC_TIMESTAMP())")
            ->execute([$userId, $taskId]);

        sendResponse(['entry' => fetchRunning($pdo, $userId)], 201);
    } catch (PDOException $e) {
        error_log("Start timer error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to start timer'], 500);
    }
}

function stopTimer($pdo, $userId) {
    try {
        stopRunningAndLog($pdo, $userId);
        sendResponse(['entry' => null]);
    } catch (PDOException $e) {
        error_log("Stop timer error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to stop timer'], 500);
    }
}

function createEntry($pdo, $userId) {
    $data = getJsonInput();
    $taskId = (int)($data['task_id'] ?? 0);
    if (!$taskId) {
        sendResponse(['error' => "Field 'task_id' is required"], 400);
    }

    $start = parseUtc($data['startedAt'] ?? null, 'startedAt');
    $end = parseUtc($data['endedAt'] ?? null, 'endedAt');
    $note = normalizeNote($data);

    try {
        requireOwnedTask($pdo, $userId, $taskId);
        validateRange($pdo, $userId, $start, $end);

        $pdo->prepare("INSERT INTO time_entries (user_id, task_id, started_at, ended_at, note) VALUES (?, ?, ?, ?, ?)")
            ->execute([$userId, $taskId, $start, $end, $note]);

        $entryId = (int)$pdo->lastInsertId();
        logTimeToJournal($pdo, $userId, $entryId, true);

        $entry = requireOwnedEntry($pdo, $userId, $entryId);
        sendResponse(formatEntry($entry), 201);
    } catch (PDOException $e) {
        error_log("Create time entry error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to create time entry'], 500);
    }
}

function updateEntry($pdo, $userId) {
    $data = getJsonInput();
    $entryId = (int)($data['id'] ?? 0);
    if (!$entryId) {
        sendResponse(['error' => "Field 'id' is required"], 400);
    }

    try {
        $existing = requireOwnedEntry($pdo, $userId, $entryId);

        $start = parseUtc($data['startedAt'] ?? null, 'startedAt');
        // A running entry may keep a null end (edit its start only)
        $end = ($existing['ended_at'] === null && empty($data['endedAt']))
            ? null
            : parseUtc($data['endedAt'] ?? null, 'endedAt');
        $note = normalizeNote($data);

        validateRange($pdo, $userId, $start, $end, $entryId);

        $pdo->prepare("UPDATE time_entries SET started_at = ?, ended_at = ?, note = ? WHERE id = ? AND user_id = ?")
            ->execute([$start, $end, $note, $entryId, $userId]);

        sendResponse(formatEntry(requireOwnedEntry($pdo, $userId, $entryId)));
    } catch (PDOException $e) {
        error_log("Update time entry error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to update time entry'], 500);
    }
}

function deleteEntry($pdo, $userId) {
    $entryId = (int)($_GET['id'] ?? 0);
    if (!$entryId) {
        sendResponse(['error' => 'Entry ID is required'], 400);
    }

    try {
        requireOwnedEntry($pdo, $userId, $entryId);
        $pdo->prepare("DELETE FROM time_entries WHERE id = ? AND user_id = ?")
            ->execute([$entryId, $userId]);
        sendResponse(['message' => 'Time entry deleted']);
    } catch (PDOException $e) {
        error_log("Delete time entry error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to delete time entry'], 500);
    }
}

function setTaskRate($pdo, $userId) {
    $data = getJsonInput();
    $taskId = (int)($data['task_id'] ?? 0);
    if (!$taskId) {
        sendResponse(['error' => "Field 'task_id' is required"], 400);
    }
    $rate = parseRate($data['rate'] ?? null);

    try {
        requireOwnedTask($pdo, $userId, $taskId);
        $pdo->prepare("UPDATE tasks SET hourly_rate = ? WHERE id = ?")
            ->execute([$rate, $taskId]);
        sendResponse(['taskRate' => $rate]);
    } catch (PDOException $e) {
        error_log("Set task rate error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to update hourly rate'], 500);
    }
}
