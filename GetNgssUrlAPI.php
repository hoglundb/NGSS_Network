<?php
include 'DBConnection.php';
   if(isset($_POST['scode']) && $_POST['scode'] != ''){
   print(GetNGSSUrl($_POST['scode']));
}


//GetNGSSUrl('S2454554');
function GetNGSSUrl($sCode){
      $dbConnection = GetDBConnection();
      $query = "SELECT uri FROM bh_ngss_uri_mappings WHERE sCode = '".$sCode."'";
      if($res = mysqli_query($dbConnection, $query)){
        $row = $res->fetch_assoc();
        return json_encode($row['uri']);
        //echo("\n"); //strval($query) ;// $row['uri'];
      }
      else return json_encode("error");
}


?>
