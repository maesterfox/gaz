<?php

$api_key = 'AIzaSyAgogJFxyczBYpDf5qonOl_AwatS4TYY2Q';

$lat = $_GET['lat'];
$lon = $_GET['lon'];
$radius = 50000;  // in meters

$url = "https://maps.googleapis.com/maps/api/place/textsearch/json?"
	. "query=train+stations"
	. "&location=$lat,$lon"
	. "&radius=$radius"
	. "&key=$api_key";

$response = file_get_contents($url);

if ($response === FALSE) {
	header('Content-Type: application/json');
	echo json_encode(['error' => 'Failed to fetch train station data']);
	exit;
}

$response_data = json_decode($response, true);
if (isset($response_data['results'])) {
	$stations = array();
	foreach ($response_data['results'] as $result) {
		$station = array(
			'name' => $result['name'],
			'lat' => $result['geometry']['location']['lat'],
			'lon' => $result['geometry']['location']['lng'],
			'address' => isset($result['formatted_address']) ? $result['formatted_address'] : '',
			'rating' => isset($result['rating']) ? $result['rating'] : ''
		);
		$stations[] = $station;
	}
	header('Content-Type: application/json');
	echo json_encode(['results' => $stations]);
} else {
	header('Content-Type: application/json');
	echo json_encode(['error' => 'No results found']);
}
