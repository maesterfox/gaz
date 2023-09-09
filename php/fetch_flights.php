<?php
// Fetch flight data from OpenSky API
$api_url = "https://opensky-network.org/api/states/all";

// Use file_get_contents to GET the API response
$response = file_get_contents($api_url);

// Output the response for AJAX call
echo $response;
