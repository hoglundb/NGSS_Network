<?php
/************************************************************************************************
This progam builds the network data from prod_edu_standards_db and posts the result to the client.
The data is represented as a modified adjacency list as follows:
  The network data is represented with 2 arrays, standardsList[] and alignmentsList[].
  The standardsList[] is an array of Standards objects representing the NGSS collection of standards.
  Each Standard object contains a list of indecies of it's neighboring standard.
  alignmentsList[] is an array of all the TE alignmed resources. Each standard object contains a list of
  indeces that corrispond its lignments to resources in alignmentsList[].

Database Info:
    server: teacheng_prod.
    name:  NGSS_Network_App.
    tables:
       bh_std_ngss_alignments ->  ngss_alignments.
       bh_ngss_network_map.  -> ngss_network_edge_list
       bh_ngss_network_nodes. -> ngss_network_nodes
       bh_raven_docs.   ->teach_engr_collection
       bh_ngss_network_nodes. -> ngss_network_map
       bh_ngss_uri_mappings. -> ngss_uri_mappings
       bh_NGSS_3D  -> ngss_comprizing_standards
*************************************************************************************************/


include 'DBConnection.php';
include 'colorDefinitions.php';
session_start();

//Get the network data and send back to the client.
echo GetNetworkData();


/*********************************************************************************
Description:
   This function is the entry point for the API. It calls other methods to generate
   the data structure for the network. It then returns the network which consists
   of an adjacency list of standards and an array of alignments.
**********************************************************************************/
function GetNetworkData(){

   //The connection string to prod_edu_standards
   $dbConnection = GetDBConnection();

   $standardsHashMap = array(); //hashes on sCode for standards and document name for documents. Holds ids that coorispont to $standardsList

   //Get an array of standards and an array of documents
   $standardsList = GetASNStandards($dbConnection);
   $alignmentsList = GetAlignments($standardsList, $standardsHashMap, $dbConnection);

   //For each standard,add its neighboring standards to the adjacency list.
   AddNeighborStandardsToAdjList($standardsList, $dbConnection);

   //For each standard, add its neighboring alignments to the alignments adjacency list
   AddNeighborAlignmentsToAdjList($standardsList, $alignmentsList, $dbConnection);

   //build a 2d array out of standardsList[] and alignments[]
   $results = array();
   array_push($results, $standardsList, $alignmentsList);

   return json_encode($results);
}


/*************************************************************************************************
* Parameters:
    1) $standardsList: A reference to an adjacency list of standards. Is made up of Standards objects
    2) $alignmentsList: An array of aligned resources. It is made up of Alignments objects.
    3) $dbConnection: The connection string to prod_edu_standards_db.
* Description:
   Goes through each standard in $standardsList and builds its adjacency list that determine
   the standards alignments in $alignmentsList.
**************************************************************************************************/
function AddNeighborAlignmentsToAdjList(& $standardsList, $alignmentsList, $dbConnection){

    //Create a hash map on the alignments so we can do a fast lookup
     $alignmentsHashMap = array();
     for($i = 0 ; $i < count($alignmentsList); $i++){
       $cur = strval($alignmentsList[$i]->document) ;
       $alignmentsHashMap[$cur] = $i;
     }

     //get has map from std ids to array of alignments
     $alignmentMappings = getAlignmentMappings($dbConnection, $resourceEdges, $resourceList);
     //for each standard
     for($i = 0; $i < count($standardsList); $i++){
       $ids = array();
       //get the aligned documents to that standard
       if(array_key_exists(strval($standardsList[$i]->MySqlId), $alignmentMappings)){
         $alignmentsForStandard = $alignmentMappings[$standardsList[$i]->MySqlId];
         for($j = 0; $j < count($alignmentsForStandard); $j++){
           $id = $alignmentsHashMap[$alignmentsForStandard[$j]];
           array_push($ids, $id);
         }
        $standardsList[$i]->docNeighbors = $ids;
       }
     }
}


/*************************************************************************************
* Parameters
   1) $sCode: the ASN sCode identifier of the standard
   2) $dbConnection: the connection string to prod_edu_standards_db
* Description:
    Builds a list of TE documents that are alignmed to the given standard. The list is
    then returns as an array of document ids.
*************************************************************************************/
function GetIdsOfAlignedDocs($sCode, $dbConnection){
    $idsArray = array(); //array that will hold TE document ids.

    //Query list of doc_ids that are ligned to the sCode
    $query = "SELECT doc_id  FROM ngss_alignments WHERE sCode ='".$sCode."';";
    if($res = mysqli_query($dbConnection, $query)){;
        while($row = $res->fetch_assoc()){
          array_push($idsArray, $row["doc_id"]);
        }
    }
    return $idsArray;
}


/*******************************************************************************
* Parameters:
   1) $standardsList: a refrence to the adjacency list of Standards
   2) $dbConnection: connection string to prod_edu_standards_db;
* Description:
     Goes through each standard in $standardsList and builds that standard's
     adjacency list of aligned standerds.
*******************************************************************************/
function AddNeighborStandardsToAdjList(& $standardsList, $dbConnection){
  //for every standard in the list (This is for every NGSS standerd in the collection)
  for($i = 0; $i < count($standardsList); $i++){
     //get all the standards that are linked to the current standard.
     $tmpNeighbors = GetAlignedStandards($standardsList[$i]->MySqlId, $dbConnection);

     //Build out a list of neighboring standards and add to the current standers adj list
     $neighborsArray = array();
     for($j = 0; $j < count($tmpNeighbors); $j++){
       $indexOfStandard = GetIndexFromMySqlId($standardsList, $tmpNeighbors[$j]);
       array_push($neighborsArray, $indexOfStandard);
     }

     //The standard's neighbors member is an adj list of neighboring standards.
     $standardsList[$i]->neighbors = $neighborsArray;
  }
}


/********************************************************************************
* Parameters:
   1) $standardsList: an adj list representation of the NGSS collection
   2) $MySqlId: the corrisponding id of the standard as represented in the db
* Description: Determines which standard in $standardList has the given mysqlId
               as an identifier. Returns the coorisponding index of that
               standard as it appears in $standardsList.
*********************************************************************************/
function GetIndexFromMySqlId($standardsList, $MySqlId){
      for($i = 0; $i < count($standardsList); $i++){
         if($standardsList[$i]->MySqlId == $MySqlId){
           return $i;
         }
      }
      return -1;
}


/*************************************************************************************
* Parameters:
     1) $MySqlId: the mysql identifier of the current standard that we are working with .
     2) $dbConnection: connection string to prod_edu_standards_db.
*Description:
    Takes a mySQl standard identifier and returns a list of ids of standards that are
    linked to that standard.
*************************************************************************************/
function GetAlignedStandards($MySqlId, $dbConnection){
    $neighborIds = array();
    $query = "SELECT m.mapped_id FROM ngss_network_edge_list m WHERE m.node_id  = '".$MySqlId."';";
    if($res = mysqli_query($dbConnection, $query)){
      while($row = $res->fetch_assoc()){
        array_push($neighborIds, $row["mapped_id"]);
      }
    }
    return $neighborIds;
}


/********************************************************************************
* Parameters:
    1) $dbConnection: connection string to prod_edu_standards_db.
    2) $resourceEdges: A reference to an edge list of connections from standards to resouces.
    3) $resouceList: A reference to an array of TE resources.

* Descriptions:
   Builds an edge list of standards and aligned TE resources. This is build into the the
   array alignedMappings();
********************************************************************************/
function getAlignmentMappings($dbConnection, & $resourceEdges, & $resourceList){
  //query to return list doc ids and aligned standards
  $MySqlQuery = "SELECT p.id, p.doc_id FROM(
                 SELECT t.doc_id, (SELECT id FROM ngss_network_nodes WHERE sCode = t.sCode) AS id FROM
                (
                  SELECT sCode, doc_id FROM ngss_alignments ORDER BY sCode
                ) t) p WHERE p.id IS NOT NULL AND doc_id IN (SELECT doc_id FROM teach_engr_collection)
                ORDER BY p.id, p.doc_id";

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


/*******************************************************************************************
* Parameters:
   1) $dbConnection: connection string to prod_edu_standards_db.
* Description:
    Builds an array of Standard objects from the databases representation of the NGSS.
    This array of Standards is then returned.
*******************************************************************************************/
function GetASNStandards($dbConnection){
   //an array to hold the list of standards.
    $standards = array();

    //query all the data from bh_ngss_network_nodes
    $query = "SELECT id, std_type, description, lowgrade, highgrade, sCode from ngss_network_nodes";
    if($res = mysqli_query($dbConnection, $query)){

      //Fetch all rows (each row is a standard), create a Standard object and get its meta-data.
      $curId = 0;
      while($row = $res->fetch_assoc()){
        //Create a new standard object
        $standard = new Standard();
        $standard->id = $curId;
        $standard->MySqlId = $row["id"];
        $standard->sCode = $row["sCode"];

        //Get the metadata attributes for the NGSS standard.
        $standard->nodeType = _SetStandardType($row['std_type'], $row['sCode'], $dbConnection);
        $standard->gradeBand = _GetStandardGradeBand($row['lowgrade'], $row['highgrade']);
        $standard->color = _GetNodeColor($standard->nodeType);
        $standard->origonalColor = $standard->color;
        $standard->highlightColor = _GetNodeHighlightColor($standard->nodeType);
        $standard->des = iconv("UTF-8", "UTF-8//IGNORE", $row['description']);
        $standard->pCode = _GetPCode($row['sCode'], $dbConnection);
        $standard->uri = _GetNGSSURI($standard, $dbConnection);
        $standard->order = 10000;

        //Add standard to the list of standards.
        array_push($standards, $standard);
        $curId++;
      }
    }

    //return the list of Standard objects
    return $standards;
}


/*****************************************************************************************
* Parameters:
    1) $standardsList: a reference to the adj list of standards that make up the nw.
    2) $standardsHashMap: a reference to a assoc array of standards that hashes on standard id.
    3) $dbConnection: connection string to prod_edu_standards_db.
* Description:
   Builds a list of documents that are aligned to NGSS standards.
******************************************************************************************/
function GetAlignments(& $standardsList, & $standardsHashMap, $dbConnection){

      $alignments = array();//array to hold the list of all alignments

      //query to return list doc ids and aligned standards
     $MySqlQuery = "SELECT a.doc_id, n.id FROM ngss_alignments a
                   INNER JOIN ngss_network_nodes n ON n.sCode = a.sCode
                   ORDER BY a.doc_id";

    if($res = mysqli_query($dbConnection, $MySqlQuery)){
        //for every alignment, create an Alignment object
        $curRow = "";
        $MySqlId = 10001;
        $curId = count($standardsList);
        while($row = $res->fetch_assoc()){
           if($row['doc_id'] != $curRow){  //once we reach the next document in the ordered list
             $curRow = $row['doc_id'];
             $alignment = new Alignment();
             $alignment->id = $curId;
             $alignment->color = DOC_COLOR;
             $alignment->MySqlId = $MySqlId;
             $standardsHashMap[$row['doc_id']] = $curId;
             GetAlignmentMetadata($alignment, $dbConnection, $curRow);
             array_push($alignments, $alignment);
             $curId++;
             $MySqlId++;
           }
        }
      }
      return $alignments;
}


/********************************************************************************
* Parameters:
   1) $dbConnection: connection string to prod_edu_standards_db
* Description:
     Queries the standards edge list ids from the db and builds a list of Edge objects.
     Returns ths list of Edge objects.
*********************************************************************************/
function GetStandardsEdges($dbConnection){
  $edges = array();
  //First get the neighbors for standards
   $query = "SELECT node_id, mapped_id FROM ngss_network_edge_list";
   if($res = mysqli_query($dbConnection, $query)){
     while($row = $res->fetch_assoc()){
       $edge = new Edge();
       $edge->id1 = $row["node_id"];
       $edge->id2 = $row["mapped_id"];
       array_push($edges, $edge);
     }
   }
   return $edges;
}


/******************************************************************************
*Parameters:
    1) $alignments: a reference to an array of Alignment objects.
    2) $dbConnection: connection string to prod_edu_standards_db
    3) $doc: The document id that we will query by.
* Description:
     Adds the metadata attribues to the given alignment: summary, title,
     docType and TE url
*******************************************************************************/
function GetAlignmentMetadata(& $alignment, $dbConnection, $doc){
  $alignment->summary = "bla bla";
  $query  = "SELECT doc_id, summary, title, doc_type FROM teach_engr_collection WHERE doc_id  = '".$doc."';";
   if($res = mysqli_query($dbConnection, $query)){
        if($row = $res->fetch_assoc()){
          $alignment->summary = iconv("UTF-8", "UTF-8//IGNORE", $row['summary']);
          $alignment->title =  iconv("UTF-8", "UTF-8//IGNORE", $row['title']);
          $alignment->docType = $row["doc_type"];
          $alignment->document = $doc;
          $alignment->TEURI = _GetTEUrl($alignment->docType, $doc);
        }
    }
}


/********************************************************************************
* Parameters:
   1) $docType: The type of TE document: activity, lesson, unit, or sprinkle.
   2) $docId: The id of the document. Same as raven document name.
* Description:
    Assignes the document to its TE url based on its id and the TE naming convention
********************************************************************************/
function _GetTEUrl($docType, $docId){
  $type = "";
  if($docType == "lesson"){
    $type = "lessons";
  }
  else if($docType = "activity"){
    $type = "activities";
  }
  else if($docType = "curricularUnit"){
    $type = "curricularunits";
  }
  else if($docType = "makerChallange"){
    $type = "makerchallanges";
  }
  else if ($docType = "sprinkle"){
    $type = "sprinkles";
  }
  return "https://www.teachengineering.org/" . $type . "/view" . "/" .$docId;
}


/*******************************************************************
* Parameters:
  1) nodeType: The type of standard
* Description:
    returns a numerical value based on the NGSS standard type. This is
    used on the client side to sort the standards.
********************************************************************/
//Asigns a value coorisponding to node precidence
function _SetNodeOrder($nodeType){
    if($nodeType == "Standard") return 1;
    if($nodeType == 'Performance Expectation') return 2;
    if($nodeType == "Disciplinary Core Ideas") return 3;
    if($nodeType == "Science and Engineering Practices") return 4;
    if($nodeType == "Crosscutting Concepts") return 5;
}


/**************************************************************************************
* Parametes:
   1) $sCode: the sCode of the standard used as a query parameter
   2) $dbConnection: connection string to prod_edu_standards_db
* Description:
    Takes the ASN code of a standard and returns the coorisponding NGSS code
**************************************************************************************/
//Returns the corrisponding pCode for the standard with the given sCode
function _GetPCode($sCode, $dbConnection){
    $queryNGSS = "SELECT pCode FROM ngss_uri_mappings WHERE  sCode = '" . $sCode . "'";
    if($res = mysqli_query($dbConnection, $queryNGSS)){
      if($row=$res->fetch_assoc()){
        return $row["pCode"];
      }
      return "error1";
    }
    return "error2";
}


/**************************************************************************************
* Parameters
   1) $sCode: the ASN code of the standard used in the query parameter.
   2) $dbConnection: Connection string to prod_edu_standards_db.
* Description:
     Takes an ASN code and queries for the coorisponding NGSS URI. The Uri string is
      returned. Note that dci's link to a different website so their urls are stored in
      another table.
***************************************************************************************/
function _GetNGSSURI($standard, $dbConnection){
    $sCode = $standard->sCode;
    $pCode = $standard->pCode;
    $nodeType = $standard->nodeType;
    //query to get the uri based on the node type.
    if($nodeType == "Disciplinary Core Ideas"){
         $query = "SELECT dci, url FROM  dci_url_mappings WHERE dci = '" . $pCode . "'";
         if($res = mysqli_query($dbConnection, $query)){
           if($row=$res->fetch_assoc()){
             return $row["url"];
           }
           return "error3";
         }
    }

    else{
      $queryNGSS = "SELECT uri FROM ngss_uri_mappings WHERE  sCode = '" . $sCode . "'";
      if($res = mysqli_query($dbConnection, $queryNGSS)){
        if($row=$res->fetch_assoc()){
          return $row["uri"];
        }
        return "error1";
      }
      return "error2";
    }

}


/****************************************************************************
* Parameters:
   1) $nodeType: a string representing the type of NGSS standard.
* Description:
    Takes a node type and returns the coorisponding highligh color as defined
    in the global constants section.
****************************************************************************/
//Returns the highlight color for the node
function _GetNodeHighlightColor($nodeType){
    if($nodeType == 'Performance Expectation') return GREY_HIGHLIGHT_COLOR;
    else if($nodeType == "Science and Engineering Practices") return BLUE_HIGHLIGHT_COLOR;
    else if($nodeType == "Crosscutting Concepts") return GREEN_HIGHLIGHT_COLOR;
    else if($nodeType == "Disciplinary Core Ideas") return ORANGE_HIGHLIGHT_COLOR;
    else if($nodeType == "Standard") return TOPIC_HIGHLIGHT_COLOR;
}


/*******************************************************************************
* Parameters:
    1) $nodeType: A string representing the type of NGSS standard
* Description:
     Takes a NGSS node type and returns the corrispond node color as defined
     in the global constants.
*******************************************************************************/
function _GetNodeColor($nodeType){
    if($nodeType == 'Performance Expectation') return GREY_COLOR;
    else if($nodeType == "Science and Engineering Practices") return BLUE_COLOR;
    else if($nodeType == "Crosscutting Concepts") return GREEN_COLOR;
    else if($nodeType == "Disciplinary Core Ideas") return ORANGE_COLOR;
    else if($nodeType == "Standard") return TOPIC_COLOR;
    else return "Error!!!!!!!!";
}


/********************************************************************************
* Parameters:
   1) $type: the type of standard iether parent or child
   2) $sCode: the NGSS sCode identifier of the standard.
   3) $dbConnection: the connection string to prod_edu_standards_db
* Description:
     Takes a node type and returns a string representing if the node is a
     PE or a comprizing standard.
*********************************************************************************/
function _SetStandardType($type, $sCode, $dbConnection){
  if($type == "parent"){
    return "Standard";
  }
  if($type == "child"){
    return "Performance Expectation";
  }
  else {
    return  _Get3dStandardCategory($sCode, $dbConnection);
  }
}


/********************************************************************
* Parameters:
  1) $sCode: the NGSS sCode identifier of the standard
  2) $dbConnection: the connectin string to prod_edu_standards_db
* Description:
     Takes an sCode identifier and queries the db for whether the standard
     is a child (ie comprizing standard) or a parent (id a PE or a Topic).
     This function is a helper method for the function _SetStandardType();
*********************************************************************/
function _Get3dStandardCategory($sCode, $dbConnection){
  $query3dType = "SELECT category FROM ngss_comprizing_standards WHERE edu_std = '" . $sCode . "'";
  if($res = mysqli_query($dbConnection, $query3dType)){
      if($row = $res->fetch_assoc()){
        $category = $row["category"];
        if($category == "SEP") return "Science and Engineering Practices";
        else if($category == "CC") return "Crosscutting Concepts";
        else if($category == "DCI") return "Disciplinary Core Ideas";
        else return "Error: 3d category not found";
      }
      else return "Error1";
  }
  else return "Error2";
}


/***********************************************************************************
* Parameters:
   1) $low: an int representing the low grade of a standards gradeband.
   2) $high: an int represneting the high grade of a gradeband
* Description:
    Takes $low and $high and formats those number into a string that represents
    the grade band of a standard.
*************************************************************************************/
function _GetStandardGradeBand($low, $high){
    $lowGrade = strval($low);
    if($lowGrade == "0") $lowGrade = "k";
    $highGrade = strval($high);
    if($highGrade == "0") $highGrade = "k";
    return $lowGrade . "-" . $highGrade;
  }


//Class to represend an NGSS standard with its metadata.
class Standard{
    public $id; //The id of a standard
    public $MySqlId; //the mysql identifier of the standard
    public $nodeType;  //The type of standard (PE, Topic, etc)
    public $des;  //The description of the standard
    public $sCode; //The NGSS identifier of the standard (only exists for Topics and PE's)
    public $gradeBand; //The gradeband (lowgrade - highgrade) of the standard
    public $pCode;  //The ASN identifier of the standard.
    public $color;  //The color that will be rendered for the standard node in the graph
    public $origonalColor; //NA
    public $highlightColor; //The color that will be rendered when the node is highlighed
    public $neighbors = array(); //An adjacency list of neighboring standards.
    public $docNeighbors = array(); //An adjacency list of alignments corrisponding to $alignmentsList[]
    public $rId = 0;  //The id that will eventually be set, zero indexed, so the data can be passed to r
    public $uri = null; //the URI to the NGSS web page
}


//Represents a edge pair in an edges list
class Edge{
  public $id1;
  public $id2;
}


//Represents a TE document. Comprizes $alignmentsList[].
class Alignment{
  public $id;  //The id of the document.
  public $MySqlId; //The mysql identifier of the document
  public $title;  //The TE title of the document
  public $summary; //The TE summary of the document
  public $TEURI; //The TE URI of the document
  public $docType; //The type of document (activity, lesson, etc)
  public $document; //The name of the document. (Same as document name in Raven)
  public $rId = 0;  //The id that will eventually be set, zero indexed, so the data can be passed to r
  public $nodeType = "Document"; //Identifier of the type of node so we can distinguish from Standards
}


?>
