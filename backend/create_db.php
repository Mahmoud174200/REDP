<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE DATABASE IF NOT EXISTS rdp_dp;');
    echo "Database 'rdp_dp' created successfully!\n";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}
