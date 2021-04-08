<?php


try {
    $conn = new PDO("mysql:host=".SUPER6_DBHOST.";dbname=".SUPER6_DBNAME, SUPER6_DBUSER, SUPER6_DBPASS);
    // set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    //echo "Connected successfully";
} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}