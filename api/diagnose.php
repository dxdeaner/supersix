<?php
// Temporary diagnostic — DELETE after use
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/plain');

echo "=== SERVER config.php CONTENTS ===\n";
echo "(DB_PASS redacted for security)\n\n";

$configContent = file_get_contents(__DIR__ . '/config.php');

// Redact the password line
$configContent = preg_replace(
    "/define\('DB_PASS',\s*'[^']*'\)/",
    "define('DB_PASS', '***REDACTED***')",
    $configContent
);

echo $configContent;

echo "\n\n=== TOTAL LINES: " . count(explode("\n", $configContent)) . " ===\n";
echo "=== Contains 'security.php': " . (strpos($configContent, 'security.php') !== false ? 'YES' : 'NO') . " ===\n";
