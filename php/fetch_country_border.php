<?php
header('Content-Type: application/json');

// Get the country code from the GET request
$countryCode = $_GET['countryCode'];

// Read the GeoJSON file
$geojson = file_get_contents('./countries.geo.json');
$data = json_decode($geojson, true);

// Initialize an empty array to hold the border data for the selected country
$selectedCountryData = [];

// Loop through each feature to find the one that matches the country code
foreach ($data['features'] as $feature) {
    if ($feature['properties']['ISO_A3'] === $countryCode) { // Note the change to 'ISO_A3'
        $selectedCountryData = $feature;
        break;
    }
}

// Check if data was found
if (empty($selectedCountryData)) {
    echo json_encode(['status' => ['code' => 404, 'message' => 'Country not found']]);
} else {
    // Return the selected country data
    echo json_encode(['status' => ['code' => 200, 'message' => 'Success'], 'properties' => $selectedCountryData['properties'], 'geometry' => $selectedCountryData['geometry']]);
}
