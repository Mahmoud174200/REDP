<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=redp_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $tables = ['projects', 'buildings', 'building_floors', 'units', 'project_media', 'project_payment_plans'];
    
    foreach ($tables as $t) {
        echo "=== Table: $t ===\n";
        $stmt = $pdo->query("DESCRIBE `$t`");
        $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $col) {
            echo "  {$col['Field']} - {$col['Type']} - Null: {$col['Null']} - Key: {$col['Key']}\n";
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
