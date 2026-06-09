<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=redp_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected successfully to redp_db.\n";
    $stmt = $pdo->query("SELECT * FROM units LIMIT 3");
    $units = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($units as $u) {
        echo "Unit: {$u['unit_number']}, Floor: {$u['floor']}, Type: {$u['type']}, Price: {$u['price']}, Area: {$u['area']}, Beds: {$u['bedrooms']}, Baths: {$u['bathrooms']}, View: {$u['view_type']}, Bldg: {$u['building']}, Layout: {$u['layout_description']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
