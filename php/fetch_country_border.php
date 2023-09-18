<?php
$countryCode = $_GET['countryCode'] ?? null;

if (!$countryCode) {
    echo json_encode(['error' => 'Country code is required']);
    exit;
}

$url = "https://restcountries.com/v3.1/alpha/{$countryCode}";

$response = file_get_contents($url);

if ($response === FALSE) {
    echo json_encode(['error' => 'Failed to fetch data']);
    exit;
}

$countryData = json_decode($response, true);
$borderData = $countryData[0]['borders'] ?? null;

if (!$borderData) {
    echo json_encode(['error' => 'No border data available']);
    exit;
}

echo json_encode(['borders' => $borderData]);
