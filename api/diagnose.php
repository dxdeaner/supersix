<?php
// Temporary diagnostic — DELETE after use
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/plain');

echo "=== DIAGNOSE START ===\n";
echo "PHP " . PHP_VERSION . "\n\n";

// Simulate EXACTLY what auth.php does
echo "Step 1: require_once config.php (just like auth.php line 3)\n";
require_once 'config.php';
echo "config.php loaded OK\n\n";

echo "Step 2: new Database + connect (just like auth.php lines 7-8)\n";
$database = new Database();
$pdo = $database->connect();
echo "Database connected OK\n\n";

echo "Step 3: Check if functions from security.php exist\n";
echo "startSecureSession: " . (function_exists('startSecureSession') ? 'YES' : 'NO') . "\n";
echo "generateCsrfToken: " . (function_exists('generateCsrfToken') ? 'YES' : 'NO') . "\n";
echo "checkRateLimit: " . (function_exists('checkRateLimit') ? 'YES' : 'NO') . "\n";
echo "validateCsrf: " . (function_exists('validateCsrf') ? 'YES' : 'NO') . "\n";
echo "sendResponse: " . (function_exists('sendResponse') ? 'YES' : 'NO') . "\n";
echo "enforceMaxLengths: " . (function_exists('enforceMaxLengths') ? 'YES' : 'NO') . "\n\n";

echo "Step 4: Try calling startSecureSession()\n";
try {
    startSecureSession();
    echo "Session started OK! ID: " . substr(session_id(), 0, 8) . "...\n\n";
} catch (Throwable $e) {
    echo "FAILED: " . $e->getMessage() . "\n\n";
}

echo "Step 5: Try calling generateCsrfToken()\n";
try {
    $token = generateCsrfToken();
    echo "CSRF token OK! Length: " . strlen($token) . "\n\n";
} catch (Throwable $e) {
    echo "FAILED: " . $e->getMessage() . "\n\n";
}

echo "Step 6: Check config.php content around require_once line\n";
$configContent = file_get_contents(__DIR__ . '/config.php');
$lines = explode("\n", $configContent);
foreach ($lines as $i => $line) {
    $num = $i + 1;
    if ($num >= 68 && $num <= 75) {
        echo "  line $num: $line\n";
    }
}

echo "\nStep 7: Check .htaccess\n";
$htaccess = __DIR__ . '/.htaccess';
if (file_exists($htaccess)) {
    echo file_get_contents($htaccess) . "\n";
} else {
    echo "No .htaccess found\n";
}

echo "\n=== DIAGNOSE END ===\n";
