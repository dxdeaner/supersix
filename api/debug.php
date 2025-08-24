<?php
// debug.php - Basic PHP debugging
// Place this in your /api/ folder first to test PHP is working

echo "<h2>PHP Debug Test</h2>";
echo "<style>body { font-family: Arial, sans-serif; background: #1e293b; color: #e2e8f0; padding: 20px; }</style>";

echo "✅ PHP is working!<br>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Current time: " . date('Y-m-d H:i:s') . "<br><br>";

// Test if config.php exists
echo "<h3>Testing config.php...</h3>";
if (file_exists('config.php')) {
    echo "✅ config.php file found<br>";
    
    // Try to include it
    try {
        require_once 'config.php';
        echo "✅ config.php loaded successfully<br>";
        
        // Check if constants are defined
        if (defined('DB_HOST')) {
            echo "✅ DB_HOST: " . DB_HOST . "<br>";
        } else {
            echo "❌ DB_HOST not defined<br>";
        }
        
        if (defined('DB_NAME')) {
            echo "✅ DB_NAME: " . DB_NAME . "<br>";
        } else {
            echo "❌ DB_NAME not defined<br>";
        }
        
        if (defined('DB_USER')) {
            echo "✅ DB_USER: " . DB_USER . "<br>";
        } else {
            echo "❌ DB_USER not defined<br>";
        }
        
        if (defined('DB_PASS')) {
            echo "✅ DB_PASS: [hidden for security]<br>";
        } else {
            echo "❌ DB_PASS not defined<br>";
        }
        
    } catch (Exception $e) {
        echo "❌ Error loading config.php: " . $e->getMessage() . "<br>";
    }
} else {
    echo "❌ config.php file not found in current directory<br>";
    echo "Current directory: " . __DIR__ . "<br>";
    echo "Looking for: " . __DIR__ . "/config.php<br>";
}

echo "<br><h3>Testing PDO...</h3>";
if (class_exists('PDO')) {
    echo "✅ PDO class available<br>";
    
    // List available PDO drivers
    $drivers = PDO::getAvailableDrivers();
    echo "Available PDO drivers: " . implode(', ', $drivers) . "<br>";
    
    if (in_array('mysql', $drivers)) {
        echo "✅ MySQL driver available<br>";
    } else {
        echo "❌ MySQL driver NOT available<br>";
    }
} else {
    echo "❌ PDO class NOT available<br>";
}

echo "<br><h3>File Permissions...</h3>";
echo "Current directory: " . __DIR__ . "<br>";
echo "Directory readable: " . (is_readable(__DIR__) ? '✅ Yes' : '❌ No') . "<br>";
echo "Directory writable: " . (is_writable(__DIR__) ? '✅ Yes' : '❌ No') . "<br>";

// List files in directory
echo "<br>Files in directory:<br>";
$files = scandir(__DIR__);
foreach ($files as $file) {
    if ($file != '.' && $file != '..') {
        echo "- {$file}<br>";
    }
}

echo "<br><h3>Next Steps:</h3>";
echo "1. If this page loads correctly, PHP is working<br>";
echo "2. Fix any issues shown above<br>";
echo "3. Then try the database test again<br>";
?>