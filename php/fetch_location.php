<?php
// fetch_mapbox.php
$api_key = "pk.eyJ1IjoibXJmb3g4MTUiLCJhIjoiY2xtcDYwMjFmMWJtNjJpczVlOXJ1MTA3ayJ9.VeHBC-5PeWhYl36hK3-cMw";
$country_code = isset($_GET['query']) ? $_GET['query'] : null;
$latitude = isset($_GET['latitude']) ? $_GET['latitude'] : null;
$longitude = isset($_GET['longitude']) ? $_GET['longitude'] : null;

if ($country_code) {
    $url = "https://api.mapbox.com/geocoding/v5/mapbox.places/{$country_code}.json?access_token={$api_key}";
} elseif ($latitude && $longitude) {
    $url = "https://api.mapbox.com/geocoding/v5/mapbox.places/{$longitude},{$latitude}.json?access_token={$api_key}";
} else {
    echo json_encode(['error' => 'Invalid parameters']);
    exit;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$response = curl_exec($ch);
curl_close($ch);

echo $response;
