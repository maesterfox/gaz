<?php
// fetch_warzones.php
$apiKey = 'your_warzones_api_key';
$location = $_GET['location'];
$url = 'warzones_api_url_here';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$output = curl_exec($ch);
curl_close($ch);

echo $output;
