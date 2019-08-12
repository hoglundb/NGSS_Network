<?php

  include "simple_html_dom.php";
  include 'DBConnection.php';
   function main(){
     $data = readSBData();
/*     print_r($data);
*/     buildDBTables($data);
   }

   /**********************************************************************************
   Reads the science buddies data from the csv file into a php object.
   ***********************************************************************************/
   function readSBData(){
       $fp = "sciencebuddies.csv";
       $file = new SplFileObject($fp);
       $file->setFlags(SplFileObject::READ_CSV);
       $file->setCsvControl(',', '"', '\\'); // this is the default anyway though
       $alignments = array();

       $count = 0;
       foreach ($file as $row) {
         //skip header row
         if($count == 0){
           $count++;
           continue;
         }
         if(count($row) < 3) continue;
         $newRow = new CSVRow();
         $newRow->title = $row[0];
         $newRow->url = $row[1];
         $newRow->numAlignments = $row[2];
         $newRow->summary = getDocumentSummary($newRow->url);
         $newRow->docId = getDocId($newRow->url); //doc id is last part of url
         for($i = 0; $i < $newRow->numAlignments; $i++){
              $newRow->addAlignment($row[$i + 3]);
         }
         array_push($alignments, $newRow);
       }
       return $alignments;
   }


   //gets last part of url and returns it. This is to be the id of the document
   function getDocId($url){
      $str = explode('/', $url);
      return end($str);
   }


   function buildDBTables($data){
       //Establish db connection
        $dbCon = GetDBConnection();

        //Delete any old data from bh_science_buddies_docs
        $q = "DELETE FROM bh_science_buddies_docs";
        if($dbCon->query($q) !== TRUE) echo "Failed to delete from bh_science_buddies_docs\n";

       //insert the data into bh_science_buddies_docs
       for($i = 0; $i < count($data); $i++){
          $row = $data[$i];
          $insertQuery = "INSERT INTO bh_science_buddies_docs" . "("
          . "doc_id,"
          . "summary,"
          . "title"
          . ")"
          ."VALUES ("
          . "'" .  $row->docId . "',"
          . "'" .  $row->summary . "',"
          . "'" .  $row->title . "'"
          . ")";
          print($insertQuery . "\n");
          if($dbCon->query($insertQuery) !== TRUE){
             echo "Failed inserting into bh_science_buddies_docs";
             return;
          }
       }


   }

   function printSBData(){

   }

   function getDocumentSummary($url){
     return "Document summary will go here... maybe.";
   }

   main();

   class CSVRow{
     public $title;
     public $url;
     public $summary;
     public $docId;
     public $numAlignments;
     public $alignments = array();

     function addAlignment($newAlignment){
       array_push($this->alignments, $newAlignment);
     }
   }

?>
