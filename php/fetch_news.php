<?php
$country = isset($_REQUEST['newsCountry']) ? $_REQUEST['newsCountry'] : 'GB';
$apiKey = "_U0_0Xs73Eq6UH9dM90owTlkPVelmjy1HAwtJoGbJZSjB5CC";  // Replace with your Currents API key

// Use the Currents API endpoint for latest news
$curl = curl_init();

curl_setopt_array($curl, array(
    CURLOPT_URL => "https://api.currentsapi.services/v1/latest-news?country=" . $country,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERAGENT => 'YourApplicationName/1.0',  // Add this line to set the User-Agent
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "GET",
    CURLOPT_HTTPHEADER => array(
        "Authorization: " . $apiKey  // Add this line to set the API key in the header
    ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo "cURL Error #:" . $err;
} else {
    echo $response;
}
