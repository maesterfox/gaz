<?php
$apiKey = "b1b39de8b0328204bf0b3e28e4d70c25"; // Replace with your OpenWeather API key
$city = $_GET["city"]; // The city name passed from the front-end
$url = "http://api.openweathermap.org/data/2.5/weather?q=$city&appid=$apiKey";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$output = curl_exec($ch);
curl_close($ch);

echo $output;
