<?php
$country = isset($_REQUEST['newsCountry']) ? $_REQUEST['newsCountry'] : 'us'; // Default to 'us' if not provided

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "https://google-news13.p.rapidapi.com/world?lr=en-US&country=$country", // Include the 'country' parameter
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "GET",
    CURLOPT_HTTPHEADER => [
        "X-RapidAPI-Host: google-news13.p.rapidapi.com",
        "X-RapidAPI-Key: a18908fbc2msh4465e8c94fa4888p1aeed5jsn97d8dc3e9b41"
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo "cURL Error #:" . $err;
} else {
    echo $response;
}
