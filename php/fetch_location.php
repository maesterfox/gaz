<?php
// fetch_mapbox.php
$api_key = "pk.eyJ1IjoibXJmb3g4MTUiLCJhIjoiY2xtcDYwMjFmMWJtNjJpczVlOXJ1MTA3ayJ9.VeHBC-5PeWhYl36hK3-cMw";
$country_code = $_GET['query'];

$url = "https://api.mapbox.com/geocoding/v5/mapbox.places/{$country_code}.json?access_token={$api_key}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$response = curl_exec($ch);
curl_close($ch);

echo $response;
