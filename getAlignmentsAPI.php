<?php
/*define("GREEN_COLOR", "#d6e3bc");
define("ORANGE_COLOR", "#fbd4b4");
define("BLUE_COLOR", "#b8cce4");*/

define("GREEN_COLOR", "#CDE49F");
define("ORANGE_COLOR", "#FBC08C");
define("BLUE_COLOR", "#9FBDE4");
include 'DBConnection.php';
   if(isset($_POST['scode']) && $_POST['scode'] != ''){
    $con = GetDBConnection();
    $alignments = GetAlignments($_POST['scode'], GetDBConnection());
    //print(json_encode("test"));
    print($alignments);
}

/*$time_start = microtime(true);
$res = GetAlignments("S2454554", GetDBConnection());
$end_time = microtime(true);
print($end_time - $time_start);
print($res);*/

//Gets all documents aligned with this standard (sCode)
function GetAlignments($sCode, $dbConnection){
  $documents = array();
  $docCount = 0;
  $stdColor = _GetStdColor($sCode, $dbConnection);
  $query = "SELECT doc_id, summary, title, doc_type from bh_raven_docs WHERE doc_id in (SELECT doc_id FROM bh_std_ngss_alignments WHERE sCode = '".$sCode."')";
  if($res = mysqli_query($dbConnection, $query)){
    while($row = $res->fetch_assoc()){
      $doc = new Document();
      $doc->doc_id = $row['doc_id'];
      $doc->summary = iconv("UTF-8", "UTF-8//IGNORE", $row['summary']);
      $doc->title = iconv("UTF-8", "UTF-8//IGNORE", $row['title']);
      $doc->std_color = $stdColor;
      $doc->doc_type = $row['doc_type'];
      $doc->docType = $row['doc_type'];
      $doc->url =   _GetTEUrl($row['doc_type'], $row["doc_id"]);
      array_push($documents, $doc);
      $docCount = $docCount + 1;
    }
  }
/*print_r($documents);*/
  return json_encode($documents);
}


function _GetTEUrl($doc_type, $docId){
  $type = "";
  if($doc_type == "lesson"){
    $type = "lessons";
  }
  else if($doc_type = "activity"){
    $type = "activities";
  }
  else if($doc_type = "curricularUnit"){
    $type = "curricularunits";
  }
  else if($doc_type = "makerChallange"){
    $type = "makerchallanges";
  }
  else if ($doc_type = "sprinkle"){
    $type = "sprinkles";
  }
  return "https://www.teachengineering.org/" . $type . "/view" . "/" .$docId;
}

function _GetStdColor($sCode, $dbConnection){
   $query = "SELECT std_type from bh_ngss_network_nodes WHERE s_code = '".$sCode."'";
   if($res = mysqli_query($dbConnection, $query)){
     if($row = $res->fetch_assoc()){
       if($row['std_type'] == "parent"){
         return '#EFB2F2';
       }
       if($row['std_type'] == "child"){
         return "lightGrey";
       }
       if($row['std_type'] == "3d"){
        return _GetChildColor($sCode, $dbConnection);
       }
       else return $row['std_type'];
     }

   }
   return $query;
}


function _GetChildColor($sCode, $dbConnection){
  $query = "SELECT category FROM bh_NGSS_3D WHERE edu_std = '".$sCode."'";
  if($res = mysqli_query($dbConnection, $query)){
    if($row = $res->fetch_assoc()){
        if($row['category'] == "SEP"){
          return BLUE_COLOR;
        }
        if($row['category'] == "DCI"){
          return ORANGE_COLOR;
        }
        if($row['category'] == "CC"){
          return GREEN_COLOR;
        }
    }
  }
  return $query;
}

class Document{
  public $doc_id;
  public $summary;
  public $title;
  public $std_color;
  public $url;
  public $docType;
}
 ?>
