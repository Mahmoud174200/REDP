<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=redp_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $projectId = '623f1780-4ed7-4db4-a558-2e65e5238431';
    
    // Find project
    $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
    $stmt->execute([$projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$project) {
        echo "Project with ID $projectId not found in database.\n";
        
        // List all projects in database
        $all = $pdo->query("SELECT id, name FROM projects")->fetchAll(PDO::FETCH_ASSOC);
        echo "All projects in DB:\n";
        foreach ($all as $p) {
            echo " - {$p['id']}: {$p['name']}\n";
        }
        exit;
    }
    
    echo "Found Project:\n";
    print_r($project);
    
    // Find buildings count
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM buildings WHERE project_id = ?");
    $stmt->execute([$projectId]);
    $buildingsCount = $stmt->fetchColumn();
    echo "Buildings count: $buildingsCount\n";
    
    // Find units count
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM units WHERE project_id = ?");
    $stmt->execute([$projectId]);
    $unitsCount = $stmt->fetchColumn();
    echo "Units count: $unitsCount\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
