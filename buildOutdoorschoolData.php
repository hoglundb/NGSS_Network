<?php
include 'DBConnection.php';
include 'simple_dom_parser.php';

function main(){

  //Read the Outdoorschool data from the csv, web scrape for activity summary, and write to database table outdoorschool_collection
  $collection = readOSCollection();
  print(count($collection) ."\n\n");
  buildOSCollection($collection);

  //writeOSCollectionToDB($collection);
  buildOSAlignments($collection);
}


//takes alignment data and builds the outdoorschool_alignments table
function buildOSAlignments($collection){
  $dbConnection = GetDBConnection();

  $q = "DELETE FROM outdoorschool_alignments";
  if($dbConnection->query($q) !== TRUE) echo "Failed to delete from sciencebuddies_collection\n";



  //for every resource in the outdoor school collection
  for($i = 0; $i < count($collection); $i++){
    $curResource = $collection[$i];
    $alignmentsCount = $collection[$i]->numAlignments;

    //for every alignment to the current resource
    for($j = 0; $j < $alignmentsCount; $j++){
       //Add resource alignment pair to the database
      $NGSSCode = str_replace(" ", "", $curResource->alignments[$j]);

      $ASNCode = getASNCode($NGSSCode);

      print($NGSSCode . ", " . $ASNCode . ", " . $collection[$i]->docId . "\n");
      $insertQuery = "INSERT INTO outdoorschool_alignments" . "("
      . "doc_id,"
      . "sCode"
      . ")"
      ."VALUES ("
      . "'" .  $collection[$i]->title . "',"
      . "'" .  $ASNCode . "'"
      . ")";
      if($dbConnection->query($insertQuery) !== TRUE){
         echo "Failed inserting into bh_science_buddies_docs";
         return;
      }
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



//Reads the collection from the CSV and returns an array of CSV row objects
function readOSCollection(){
  $fp = "outdoorschool.csv";
  $file = new SplFileObject($fp);
  $file->setFlags(SplFileObject::READ_CSV);
  $file->setCsvControl(',', '"', '\\'); // this is the default anyway though
  $alignments = array();

  $count = 0;
  $rows = 0;
  foreach ($file as $row) {
    //print_r($row);
    $curRow = new CSVRow();
    $curRow->title = $row[0];
    $curRow->numAlignments = $row[1];
    for($i = 0; $i < $curRow->numAlignments; $i++){
      $curRow->addAlignment($row[$i + 2]);
    }
    $rows++;
    array_push($alignments, $curRow);
  }
  return $alignments;
}


//Perform web scraping to get resource summary.
function buildOSCollection(& $collection){

   //Urls to the outdoor school resources for 4 different catagories: animals, plants, soil and water.
   $url1 = "https://www.mesdoutdoorschool.org/animals-curriculum-outline.html"; //animals
   $url2 = "https://www.mesdoutdoorschool.org/plants-curriculum-outline.html"; // plants
   $url3 = "https://www.mesdoutdoorschool.org/soil-curriculum-outline.html"; // soil
   $url4 = "https://www.mesdoutdoorschool.org/water-curriculum-outline.html"; //water

   _getSummary($url1, $collection, "animals");
   _getSummary($url2, $collection, "plants");
   _getSummary($url3, $collection, "soil");
   _getSummary($url4, $collection, "water");

 //hardcode the summaries for the ones that didn't work.

 for($i = 0; $i < count($collection); $i++){
    if($collection[$i]->summary ==null){
/*      print(($i + 1) . ": ". $collection[$i]->title . "\n");*/
      $title = $collection[$i]->title;

      if($collection[$i]->title == "Aquatic Life (Critter Catch)"){
        $collection[$i]->summary = " Students collect, count and identify aquatic life specimens and discuss adaptations and niche of the animals.";
        $collection[$i]->docType = "animals";
        $collection[$i]->url = $url1;
      //  echo " Updated " . $collection[$i]->title . "\n\n";
      }
      else if($collection[$i]->title == "Water Cycle"){
          $collection[$i]->summary = "Students define and/or act out the water cycle and point out observable stages in the water cycle. Then students characterize water as either a renewable or non-renewable resource.";
          $collection[$i]->docType = "water";
          $collection[$i]->url = $url4;
        //  echo " Updated " . $collection[$i]->title . "\n\n";
        }
     else if($collection[$i]->title == "Compost (Worm Bin)"){
        $collection[$i]->summary = "Students observe a worm bin and explore the role organic decomposition plays in soil formation as well as the role composting plays in waste reduction.";
        $collection[$i]->docType = "soil";
        $collection[$i]->url = $url3;
      //  echo " Updated " . $collection[$i]->title . "\n\n";
      }
    else if($collection[$i]->title == "Soil Life Survey (Critter Catch)"){
         $collection[$i]->summary = "Students collect and examine soil organisms and discuss the role of organisms in soil health.";
         $collection[$i]->docType = "soil";
         $collection[$i]->url = $url3;
        // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Apple Earth Intro"){
             $collection[$i]->summary = "Students examine and discuss the concept of soil as a limited resource.";
             $collection[$i]->docType = "soil";
             $collection[$i]->url = $url3;
            // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Primitive Plants (Moss and Lichen)"){
               $collection[$i]->summary = "Students identify fungi, lichens, ferns and moss and examine their adaptations and role in the forest ecosystem.";
               $collection[$i]->docType = "plants";
               $collection[$i]->url = $url2;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }

    else if($collection[$i]->title == "Phototropism"){
               $collection[$i]->summary = "Students identify causes and mechanisms of phototropism and observe and analyze its effects in a forest ecosystem.";
               $collection[$i]->docType = "plants";
               $collection[$i]->url = $url2;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Cop"){
              $collection[$i]->title = "Microscope Study / Aquatic Food Pyramid";
               $collection[$i]->summary = "Students collect and examine microscopic aquatic life and discuss the model of an aquatic food pyramid.";
               $collection[$i]->docType = "water";
               $collection[$i]->url = $url4;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Flower Parts (Spring)"){
               $collection[$i]->summary = "Students examine and dissect flowers and discuss the structure and function of flower parts.";
               $collection[$i]->docType = "plants";
               $collection[$i]->url = $url2;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Photosynthesis (Energy & Renewable Natural Resources)"){
               $collection[$i]->summary = "Students explore the process of photosynthesis and relate the process to activities they do on field study.";
               $collection[$i]->docType = "plants";
               $collection[$i]->url = $url2;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Forestry Practices"){
               $collection[$i]->summary = "Students engage in a discussion about various methods for managing forest lands and how individuals in the past and present have managed land for fuel reduction, revenue, public use, and habitat conservation.";
               $collection[$i]->docType = "plants";
               $collection[$i]->url = $url2;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Pelts"){
               $collection[$i]->summary = "Students identify adaptations of animals and describe how those adaptations help animals survive in their habitats. They use measurement and observations to identify animals using reference materials such as field guides.";
               $collection[$i]->docType = "animals";
               $collection[$i]->url = $url1;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Skulls"){
               $collection[$i]->summary = "Students identify adaptations of animals and describe how those adaptations help animals survive in their habitats. They use measurement and observations to identify animals using reference materials such as field guides.";
               $collection[$i]->docType = "animals";
               $collection[$i]->url = $url1;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Horns, Antlers, & Hooves"){
               $collection[$i]->summary = "Students identify adaptations of animals and describe how those adaptations help animals survive in their habitats. They use measurement and observations to identify animals using reference materials such as field guides.";
               $collection[$i]->docType = "animals";
               $collection[$i]->url = $url1;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Niche"){
               $collection[$i]->summary = "The student will describe an animal's niche and compare niches of different species.";
               $collection[$i]->docType = "animals";
               $collection[$i]->url = $url1;
            //   echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Predator / Prey Game"){
               $collection[$i]->summary = "Students use role-playing and simulation to explore concepts of camouflage, environmental factors, and the predator / prey relationship.";
               $collection[$i]->docType = "animals";
               $collection[$i]->url = $url1;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Animal Signs & Survey"){
               $collection[$i]->summary = "Students identify a wildlife-related question for inquiry and then survey the site for signs of wildlife and draw conclusions about presence and populations of animals.";
               $collection[$i]->docType = "animals";
               $collection[$i]->url = $url1;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Live Animal Station"){
               $collection[$i]->summary = "Students identify adaptations of animals and describe how those adaptations help animals survive in their habitats. They use measurement and observations to identify animals using reference materials such as field guides.";
               $collection[$i]->docType = "animals";
               $collection[$i]->url = $url1;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Supermarket Niche"){
               $collection[$i]->summary = "The student will explore the concept of niche as it relates to competition using a model.";
               $collection[$i]->docType = "animals";
               $collection[$i]->url = $url1;
              // echo " Updated " . $collection[$i]->title . "\n\n";
    }
    else if($collection[$i]->title == "Native Birds (Toxics)"){
               $collection[$i]->summary = "Students discuss the process of bioaccumulation of toxins in a wildlife population, and explore how human choices affect animal populations.";
               $collection[$i]->docType = "animals";
               $collection[$i]->url = $url1;
            /*   echo " Updated " . $collection[$i]->title . "\n\n";*/
    }
   }
 }
}


//Performs web scraping to get the summary for each document on that web page.
function _getSummary($url, & $collection, $catagory){


 //fill in the doc type and url of the resource
/* for($i = 0; $i < count($collection); $i++){
   $collection[$i]->url = $url;
   $collection[$i]->docType = $catagory;
 }*/

  $html = file_get_html($url);
  $res = null;
  foreach ($html->find('div.paragraph') as $el) {
    if(strpos($el, "Actual activities will vary") !== false){
         $res = $el;
         break;
    }
  }

  //Get the array of titles and summary
  $resArray = explode("<br /><br />", $res);
  for($j = 0; $j < count($resArray); $j++){
    $resArray[$j] = strip_tags($resArray[$j]);
    $resArray[$j] = str_replace(array("&#8203;"), '', $resArray[$j] ); //remove these unicode characters
    $resArray[$j] = str_replace(array("&nbsp;"), ' ', $resArray[$j] ); //remove space unicode characters
  }

  //split line into title and summary (delemited by first instance of ':')
  //we will build a list of title, summary pairs.
  $titleSummaryPairs = array(); //array of TitleSummaryPair objects
  for($i = 1; $i < count($resArray); $i++){ //first element is just a header so we skip it.
    $split = explode(':', $resArray[$i], 2);
    $ts = new TitleSummaryPair();
    $ts->title = $split[0];
    $ts->summary = $split[1];
    array_push($titleSummaryPairs, $ts);
  }

 //find the matching title in the csv data array and add the summary. Do this for every title/summary pair.
 for($i = 0; $i < count($titleSummaryPairs); $i++){ //for each title summary pair that was scraped in this category
     $cur = $titleSummaryPairs[$i]; //the current title summary pair
     $foundMatch = false; //track weather or not we found a match. If we don't there is likely a typo in the title somewhere.
     $t1 = null;
     $t2 = null;
     for($j = 0; $j < count($collection)- 1; $j++){ //for each document row we harvested from the csv file
        $t1 = str_replace(" ", "", $cur->title);
        $t2 = str_replace(" ", "",$collection[$j]->title);
        $t1 = str_replace("s", "", $t1);
        $t2 = str_replace("s", "",$t2);
        if(($t1 == $t2 || strpos($t1, $t2) !== false || strpos($t2, $t1) != false) && $t1 != "" && $t2 != "" ){ //if we mached title summary pair to title in csv object
         $foundMatch = true;
         $collection[$j]->docType = $catagory;
         $collection[$j]->summary = $cur->summary; //add summary to the data set for the current document in the collection.
         $collection[$j]->url = $url;
        }
     }

     //Do these ones manually since an exact text match was not found.
  /*   if($foundMatch == false){
       echo "Do manually: " . $t1 . "\n";
      // InsertManually($t1);
     }*/
 }




  //print_r($resArray);
/*  $ret = $html->find('div[class=paragraph]');*/
/*  print_r($ret);*/
  /*$curl = curl_init($url);
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
*/

}


function InsertManually(){

}

function writeOSCollectionToDB(& $collection){
   $dbCon = GetDBConnection();

   $q = "DELETE FROM outdoorschool_collection";
   if($dbCon->query($q) !== TRUE) echo "Failed to delete from sciencebuddies_collection\n";


   for($i = 0; $i < count($collection) - 1; $i++){
     $title = $collection[$i]->title;
     $summary = addslashes($collection[$i]->summary);
     $docId = $collection[$i]->title;
     $url = $collection[$i]->url;
     $docType = $collection[$i]->docType;

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
     . ")";
/*     print($query . "\n");*/
     if($dbCon->query($query) !== TRUE){
        echo "Failed inserting into bh_science_buddies_docs";
        echo($query);
        return;
     }
   }

}

main();


class CSVRow{
  public $title;
  public $url;
  public $summary = null;
  public $docId;
  public $numAlignments;
  public $alignments = array();
  public $docType = null;

  function addAlignment($newAlignment){
    array_push($this->alignments, $newAlignment);
  }
}


class TitleSummaryPair{
  public $title;
  public $summary;
}


?>
