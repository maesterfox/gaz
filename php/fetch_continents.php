<?php
// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Hardcoded list of continents
$continents = ["Africa", "Asia", "Europe", "Americas", "Oceania", "Antarctica"];

echo json_encode($continents);
