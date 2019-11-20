<?php


include 'DBConnection.php';

$con = GetDBConnection();


$queryResources = 'SELECT * FROM resource_collections_backup ORDER BY resource_id';


$resources = array();
if($res = mysqli_query($con, $queryResources)){
  while($row = $res->fetch_assoc()){
    array_push($resources, $row["resource_name"]);
  }
}

print("\n");

$fp = fopen("foo.txt", 'w');
fwrite($fp, "Resource Name\tNumber of Resources Aligned Across Gradebands \n");
for($i = 0; $i < count($resources); $i++){
   $resource = $resources[$i];

   $queryCounts = 'select count(*) as aCount from(
select * from(
select doc_id, count(*) as myCount from(
select distinct(concat(gradeband, doc_id)) as foo, doc_id from (
select  resource_name,
case
     when gradeband like \'%0%\' or gradeband  like \'%1%\' or gradeband like \'%2%\' then \'k-2\'
     when gradeband like \'%3%\' or gradeband like \'%4%\' or gradeband like \'%5%\' then \'3-5\'
     when gradeband like \'%6%\' or gradeband like \'%7%\' or gradeband like \'%8%\' then \'6-8\'
     when gradeband like \'%9%\' or gradeband like \'%10%\' or gradeband like \'%11%\' or gradeband like \'%12%\' then \'9-12\' ELSE gradeband END as gradeband,
 doc_id, sCode from foofoo where resource_name like \'%' . $resource . '%\' order by doc_id
) t1 order by doc_id
) final
group by final.doc_id
) f2 where myCount > 1
) f3';

if($res = mysqli_query($con, $queryCounts)){
  if($row = $res->fetch_assoc()){


    fwrite($fp, $resource . "\t" . $row["aCount"] . "\n");
  }
}

}
fclose($fp);
?>
