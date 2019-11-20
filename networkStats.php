<?php
include 'DBConnection.php';

//get the list of providors that have have at least the specified numver of resources
 $providers = array();
 $queryProviders = "select t.docs_per_resource, t.resource_id, c.resource_name from (
                    select count(resource_id) as docs_per_resource, resource_id
                    from resource_data
                    group by resource_id) t
                    inner join resource_collections_backup c on c.resource_id = t.resource_id
                    where t.docs_per_resource >= 10
                    order by  t.docs_per_resource desc, resource_id desc";

 if($res = mysqli_query(GetDBConnection(), $queryProviders)){
   while($row = $res->fetch_assoc()){
      $p = new Provider();
      $p->resourceCount = $row["docs_per_resource"];
      $p->providerId = $row["resource_id"];
      $p->providerName = $row["resource_name"];
      array_push($providers, $p);
   }
 }

//get stats for each provider
print("Provider\tAverage Degree Centralilty\tStandard Deviation\tResource Count\n");
for($i = 0; $i < count($providers); $i++){
  $stats = GetStatsForProvider($providers[$i]);
}


function GetStatsForProvider($p){
  //get list of all PEs that the resource is aligned to
  $resources = GetProviderResources($p);
}


function GetProviderResources($p){
  $queryResources = "select doc_id from resource_data where resource_id = " . $p->providerId;
  if($res = mysqli_query(GetDBConnection(), $queryResources)){
    while($row = $res->fetch_assoc()){
      $r = new Resource();
      $r->resourceId = $row["doc_id"];
      $r->connections = GetConnections($r->resourceId);
      $r->numConnections = count($r->connections);
      array_push($p->resources, $r);
    }
  }

  //print out the stats for the providor
  ComputeDegreeCentrallity($p);

}



function ComputeDegreeCentrallity($p){
    $centrality = 0;
    $i = 0;

    //compute the standard deviation for degree centality for the given provider
    $mean = 0; //the everage centrality for this provider's resources
    $i = 0;
    for($i; $i < count($p->resources); $i++){
        $r = $p->resources[$i];
        $mean += $r->numConnections;
    }
    $mean = $mean/$i;
    //get the sum of deviations from the mean
    $sumSquares = 0;
    for($i = 0; $i < count($p->resources); $i++){
      $sumSquares += ($p->resources[$i]->numConnections - $mean) * ($p->resources[$i]->numConnections - $mean);
    }

    $standardDev = sqrt( (1/(count($p->resources) - 1)) * $sumSquares );

    $i = 0;
    $centrality = 0;
    for($i; $i < count($p->resources); $i++){
        $r = $p->resources[$i];
        $centrality += $r->numConnections;
    }
    $centrality = $centrality/$i;

    print($p->providerName . "\t"  . $centrality . "\t" .$standardDev . "\t" . $p->resourceCount . "\n");
}


//get all 3d standards that the resource alignes to. If it alignes to a PE, count all 3D standards that comprize that PE. Don't count duplicate 3D alignmnets even if the provider says so.
function GetConnections($resourceId){
   //get all the 3D standards that the resource is explicitly aligned to
   $comprizors = GetComprizors($resourceId);
   $comprizors = RemoveDuplicates($comprizors);
   return $comprizors;
}

function RemoveDuplicates($comprizors){
     $comHash = array();
     for($i = 0; $i < count($comprizors); $i++){
         if(array_key_exists(strval($comprizors[$i]), $comHash)){
           continue;
         }
         else{
           $comHash[$comprizors[$i]] = $comprizors[$i];
         }
     }
     return $comHash;
}


function GetPEComprizors($resourceId){
  $peConnections = array();

  $queryPEConnections = "select distinct(a.sCode) as sCode from resource_alignments a
                      inner join ngss_network_nodes n on n.sCode = a.sCode
                      where doc_id = '" . $resourceId . "' and n.std_type = 'child'";

  if($res = mysqli_query(GetDBConnection(), $queryPEConnections)){
        while($row = $res->fetch_assoc()){
          $c = $row["sCode"];
          array_push($peConnections, $c);
          }
  }
  return $peConnections;
}


//returns a list of the 3D standards that are aligned to the resource with the given name
function GetComprizors($resourceId){
    $comprizors = array();

    $queryComprizors = "select distinct(a.sCode) as sCode from resource_alignments a
                        inner join ngss_network_nodes n on n.sCode = a.sCode
                        where doc_id = '" . $resourceId . "' and n.std_type = '3D'";

    if($res = mysqli_query(GetDBConnection(), $queryComprizors)){
      while($row = $res->fetch_assoc()){
        $c = $row["sCode"];
        array_push($comprizors, $c);
      }
    }

    $queryPEComprizors = "select distinct(n2.sCode) as sCode from ngss_network_edge_list l
                          inner join ngss_network_nodes n1 on n1.id = l.node_id
                          inner join ngss_network_nodes n2  on n2.id = l.mapped_id
                          where n1.std_type = 'child' and n2.std_type = '3d' and n1.sCode in (
                          select distinct(a.sCode) as sCode from resource_alignments a
                          inner join ngss_network_nodes n on n.sCode = a.sCode
                          where doc_id = '" . $resourceId. "' and n.std_type = 'child' );";

        if($res = mysqli_query(GetDBConnection(), $queryPEComprizors)){
              while($row = $res->fetch_assoc()){
                $c = $row["sCode"];
                array_push($comprizors, $c);
              }
        }


    return $comprizors;
}



class Resource{
  public  $resourceId;
  public  $connections = array();
  public  $numConnections;
}

class Provider{
  public $resourceCount;
  public $providerId;
  public $providerName;
  public $resources = array();
}
?>
