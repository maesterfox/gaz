<!-- Geonames API  -->

<?php
// Define your GeoNames API endpoint and parameters
$apiUrl = 'http://api.geonames.org/searchJSON';
$countryInfoApiUrl = 'http://api.geonames.org/countryCodeJSON';
$username = 'mrfox815';
$landmarksData = array();
$citiesData = array();
$airportsData = array();


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

    // Make the API request
    $response = file_get_contents($url);

    // Handle the API response (you may want to parse and process the data here)
    $data = json_decode($response, true);

    return $data;
}

// Function to make API requests for landmarks, cities, and airports
function fetchGeoNamesData($featureCode, $countryCode, $maxRows)
{
    global $apiUrl, $username;

    $params = array(
        'q' => '',
        'country' => $countryCode,
        'featureCode' => $featureCode,
        'maxRows' => $maxRows,
        'username' => $username,
    );

    $url = $apiUrl . '?' . http_build_query($params);

    // Make the API request
    $response = file_get_contents($url);

    // Handle the API response (you may want to parse and process the data here)
    $data = json_decode($response, true);

    return $data;
}


// Process and return the data as needed
echo json_encode(array(
    'landmarks' => $landmarksData,
    'cities' => $citiesData,
    'airports' => $airportsData,
));
