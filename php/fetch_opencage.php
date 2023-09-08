<?php
$apiKey = "4fe0f4e6120b4529a33583954b82b56d"; // Replace with your OpenCage API key
$query = urlencode($_GET['query']);
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
