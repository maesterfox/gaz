<?php
// Get latitude and longitude from AJAX request
$lat = $_GET['lat'];
$lng = $_GET['lng'];

// Google Street View API endpoint
$apiUrl = "https://maps.googleapis.com/maps/api/streetview?location=$lat,$lng&key=AIzaSyAgogJFxyczBYpDf5qonOl_AwatS4TYY2Q";

// Initialize cURL session
$ch = curl_init($apiUrl);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Execute cURL session and get the response
$response = curl_exec($ch);

// Check for errors
if (curl_errno($ch)) {
    echo json_encode(array('error' => 'Error making API request.'));
} else {
    // Process the response as needed
    // For example, you can return the URL of the Street View image
    echo json_encode(array('streetview_url' => $response));
}

// Close cURL session
curl_close($ch);
