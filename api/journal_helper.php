<?php
// journal_helper.php - Shared helper for auto-logging journal entries
// Include this in tasks.php, subtasks.php, boards.php via:
//   require_once __DIR__ . '/journal_helper.php';

/**
 * Insert an automatic journal log entry.
 * Fails silently — auto-logging should never break the parent operation.
 */
function insertJournalAutoLog(
    PDO $pdo,
    int $userId,
    string $autoType,
    string $content,
    ?int $boardId = null,
    ?string $boardName = null,
    ?int $taskId = null,
    ?string $taskTitle = null,
    ?string $tag = null
): void {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO journal_entries (user_id, entry_type, auto_type, content, board_id, board_name, task_id, task_title, tag)
            VALUES (?, 'auto', ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $autoType, $content, $boardId, $boardName, $taskId, $taskTitle, $tag]);
    } catch (PDOException $e) {
        error_log("Journal auto-log error ($autoType): " . $e->getMessage());
    }
}
?>
