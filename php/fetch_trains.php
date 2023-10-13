<?php
// Replace 'YOUR_API_KEY' with your actual API key
$api_key = 'AIzaSyAgogJFxyczBYpDf5qonOl_AwatS4TYY2Q';

$lat = $_GET['lat'];
$lon = $_GET['lon'];
$radius = 50000;  // in meters

$url = "https://maps.googleapis.com/maps/api/place/textsearch/json?"
    . "query=trainstations"
    . "&location=$lat,$lon"
    . "&radius=$radius"
    . "&key=$api_key";

$response = file_get_contents($url);

if ($response === FALSE) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to fetch train station data']);
    exit;
}

header('Content-Type: application/json');
echo $response;
