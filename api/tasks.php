<?php
// tasks.php - Task Management API with User Authentication
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
        getTasks($pdo);
        break;
    case 'POST':
        $action = $_GET['action'] ?? 'create';
        switch ($action) {
            case 'create':
                createTask($pdo);
                break;
            case 'complete':
                completeTask($pdo);
                break;
            case 'promote':
                promoteTask($pdo);
                break;
            case 'demote':
                demoteTask($pdo);
                break;
            case 'postpone':
                postponeTask($pdo);
                break;
            case 'reorder':
                reorderTask($pdo);
                break;
            case 'undo':
                undoCompleteTask($pdo);
                break;
            default:
                sendResponse(['error' => 'Invalid action'], 400);
        }
        break;
    case 'PUT':
        updateTask($pdo);
        break;
    case 'DELETE':
        deleteTask($pdo);
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getTasks($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $boardId = $_GET['board_id'] ?? null;
    
    if (!$boardId) {
        sendResponse(['error' => 'Board ID is required'], 400);
    }
    
    try {
        // First verify that the board belongs to the current user
        $stmt = $pdo->prepare("SELECT id FROM boards WHERE id = ? AND user_id = ?");
        $stmt->execute([$boardId, $userId]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Board not found or access denied'], 404);
        }
        
        $stmt = $pdo->prepare("
            SELECT * FROM tasks 
            WHERE board_id = ? 
            ORDER BY 
                FIELD(status, 'active', 'queued', 'completed'), 
                position ASC, 
                completed_at DESC
        ");
        $stmt->execute([$boardId]);
        $tasks = $stmt->fetchAll();
        
        // Format the response
        $formattedTasks = array_map(function($task) {
            return [
                'id' => (int)$task['id'],
                'boardId' => (int)$task['board_id'],
                'title' => $task['title'],
                'description' => $task['description'],
                'status' => $task['status'],
                'position' => (int)$task['position'],
                'dueDate' => $task['due_date'],
                'createdAt' => $task['created_at'],
                'completedAt' => $task['completed_at']
            ];
        }, $tasks);
        
        sendResponse($formattedTasks);
    } catch (PDOException $e) {
        error_log("Get tasks error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch tasks'], 500);
    }
}

function createTask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $data = getJsonInput();
    validateRequired($data, ['board_id', 'title']);

    enforceMaxLengths($data, [
        'title'       => MAX_LENGTHS['task_title'],
        'description' => MAX_LENGTHS['description'],
    ]);

    try {
        // Verify board ownership
        $stmt = $pdo->prepare("SELECT id FROM boards WHERE id = ? AND user_id = ?");
        $stmt->execute([$data['board_id'], $userId]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Board not found or access denied'], 404);
        }
        
        // Get next position for queued tasks
        $stmt = $pdo->prepare("
            SELECT COALESCE(MAX(position), 0) + 1 as next_position 
            FROM tasks 
            WHERE board_id = ? AND status = 'queued'
        ");
        $stmt->execute([$data['board_id']]);
        $result = $stmt->fetch();
        $nextPosition = $result['next_position'];
        
        $stmt = $pdo->prepare("
            INSERT INTO tasks (board_id, title, description, status, position, due_date) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $dueDate = isset($data['dueDate']) && !empty($data['dueDate']) ? $data['dueDate'] : null;
        
        $stmt->execute([
            $data['board_id'],
            trim($data['title']),
            $data['description'] ?? '',
            'queued',
            $nextPosition,
            $dueDate
        ]);
        
        $taskId = $pdo->lastInsertId();
        
        // Return the new task
        $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        
        sendResponse([
            'id' => (int)$task['id'],
            'boardId' => (int)$task['board_id'],
            'title' => $task['title'],
            'description' => $task['description'],
            'status' => $task['status'],
            'position' => (int)$task['position'],
            'dueDate' => $task['due_date'],
            'createdAt' => $task['created_at'],
            'completedAt' => $task['completed_at']
        ], 201);
    } catch (PDOException $e) {
        error_log("Create task error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to create task'], 500);
    }
}

function updateTask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $data = getJsonInput();
    validateRequired($data, ['id', 'title']);

    enforceMaxLengths($data, [
        'title'       => MAX_LENGTHS['task_title'],
        'description' => MAX_LENGTHS['description'],
    ]);

    try {
        // Verify task belongs to user (through board ownership)
        $stmt = $pdo->prepare("
            SELECT t.id 
            FROM tasks t 
            JOIN boards b ON t.board_id = b.id 
            WHERE t.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$data['id'], $userId]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Task not found or access denied'], 404);
        }
        
        $stmt = $pdo->prepare("
            UPDATE tasks 
            SET title = ?, description = ?, due_date = ?
            WHERE id = ?
        ");
        
        $dueDate = isset($data['dueDate']) && !empty($data['dueDate']) ? $data['dueDate'] : null;
        
        $result = $stmt->execute([
            trim($data['title']),
            $data['description'] ?? '',
            $dueDate,
            $data['id']
        ]);
        
        sendResponse(['message' => 'Task updated successfully']);
    } catch (PDOException $e) {
        error_log("Update task error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to update task'], 500);
    }
}

function deleteTask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $taskId = $_GET['id'] ?? null;
    
    if (!$taskId) {
        sendResponse(['error' => 'Task ID is required'], 400);
    }
    
    try {
        $pdo->beginTransaction();
        
        // Get task info and verify ownership
        $stmt = $pdo->prepare("
            SELECT t.board_id, t.status, t.position 
            FROM tasks t 
            JOIN boards b ON t.board_id = b.id 
            WHERE t.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$taskId, $userId]);
        $task = $stmt->fetch();
        
        if (!$task) {
            sendResponse(['error' => 'Task not found or access denied'], 404);
        }
        
        // Delete the task
        $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->execute([$taskId]);
        
        // Reorder remaining tasks in the same status
        if ($task['status'] === 'active') {
            $stmt = $pdo->prepare("
                UPDATE tasks 
                SET position = position - 1 
                WHERE board_id = ? AND status = 'active' AND position > ?
            ");
            $stmt->execute([$task['board_id'], $task['position']]);
            
            // Promote first queued task if active slots < 6
            promoteQueuedTask($pdo, $task['board_id']);
        }
        
        $pdo->commit();
        sendResponse(['message' => 'Task deleted successfully']);
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Delete task error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to delete task'], 500);
    }
}

function completeTask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $data = getJsonInput();
    validateRequired($data, ['id']);
    
    try {
        $pdo->beginTransaction();
        
        // Get task info and verify ownership
        $stmt = $pdo->prepare("
            SELECT t.board_id, t.status, t.position 
            FROM tasks t 
            JOIN boards b ON t.board_id = b.id 
            WHERE t.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$data['id'], $userId]);
        $task = $stmt->fetch();
        
        if (!$task) {
            sendResponse(['error' => 'Task not found or access denied'], 404);
        }
        
        // Mark as completed
        $stmt = $pdo->prepare("
            UPDATE tasks 
            SET status = 'completed', completed_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$data['id']]);
        
        // Reorder active tasks if this was active
        if ($task['status'] === 'active') {
            $stmt = $pdo->prepare("
                UPDATE tasks 
                SET position = position - 1 
                WHERE board_id = ? AND status = 'active' AND position > ?
            ");
            $stmt->execute([$task['board_id'], $task['position']]);
            
            // Promote first queued task
            promoteQueuedTask($pdo, $task['board_id']);
        }
        
        $pdo->commit();
        sendResponse(['message' => 'Task completed successfully']);
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Complete task error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to complete task'], 500);
    }
}

function promoteTask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $data = getJsonInput();
    validateRequired($data, ['id']);
    
    try {
        $pdo->beginTransaction();
        
        // Get task info and verify ownership
        $stmt = $pdo->prepare("
            SELECT t.board_id, t.status 
            FROM tasks t 
            JOIN boards b ON t.board_id = b.id 
            WHERE t.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$data['id'], $userId]);
        $task = $stmt->fetch();
        
        if (!$task || $task['status'] !== 'queued') {
            sendResponse(['error' => 'Task not found, access denied, or not in queue'], 400);
        }
        
        // Count active tasks
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM tasks 
            WHERE board_id = ? AND status = 'active'
        ");
        $stmt->execute([$task['board_id']]);
        $activeCount = $stmt->fetch()['count'];
        
        if ($activeCount < 6) {
            // Simple promotion
            $stmt = $pdo->prepare("
                UPDATE tasks 
                SET status = 'active', position = ? 
                WHERE id = ?
            ");
            $stmt->execute([$activeCount + 1, $data['id']]);
        } else {
            // Push #6 to queue, promote to #6
            $stmt = $pdo->prepare("
                SELECT id FROM tasks 
                WHERE board_id = ? AND status = 'active' 
                ORDER BY position DESC LIMIT 1
            ");
            $stmt->execute([$task['board_id']]);
            $lastActive = $stmt->fetch();
            
            if ($lastActive) {
                // Get max queue position
                $stmt = $pdo->prepare("
                    SELECT COALESCE(MAX(position), 0) + 1 as next_position 
                    FROM tasks 
                    WHERE board_id = ? AND status = 'queued'
                ");
                $stmt->execute([$task['board_id']]);
                $nextQueuePos = $stmt->fetch()['next_position'];
                
                // Demote #6 to queue
                $stmt = $pdo->prepare("
                    UPDATE tasks 
                    SET status = 'queued', position = ? 
                    WHERE id = ?
                ");
                $stmt->execute([$nextQueuePos, $lastActive['id']]);
            }
            
            // Promote to position 6
            $stmt = $pdo->prepare("
                UPDATE tasks 
                SET status = 'active', position = 6 
                WHERE id = ?
            ");
            $stmt->execute([$data['id']]);
        }
        
        $pdo->commit();
        sendResponse(['message' => 'Task promoted successfully']);
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Promote task error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to promote task'], 500);
    }
}

function demoteTask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $data = getJsonInput();
    validateRequired($data, ['id']);
    
    try {
        $pdo->beginTransaction();
        
        // Get task info and verify ownership
        $stmt = $pdo->prepare("
            SELECT t.board_id, t.status, t.position 
            FROM tasks t 
            JOIN boards b ON t.board_id = b.id 
            WHERE t.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$data['id'], $userId]);
        $task = $stmt->fetch();
        
        if (!$task || $task['status'] !== 'active') {
            sendResponse(['error' => 'Task not found, access denied, or not active'], 400);
        }
        
        // Get next queue position
        $stmt = $pdo->prepare("
            SELECT COALESCE(MAX(position), 0) + 1 as next_position 
            FROM tasks 
            WHERE board_id = ? AND status = 'queued'
        ");
        $stmt->execute([$task['board_id']]);
        $nextQueuePos = $stmt->fetch()['next_position'];
        
        // Move to queue
        $stmt = $pdo->prepare("
            UPDATE tasks 
            SET status = 'queued', position = ? 
            WHERE id = ?
        ");
        $stmt->execute([$nextQueuePos, $data['id']]);
        
        // Compact remaining active tasks
        $stmt = $pdo->prepare("
            UPDATE tasks 
            SET position = position - 1 
            WHERE board_id = ? AND status = 'active' AND position > ?
        ");
        $stmt->execute([$task['board_id'], $task['position']]);
        
        $pdo->commit();
        sendResponse(['message' => 'Task demoted successfully']);
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Demote task error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to demote task'], 500);
    }
}

function postponeTask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $data = getJsonInput();
    validateRequired($data, ['id']);
    
    try {
        // Verify task ownership and get current due date
        $stmt = $pdo->prepare("
            SELECT t.due_date 
            FROM tasks t 
            JOIN boards b ON t.board_id = b.id 
            WHERE t.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$data['id'], $userId]);
        $task = $stmt->fetch();
        
        if (!$task) {
            sendResponse(['error' => 'Task not found or access denied'], 404);
        }
        
        // Calculate new due date
        if ($task['due_date']) {
            $newDate = date('Y-m-d H:i:s', strtotime($task['due_date'] . ' +1 day'));
        } else {
            $newDate = date('Y-m-d 09:00:00', strtotime('+1 day'));
        }
        
        $stmt = $pdo->prepare("UPDATE tasks SET due_date = ? WHERE id = ?");
        $stmt->execute([$newDate, $data['id']]);
        
        sendResponse(['message' => 'Task postponed successfully']);
    } catch (PDOException $e) {
        error_log("Postpone task error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to postpone task'], 500);
    }
}

function reorderTask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $data = getJsonInput();
    validateRequired($data, ['id', 'direction']); // 'up' or 'down'
    
    try {
        $pdo->beginTransaction();
        
        // Get task info and verify ownership
        $stmt = $pdo->prepare("
            SELECT t.board_id, t.status, t.position 
            FROM tasks t 
            JOIN boards b ON t.board_id = b.id 
            WHERE t.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$data['id'], $userId]);
        $task = $stmt->fetch();
        
        if (!$task) {
            sendResponse(['error' => 'Task not found or access denied'], 404);
        }
        
        // Get adjacent task (explicit queries to avoid SQL interpolation)
        if (!in_array($data['direction'], ['up', 'down'], true)) {
            sendResponse(['error' => 'Direction must be "up" or "down"'], 400);
        }

        if ($data['direction'] === 'up') {
            $stmt = $pdo->prepare("
                SELECT id, position FROM tasks
                WHERE board_id = ? AND status = ? AND position < ?
                ORDER BY position DESC LIMIT 1
            ");
        } else {
            $stmt = $pdo->prepare("
                SELECT id, position FROM tasks
                WHERE board_id = ? AND status = ? AND position > ?
                ORDER BY position ASC LIMIT 1
            ");
        }
        $stmt->execute([$task['board_id'], $task['status'], $task['position']]);
        $adjacentTask = $stmt->fetch();
        
        if (!$adjacentTask) {
            sendResponse(['error' => 'Cannot move task in that direction'], 400);
        }
        
        // Swap positions
        $stmt1 = $pdo->prepare("UPDATE tasks SET position = ? WHERE id = ?");
        $stmt2 = $pdo->prepare("UPDATE tasks SET position = ? WHERE id = ?");
        
        $stmt1->execute([$adjacentTask['position'], $data['id']]);
        $stmt2->execute([$task['position'], $adjacentTask['id']]);
        
        $pdo->commit();
        sendResponse(['message' => 'Task reordered successfully']);
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Reorder task error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to reorder task'], 500);
    }
}

function undoCompleteTask($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    $data = getJsonInput();
    validateRequired($data, ['id']);
    
    try {
        $pdo->beginTransaction();
        
        // Get task info and verify ownership
        $stmt = $pdo->prepare("
            SELECT t.board_id, t.status 
            FROM tasks t 
            JOIN boards b ON t.board_id = b.id 
            WHERE t.id = ? AND b.user_id = ?
        ");
        $stmt->execute([$data['id'], $userId]);
        $task = $stmt->fetch();
        
        if (!$task || $task['status'] !== 'completed') {
            sendResponse(['error' => 'Task not found, access denied, or not completed'], 400);
        }
        
        // Check if active slots available
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM tasks 
            WHERE board_id = ? AND status = 'active'
        ");
        $stmt->execute([$task['board_id']]);
        $activeCount = $stmt->fetch()['count'];
        
        if ($activeCount < 6) {
            // Restore to active
            $stmt = $pdo->prepare("
                UPDATE tasks 
                SET status = 'active', position = ?, completed_at = NULL 
                WHERE id = ?
            ");
            $stmt->execute([$activeCount + 1, $data['id']]);
        } else {
            // Restore to queue
            $stmt = $pdo->prepare("
                SELECT COALESCE(MAX(position), 0) + 1 as next_position 
                FROM tasks 
                WHERE board_id = ? AND status = 'queued'
            ");
            $stmt->execute([$task['board_id']]);
            $nextPos = $stmt->fetch()['next_position'];
            
            $stmt = $pdo->prepare("
                UPDATE tasks 
                SET status = 'queued', position = ?, completed_at = NULL 
                WHERE id = ?
            ");
            $stmt->execute([$nextPos, $data['id']]);
        }
        
        $pdo->commit();
        sendResponse(['message' => 'Task restored successfully']);
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Undo complete task error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to restore task'], 500);
    }
}

// Helper function to promote queued task when active slot opens
function promoteQueuedTask($pdo, $boardId) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM tasks 
        WHERE board_id = ? AND status = 'active'
    ");
    $stmt->execute([$boardId]);
    $activeCount = $stmt->fetch()['count'];
    
    if ($activeCount < 6) {
        $stmt = $pdo->prepare("
            SELECT id FROM tasks 
            WHERE board_id = ? AND status = 'queued' 
            ORDER BY position ASC 
            LIMIT 1
        ");
        $stmt->execute([$boardId]);
        $firstQueued = $stmt->fetch();
        
        if ($firstQueued) {
            $stmt = $pdo->prepare("
                UPDATE tasks 
                SET status = 'active', position = ? 
                WHERE id = ?
            ");
            $stmt->execute([$activeCount + 1, $firstQueued['id']]);
        }
    }
}
?>