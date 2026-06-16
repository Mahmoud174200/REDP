<?php

// Load .env variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

$apiKey = $_ENV['GEMINI_API_KEY'] ?? null;

if (!$apiKey) {
    die("Error: GEMINI_API_KEY not found in .env\n");
}

echo "Querying models list using API Key: " . substr($apiKey, 0, 6) . "...\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo "Failed to query models. HTTP Code: $httpCode\n";
    echo "Response: $response\n";
    exit;
}

$data = json_decode($response, true);
if (empty($data['models'])) {
    echo "No models found.\n";
    exit;
}

echo "Available Models:\n";
foreach ($data['models'] as $model) {
    echo " - " . $model['name'] . " (Supported Methods: " . implode(', ', $model['supportedGenerationMethods'] ?? []) . ")\n";
}
