<?php
header("Content-Type: application/json");

// Fetch country code from the query parameters
$countryCode = $_GET['countryCode'];

if (!$countryCode) {
  echo json_encode(["error" => "No country code provided"]);
  exit;
}


$apiUrl = "https://restcountries.com/v3.1/alpha/" . $countryCode;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200) {
  echo $response;
} else {
  echo json_encode(["error" => "Failed to fetch data, HTTP Code: " . $httpCode]);
}
