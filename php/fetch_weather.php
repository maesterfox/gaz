<?php
// Your API Key should be kept secure
$apiKey = "2c7d6c408ca54ea584c114917232210";

// Validate latitude and longitude
$lat = filter_input(INPUT_POST, 'lat', FILTER_VALIDATE_FLOAT);
$lon = filter_input(INPUT_POST, 'lon', FILTER_VALIDATE_FLOAT);

if ($lat === false || $lon === false || $lat === null || $lon === null) {
    echo json_encode(['error' => 'Invalid latitude or longitude']);
    exit;
}

// Create the query parameter for latitude and longitude
$location = "{$lat},{$lon}";

// WeatherAPI endpoint for both current weather and forecast
$weatherUrl = "http://api.weatherapi.com/v1/forecast.json?key={$apiKey}&q={$location}&days=5";

// Initialize cURL session
$curl = curl_init();

// Set cURL options
curl_setopt_array($curl, [
    CURLOPT_URL => $weatherUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPGET => true,
]);

// Execute cURL session and fetch the response
$response = curl_exec($curl);

// Check for cURL errors
if (curl_errno($curl)) {
    echo json_encode(['error' => 'Failed to fetch weather data']);
    exit;
}

// Close cURL session
curl_close($curl);

// Output the JSON response
echo $response;
