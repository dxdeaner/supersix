<?php
// journal.php - Journal Entries API with User Authentication
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
    $boardId = $_GET['board_id'] ?? null;

    if (!$boardId) {
        sendResponse(['error' => 'board_id is required'], 400);
    }

    // Verify board ownership
    $stmt = $pdo->prepare("SELECT id FROM boards WHERE id = ? AND user_id = ? AND archived = FALSE");
    $stmt->execute([$boardId, $userId]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Board not found or access denied'], 404);
    }

    try {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = 30;
        $offset = ($page - 1) * $perPage;

        $stmt = $pdo->prepare("
            SELECT id, content, created_at, updated_at
            FROM journal_entries
            WHERE board_id = ? AND user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$boardId, $userId, $perPage + 1, $offset]);
        $entries = $stmt->fetchAll();

        $hasMore = count($entries) > $perPage;
        if ($hasMore) {
            array_pop($entries);
        }

        $formatted = array_map(function($entry) {
            return [
                'id' => (int)$entry['id'],
                'content' => $entry['content'],
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
    validateRequired($data, ['board_id', 'content']);

    enforceMaxLengths($data, [
        'content' => MAX_LENGTHS['journal_content'],
    ]);

    $boardId = $data['board_id'];

    // Verify board ownership
    $stmt = $pdo->prepare("SELECT id FROM boards WHERE id = ? AND user_id = ? AND archived = FALSE");
    $stmt->execute([$boardId, $userId]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Board not found or access denied'], 404);
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO journal_entries (board_id, user_id, content)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$boardId, $userId, trim($data['content'])]);

        $entryId = $pdo->lastInsertId();

        $stmt = $pdo->prepare("SELECT id, content, created_at, updated_at FROM journal_entries WHERE id = ?");
        $stmt->execute([$entryId]);
        $entry = $stmt->fetch();

        sendResponse([
            'id' => (int)$entry['id'],
            'content' => $entry['content'],
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

    try {
        $stmt = $pdo->prepare("
            UPDATE journal_entries
            SET content = ?
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([trim($data['content']), $data['id'], $userId]);

        if ($stmt->rowCount() === 0) {
            sendResponse(['error' => 'Entry not found or access denied'], 404);
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
        $stmt = $pdo->prepare("
            DELETE FROM journal_entries
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$entryId, $userId]);

        if ($stmt->rowCount() === 0) {
            sendResponse(['error' => 'Entry not found or access denied'], 404);
        }

        sendResponse(['message' => 'Entry deleted successfully']);
    } catch (PDOException $e) {
        error_log("Delete journal entry error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to delete journal entry'], 500);
    }
}
?>
