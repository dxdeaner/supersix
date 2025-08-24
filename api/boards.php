<?php
// boards.php - Board Management API with User Authentication
require_once 'config.php';

// Start session for authentication
session_start();

$database = new Database();
$pdo = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getBoards($pdo);
        break;
    case 'POST':
        createBoard($pdo);
        break;
    case 'PUT':
        updateBoard($pdo);
        break;
    case 'DELETE':
        deleteBoard($pdo);
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getBoards($pdo) {
    // Ensure user is authenticated
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    
    try {
        $stmt = $pdo->prepare("
            SELECT b.*, 
                   COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_count
            FROM boards b
            LEFT JOIN tasks t ON b.id = t.board_id
            WHERE b.user_id = ?
            GROUP BY b.id
            ORDER BY b.created_at ASC
        ");
        $stmt->execute([$userId]);
        $boards = $stmt->fetchAll();
        
        // Format the response
        $formattedBoards = array_map(function($board) {
            return [
                'id' => (int)$board['id'],
                'name' => $board['name'],
                'color' => $board['color'],
                'archived' => (bool)$board['archived'],
                'active_count' => (int)$board['active_count'],
                'createdAt' => $board['created_at']
            ];
        }, $boards);
        
        sendResponse($formattedBoards);
    } catch (PDOException $e) {
        error_log("Get boards error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch boards'], 500);
    }
}

function createBoard($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    $data = getJsonInput();
    validateRequired($data, ['name']);
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO boards (user_id, name, color, archived) 
            VALUES (?, ?, ?, ?)
        ");
        
        $colors = ['cyan', 'green', 'blue', 'purple', 'pink', 'yellow'];
        $color = $data['color'] ?? $colors[array_rand($colors)];
        
        $stmt->execute([
            $userId,
            trim($data['name']),
            $color,
            false
        ]);
        
        $boardId = $pdo->lastInsertId();
        
        // Create sample task for new board
        $taskStmt = $pdo->prepare("
            INSERT INTO tasks (board_id, title, description, status, position) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $taskStmt->execute([
            $boardId,
            "Get started with your new board",
            "Edit this task and add more tasks to begin organizing your work",
            "active",
            1
        ]);
        
        // Return the new board with task count
        $stmt = $pdo->prepare("
            SELECT b.*, 
                   COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_count
            FROM boards b
            LEFT JOIN tasks t ON b.id = t.board_id
            WHERE b.id = ? AND b.user_id = ?
            GROUP BY b.id
        ");
        $stmt->execute([$boardId, $userId]);
        $board = $stmt->fetch();
        
        $formattedBoard = [
            'id' => (int)$board['id'],
            'name' => $board['name'],
            'color' => $board['color'],
            'archived' => (bool)$board['archived'],
            'active_count' => (int)$board['active_count'],
            'createdAt' => $board['created_at']
        ];
        
        sendResponse($formattedBoard, 201);
    } catch (PDOException $e) {
        error_log("Create board error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to create board'], 500);
    }
}

function updateBoard($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    $data = getJsonInput();
    validateRequired($data, ['id', 'name']);
    
    try {
        $stmt = $pdo->prepare("
            UPDATE boards 
            SET name = ?
            WHERE id = ? AND user_id = ?
        ");
        
        $result = $stmt->execute([
            trim($data['name']),
            $data['id'],
            $userId
        ]);
        
        if ($stmt->rowCount() === 0) {
            sendResponse(['error' => 'Board not found or access denied'], 404);
        }
        
        sendResponse(['message' => 'Board updated successfully']);
    } catch (PDOException $e) {
        error_log("Update board error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to update board'], 500);
    }
}

function deleteBoard($pdo) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    $userId = $_SESSION['user_id'];
    $boardId = $_GET['id'] ?? null;
    
    if (!$boardId) {
        sendResponse(['error' => 'Board ID is required'], 400);
    }
    
    try {
        // Check if this is the last non-archived board for this user
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM boards 
            WHERE archived = FALSE AND id != ? AND user_id = ?
        ");
        $stmt->execute([$boardId, $userId]);
        $result = $stmt->fetch();
        
        if ($result['count'] === 0) {
            sendResponse(['error' => 'Cannot archive the last board'], 400);
        }
        
        // Archive the board (soft delete) - only if user owns it
        $stmt = $pdo->prepare("
            UPDATE boards 
            SET archived = TRUE 
            WHERE id = ? AND user_id = ?
        ");
        
        $result = $stmt->execute([$boardId, $userId]);
        
        if ($stmt->rowCount() === 0) {
            sendResponse(['error' => 'Board not found or access denied'], 404);
        }
        
        sendResponse(['message' => 'Board archived successfully']);
    } catch (PDOException $e) {
        error_log("Delete board error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to archive board'], 500);
    }
}
?>