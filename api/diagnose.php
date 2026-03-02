<?php
// Temporary diagnostic — DELETE after use
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$result = [
    'php_version' => PHP_VERSION,
    'time' => date('Y-m-d H:i:s T'),
    'steps' => [],
];

// Step 1: Can we load config.php?
try {
    require_once 'config.php';
    $result['steps'][] = 'config.php loaded OK';
} catch (Throwable $e) {
    $result['steps'][] = 'config.php FAILED: ' . $e->getMessage();
    echo json_encode($result, JSON_PRETTY_PRINT);
    exit;
}

// Step 2: Can we connect to the database?
try {
    $db = new Database();
    $pdo = $db->connect();
    $result['steps'][] = 'Database connection OK';
} catch (Throwable $e) {
    $result['steps'][] = 'Database connection FAILED: ' . $e->getMessage();
}

// Step 3: Can we start a session (needed for CSRF)?
try {
    startSecureSession();
    $result['steps'][] = 'Session started OK (id: ' . substr(session_id(), 0, 8) . '...)';
} catch (Throwable $e) {
    $result['steps'][] = 'Session FAILED: ' . $e->getMessage();
}

// Step 4: Can we generate a CSRF token?
try {
    $token = generateCsrfToken();
    $result['steps'][] = 'CSRF token generated OK (length: ' . strlen($token) . ')';
} catch (Throwable $e) {
    $result['steps'][] = 'CSRF token FAILED: ' . $e->getMessage();
}

// Step 5: Check if users table exists
try {
    if (isset($pdo)) {
        $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
        $exists = $stmt->rowCount() > 0;
        $result['steps'][] = 'Users table: ' . ($exists ? 'EXISTS' : 'MISSING');
    }
} catch (Throwable $e) {
    $result['steps'][] = 'Table check FAILED: ' . $e->getMessage();
}

// Step 6: Check PHP error log for recent errors
$logPaths = [
    __DIR__ . '/error_log',
    $_SERVER['DOCUMENT_ROOT'] . '/error_log',
    ini_get('error_log'),
];

foreach ($logPaths as $logPath) {
    if ($logPath && file_exists($logPath) && is_readable($logPath)) {
        $size = filesize($logPath);
        $tail = '';
        if ($size > 0) {
            $fp = fopen($logPath, 'r');
            fseek($fp, -min($size, 4096), SEEK_END);
            $tail = fread($fp, 4096);
            fclose($fp);
        }
        $lines = array_slice(explode("\n", trim($tail)), -15);
        $result['error_log'] = [
            'path' => $logPath,
            'last_15_lines' => $lines,
        ];
        break;
    }
}

if (!isset($result['error_log'])) {
    $result['error_log'] = 'No readable error log found';
}

echo json_encode($result, JSON_PRETTY_PRINT);
