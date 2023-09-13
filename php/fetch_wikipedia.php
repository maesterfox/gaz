<?php
// Your GeoNames username
$username = "mrfox815";

// Validate latitude and longitude from the GET request
$lat = filter_input(INPUT_GET, 'lat', FILTER_VALIDATE_FLOAT);
$lon = filter_input(INPUT_GET, 'lon', FILTER_VALIDATE_FLOAT);

if ($lat === false || $lon === false) {
    echo json_encode(['error' => 'Invalid latitude or longitude']);
    exit;
}

// Fetch place name data using findNearbyPlaceName API
$placeNameUrl = "http://api.geonames.org/findNearbyPlaceNameJSON?lat=$lat&lng=$lon&username=$username";
$wikipediaUrl = "http://api.geonames.org/findNearbyWikipediaJSON?lat=$lat&lng=$lon&username=$username";

// Error handling for file_get_contents
$placeNameData = @file_get_contents($placeNameUrl);
$wikipediaData = @file_get_contents($wikipediaUrl);

if ($placeNameData === false || $wikipediaData === false) {
    echo json_encode(['error' => 'Failed to fetch data']);
    exit;
}

// Decode and prepare the response
$response = [
    'placeInfo' => json_decode($placeNameData, true),
    'wikipediaInfo' => json_decode($wikipediaData, true)
];

// Output the JSON response
echo json_encode($response);
