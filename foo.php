<?php
include 'DBConnection.php';

function main(){
  $res = getAlignmentMappings(GetDBConnection(), "SB");
  print_r($res);
}


function getAlignmentMappings($dbConnection, $collection){

  $alignmentsTable = null;
  $collectionTable = null;
  if($collection == "TE"){
     $alignmentsTable = "teach_engr_alignments";
     $collectionTable = "teach_engr_collection";
  }
  else if($collection == "SB"){
    $alignmentsTable = "sciencebuddies_alignments";
    $collectionTable = "sciencebuddies_collection";
  }

  //query to return list doc ids and aligned standards
  $MySqlQuery = "SELECT p.id, p.doc_id FROM(
                 SELECT t.doc_id, (SELECT id FROM ngss_network_nodes WHERE sCode = t.sCode) AS id FROM
                (
                  SELECT sCode, doc_id FROM {$alignmentsTable} ORDER BY sCode
                ) t) p WHERE p.id IS NOT NULL AND doc_id IN (SELECT doc_id FROM {$collectionTable})
                ORDER BY p.id, p.doc_id";

  //array holds the mappings from a resource to an aligned standard
  $alignmentMappings = array();

  if($res = mysqli_query($dbConnection, $MySqlQuery)){
    $arr = array(); //will hold a list of doc ids that coorispont to a standard.

    //Queries a list of all standards and their aligned documents. For every standard we get its
    //list of aligned documents. We build the data structure alignedMappings[] which is an associative
    //array that hashes on a standard id to its list of alignments.
    $isStart = true;
    $prev = "";
    while($row = $res->fetch_assoc()){  //for every row
         if($isStart){  //first time through
            array_push($arr, $row['doc_id']);
            $isStart = false;
         }
         else{   //subsequent times through
           if($prev == $row["id"]){ //if we are still on the same standard
             array_push($arr, $row['doc_id']);
           }
           else{ //we reached a new standard in the list
             $alignmentMappings[$prev] = $arr;
             $arr = null;
             $arr = array();

             array_push($arr, $row['doc_id']);
           }
         }
        $prev = $row["id"];
     }
     $alignmentMappings[$prev] = $arr;
  }
  return $alignmentMappings;
}



main();
 ?>
