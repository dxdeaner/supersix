<?php
// Temporary diagnostic — DELETE after use
// Force ALL errors to display on screen
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/plain');

echo "=== DIAGNOSE START ===\n";
echo "PHP " . PHP_VERSION . "\n\n";

// Step 1: Does security.php exist?
$secPath = __DIR__ . '/security.php';
echo "security.php path: $secPath\n";
echo "security.php exists: " . (file_exists($secPath) ? 'YES' : 'NO') . "\n";

if (file_exists($secPath)) {
    echo "security.php size: " . filesize($secPath) . " bytes\n";
    echo "security.php md5: " . md5_file($secPath) . "\n\n";

    echo "--- FIRST 500 CHARS ---\n";
    echo substr(file_get_contents($secPath), 0, 500) . "\n";
    echo "--- END ---\n\n";

    // Try to include it
    echo "Including security.php...\n";
    try {
        include_once $secPath;
        echo "Include completed.\n";
    } catch (Throwable $e) {
        echo "Include THREW: " . $e->getMessage() . "\n";
    }

    echo "startSecureSession exists: " . (function_exists('startSecureSession') ? 'YES' : 'NO') . "\n";
    echo "generateCsrfToken exists: " . (function_exists('generateCsrfToken') ? 'YES' : 'NO') . "\n";
    echo "checkRateLimit exists: " . (function_exists('checkRateLimit') ? 'YES' : 'NO') . "\n";
} else {
    echo "!! security.php NOT FOUND !!\n";
}

echo "\n--- FILES IN " . __DIR__ . " ---\n";
foreach (scandir(__DIR__) as $f) {
    if ($f !== '.' && $f !== '..') {
        echo "  $f (" . filesize(__DIR__ . '/' . $f) . " bytes)\n";
    }
}

echo "\n=== DIAGNOSE END ===\n";
