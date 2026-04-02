<?php
// journal.php - Journal Entries API (Global Profile-Level)
require_once 'config.php';

// Start secure session
startSecureSession();

// Validate CSRF token on state-changing requests
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
    validateCsrf();
}

$database = new Database();
$pdo = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getEntries($pdo);
        break;
    case 'POST':
        createEntry($pdo);
        break;
    case 'PUT':
        updateEntry($pdo);
        break;
    case 'DELETE':
        deleteEntry($pdo);
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getEntries($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];

    try {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = 30;
        $offset = ($page - 1) * $perPage;

        $stmt = $pdo->prepare("
            SELECT id, entry_type, tag, auto_type, content, board_id, board_name, task_id, task_title, created_at, updated_at
            FROM journal_entries
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$userId, $perPage + 1, $offset]);
        $entries = $stmt->fetchAll();

        $hasMore = count($entries) > $perPage;
        if ($hasMore) {
            array_pop($entries);
        }

        $formatted = array_map(function($entry) {
            return [
                'id' => (int)$entry['id'],
                'entryType' => $entry['entry_type'],
                'tag' => $entry['tag'],
                'autoType' => $entry['auto_type'],
                'content' => $entry['content'],
                'boardId' => $entry['board_id'] ? (int)$entry['board_id'] : null,
                'boardName' => $entry['board_name'],
                'taskId' => $entry['task_id'] ? (int)$entry['task_id'] : null,
                'taskTitle' => $entry['task_title'],
                'createdAt' => $entry['created_at'],
                'updatedAt' => $entry['updated_at'],
            ];
        }, $entries);

        sendResponse(['entries' => $formatted, 'hasMore' => $hasMore]);
    } catch (PDOException $e) {
        error_log("Get journal entries error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch journal entries'], 500);
    }
}

function createEntry($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    $data = getJsonInput();
    validateRequired($data, ['content']);

    enforceMaxLengths($data, [
        'content' => MAX_LENGTHS['journal_content'],
    ]);

    // Validate tag if provided
    $allowedTags = ['blocker', 'win', 'idea', 'reflection'];
    $tag = isset($data['tag']) && in_array($data['tag'], $allowedTags, true) ? $data['tag'] : null;

    try {
        $stmt = $pdo->prepare("
            INSERT INTO journal_entries (user_id, entry_type, tag, content)
            VALUES (?, 'manual', ?, ?)
        ");
        $stmt->execute([$userId, $tag, trim($data['content'])]);

        $entryId = $pdo->lastInsertId();

        $stmt = $pdo->prepare("
            SELECT id, entry_type, tag, auto_type, content, board_id, board_name, task_id, task_title, created_at, updated_at
            FROM journal_entries WHERE id = ?
        ");
        $stmt->execute([$entryId]);
        $entry = $stmt->fetch();

        sendResponse([
            'id' => (int)$entry['id'],
            'entryType' => $entry['entry_type'],
            'tag' => $entry['tag'],
            'autoType' => $entry['auto_type'],
            'content' => $entry['content'],
            'boardId' => $entry['board_id'] ? (int)$entry['board_id'] : null,
            'boardName' => $entry['board_name'],
            'taskId' => $entry['task_id'] ? (int)$entry['task_id'] : null,
            'taskTitle' => $entry['task_title'],
            'createdAt' => $entry['created_at'],
            'updatedAt' => $entry['updated_at'],
        ], 201);
    } catch (PDOException $e) {
        error_log("Create journal entry error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to create journal entry'], 500);
    }
}

function updateEntry($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    $data = getJsonInput();
    validateRequired($data, ['id', 'content']);

    enforceMaxLengths($data, [
        'content' => MAX_LENGTHS['journal_content'],
    ]);

    // Validate tag if provided
    $allowedTags = ['blocker', 'win', 'idea', 'reflection'];
    $tag = isset($data['tag']) && in_array($data['tag'], $allowedTags, true) ? $data['tag'] : null;

    try {
        // Only allow editing manual entries
        $stmt = $pdo->prepare("
            UPDATE journal_entries
            SET content = ?, tag = ?
            WHERE id = ? AND user_id = ? AND entry_type = 'manual'
        ");
        $stmt->execute([trim($data['content']), $tag, $data['id'], $userId]);

        if ($stmt->rowCount() === 0) {
            sendResponse(['error' => 'Entry not found, access denied, or cannot edit auto-log entries'], 404);
        }

        sendResponse(['message' => 'Entry updated successfully']);
    } catch (PDOException $e) {
        error_log("Update journal entry error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to update journal entry'], 500);
    }
}

function deleteEntry($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    $entryId = $_GET['id'] ?? null;

    if (!$entryId) {
        sendResponse(['error' => 'Entry ID is required'], 400);
    }

    try {
        // Only allow deleting manual entries
        $stmt = $pdo->prepare("
            DELETE FROM journal_entries
            WHERE id = ? AND user_id = ? AND entry_type = 'manual'
        ");
        $stmt->execute([$entryId, $userId]);

        if ($stmt->rowCount() === 0) {
            sendResponse(['error' => 'Entry not found, access denied, or cannot delete auto-log entries'], 404);
        }

        sendResponse(['message' => 'Entry deleted successfully']);
    } catch (PDOException $e) {
        error_log("Delete journal entry error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to delete journal entry'], 500);
    }
}
?>
