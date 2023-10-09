<?php

// Initialize cURL session
$ch = curl_init();

// Set API endpoint and parameters
$apiKey = "0017134679611fd6118d1583"; // Replace with your ExchangeRate-API key
$baseUrl = "https://api.exchangerate-api.com/v4/latest/"; // Latest rates based on USD
$params = "?api_key=" . $apiKey;

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $baseUrl . $params);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// Execute cURL session and fetch response
$response = curl_exec($ch);

// Check for errors in cURL session
if (curl_errno($ch)) {
    $result = array(
        "status" => array(
            "code" => 500,
            "name" => "fail",
            "description" => curl_error($ch)
        ),
        "data" => null
    );
} else {
    $result = array(
        "status" => array(
            "code" => 200,
            "name" => "ok",
            "description" => "success"
        ),
        "data" => json_decode($response, true)
    );
}

// Close cURL session
curl_close($ch);

// Output the result in JSON format
echo json_encode($result);
