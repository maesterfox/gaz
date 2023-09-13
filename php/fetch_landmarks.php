<?php
$apiKey = "4fe0f4e6120b4529a33583954b82b56d";
$lat = $_GET['lat']; // Extract latitude from the query parameter
$lng = $_GET['lng']; // Extract longitude from the query parameter

// Use $lat and $lng for reverse geocoding

$query = urlencode("$lat,$lng"); // Construct the query string

// Define the OpenCage API endpoint for landmarks (you may need to adjust this based on the OpenCage API documentation)
$url = "https://api.opencagedata.com/geocode/v1/json?q=$query&key=$apiKey";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Curl error: ' . curl_error($ch);
}

curl_close($ch);

header('Content-Type: application/json');
echo $response;
