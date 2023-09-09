<?php

$api_key = 'V7tnMZ5VxmlCEeorX16A1LZwAGv4LDNb';
$base_url = 'https://www.mapquestapi.com/directions/v2/route';

// Replace 'Start Location' and 'End Location' with user-provided values
$origin = $_GET['origin']; // You can use POST if needed
$destination = $_GET['destination'];

// Build the request URL with parameters
$start = urlencode($origin);
$end = urlencode($destination);
$url = "{$base_url}?key={$api_key}&from={$start}&to={$end}";

// Make the API request
$response = file_get_contents($url);

// Parse and handle the API response
$data = json_decode($response, true);
if ($data) {
    // Extract and process route information here
    $route = $data['route'];
    // Example: Access route distance and time
    $distance = $route['distance'];
    $time = $route['formattedTime'];
    // You can customize this part to use route data as needed
    $result = [
        'distance' => $distance,
        'time' => $time,
    ];
    echo json_encode($result); // Return processed data as JSON
} else {
    // Handle errors
    echo json_encode(['error' => 'Failed to fetch route data']);
}
