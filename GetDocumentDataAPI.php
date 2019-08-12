<?php
include 'DBConnection.php';
if(isset($_POST["docId"])  && $_POST['docId'] != ''){
  $documentData = GetDocumentData($_POST["docId"]);
  print($documentData);
}

//GetDocumentData('able_sue');

function GetDocumentData($docId){
  $doc = new Document();

  $con = GetDBConnection();

  $query = "SELECT doc_id, summary, title, doc_type from bh_raven_docs WHERE doc_id  = '".$docId."'";
  if($res = mysqli_query($con, $query)){
    $row = $res->fetch_assoc();
    $doc->summary = iconv("UTF-8", "UTF-8//IGNORE", $row['summary']);
    $doc->title =  iconv("UTF-8", "UTF-8//IGNORE", $row['title']);
    $doc->docType = $row["doc_type"];
  $doc->TEURI = _GetTEUrl($doc->docType, $docId);
  }


  return json_encode($doc);
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

class Document{
public $title;
public $summary;
public $TEURI;
public $docType;
}




?>
