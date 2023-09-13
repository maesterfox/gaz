<?php
// Your API Key should be kept secure
$apiKey = "b1b39de8b0328204bf0b3e28e4d70c25";

// Validate latitude and longitude
$lat = filter_input(INPUT_GET, 'lat', FILTER_VALIDATE_FLOAT);
$lon = filter_input(INPUT_GET, 'lon', FILTER_VALIDATE_FLOAT);

if ($lat === false || $lon === false) {
    echo json_encode(['error' => 'Invalid latitude or longitude']);
    exit;
}

$zoom = 6;
$date = time(); // Current Unix timestamp

// Fetch weather data
$weatherUrl = "http://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lon&appid=$apiKey";

// Error handling for file_get_contents
$weatherData = @file_get_contents($weatherUrl);
if ($weatherData === false) {
    echo json_encode(['error' => 'Failed to fetch weather data']);
    exit;
}

// Generate global precipitation map URL
$globalPrecipitationMapUrl = "https://maps.openweathermap.org/maps/2.0/radar/$zoom/$lat/$lon?appid=$apiKey&tm=$date";

// Combine both into one associative array
$response = [
    'weatherData' => json_decode($weatherData, true),
    'globalPrecipitationMapUrl' => $globalPrecipitationMapUrl
];

// Output the JSON response
echo json_encode($response);
