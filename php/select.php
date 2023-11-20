<?php
// Replace with your GeoNames username
$username = 'mrfox815';

if (isset($_GET['lat']) && isset($_GET['lng'])) {
    $lat = $_GET['lat'];
    $lng = $_GET['lng'];

    $url = "http://api.geonames.org/countryCodeJSON?lat={$lat}&lng={$lng}&username={$username}";

    try {
        $response = file_get_contents($url);
        if ($response === FALSE) {
            throw new Exception("Error fetching data from GeoNames API");
        }
        echo $response;
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["error" => "Invalid request"]);
}
