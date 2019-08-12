<?php
include("KKLayout.php");
$nodes = array();

/* Create 11 random nodes */
for($i=0;$i<=300;$i++)
{
    $Connections = ""; $RandCx1 = rand(0,1);
    for($j=0;$j<=$RandCx1;$j++)
    {
        $RandCx2 = rand(0,10);
        if ( $RandCx2 != $j )
        { $Connections[] = $RandCx2; }
    }
    $nodes[$i] = array('idx' => $i, "conn" => $Connections);
}
$kklayout = new KKLayout ( $nodes );
$kklayout->initialize ();
while ( ! $kklayout->done () ) {
    $kklayout->step ();
}
print_r($kklayout->xydata);
print_r($nodes);
?>
