<?php
function GetDBConnection(){
  $connection = mysqli_connect("localhost", "teacheng_prod" ,"EKvCfHQ8uuyXl2tf" ,"test_ngss_network");
  if($connection == false){
          die("Error: Could not connect ".mysqli_connect_error());
  }

  return $connection;
}

 ?>
