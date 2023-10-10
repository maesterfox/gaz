<?php
$country = isset($_REQUEST['newsCountry']) ? $_REQUEST['newsCountry'] : 'GB';
$apiKey = "6d8059df68a94d09afe51afa601dd369";

$curl = curl_init();

curl_setopt_array($curl, array(
    CURLOPT_URL => "https://newsapi.org/v2/everything?q=" . $country . "&apiKey=" . $apiKey,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERAGENT => 'YourApplicationName/1.0',  // Add this line to set the User-Agent
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "GET",
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo "cURL Error #:" . $err;
} else {
    echo $response;
}
