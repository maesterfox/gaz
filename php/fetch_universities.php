<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

$username = "mrfox815";
$countryCode = $_REQUEST['iso'];

$url = "http://api.geonames.org/searchJSON?country={$countryCode}&fcode=UNIV&maxRows=50&username={$username}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

if (curl_errno($ch)) {
    $output['status']['code'] = "500";
    $output['status']['name'] = "Curl Error";
    $output['status']['description'] = curl_error($ch);
    echo json_encode($output);
    exit;
}

curl_close($ch);

$decode = json_decode($result, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    $output['status']['code'] = "500";
    $output['status']['name'] = "JSON Decode Error";
    $output['status']['description'] = json_last_error_msg();
    echo json_encode($output);
    exit;
}

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['data'] = $decode['geonames'];

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
