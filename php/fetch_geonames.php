<?php
// Define your GeoNames API endpoint and parameters
$apiUrl = 'http://api.geonames.org/searchJSON';
$countryInfoApiUrl = 'http://api.geonames.org/countryCodeJSON';
$username = 'mrfox815';

// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Function to fetch country code based on latitude and longitude
function fetchCountryCode($lat, $lng)
{
    global $countryInfoApiUrl, $username;

    $params = array(
        'lat' => $lat,
        'lng' => $lng,
        'username' => $username,
    );

    $url = $countryInfoApiUrl . '?' . http_build_query($params);
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    error_log(print_r($data, true));  // Log the data
    return $data;
}

// Function to make API requests for landmarks, cities, and airports
// Function to make API requests for landmarks, cities, and airports
function fetchGeoNamesData($featureCode, $countryCode, $maxRows, $bbox = null)
{
    global $apiUrl, $username;

    $params = array(
        'q' => '',
        'country' => $countryCode,
        'featureCode' => $featureCode,
        'maxRows' => $maxRows,
        'username' => $username,
    );

    if ($bbox) {
        $params['north'] = $bbox['north'];
        $params['south'] = $bbox['south'];
        $params['east'] = $bbox['east'];
        $params['west'] = $bbox['west'];
    }

    $url = $apiUrl . '?' . http_build_query($params);
    $response = file_get_contents($url);
    $data = json_decode($response, true);

    return $data;
}

// Fetch data based on feature codes and country codes
$countryCode = $_GET['countryCode'] ?? ''; // Replace with the actual country code
$featureCode = $_GET['featureCode'] ?? ''; // Replace with the actual feature code
$maxRows = $_GET['maxRows'] ?? 50; // Replace with the actual max rows
$bbox = $_GET['bbox'] ?? null; // Bounding box for map view

$fetchedData = fetchGeoNamesData($featureCode, $countryCode, $maxRows, $bbox);

// Process and return the data as needed
echo json_encode($fetchedData);
