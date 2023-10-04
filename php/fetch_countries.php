<?php
// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Step 1: Updated API URL to fetch all countries
$apiUrl = "https://restcountries.com/v3.1/all"; // Replace with your actual API to fetch all countries

// Step 2: Removed continent dependency
// $continent = $_GET['continent'];

// Step 3: cURL execution remains the same
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Curl error: ' . curl_error($ch);
}

curl_close($ch);

// Output the JSON response
echo $response;
