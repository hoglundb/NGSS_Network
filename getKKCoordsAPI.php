<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
define("RSERVE_HOST", "127.0.0.1");
include_once("/var/www/2014.teachengineering.org/2014_htdocs/research.teachengineering.org/htdocs/rserve-php-0.1/Connection.php");

$edgeListString = $_POST["edgeList"];

$junk = array();
$r = new Rserve_Connection(RSERVE_HOST);
$kkCoords = $r->evalString($edgeListString);
for($i = 0; $i < count($kkCoords); $i++){
  $kkCoords[$i] = round($kkCoords[$i] * 100);
}
echo json_encode($kkCoords);
?>
