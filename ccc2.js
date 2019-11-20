//global variables for the newtork data
var NetworkData = null;
var Category = null;
var Category3DType = null;
var GraphDataStructure = null;
var KKCoords3D = null;
var DCIList = null;
var SEPList = null;
var CCList = null;

var CurTableRowId = null;
var CategoryDepth = null;

//global variables for the vis.js network
var v_Edges = null;
var v_Nodes = null;
var v_Data = null;
var v_NW = null;
var v_Options = null;

//Global constants
var GET_COMPRIZING = true;

window.onload = async function(){
  InitItems();
  //use default value to build network
    GetCategoryList("ccc.php", 1, true);
    GetCategoryList("dci.php", 2, false);
    GetCategoryList("sep.php", 3, false);

  LoadNetworkData();
}


function InitItems(){


document.getElementById("depthDropdown").addEventListener("change", function (e){

    if(e.target.value == 2) GET_COMPRIZING = true;
    else GET_COMPRIZING = false;
    RemoveNetwork("mynetwork")
    LoadNetworkData()
});

document.getElementById("categoryDropdown").addEventListener("change", function(e){
  Category3DType = e.target.value
  BuildCategoryTable(e.target.value);
});
}

function BuildCategoryTable(index){
   ClearTable(document.getElementById("CategoryTable"));
   var data = null;
   var color = null;
   if(index == 1){
     color = "#93EF72"
     highlightColor = "#47CA18"
     data = CCList;
   }
   else if(index == 2){
       color = "#FDCC78"
       highlightColor = "#F2A624"
       data = DCIList;
    }
    else if(index == 3){
        color = "#86D3FF"
        highlightColor = "#2AB0FD"
        data = SEPList;
    }


    for(var i = 0; i < data.length; i++){
         tableRef = document.getElementById("CategoryTable");
         newRow = tableRef.insertRow(tableRef.length);
         newRow.style.backgroundColor = color;
         newRow.id = data[i];
         newRow.innerHTML = data[i]
         newRow.onclick = ((i) => {
           return () => {
                 RemoveNetwork("mynetwork")
                 Category = data[i]
                 LoadNetworkData()
                 SetTableBorder(data[i]);
           }
         })(i);
         newRow.onmouseover = ((i) => {
           return () => {
               document.getElementById(data[i]).style.backgroundColor = highlightColor
               document.getElementById(data[i]).style.cursor = "pointer"
           }
         })(i);
         newRow.onmouseout = ((i) => {
           return () => {
                     document.getElementById(data[i]).style.backgroundColor = color
                     document.getElementById(data[i]).style.cursor = "auto"
           }
         })(i);
    }
}


function SetTableBorder(e){
  var domRef = document.getElementById(e)

  domRef.style.border = "solid black"

  if(document.getElementById(CurTableRowId)){
    document.getElementById(CurTableRowId).style.border = "none"
  }
  CurTableRowId = e
}

function ClearTable(domRef){
  if(!domRef) return;
  var rows = domRef.rows;
    var i = rows.length;
    while (--i) {
      rows[i].parentNode.removeChild(rows[i]);
    }
}

function GetCategoryList(categoryFile, index, shouldLoadTable){
    var uri =  categoryFile;

    var req = new XMLHttpRequest();

    req.open("POST", uri, true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = () => {
      if(req.status == 200){
           if(index == 1) CCList = JSON.parse(req.responseText);
           else if(index == 2) DCIList = JSON.parse(req.responseText);
           else if(index == 3 ) SEPList = JSON.parse(req.responseText);
           if(shouldLoadTable){
               BuildCategoryTable(index);
           }

      }
      else{
        throw new Error("Bad request to ccc.php");
      }
    }
    req.send(null);
}


function GetNetworkNodes(){
  if(NetworkData == null){
    console.log("NetworkData has not been initailized");
    return;
  }
  var comprizorsHash = {};
  GraphDataStructure = new NGSSGraph();
  var nodeIdStart = 5;

  //Add a node for each gradband bundle of 3d standards for the current category
  for(var i = 0; i < NetworkData.length; i++){
     var node = new Node();
     node.id = (i + 1);
     node.type = "Bundle"
     GraphDataStructure.addNode(node);
  }


  //Add PEs and comprizing standards to the network for each gradeband
  for(var i = 0; i < NetworkData.length; i++){  //for each gradeband
       for(var j = 0; j < NetworkData[i].PEList.length; j++){ //for each pe in that gradeband

         //add that pe
         var pe = NetworkData[i].PEList[j];
         var peNode = new Node();
          peNode.id =  nodeIdStart;
          peNode.type = "PE";
          var metadata = {};
          metadata.description = pe.description;
          metadata.sCode = pe.sCode;
          if(comprizorsHash[pe.sCode]){  //skip ones already added
            continue;
          }
          comprizorsHash[pe.sCode] = pe.sCode
          peNode.metadata = metadata;
          GraphDataStructure.addNode(peNode);
          nodeIdStart++;

          //add all the 3d standards to the graph.
          if(GET_COMPRIZING){
            //make sure duplicate 3d standards are not added
            for(var k = 0; k < pe.ComprizingStandards.length; k++){
               var compId = pe.ComprizingStandards[k];
               var comp = NetworkData[i].ComprizingStandardsList[compId]

               if(comprizorsHash[comp.sCode]){  //skip ones already added
                 continue;
               }
               comprizorsHash[comp.sCode] = comp.sCode;
               var node3D = new Node();
               node3D.id = nodeIdStart;
               node3D.type  = comp.category;
               m = {};
               m.sCode = comp.sCode;
               m.description = comp.description;
               m.lowGrade = comp.lowGrade;
               m.highGrade = comp.highGrade;
               node3D.metadata = m;

               comprizorsHash[m.sCode] = m.sCode;
               GraphDataStructure.addNode(node3D);
               nodeIdStart++;
            }
          }
       }
  }

  for(var i = 0; i <  NetworkData.length; i++){
    var topics = NetworkData[i].TopicsList;
    for(var j = 0; j < topics.length; j++){
      comprizorsHash[topics[j].sCode] = topics[j].sCode
      var n = new Node();
      var m = {};
      n.id = nodeIdStart;
      m.sCode = topics[j].sCode;
      m.description = topics[j].description;
      m.lowGrade = topics[j].lowGrade;
      m.highGrade = topics[j].highGrade;
      n.metadata = m;
      n.type = "topic";
      GraphDataStructure.addNode(n);
      nodeIdStart++;
    }
  }

}


function GetNetworkEdges(){

   //add edges connecting the gradeband categories
    for(var i = 1; i < 4; i++){
      GraphDataStructure.addEdge(i, i + 1);
    }

    //add connections from gradband categories to PE's
    for(var i = 0; i < 4; i++){
         var categoryId = (i + 1);
         var category = NetworkData[i];

         //add every PE connected to that category in the gradeband
         for(var j = 0; j < category.PEList.length; j++){
           var pe = GraphDataStructure.GetNodeFromSCode(category.PEList[j].sCode);
           if(!GraphDataStructure.hasEdge(categoryId, pe.id))
           GraphDataStructure.addEdge(categoryId, pe.id);
         }
    }

    //add connections from PEs to comprizing standards
    if(GET_COMPRIZING){
      for(var i = 0; i < 4; i++){
        for(var j = 0; j < NetworkData[i].PEList.length; j++){
          var pe = NetworkData[i].PEList[j];
          for(var k = 0; k < pe.ComprizingStandards.length; k++){
            var connected3DStandardIndex = pe.ComprizingStandards[k];
            var connected3DStandard = NetworkData[i].ComprizingStandardsList[connected3DStandardIndex];
            var peInGraph = GraphDataStructure.GetNodeFromSCode(pe.sCode);
            var connected3DStandard = GraphDataStructure.GetNodeFromSCode(connected3DStandard.sCode);
            if(!GraphDataStructure.hasEdge(peInGraph.id, connected3DStandard.id)){
                GraphDataStructure.addEdge(peInGraph.id, connected3DStandard.id);
            }
          }
        }
      }
    }

    console.log(GraphDataStructure)
    //add connections from topics to PE's
    for(var i = 0; i < 4; i++){
      for(var j = 0; j < NetworkData[i].PEList.length; j++){
          var pe = NetworkData[i].PEList[j];
          var topicId = pe.topicIndex;
          var topic = NetworkData[i].TopicsList[topicId];
          var  topicInGraph = GraphDataStructure.GetNodeFromSCode(topic.sCode);
          var peInGraph = GraphDataStructure.GetNodeFromSCode(pe.sCode)

         if(!GraphDataStructure.hasEdge(peInGraph.id, topicInGraph.id)){
  console.log(peInGraph.id.toString() + ", " + topicInGraph.id.toString())
              GraphDataStructure.addEdge(peInGraph.id, topicInGraph.id)
         }
      }
    }
}


function GetNodeAttributes(node){
   var attribs = {};
   if(node.type == "topic"){
     attribs.color = "#EFB2F2";
     attribs.label = node.metadata.sCode;
     attribs.title = node.metadata.description;
   }
   else if(node.type == "PE"){
    // console.log(node)
     attribs.color = "lightGrey";
     attribs.label = node.metadata.sCode;
     attribs.title = node.metadata.description;
   }
   else if(node.type == "CC"){
     attribs.color = "#93EF72";
     attribs.label = node.metadata.sCode;
     attribs.title = node.metadata.description;
   }
   else if(node.type == "SEP"){
     attribs.color = "#86D3FF";
     attribs.label = node.metadata.sCode;
     attribs.title = node.metadata.description;
   }
   else if(node.type == "DCI"){
     attribs.color = "#FDCC78";
     attribs.label = node.metadata.sCode;
     attribs.title = node.metadata.description;
   }
   else if(node.type == "Bundle"){
     attribs.color = "#93EF72";
     if(Category3DType == 1){
       attribs.color = "#93EF72";
     }
     if(Category3DType == 2){
        attribs.color = "#FDCC78";
     }
     if(Category3DType == 3){
        attribs.color = "#86D3FF";
     }


     attribs.title = "Category" //FIXME

     if(node.id == 1){
       attribs.label = "K-2"
     }
     else  if(node.id == 2) {
       attribs.label = "3-5"
     }
     else  if(node.id == 3){
       attribs.label = "6-8"
     }
     else  if(node.id == 4) {
       attribs.label = "9-12"
     }
   }
   return attribs;
}

function DrawNetwork(){

  var count = 0;

  //init the global variables for the vis.js network
  v_Nodes = new vis.DataSet({});
  v_Edges = new vis.DataSet({});
  v_Data = {
    nodes:v_Nodes,
    edges:v_Edges
  };

  v_Options = {
    physics:false,  //don't want wibly wobbley stuff to happen
    layout:{improvedLayout:false}  //we let R compute the layout for us
  }

  //for each node, draw the node according to its type
  for(var i = 0; i < GraphDataStructure.nodeCount; i++){
    var node = GraphDataStructure.nodesList[i];
    var nodeAtt = GetNodeAttributes(node);
  /*  console.log(nodeAtt);*/
      v_Nodes.add({
      id:node.id,
      label:nodeAtt.label,
      title:nodeAtt.title,
      color:nodeAtt.color,
      x:KKCoords3D[i].x,
      y:KKCoords3D[i].y
    });
    count++;
  }
  console.log(GraphDataStructure)
  //draw all the edges
  for(var i = 0; i < GraphDataStructure.edgeCount; i++){
    var edge = GraphDataStructure.edgesList[i];
    v_Edges.add({
      to: edge.source,
      from: edge.target
    });
  }

   var container = document.getElementById("mynetwork");
   v_NW = new vis.Network(container, v_Data, v_Options);
}

function RemoveNetwork(domRef){
	var html = document.getElementById(domRef);
	while(html.firstChild){
	    html.removeChild(html.firstChild);
	}
}



 function BuildGraphDataStructure(){

  GetNetworkNodes();

  GetNetworkEdges();


  //DrawNetwork();

  //console.log(GraphDataStructure);
}


function GetGMLDataString(){

  var dataString = "GetKKCoords('graph[\n	 label \"NGSS k-2\"\n";


  //get the nodes in gml format
  for(var i = 0; i < GraphDataStructure.nodeCount; i++){
    var nodeId = GraphDataStructure.nodesList[i].id;
    dataString += "     node[\n        id " + (nodeId).toString() + "\n     ]\n"
  }

  //add the egdes to the gml data string
  for(var i = 0; i < GraphDataStructure.edgeCount; i++){
    var target = GraphDataStructure.edgesList[i].target;
    var source = GraphDataStructure.edgesList[i].source;
    dataString += "     edge[\n            source "+ source + " \n            target " + target + "\n     ]\n";
  }


  dataString += "]')"


  return dataString
}

function FormatKKCoords(coords){

    var coordsObj = [];
    var mid = coords.length/2;
    for(var i = 0; i < mid; i++){
          var x = coords[i];
          var y = coords[mid + i];
          var coord = {x:x, y:y};
          coordsObj[i] = coord;
    }

    return coordsObj;
}


  function GetKamadaKawaiCoords(dataString){
      var params = "edgeList=" + dataString;
      var uri = "getKKCoordsAPI.php";
      var req =new XMLHttpRequest();
      var kkCoords2D = null;
      req.open("POST", uri, true);
      req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      req.onload = function(){
         if(req.status == 200){
            KKCoords3D = FormatKKCoords(JSON.parse(req.responseText));
            DrawNetwork();
         }
         else{
           console.log(req.status)
           console.log("Failure Getting KK coordinates");
         }

      }

      req.send(params);
}

function LoadNetworkData(){
  if(Category3DType == null) Category3DType = 1
  if(Category == null) Category = "Cause and Effect";
  var uri = "getGradebandDataApi2.php";
  var req = new XMLHttpRequest();
  var params = "category=" + Category + "&3dType=" + Category3DType.toString();
  req.open("POST", uri, true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onload = async () => {
    if(req.status == 200){
          NetworkData = await JSON.parse(req.responseText);
          console.log(NetworkData)
          BuildGraphDataStructure();
          var gmlString = GetGMLDataString()
          GetKamadaKawaiCoords(gmlString);
    }
    else{
      throw new Error("Bad request to GetCCCNetworkApi.php");
    }
  }
  req.send(params);
}


class Node{

  constructor(){
    this.id = null;
    this.type = null;
    this.metadata = [];
  }
}

class NGSSGraph{
  constructor(){
    this.nodesList = [];
    this.edgesList = [];
    this.nodeCount = 0;
    this.edgeCount = 0;

    //private members for data integrity checking
    this.PEHashMap = {};
    this.nodesHashMap = {};
    this.EdgesHashMap = {};
  }

  //Add a node object to the graph. Throw exeption if node already in the graph.
  addNode(newNode){

    //If a PE or 3D, check that node with this sCode is not already in the graph object
      if(newNode.type == "PE" || newNode.type == "CC" || newNode.type == "SEP" || newNode.type == "DCI" || newNode.type == "topic"){
        if(this.PEHashMap[newNode.sCode]){
          throw new Error("A PE with sCode = " + newNode.sCode + " already exists");
        }
        this.PEHashMap[newNode.metadata.sCode] = newNode.metadata.sCode;
      }
      this.nodesList[this.nodeCount] = newNode;
      this.nodeCount +=1;

      //check that no node with this id is already in network
      if(this.nodesHashMap[newNode.id]){
          throw new Error("A node with id = " + newNode.sCode + " already exists");
      }
      this.nodesHashMap[newNode.id] = newNode.id;
  }

  addEdge(id1, id2){
      var edge = {};
      if(this.EdgesHashMap[id1.toString() + "," +  id2.toString()] || this.EdgesHashMap[id2.toString() + "," +  id1.toString()]){
        throw new Error("Edge from " + id1.toString()  + " to " + id2.toString() + " Already Exist.");
      }
      this.EdgesHashMap[id1.toString() + "," +  id2.toString()] = id1.toString() + "," +  id2.toString();
      edge.source = id1;
      edge.target = id2;
      this.edgesList[this.edgeCount] = edge;
      this.edgeCount++;
  }

  hasEdge(id1, id2){
    var edge = {};
    if(this.EdgesHashMap[id1.toString() + "," +  id2.toString()] || this.EdgesHashMap[id2.toString() + "," +  id1.toString()]){
      return true;
    }
    else return false;
  }

  GetNodeFromSCode(sCode){
    for(var i = 0; i < this.nodeCount; i++){
      if(this.nodesList[i].type != "Bundle" || this.nodesList[i].type == "topic"){
        if(this.nodesList[i].metadata.sCode == sCode) {
          return this.nodesList[i];
        }
      }
    }
    return "not found";  //lets us know that node with that sCode was not in the graph
  }

}
