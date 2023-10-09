<?php
header("Content-Type: application/json");

// Capture north, east, south, west coordinates from the request
$north = $_GET['north'];
$east = $_GET['east'];
$south = $_GET['south'];
$west = $_GET['west'];

// Build the Overpass query
$query = "
    [out:json];
    (
        node['tourism'='museum']($south,$west,$north,$east);
        node['amenity'='place_of_worship']($south,$west,$north,$east);
        node['natural'='peak']($south,$west,$north,$east);
        node['historic']($south,$west,$north,$east);
        node['tourism'='theme_park']($south,$west,$north,$east);
    );
    out body;
";

// URL encode the query
$encodedQuery = urlencode($query);

// Fetch the data from the Overpass API
$url = "http://overpass-api.de/api/interpreter?data=$encodedQuery";
$response = file_get_contents($url);

// Return the data as JSON
echo $response;
