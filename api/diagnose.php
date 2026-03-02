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

// Step 0: Check security.php directly BEFORE loading config
$secPath = __DIR__ . '/security.php';
$result['security_file'] = [
    'path' => $secPath,
    'exists' => file_exists($secPath),
    'size' => file_exists($secPath) ? filesize($secPath) : null,
    'md5' => file_exists($secPath) ? md5_file($secPath) : null,
    'first_200_chars' => file_exists($secPath) ? substr(file_get_contents($secPath), 0, 200) : null,
    'last_200_chars' => file_exists($secPath) ? substr(file_get_contents($secPath), -200) : null,
];

// Step 0b: Try to include security.php directly with error capture
$result['security_direct_include'] = 'not tested';
try {
    $oldLevel = error_reporting(0);
    ob_start();
    $includeResult = include_once $secPath;
    $output = ob_get_clean();
    error_reporting($oldLevel);
    $result['security_direct_include'] = [
        'return' => $includeResult,
        'output' => $output ?: '(none)',
        'function_exists_startSecureSession' => function_exists('startSecureSession'),
        'function_exists_generateCsrfToken' => function_exists('generateCsrfToken'),
        'function_exists_checkRateLimit' => function_exists('checkRateLimit'),
        'function_exists_validateCsrf' => function_exists('validateCsrf'),
    ];
} catch (Throwable $e) {
    $result['security_direct_include'] = 'EXCEPTION: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine();
}

// Step 0c: Try php syntax check via command line
$syntaxCheck = null;
exec('php -l ' . escapeshellarg($secPath) . ' 2>&1', $syntaxOutput, $syntaxCode);
$result['security_syntax_check'] = [
    'exit_code' => $syntaxCode,
    'output' => implode("\n", $syntaxOutput),
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

// Step 5: Check error log
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

echo json_encode($result, JSON_PRETTY_PRINT);
