<?php
$username = "mrfox815";

$lat = isset($_GET['lat']) ? $_GET['lat'] : null;
$lng = isset($_GET['lng']) ? $_GET['lng'] : null;
$q = isset($_GET['q']) ? $_GET['q'] : "airport"; // Default to "airport"

if (!$lat || !$lng) {
	header('Content-Type: application/json');
	echo json_encode(['error' => 'missing parameter']);
	exit;
}

// Construct the Geonames URL
$geonames_url = "http://api.geonames.org/findNearbyJSON?q={$q}&lat={$lat}&lng={$lng}&featureCode=AIRP&username={$username}&maxRows=50";

// Perform the API request
$response = file_get_contents($geonames_url);

// Check if the request was successful
if ($response === FALSE) {
	header('Content-Type: application/json');
	echo json_encode(['error' => 'Failed to fetch data from Geonames']);
	exit;
}

// Return the response
header('Content-Type: application/json');
echo $response;
