<?php
header("Content-Type: application/json");

// Capture latitude and longitude from the GET request
$lat = $_GET['lat'];
$lng = $_GET['lng'];

// Set the optional parameters (you can adjust these as needed)
$radius = isset($_GET['radius']) ? $_GET['radius'] : 10;
$maxRows = isset($_GET['maxRows']) ? $_GET['maxRows'] : 10;

// Construct the Geonames API URL for finding nearby points of interest
$geonamesUrl = "https://api.geonames.org/findNearbyPOIsOSMJSON?lat=$lat&lng=$lng&radius=$radius&maxRows=$maxRows&username=mrfox815";

// Initialize a cURL session
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $geonamesUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Execute the cURL request and get the response
$response = curl_exec($ch);

// Close the cURL session
curl_close($ch);

// Return the response as JSON
echo $response;
