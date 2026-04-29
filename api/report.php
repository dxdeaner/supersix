<?php
// report.php - Date Range Report API
require_once 'config.php';

startSecureSession();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Authentication required'], 401);
}

$userId = $_SESSION['user_id'];

$start = $_GET['start'] ?? '';
$end   = $_GET['end']   ?? '';

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end)) {
    sendResponse(['error' => 'Invalid date format. Use YYYY-MM-DD'], 400);
}

if ($start > $end) {
    sendResponse(['error' => 'start must be on or before end'], 400);
}

$startTs = new DateTime($start, new DateTimeZone('UTC'));
$endTs   = new DateTime($end,   new DateTimeZone('UTC'));
$diff    = $endTs->diff($startTs)->days;

if ($diff > 366) {
    sendResponse(['error' => 'Date range cannot exceed 366 days'], 400);
}

$rangeStart = $start . ' 00:00:00';
$rangeEnd   = date('Y-m-d', strtotime($end . ' +1 day')) . ' 00:00:00';

$database = new Database();
$pdo = $database->connect();

try {
    $taskStmt = $pdo->prepare("
        SELECT t.id, t.title, t.result, t.completed_at, t.due_date, b.name AS board_name
        FROM tasks t
        JOIN boards b ON t.board_id = b.id
        WHERE b.user_id = ?
          AND t.status = 'completed'
          AND t.completed_at >= ?
          AND t.completed_at < ?
        ORDER BY t.completed_at ASC
    ");
    $taskStmt->execute([$userId, $rangeStart, $rangeEnd]);
    $tasks = $taskStmt->fetchAll();

    $journalStmt = $pdo->prepare("
        SELECT id, entry_type, tag, auto_type, content, board_name, task_title, created_at
        FROM journal_entries
        WHERE user_id = ?
          AND created_at >= ?
          AND created_at < ?
        ORDER BY created_at ASC
    ");
    $journalStmt->execute([$userId, $rangeStart, $rangeEnd]);
    $journal = $journalStmt->fetchAll();

    $formattedTasks = array_map(function($t) {
        return [
            'id'          => (int)$t['id'],
            'title'       => $t['title'],
            'result'      => $t['result'],
            'completedAt' => toIsoUtc($t['completed_at']),
            'dueDate'     => toIsoUtc($t['due_date']),
            'boardName'   => $t['board_name'],
        ];
    }, $tasks);

    $formattedJournal = array_map(function($j) {
        return [
            'id'        => (int)$j['id'],
            'entryType' => $j['entry_type'],
            'tag'       => $j['tag'],
            'autoType'  => $j['auto_type'],
            'content'   => $j['content'],
            'boardName' => $j['board_name'],
            'taskTitle' => $j['task_title'],
            'createdAt' => toIsoUtc($j['created_at']),
        ];
    }, $journal);

    sendResponse([
        'range'   => ['start' => $start, 'end' => $end],
        'tasks'   => $formattedTasks,
        'journal' => $formattedJournal,
    ]);

} catch (PDOException $e) {
    error_log("Report error: " . $e->getMessage());
    sendResponse(['error' => 'Failed to generate report'], 500);
}
