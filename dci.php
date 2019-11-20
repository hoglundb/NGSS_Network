<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include 'DBConnection.php';

session_start();

function main(){
  $con = GetDBConnection();
  $query = "SELECT categories FROM dci_categories";
  $result = array();
  if($res = mysqli_query($con, $query)){
    while($row = $res->fetch_assoc()){
      $cat = $row["categories"];
      array_push($result, $cat);
    }
  }
  echo json_encode($result);
}

main();

?>
