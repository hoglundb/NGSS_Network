<?php
include 'DBConnection.php';
include 'simple_dom_parser.php';

function main(){

  ClearDBTables();


  //file contains alignments data
  $csvFilePath = "GenerationgeniusDataFiles/Alignments_OR.csv";

  //file contains data on url of lesson. We will use this url to scrape for the summary.
  $htmlFilePath = "GenerationgeniusDataFiles/Alignments_OR.html";

  $lessonURIs = ScrapeForLessonURIs($htmlFilePath);

  $alignmentsData = ReadAlignmentsFromCSV($csvFilePath);

  $alignmentsData2 = FormatAlignmentsData($alignmentsData);
//  print_r($alignmentsData2);

  $resources = GetResources($alignmentsData2, $lessonURIs);

  $resources = GetAlignmentsForAllResources($resources, $alignmentsData2);

  $resources = RemoveNonNGSSAlignedResources($resources);

  $alignments = BuildAlignments($resources);

  $resources = ScrapeForSummaries($resources);

  BuildResourceTable($resources);
/*  print_r($resources);*/

/*  print_r($resources);
*/}



function BuildAlignments($resources){
     $dbConnection = GetDBConnection();
     $count = 1;
     for($i = 0; $i < count($resources); $i++){
       $curResource = $resources[$i];
       $alignmentsCount = count($resources[$i]->alignments);

       for($j = 0; $j < $alignmentsCount; $j++){

        $NGSSCode  = str_replace(" ", "", $resources[$i]->alignments[$j]);
        $ASNCode = getASNCode($NGSSCode);

        $insertQuery = "INSERT INTO generationgenius_alignments" . "("
        . "doc_id,"
        . "sCode"
        . ")"
        ."VALUES ("
        . "'" .  addslashes($resources[$i]->id) . "',"
        . "'" .  addslashes($ASNCode) . "'"
        . ")";
        if($dbConnection->query($insertQuery) !== TRUE){
           echo "Failed inserting into bh_science_buddies_docs";
           print($insertQuery . "\n");
           return;
        }
        echo $count . "\n";
        $count++;
       }


     }

}


//Takes a NGSS code and querries the db for the corrisponding ASN code
function getASNCode($NGSSCode){
  $dbConnection = GetDBConnection();
  $queryNGSS = "SELECT sCode FROM ngss_uri_mappings WHERE  pCode = '" . $NGSSCode . "'";
  if($res = mysqli_query($dbConnection, $queryNGSS)){
    if($row=$res->fetch_assoc()){
      return $row["sCode"];
    }
    return "error1";
  }
  return "error2";
}


function ClearDBTables(){
  $con = GetDBConnection();

  $q = "DELETE FROM generationgenius_collection";
  if($con->query($q) !== TRUE) echo "Failed to delete from generationgenious_collection\n";

  $q = "DELETE FROM generationgenius_alignments";
  if($con->query($q) !== TRUE) echo "Failed to delete from generationgenius_alignments\n";
}


function BuildResourceTable($resources){

    $con = GetDBConnection();


  print("\n". count($resources) . "docs to insert\n\n");

  for($i = 0; $i < count($resources); $i++){
    $id = $resources[$i]->id;
    $url = $resources[$i]->url;
    $summary = $resources[$i]->summary;
    $grade = $resources[$i]->grade;
    $title = $resources[$i]->id;
    $state = $resources[$i]->state;

    $query = "INSERT INTO generationgenius_collection" . "("
    . "doc_id,"
    . "summary,"
    . "title,"
    . "url,"
    . "state,"
    . "grade"
    . ")"
    . "VALUES ("
    . "'" . addslashes($id) . "',"
    . "'" . addslashes($summary) . "',"
    . "'" . addslashes($title) . "',"
    . "'" . $url . "',"
    . "'" . $state . "',"
    . "'" . $grade . "'"
    . ")";

    if($con->query($query) !== TRUE){
       echo "Failed inserting into bh_science_buddies_docs";
       echo($query);
       return;
    }

  }
}

/*
$query = "INSERT INTO outdoorschool_collection" . "("
. "doc_id,"
. "summary,"
. "title,"
. "url,"
. "doc_type"
. ")"
."VALUES ("
. "'" .  $docId . "',"
. "'" .  $summary . "',"
. "'" .  $title . "',"
. "'" .  $url . "',"
 . "'" .  $docType . "'"
. ")";*/

function RemoveNonNGSSAlignedResources($resources){
  $alignedResources = array();
  for($i = 0; $i < count($resources); $i++){
    $code = $resources[$i]->alignments[0];
    if(IsNGSSCode($code)){
       array_push($alignedResources, $resources);
    }
  }
  return $resources;
}

/*if($res = mysqli_query($dbConnection, $queryNGSS)){
  if($row=$res->fetch_assoc()){
    return $row["sCode"];
  }
  return "error1";
}
return "error2";
}*/
function IsNGSSCode($code){
  $con = GetDBConnection();
  $q = "SELECT COUNT(pCode) as count FROM ngss_uri_mappings WHERE  pCode = '" . $code . "'";
  if($res = mysqli_query($con, $q)){
    if($row = $res->fetch_assoc()){
       $count = $row["count"];
       if($count >=0) {
         return true;
       }
    }

   }
   return false;
}

function ScrapeForSummaries($resources){
  print("---------------Beginning scraping------------\n\n");
  for($i = 0; $i < count($resources); $i++){
    $resources[$i]->url = str_replace("\\", "", $resources[$i]->url);
    $resources[$i]->summary = ScrapeSummary($resources[$i]->url);
    print("item " . $i . ": ");
    print_r($resources[$i]);
    print("---------item " . ($i + 1) . " of " . count($resources) . " completed----------\n\n\n");
    // break;
  }
  return $resources;
}


function ScrapeSummary($url){
    $html = new simple_html_dom();
    $html->load_file($url);
    $summaryChunks = array();
    $main = $html->find('ul[class="episodeVideoDetail"]');
/*    print_r($main);*/
    foreach ($html->find('ul[class="episodeVideoDetail"]') as $parent) {
      foreach ($parent->children() as $ch) {
        foreach($ch->children() as $ch2){
                  array_push($summaryChunks, $ch2->innertext);
        }

      }
    }
    $resStr = "";
    for($i = 0; $i < count($summaryChunks); $i++){
      $resStr .= $summaryChunks[$i] . " ";
    }

    if($resStr[0] == " "){
      $resStr = substr($resStr, 1);
    }
    return $resStr;
}

//Adds alignments to the $resources obj as defined in $alignments
function GetAlignmentsForAllResources($resources, $alignments){
//  print_r($alignments);
  for($i = 0; $i < count($resources); $i++){
    $resources[$i] = GetAlignmentsForResource($resources[$i], $alignments);
  }
  return $resources;
}

function GetAlignmentsForResource($resource, $alignments){
  $alignmentsArr = array();
  for($i = 0; $i < count($alignments); $i++){
    if($resource->id == $alignments[$i]->id){
      array_push($alignmentsArr, $alignments[$i]->alignment);
    }
  }
  $resource->alignments = $alignmentsArr;
  return $resource;
}


function GetResources($alignments, $URIs){
  $alignmentsArr = array();

  for($i = 0; $i < count($URIs); $i++){
    $id = $URIs[$i]->id;
    $url = $URIs[$i]->url;

    $stdData = GetStdData($id, $url, $alignments);
    if($stdData != false)
    array_push($alignmentsArr, $stdData);
    //break;
  }
  return $alignmentsArr;
}


function GetStdData($id, $url, $alignments){
  //print("------------------Searching For Matches-----------------\n");
  $found = false;

  for($i = 0; $i < count($alignments); $i++ ){

   if($id == $alignments[$i]->id){
     $al = new Alignment();
     $al->id = $id;
     $al->url = $url;
     $al->state = $alignments[$i]->state;
     $al->grade = $alignments[$i]->grade;
     return $al;
      print("Found Id\n");
      $found = true;
      break;
    }
  }
  if($found == false){

  }
  return false;
//print("Not found:");
}


function FormatAlignmentsData($data){
  $res = array();
  for($i = 0; $i < count($data); $i++){
    $ids = $data[$i]->id;
    $idsArr = explode(";", $ids);

    for($j = 0; $j < count($idsArr) - 1; $j++){
      $std = new CSVRow();
      $std->id = $idsArr[$j];
      $std->state = $data[$i]->state;
      $std->grade = $data[$i]->grade;
      $std->alignment = $data[$i]->alignment;
      array_push($res, $std);
    }

  }
  return $res;
}


function ReadAlignmentsFromCSV($fp){
  $file = new SplFileObject($fp);
  $file->setFlags(SplFileObject::READ_CSV);
  $file->setCsvControl(',', '"', '\\'); // this is the default anyway though
  $csvRows = array();

  $count = 0;
  $rows = 0;
  foreach ($file as $row) {

    //skip header row
    if($count == 0){
      $count++;
      continue;
    }

    //last row is empty
    if(count($row) < 2) continue;

    //print_r($row);
    $curRow = new CSVRow();
    $curRow->id = iconv("UTF-8", "UTF-8//IGNORE", $row[0]);
    $curRow->state =  iconv("UTF-8", "UTF-8//IGNORE", $row[1]);
    $curRow->grade =  iconv("UTF-8", "UTF-8//IGNORE", $row[3]);
    $curRow->alignment =  iconv("UTF-8", "UTF-8//IGNORE", $row[4]);
    array_push($csvRows, $curRow);
  }
  return $csvRows;
}



function ScrapeForLessonURIs($fp){
  $str = file_get_contents($fp);

  //Get the part of the string that has the ids and the URIs.
  $foo = explode("standards_links", $str)[1];

  $brack = 0;
  $i = 0;
  for($i = 0; $i < strlen($foo); $i++){
    if($foo[$i] == "{"){
      break;
    }
  }

  $j = 0;
  for($j = $i; $j < strlen($foo); $j++){
    if($foo[$j] == "{") $brack += 1;
    else if($foo[$j] == "}") $brack -= 1;

    if($brack == 0){
      break;
    }
  }

  //string contains the part of the string that has IDs and URIs.
  $sub = substr($foo, $i, $j);

   //data is now in comma seperated strings inside "";
   $data = explode('{' , rtrim($sub, '}'));

   $d = $data[10];
   $dataArr = explode('"' , rtrim($sub, '"'));

   $idUrlPairs = array();

   $linkIndex = 5;
   $idIndex = 1;
   while($linkIndex < count($dataArr)){
       $id = $dataArr[$idIndex];
       $link = $dataArr[$linkIndex];
       $pair = new IdUrlPair();
       $pair->id = $id;
       $pair->url = $link;
       array_push($idUrlPairs, $pair);
       $linkIndex += 12;
       $idIndex += 12;
   }
   return $idUrlPairs;
/*   print_r($data);*/
  /*print($sub . "\n");*/

}


main();



class IdUrlPair{
  public $id;
  public $url;
}

class CSVRow{
   public $id;
   public $state;
   public $grade;
   public $alignment;
}

class Alignment{
  public $id;
  public $state;
  public $grade;
  public $url;
  public $summary;
  public $alignments = array();
}

 ?>
