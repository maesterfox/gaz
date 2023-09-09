<?php
$apiKey = "b1b39de8b0328204bf0b3e28e4d70c25"; // Replace with your OpenWeather API key
$lat = $_GET["lat"];
$lon = $_GET["lon"];
$zoom = 6; // You can change this
$date = time(); // Current Unix timestamp

// Fetch weather data
$weatherUrl = "http://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lon&appid=$apiKey";
$weatherData = file_get_contents($weatherUrl);

// Generate global precipitation map URL
$globalPrecipitationMapUrl = "https://maps.openweathermap.org/maps/2.0/radar/$zoom/$lat/$lon?appid=$apiKey&tm=$date";

// Combine both into one associative array
$response = [
    "weatherData" => json_decode($weatherData, true),
    "globalPrecipitationMapUrl" => $globalPrecipitationMapUrl
];

// Output the JSON response
echo json_encode($response);
