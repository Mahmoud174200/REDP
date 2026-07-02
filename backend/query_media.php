<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=redp_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SELECT * FROM project_media");
    $media = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "=== All Project Media ===\n";
    foreach ($media as $m) {
        print_r($m);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
