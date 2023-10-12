<?php
// fetch_exchange_rates.php

// set API Endpoint and API key
$endpoint = 'latest';
$access_key = '8ff96e414f4450a16a4cc9947e5f9445';  // Fetch from environment variable

// Initialize CURL
$ch = curl_init('http://data.fixer.io/api/' . $endpoint . '?access_key=' . $access_key);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Store the data
$json = curl_exec($ch);

// Check for errors
if (curl_errno($ch)) {
    echo json_encode(['error' => curl_error($ch)]);
    exit;
}

curl_close($ch);

// Decode JSON response
$exchangeRates = json_decode($json, true);

// Output the result in JSON format
echo json_encode($exchangeRates);
