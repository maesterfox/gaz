<?php
// read_csv.php
header('Content-Type: application/json');
$csv = array_map('str_getcsv', file('nuclear_explosions.csv'));
array_walk($csv, function (&$a) use ($csv) {
    $a = array_combine($csv[0], $a);
});
array_shift($csv);
echo json_encode($csv);
