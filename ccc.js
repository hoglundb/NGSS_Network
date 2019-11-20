
var cccCategoryList;
var dciCategoryList;
var sepCategoryList;
var cccDataStructure;
var curDCITableRowId = null;
var curTableRowId = null;
var currentCategory = 0;
var curNodeColor = "#93EF72"
var EdgesCount = 0
window.onload = function(){
      GetCCCCategoryList();
      GetDCICategoryList();
      GetSEPCategoryList();
       document.getElementById("categoryDropdown").addEventListener("change", (e)=>{
        currentCategory =  document.getElementById("categoryDropdown").value
        BuildTableForCategory();
       });
}


function BuildTableForCategory(){
     ClearTable(document.getElementById("CategoryTable"));
     if(currentCategory == 0) return;
     else if(currentCategory == 1){
       curNodeColor = "#93EF72";
      BuildTable(cccCategoryList, "#93EF72", "#47CA18");
    }
    else if(currentCategory == 2){
      curNodeColor = "#FDCC78"
      BuildTable(dciCategoryList, "#FDCC78", "#F2A624" );
    }
    else if(currentCategory == 3){
      curNodeColor = "#86D3FF";
      BuildTable(sepCategoryList, "#86D3FF", "#2AB0FD");
    }
}


function ClearTable(domRef){
  if(!domRef) return;
  var rows = domRef.rows;
    var i = rows.length;
    while (--i) {
      rows[i].parentNode.removeChild(rows[i]);
    }
}


function BuildTable(categoryData, color, highlightColor){
  for(var i = 0; i < categoryData.length; i++){
       tableRef = document.getElementById("CategoryTable");
       newRow = tableRef.insertRow(tableRef.length);
       newRow.style.backgroundColor = color;
       newRow.id = categoryData[i];
       newRow.innerHTML = categoryData[i]
       newRow.onclick = ((i) => {
         return () => {
               GetNetworkData(categoryData[i]);
               SetTableBorder(categoryData[i]);
         }
       })(i);
       newRow.onmouseover = ((i) => {
         return () => {
             document.getElementById(categoryData[i]).style.backgroundColor = highlightColor
             document.getElementById(categoryData[i]).style.cursor = "pointer"
         }
       })(i);
       newRow.onmouseout = ((i) => {
         return () => {
                   document.getElementById(categoryData[i]).style.backgroundColor = color
                   document.getElementById(categoryData[i]).style.cursor = "auto"
         }
       })(i);
  }
}

function GetSEPCategoryList(){
  var uri =  "sep.php";
  var req = new XMLHttpRequest();

  req.open("POST", uri, true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onload = () => {
    if(req.status == 200){
         sepCategoryList = JSON.parse(req.responseText);
    }
    else{
      throw new Error("Bad request to sep.php");
    }
  }
  req.send(null);
}


function GetDCICategoryList(){
  var uri =  "dci.php";
  var req = new XMLHttpRequest();
  req.open("POST", uri, true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onload = () => {
    if(req.status == 200){
         dciCategoryList = JSON.parse(req.responseText);
    }
    else{
      throw new Error("Bad request to dci.php");
    }
  }
  req.send(null);
}


function GetCCCCategoryList(){
    var uri =  "ccc.php";

    var req = new XMLHttpRequest();

    req.open("POST", uri, true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = () => {
      if(req.status == 200){
           cccCategoryList = JSON.parse(req.responseText);
      }
      else{
        throw new Error("Bad request to ccc.php");
      }
    }
    req.send(null);
}

var nodes = null;
var edges = null;
var data = {};
//var options = {layout:{improvedLayout:false}}
var container = null;
var fooCount = 4;
function BuildGradeband(gradeband, gradebandString){
  var x;
  var y;
  if(gradeband == 0){
    x = 300;
    y = -400;
  }
  else if(gradeband == 1){
    x = -300;
    y = 400;
  }
  else if(gradeband == 2){
    x = -0;
    y = -0;
  }
  else if(gradeband == 3){
    x = -0;
    y = -0;
  }
  container =  document.getElementById("mynetwork");
  var dataG1 = cccDataStructure[gradeband];

   //add the ccc group for the first gradeband to the network
  var cCCData = dataG1.CCCList;
     nodes.add({
          id:dataG1.Category + "_" + gradeband,
          color:curNodeColor,
          title:dataG1.Category + " (" + cCCData.length.toString() + ")",
          gradeBand:"K-2",
          label:gradebandString,
          font:{size:20},
        /*  x:KKCoords[gradeband].x,
          y:KKCoords[gradeband].y*/
     });

     var pEList = dataG1.PEList
     for(var i = 0; i < pEList.length; i++){
         nodes.add({
           id:(i.toString() + "_" + gradeband).toString(),
           color:"#D4D4D4",
           title: pEList[i].sCode,
           label:pEList[i].sCode,
           /*x:KKCoords[fooCount].x,
           y:KKCoords[fooCount].y*/
         });
         fooCount++
       }

var myX = "c(";
var myY = "c(";
 for(var i = 0; i < KKCoords.length; i++){
   myX +=  KKCoords[i].x + ", ";
   myY +=  KKCoords[i].y + ", ";

 }
 myX +=  ")"
 myY += ")"


       var standards3DInGraph = {};
      /* for(var i = 0; i < pEList.length; i++){
         for(var j = 0; j < pEList[i].NonCCCAlignments.length; j++){
              var index3D = pEList[i].NonCCCAlignments[j]
              var standard3D = dataG1.DCISEPList[index3D];
              if(standards3DInGraph[standard3D.sCode]) continue; //make sure not to add duplicate standards.
              standards3DInGraph[standard3D.sCode] = standard3D.sCode;
              if(standard3D.description.includes("Energy drives"))
              console.log(standard3D);
              var color = "RED";
              if(standard3D.category == "CC") color = "green";
              else if(standard3D.category == "DCI") color = "orange";
              else if(standard3D.category == "SEP") color = "blue";
              nodes.add({
                id:standard3D.sCode,
                color: color,
                title: standard3D.description,
                label:standard3D.sCode,
              });
          }
       }*/


        for(var i = 0; i < pEList.length; i++){
        EdgesCount += 1;
          edges.add({
              from:dataG1.Category + "_" + gradeband,
              to:(i.toString() + "_" + gradeband).toString()
          });
        }
}


function BuildNetwork(){

  nodes = new vis.DataSet({});
  edges = new vis.DataSet({});
   data = {
    nodes:nodes,
    edges:edges
  };

  options = {
    physics:false,
  //  layout:{improvedLayout:false}
  }

  BuildGradeband(0, "k-2");
  BuildGradeband(1, "3-5");
  BuildGradeband(2, "6-8");
  BuildGradeband(3, "9-12");


EdgesCount += 1;
    edges.add({

      to: cccDataStructure[0].Category + "_0",
      from: cccDataStructure[0].Category + "_1",
    });


  EdgesCount += 1;
   edges.add({

     to: cccDataStructure[1].Category + "_1",
     from: cccDataStructure[2].Category + "_2",
   });

  EdgesCount += 1;
  edges.add({

    to: cccDataStructure[0].Category + "_2",
    from: cccDataStructure[0].Category + "_3",
  });

  var nw = new vis.Network(container, data, options);

  console.log(EdgesCount)
}

var KKCoords = [];


function GetGMLDataString(){

  var dataString = "GetFRCoords('graph[\n	 label \"NGSS k-2\"\n";


  //get the nodes in gml format
  var standards3DList = {};
  var nodesList = {};
  var bundleId = 10000;
  for(var i = 0; i < cccDataStructure.length; i++){
    var gradeData = cccDataStructure[i];
    dataString += "     node[\n        id " + (bundleId).toString() + "\n     ]\n"
/*    console.log(gradeData);*/
    for(var j = 0; j < gradeData.PEList.length; j++){
      if(nodesList[gradeData.PEList[j].id]) continue;
      nodesList[gradeData.PEList[j].id] = gradeData.PEList[j].id
      dataString+= "     node[\n        id " + gradeData.PEList[j].id.toString() + "\n     ]\n"


       //get the comprizing standards for the gradeband
    /*   for(var k = 0; k < gradeData.PEList[j].NonCCCAlignments.length; k++){
            var index = gradeData.PEList[j].NonCCCAlignments[k];
            var standard3d = gradeData.DCISEPList[index];
            if(standards3DList[standard3d.id]) continue;
              standards3DList[standard3d.id] =  standard3d.id;
              dataString+= "     node[\n        id " + standard3d.id.toString() + "\n     ]\n"
       }*/

    }
    bundleId+=10000
  }

  //get the edges in gml format
   var edgesList = {}
   bundleId = 10000;
     dataString += "     edge[\n            source "+ (10000).toString() + " \n            target " + (20000).toString() + "\n     ]\n";
     dataString += "     edge[\n            source "+ (20000).toString() + " \n            target " + (30000).toString()  + "\n     ]\n";
     dataString += "     edge[\n            source "+ (30000).toString() + " \n            target " + (40000).toString()  +"\n     ]\n";
   for(var i = 0; i < cccDataStructure.length; i++){
        var gradeData = cccDataStructure[i];

        //get edges from CCC bundles to pEs
        for(var j = 0; j < gradeData.PEList.length; j++){

          var e1 = (bundleId).toString();
          var e2 = gradeData.PEList[j].id.toString()
            var edgeString1 = e1 + "-" + e2;
            var edgeString2 = e2 + "-" + e1;
            if(edgesList[edgeString1] || edgesList[edgeString2]) continue;
            edgesList[edgeString1] = edgeString1;
            edgesList[edgeString2] = edgeString2;
          dataString += "     edge[\n            source "+ e1 + " \n            target " + e2 + "\n     ]\n";
        }
   }
     bundleId += 10000


   dataString += "]')";
  return dataString;

}


function FormatKKCoords(kkCoords){
  var coords = [];
     for(var i = 0; i < kkCoords.length/2; i++){
           var x = kkCoords[i];
           var y = kkCoords[2* i];
           var coord = {x: x, y:y};
           coords[i] = coord;
     }

     return coords;
}



function GetKKCoords(){
   var dataString = GetGMLDataString();
   var params = "edgeList=" + dataString;
   var uri = "getKKCoordsAPI.php";
   var req =new XMLHttpRequest();
   var kkCoords2D = null;
   req.open("POST", uri, true);
   req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
   req.onload = function(){
      if(req.status == 200){

        var kkCoords = JSON.parse(req.responseText);
         KKCoords = FormatKKCoords(kkCoords);
         BuildNetwork();

      }
      else{
        console.log(req.status)
        console.log("Failure Getting KK coordinates");
      }
   }

   req.send(params);

}

function GetNetworkData(category){
   var uri = "getGradebandDataApi.php";
   var req = new XMLHttpRequest();
   var params = "category=" + category + "&3dType=" + currentCategory.toString();
   req.open("POST", uri, true);
   req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
   req.onload = () => {
     if(req.status == 200){
          cccDataStructure = JSON.parse(req.responseText);
          GetKKCoords();
     }
     else{
       throw new Error("Bad request to GetCCCNetworkApi.php");
     }
   }
   req.send(params);
}



function SetTableBorder(e){
  var domRef = document.getElementById(e)

  domRef.style.border = "solid black"

  if(document.getElementById(curTableRowId)){
    document.getElementById(curTableRowId).style.border = "none"
  }
  curTableRowId = e

}
