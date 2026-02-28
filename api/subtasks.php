<?php
// subtasks.php - Subtask Management API
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
        getSubtasks($pdo);
        break;
    case 'POST':
        $action = $_GET['action'] ?? 'create';
        switch ($action) {
            case 'create':
                createSubtask($pdo);
                break;
            case 'toggle':
                toggleSubtask($pdo);
                break;
            default:
                sendResponse(['error' => 'Invalid action'], 400);
        }
        break;
    case 'PUT':
        updateSubtask($pdo);
        break;
    case 'DELETE':
        deleteSubtask($pdo);
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getSubtasks($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $taskId = $_GET['task_id'] ?? null;
    
    if (!$taskId) {
        sendResponse(['error' => 'Task ID is required'], 400);
    }
    
    try {
        // Verify task belongs to user
        $stmt = $pdo->prepare("
            SELECT t.id 
            FROM tasks t 
            JOIN boards b ON t.board_id = b.id 
            WHERE t.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$taskId, $userId]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Task not found or access denied'], 404);
        }
        
        $stmt = $pdo->prepare("
            SELECT * FROM subtasks 
            WHERE task_id = ? 
            ORDER BY position ASC, created_at ASC
        ");
        $stmt->execute([$taskId]);
        $subtasks = $stmt->fetchAll();
        
        $formattedSubtasks = array_map(function($subtask) {
            return [
                'id' => (int)$subtask['id'],
                'taskId' => (int)$subtask['task_id'],
                'title' => $subtask['title'],
                'completed' => (bool)$subtask['completed'],
                'position' => (int)$subtask['position'],
                'createdAt' => $subtask['created_at'],
                'completedAt' => $subtask['completed_at']
            ];
        }, $subtasks);
        
        sendResponse($formattedSubtasks);
    } catch (PDOException $e) {
        error_log("Get subtasks error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch subtasks'], 500);
    }
}

function createSubtask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $data = getJsonInput();
    validateRequired($data, ['task_id', 'title']);

    enforceMaxLengths($data, ['title' => MAX_LENGTHS['title']]);

    try {
        // Verify task belongs to user
        $stmt = $pdo->prepare("
            SELECT t.id 
            FROM tasks t 
            JOIN boards b ON t.board_id = b.id 
            WHERE t.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$data['task_id'], $userId]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Task not found or access denied'], 404);
        }
        
        // Get next position
        $stmt = $pdo->prepare("
            SELECT COALESCE(MAX(position), 0) + 1 as next_position 
            FROM subtasks 
            WHERE task_id = ?
        ");
        $stmt->execute([$data['task_id']]);
        $result = $stmt->fetch();
        $nextPosition = $result['next_position'];
        
        $stmt = $pdo->prepare("
            INSERT INTO subtasks (task_id, title, position) 
            VALUES (?, ?, ?)
        ");
        
        $stmt->execute([
            $data['task_id'],
            trim($data['title']),
            $nextPosition
        ]);
        
        $subtaskId = $pdo->lastInsertId();
        
        // Return the new subtask
        $stmt = $pdo->prepare("SELECT * FROM subtasks WHERE id = ?");
        $stmt->execute([$subtaskId]);
        $subtask = $stmt->fetch();
        
        sendResponse([
            'id' => (int)$subtask['id'],
            'taskId' => (int)$subtask['task_id'],
            'title' => $subtask['title'],
            'completed' => (bool)$subtask['completed'],
            'position' => (int)$subtask['position'],
            'createdAt' => $subtask['created_at'],
            'completedAt' => $subtask['completed_at']
        ], 201);
    } catch (PDOException $e) {
        error_log("Create subtask error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to create subtask'], 500);
    }
}

function toggleSubtask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $data = getJsonInput();
    validateRequired($data, ['id']);
    
    try {
        // Verify subtask belongs to user
        $stmt = $pdo->prepare("
            SELECT s.id, s.completed 
            FROM subtasks s 
            JOIN tasks t ON s.task_id = t.id 
            JOIN boards b ON t.board_id = b.id 
            WHERE s.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$data['id'], $userId]);
        $subtask = $stmt->fetch();
        
        if (!$subtask) {
            sendResponse(['error' => 'Subtask not found or access denied'], 404);
        }
        
        $newCompleted = !$subtask['completed'];

        if ($newCompleted) {
            $stmt = $pdo->prepare("
                UPDATE subtasks SET completed = 1, completed_at = NOW() WHERE id = ?
            ");
        } else {
            $stmt = $pdo->prepare("
                UPDATE subtasks SET completed = 0, completed_at = NULL WHERE id = ?
            ");
        }
        $stmt->execute([$data['id']]);
        
        sendResponse(['message' => 'Subtask updated successfully']);
    } catch (PDOException $e) {
        error_log("Toggle subtask error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to update subtask'], 500);
    }
}

function deleteSubtask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $subtaskId = $_GET['id'] ?? null;
    
    if (!$subtaskId) {
        sendResponse(['error' => 'Subtask ID is required'], 400);
    }
    
    try {
        // Verify subtask belongs to user
        $stmt = $pdo->prepare("
            SELECT s.id 
            FROM subtasks s 
            JOIN tasks t ON s.task_id = t.id 
            JOIN boards b ON t.board_id = b.id 
            WHERE s.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$subtaskId, $userId]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Subtask not found or access denied'], 404);
        }
        
        $stmt = $pdo->prepare("DELETE FROM subtasks WHERE id = ?");
        $stmt->execute([$subtaskId]);
        
        sendResponse(['message' => 'Subtask deleted successfully']);
    } catch (PDOException $e) {
        error_log("Delete subtask error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to delete subtask'], 500);
    }
}
?>