<?php
// auth_test.php - Test authentication setup
require_once 'config.php';

echo "<h2>Authentication Debug Test</h2>";
echo "<style>body { font-family: Arial, sans-serif; background: #1e293b; color: #e2e8f0; padding: 20px; }</style>";

// Test database connection
echo "<h3>1. Database Connection Test</h3>";
try {
    $database = new Database();
    $pdo = $database->connect();
    echo "✅ Database connection successful<br>";
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "<br>";
    exit;
}

// Test users table structure
echo "<h3>2. Users Table Structure</h3>";
try {
    $stmt = $pdo->prepare("DESCRIBE users");
    $stmt->execute();
    $columns = $stmt->fetchAll();
    
    echo "Users table columns:<br>";
    $requiredColumns = ['name', 'email_verified', 'verification_token'];
    $existingColumns = array_column($columns, 'Field');
    
    foreach ($columns as $column) {
        echo "- {$column['Field']} ({$column['Type']})<br>";
    }
    
    echo "<br>Missing required columns:<br>";
    foreach ($requiredColumns as $required) {
        if (!in_array($required, $existingColumns)) {
            echo "❌ Missing: $required<br>";
        } else {
            echo "✅ Found: $required<br>";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Users table error: " . $e->getMessage() . "<br>";
}

// Test boards table structure
echo "<h3>3. Boards Table Structure</h3>";
try {
    $stmt = $pdo->prepare("DESCRIBE boards");
    $stmt->execute();
    $columns = $stmt->fetchAll();
    
    echo "Boards table columns:<br>";
    $existingColumns = array_column($columns, 'Field');
    
    foreach ($columns as $column) {
        echo "- {$column['Field']} ({$column['Type']})<br>";
    }
    
    if (!in_array('user_id', $existingColumns)) {
        echo "❌ Missing: user_id column<br>";
    } else {
        echo "✅ Found: user_id<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Boards table error: " . $e->getMessage() . "<br>";
}

// Test session functionality
echo "<h3>4. Session Test</h3>";
session_start();
$_SESSION['test'] = 'working';
if (isset($_SESSION['test'])) {
    echo "✅ Sessions are working<br>";
    unset($_SESSION['test']);
} else {
    echo "❌ Sessions not working<br>";
}

echo "<h3>5. File Structure Test</h3>";
$files = ['config.php', 'boards.php', 'tasks.php'];
foreach ($files as $file) {
    if (file_exists($file)) {
        echo "✅ Found: $file<br>";
    } else {
        echo "❌ Missing: $file<br>";
    }
}

echo "<br><strong>Next Steps:</strong><br>";
echo "1. Fix any missing columns shown above<br>";
echo "2. Create the auth.php file<br>";
echo "3. Test registration again<br>";
?>