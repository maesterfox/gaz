<?php
header('Content-Type: application/json');

$csvFile = './nuclear_explosions.csv';  // Update this to your actual path
$rows = array_map('str_getcsv', file($csvFile));
$header = array_shift($rows);
$csv = array();
foreach ($rows as $row) {
    $csv[] = array_combine($header, $row);
}

echo json_encode(['nuclearExplosionsData' => $csv]);
