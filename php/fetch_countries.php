<?php
$continent = $_GET['continent'];
$apiUrl = "https://restcountries.com/v3.1/region/$continent"; // Replace with your actual API

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Curl error: ' . curl_error($ch);
}

curl_close($ch);

header('Content-Type: application/json');
echo $response;
