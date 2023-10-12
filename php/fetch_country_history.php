<?php
header("Content-Type: application/json");

$countryName = $_GET['countryName']; // Get this from your AJAX call
$wikipediaUrl = "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=&titles=" . urlencode($countryName);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $wikipediaUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

echo $response;
