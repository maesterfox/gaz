<?php
// error reporting (uncomment these two lines during development)
// ini_set('display_errors', 'On');
// error_reporting(E_ALL);

// gets current time
$executionStartTime = microtime(true);

// your Geonames username
$username = "mrfox815";

// gets countryCode from request variable
$countryCode = $_REQUEST['iso'];

// Update the URL to fetch airports by country code
$url = "http://api.geonames.org/searchJSON?country={$countryCode}&fcode=AIRP&maxRows=100&username={$username}";

// creating curl handle
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

// makes the request to the API
$result = curl_exec($ch);

curl_close($ch);

$decode = json_decode($result, true);

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['data'] = $decode['geonames'];

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);
