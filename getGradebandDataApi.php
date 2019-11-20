<?php
include 'DBConnection.php';

$CCC_Category = $_POST["category"];
$StandardType3D = null;
 echo GetGradebandDataStructure();


function GetGradebandDataStructure(){




  //The ccc category posted from the client
  global $CCC_Category, $StandardType3D;

  if($_POST["3dType"] == 1){
    $StandardType3D = "crosscutting_concepts";
  }
  else if($_POST["3dType"] == 2){
    $StandardType3D = "dci_list";
  }
  else if($_POST["3dType"] == 3){
    $StandardType3D = "sep_list";
  }

  //get bundle of data for each gradeband
  $CCCGradeband1 = GetGradebandData(0, 2);
  $CCCGradeband2 = GetGradebandData(3, 5);
  $CCCGradeband3 = GetGradebandData(6, 8);
  $CCCGradeband4 = GetGradebandData(9, 12);

  //return array of all gradeband data back to client
  $gradebandData = array();
  array_push($gradebandData, $CCCGradeband1, $CCCGradeband2, $CCCGradeband3, $CCCGradeband4);
  return json_encode($gradebandData);
}


function GetGradebandData($lowGrade, $highGrade){
  global $CCC_Category;

  //object to hold all network data pertaining to that gradeband
  $CCCGradebandData = new  GradebandData();

  $CCCGradebandData->Category = $CCC_Category;

  //Get the ccc list for the gradeband
  $CCCGradebandData->CCCList = GetCCCBundle($lowGrade,$highGrade);

  //get all the PEs that map to a CCC in the
  $CCCGradebandData->PEList = GetPEList($lowGrade, $highGrade);

  $CCCGradebandData->DCISEPList = Get3DStandards($CCCGradebandData->PEList);

  for($i = 0; $i < count($CCCGradebandData->PEList); $i++){
    $CCCGradebandData->PEList[$i]->NonCCCAlignments =  GetNonCCCConnections($CCCGradebandData->PEList[$i]->id, $CCCGradebandData->DCISEPList);
  }


  return $CCCGradebandData;
}


function GetPEList($lowGrade, $highGrade){
  global $CCC_Category, $StandardType3D;
  $q = "select n2.sCode as sCode, n2.std_type as nodeType, n2.lowgrade, n2.highgrade, n2.id, n2.description from ngss_network_edge_list m ";
  $q .= " inner join ngss_network_nodes n on n.id = m.mapped_id";
  $q .= " inner join ngss_network_nodes n2 on n2.id = m.node_id";
  $q .= " where n.sCode in (select c.sCode from " . $StandardType3D. " c WHERE c.category like " . "'" . $CCC_Category . "')" ;
  $q .= " and n2.lowgrade >= " . "'" . $lowGrade . "'" . " and n2.highgrade <= " . "'" . $highGrade . "'";

  $PEList = array();

  if($res = mysqli_query(GetDBConnection(), $q)){
    while($row = $res->fetch_assoc()){
      $pe = new PE();
      $pe->sCode = $row['sCode'];
      $pe->id = $row['id'];
      $pe->description =  iconv("UTF-8", "UTF-8//IGNORE", $row['description']);
      $pe->lowGrade = $row['lowgrade'];
      $pe->highGrade = $row['highgrade'];
      array_push($PEList, $pe);
    }
  }
  return $PEList;
}


function Get3DStandards($PEList){
  $q  = " select n.sCode, c.category, n.std_type, n.description, n.id, n.highgrade, n.lowgrade from ngss_network_edge_list m";
  $q .= " inner join ngss_network_nodes n on n.id = m.mapped_id";
  $q .= " inner join ngss_comprizing_standards c on c.edu_std = n.sCode";
  $q .= " where ";
  for($i = 0; $i < count($PEList); $i++){
    $q .= " m.node_id= '" . $PEList[$i]->id . "'";
    if($i != count($PEList) - 1){
      $q .= " or ";
    }
  }

  $NonCCCList = array();

  if($res = mysqli_query(GetDBConnection(), $q)){
    while($row = $res->fetch_assoc()){
       $DCISEP = new CCC();
       $DCISEP->sCode = $row['sCode'];
       $DCISEP->id = $row['id'];
       $DCISEP->description =   iconv("UTF-8", "UTF-8//IGNORE", $row['description']);
       $DCISEP->lowGrade = $row['lowgrade'];
       $DCISEP->highGrade = $row['highgrade'];
       $DCISEP->category = $row['category'];
       array_push($NonCCCList, $DCISEP);
    }
  }

  return $NonCCCList;
}


function HasEdge($peId, $nonCCCId){

  $q  = " select count(*) as HasEdge from ngss_network_edge_list n where ";
  $q .= " n.mapped_id = " . "'" . $peId . "' " . " and n.node_id = " . "'" . $nonCCCId . "'";
  if($res = mysqli_query(GetDBConnection(), $q)){
    if($row = $res->fetch_assoc()){
      if($row['HasEdge'] != '0') return true;
    }
  }

  return false;
}

function GetNonCCCConnections($PE, $nonCCCList){
   $nonCCCConnections = array();
    for($j = 0; $j < count($nonCCCList); $j++){
      if(HasEdge($PE, $nonCCCList[$j]->id)){
        array_push($nonCCCConnections, $j);
    }
  }
  return $nonCCCConnections;
}

//Returs a list of the CCC sCodes from one of 12 specified CCC categories
function GetCCCBundle($lowGrade, $highGrade){
   global $CCC_Category, $StandardType3D;
   $CCCBundle = array();
  $q = "SELECT sCode, id, description, lowgrade, highgrade FROM ngss_network_nodes where lowgrade >=" . "'" . $lowGrade . "'" . " AND highgrade <=" . "'" . $highGrade . "'" . "AND sCode IN " . "(";
  $q .= "SELECT c.sCode FROM " .$StandardType3D . " c WHERE c.category LIKE " . "'" . $CCC_Category . "')";
  if($res = mysqli_query(GetDBConnection(), $q)){
      while($row = $res->fetch_assoc()){
        $CCC = new CCC();
        $CCC->sCode = $row["sCode"];
        $CCC->id = $row["id"];
        $CCC->description = iconv("UTF-8", "UTF-8//IGNORE", $row['description']);
        $CCC->lowGrade = $row["lowgrade"];
        $CCC->highGrade = $row["highgrade"];
        array_push($CCCBundle, $CCC);
      }
  }
  return $CCCBundle;
}


class CCC{
   public $sCode;
   public $id;
   public $description;
   public $lowGrade;
   public $highGrade;
   public $category;
}

class PE{
  public $sCode;
  public $id;
  public $description;
  public $lowGrade;
  public $highGrade;
  public $CCCAlignments = array();
  public $NonCCCAlignments = array();
}


class GradebandData{
  public $Category;
  public $CCCList = array();
  public $PEList = array();
  public $DCISEPList = array();
}
 ?>
