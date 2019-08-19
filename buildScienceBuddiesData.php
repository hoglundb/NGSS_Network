<?php

 /*
     Script to build the alignments data for science buddies
     Imports data from sciencebuddies.csv
     Inserts into sciencebuddies_collection and sciencebuddies_alignments.
 */

  include 'DBConnection.php';
  include 'simple_dom_parser.php';
   function main(){
     //Read in the science buddies collection from the csv and insert into sciencebuddies_collection
     $collection = readSBCollection();
     buildSBCollection($collection);

     //Insert read the alignments from the csv and insert the alignments into sciencebuddies_alignments table
  ///   $alignments = readSBAlignments();
  //   buildSBAlignments($alignments);
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


   //Takes a lignments data and inserts into sciencebuddies_alignments table
   function buildSBAlignments($data){
      $dbConnection = GetDBConnection();
      //for every resource in the collection
      for($i = 0; $i < count($data); $i++){

          //for every alignment to that resource
          $curResource = $data[$i];
          $alignmentsCount =  $data[$i]->numAlignments;

          for($j = 0; $j < $alignmentsCount; $j++){

             //add resource alignment pair to databases
                  $NGSSCode = $curResource->alignments[$j];
                  $ASNCode = getASNCode($NGSSCode);
                  print($NGSSCode . ", " . $ASNCode . ", " . $data[$i]->docId . "\n");
                  $insertQuery = "INSERT INTO sciencebuddies_alignments" . "("
                  . "doc_id,"
                  . "sCode"
                  . ")"
                  ."VALUES ("
                  . "'" .  $data[$i]->docId . "',"
                  . "'" .  $ASNCode . "'"
                  . ")";
                  if($dbConnection->query($insertQuery) !== TRUE){
                     echo "Failed inserting into bh_science_buddies_docs";
                     return;
                  }
          }
           print("\n\n\n");
      }
   }


   function readSBAlignments(){
     $fp = "sciencebuddies.csv";
     $file = new SplFileObject($fp);
     $file->setFlags(SplFileObject::READ_CSV);
     $file->setCsvControl(',', '"', '\\'); // this is the default anyway though
     $alignments = array();

     $count = 0;
     $rows = 0;
     foreach ($file as $row) {
       $rows++;
       echo "Scraping for summary " . $rows . "\n";
       //skip header row
       if($count == 0){
         $count++;
         continue;
       }
       if(count($row) < 3) continue;
       $newRow = new CSVRow();
       $newRow->url = $row[1];
       $newRow->numAlignments = $row[2];
       $newRow->docId = getDocId($newRow->url); //doc id is last part of url
       for($i = 0; $i < $newRow->numAlignments; $i++){
            $newRow->addAlignment($row[$i + 3]);
       }
       array_push($alignments, $newRow);
     }
     return $alignments;
   }




   /**********************************************************************************
   Reads the science buddies collection data from the csv file into a php object.
   This data is then inserted into the table sciencebuddies_collection
   ***********************************************************************************/
   function readSBCollection(){
       $fp = "sciencebuddies.csv";
       $file = new SplFileObject($fp);
       $file->setFlags(SplFileObject::READ_CSV);
       $file->setCsvControl(',', '"', '\\'); // this is the default anyway though
       $alignments = array();

       $count = 0;
       $rows = 0;
       foreach ($file as $row) {
         $rows++;
         echo "Scraping for summary " . $rows . "\n";
         //skip header row
         if($count == 0){
           $count++;
           continue;
         }
         if(count($row) < 3) continue;
         $newRow = new CSVRow();
         $newRow->title =  getDocumentTitle($row[0]);
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

   function getDocumentTitle($title){
     $title =  iconv("UTF-8", "UTF-8//IGNORE", $title);
     $title = addslashes($title);
     return $title;
   }

   //gets last part of url and returns it. This is to be the id of the document
   function getDocId($url){
      $str = explode('/', $url);
      $str =  end($str);
      $str =  iconv("UTF-8", "UTF-8//IGNORE", $str);
      $str = addslashes($str);
      return $str;
   }


   function buildSBCollection($data){
       //Establish db connection
        $dbCon = GetDBConnection();

        //Delete any old data from bh_science_buddies_docs
        $q = "DELETE FROM sciencebuddies_collection";
        if($dbCon->query($q) !== TRUE) echo "Failed to delete from sciencebuddies_collection\n";

       //insert the data into bh_science_buddies_docs
       for($i = 0; $i < count($data); $i++){
          $row = $data[$i];
          $summary = strip_tags($row->summary);
          $summary = str_replace("&mdash;", "-", $summary);
        //  print_r($row);
          $insertQuery = "INSERT INTO sciencebuddies_collection" . "("
          . "doc_id,"
          . "summary,"
          . "title,"
          . "url"
          . ")"
          ."VALUES ("
          . "'" .  $row->docId . "',"
          . "'" .  $summary . "',"
          . "'" .  $row->title . "',"
          . "'" .  $row->url . "'"
          . ")";
          echo $insertQuery . "\n\n\n";
          if($dbCon->query($insertQuery) !== TRUE){
             echo "Failed inserting into bh_science_buddies_docs";
             return;
          }
       }


   }

   function printSBData(){

   }

   function curl_get_file_contents($URL)
 {
 $c = curl_init();
 curl_setopt($c, CURLOPT_RETURNTRANSFER, 1);
 curl_setopt($c, CURLOPT_URL, $URL);
 $contents = curl_exec($c);
 curl_close($c);

 if ($contents) return $contents;
 else return FALSE;
 }



function getDocumentSummary($url){

     $curl = curl_init($url);
     curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
     $page = curl_exec($curl);
     if(curl_errno($curl)) // check for execution errors
    {
        echo 'Scraper error: ' . curl_error($curl);
        exit;
    }
    curl_close($curl);

    $DOM = new DOMDocument;

    libxml_use_internal_errors(true);

    if (!$DOM->loadHTML($page)){
	      	$errors="";
	        foreach (libxml_get_errors() as $error)  {
		    	$errors.=$error->message."<br/>";
	      	}
      		libxml_clear_errors();
	       	print "libxml errors:<br>$errors";
      		return;
	  }


    $xpath = new DOMXPath($DOM);

    $matches = array();

    preg_match_all('/<h2>Overview<\/h2>(.*?)<h2>NGSS Alignment<\/h2>/s', $page, $matches);

    $match = $matches[0][0];
    $matches2 = array();
    preg_match_all('/\n(.*?)\n/s', $match, $matches2);
    $res = $matches2[0][0];
    $strResult = "";
    $foundFirst = 0;

    $res = str_replace(array("\n", "\r"), '', $res);

   //For each character in the string
   for ($i = 0; $i < strlen($res); $i++){
       //If we reach a non space, set flag to tell us we arn't at the beginning
      if($res[$i] != ' ' && $foundFirst == 0 ){
          $foundFirst = 1;
      }
      if($foundFirst == 1){
         $strResult = $strResult . $res[$i];
      }
   }
   $strResult =  iconv("UTF-8", "UTF-8//IGNORE", $strResult);
   $strResult = addslashes($strResult);

   return $strResult;
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
