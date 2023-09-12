<?php
$apiKey = "4fe0f4e6120b4529a33583954b82b56d";
$lat = $_GET['lat'];
$lng = $_GET['lng'];
$url = "https://api.opencagedata.com/geocode/v1/json?q=$lat+$lng&key=$apiKey";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Curl error: ' . curl_error($ch);
}

curl_close($ch);

$data = json_decode($response, true);
$countryCode = $data['results'][0]['components']['country_code'];

header('Content-Type: application/json');
echo json_encode(['countryCode' => strtoupper($countryCode)]);
