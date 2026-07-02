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

$prompt = "a beautiful modern house, isometric 3D cutaway render, white background, realistic material textures";

echo "Testing Imagen 4.0 API...\n";
echo "Prompt: $prompt\n\n";

$payload = [
    'instances' => [
        [
            'prompt' => $prompt
        ]
    ],
    'parameters' => [
        'sampleCount' => 1
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=" . $apiKey);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_TIMEOUT, 90);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
if ($httpCode !== 200) {
    echo "Response: $response\n";
    exit;
}

$data = json_decode($response, true);
$base64Image = $data['predictions'][0]['bytesBase64Encoded'] ?? null;

if (!$base64Image) {
    echo "No image returned. Response structure:\n";
    print_r($data);
    exit;
}

file_put_contents("test_out.png", base64_decode($base64Image));
echo "Success! Saved generated image to test_out.png\n";
