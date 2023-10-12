<?php
$countryInfoApiUrl = 'http://api.geonames.org/countryCodeJSON';
$username = 'mrfox815';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

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
    return $data;
}

function fetchCountryAndCurrencyCode($lat, $lng)
{
    global $username;
    $countryData = fetchCountryCode($lat, $lng);
    $countryCode = $countryData['countryCode'] ?? null;

    if ($countryCode === null) {
        return null;
    }

    $url = "http://api.geonames.org/countryInfoJSON?country={$countryCode}&username={$username}";
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    $currencyCode = $data['geonames'][0]['currencyCode'] ?? null;

    return [
        'countryCode' => $countryCode,
        'currencyCode' => $currencyCode,
    ];
}

$latitude = $_GET['lat'] ?? null;
$longitude = $_GET['lng'] ?? null;

if ($latitude !== null && $longitude !== null) {
    $countryAndCurrencyData = fetchCountryAndCurrencyCode($latitude, $longitude);
    if ($countryAndCurrencyData !== null) {
        echo json_encode($countryAndCurrencyData);
        exit();
    }
}
