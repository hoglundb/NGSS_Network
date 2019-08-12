//Global constants that determine node attributes
const NODE_SIZE_DIFF = 3;
const LARGE_NODE_SIZE = 24;
const DOC_NODE_SIZE = 7;
const REGULAR_NODE_SIZE = 16;
const SELECTED_DOC_NODE_SIZE = 30;
const LARGE_DOC_NODE_SIZE = 16;
const EDGE_COLOR = '#626161';
const STD_DESCRIPTION_LENGTH = 120;
const STD_LINE_HEIGHT = 1.2;
const DOCS_LINE_HEIGHT = 1.2;
const SELECTED_NODE_COLOR = '#3F3D3D'
const BLANK_NODE_LABEL = "          "
//node and standards table colors. First entry is regular color, second value is matching border highlight color, third is highlight node color
const PURPLE_COLOR = ["#EFB2F2", "#EA39F0", "#FEE2FF", "#F2CFF3" ];
const GREY_COLOR = ['#D4D4D4',"#808080", "#EFEFEF"];
const BLUE_COLOR =   ["#9FBDE4", "#2B7BE4", "#C2DAF9", "#C2D0E4"];
const ORANGE_COLOR = ["#FBC08C","#F67401","#FFE4CB", "#FBCFAB"];
const GREEN_COLOR =  ["#CDE49F", "#85C702","#E8F3D6", "#D8E4C2"];
const DOCS_COLOR = ["#DFD4C8", "#F2E4D3" ];
const COLOR_INDEX = 2;

//Data structure to track the alignments dropdown list items and their node id's
const DOC_TYPES = ["activity", "lesson", "curricularUnit", "all"]

//global variables for the network
var docTypesForDropDown = getDropDownTypesArray();
var NGSSGraph = null;
var Alignments = null;
var standardsCount = 0;
var ADD_DOCS = true;
var graph = null;
var currentTableRow = "";
var currentSelectedNode = null;
var currentDocsTableRow = null;
var selectedDocNodeId = null;
var edgesToPrint = null;


//The options for viewing the network. Either we are viewing the ASN or the NGSS
var ModeEnum = {
  NGSS: 1,
  ASN:2
};

//The options for the types of alignments
var ResourceTypes = {
    activities:false,
    lessons:false,
    curricularunits:false
}

//Traks the display type as defined in ModeEnum{}
var NodeDisplayType;



//Initization function
window.onload = function onLoad(){
  ShowLoadingScreen();
  //Load the nw data via a post request to getNetworkDataAPI.php
   GetNetworkDataAJAX();

   //The node display type defaults to ASN
   NodeDisplayType = ModeEnum.ASN;

  //Set the legend colors and align the legend based on the page size
  alignLegend();
  document.getElementById("label1").style.background = PURPLE_COLOR[0];
  document.getElementById("label2").style.background = GREY_COLOR[0];
  document.getElementById("label3").style.background = BLUE_COLOR[0];
  document.getElementById("label4").style.background = ORANGE_COLOR[0];
  document.getElementById("label5").style.background = GREEN_COLOR[0];

   //set the default sCode in the search bar
  document.getElementById("sCode").value = "S2467886";

  //Bind the "resouce type" dropdown to its action functions
  initDropdown();

  //event listender for the type of resources dropdown.
  document.getElementById("dropdownToggle").addEventListener("click", function(){
        if(graph == null){
          SetResourceTypesFromDropdown()
          return;
        }
        HandleResouceTypeDropdown();
  });

  //event listener for the display type dropdown
  document.getElementById("displayType").addEventListener("change", function(){
    //options 0 and 1 are ASN
    if(this.value == 0 || this.value == 1){
      DisplayType = ModeEnum.ASN;
    }
    //option 2 is NGSS
    else{
      DisplayType = ModeEnum.NGSS
    }
     ToggleNetworkLables();
  });

  //event listener for the network depth dropdown
  document.getElementById("networkDepth").addEventListener("change", function(){
    if(graph != null && currentSelectedNode != null){
      document.getElementById("gradeBand").value = 0;
      submit(currentSelectedNode);
    }
  });

  //event listener for the gradeband dropdown
  document.getElementById("gradeBand").addEventListener("change",  function(){
     submit(null);
  });

//User can search by Enter key
 window.addEventListener("keyup", function(e){
    if(event.key == "Enter"){
      submitBtn();
    }
 });

}


/***************************************************************************************************************
Function changes back and forth from NGSS labels to ASN labels. It uses the global var DisplayType to determine
if we are going from NGSS to ASN or vice versa.
***************************************************************************************************************/
function ToggleNetworkLables(){
  if(graph ==  null) return;  //don't do anything if graph not already drawn.

  //Build json string to pass to the network to update the label of all the standard nodes.
  var dataString = "[";
  for(var i = 0; i < graph.numVertices; i++){
    var curVertex = graph.vertices[i];
    var curLabel = curVertex.sCode;
    if(DisplayType == ModeEnum.NGSS){
      if(curVertex.nodeType == "Standard" || curVertex.nodeType == "Performance Expectation" || curVertex.nodeType == "Disciplinary Core Ideas"){
          curLabel = curVertex.pCode;
      }
      else{
        (curLabel = "           ");
      }
    }

    dataString =  dataString + "{";
    dataString =  dataString + '"'+ "id" + '"' + ":" +  curVertex.id.toString()  + ",";
    dataString =  dataString +'"'+ "label" + '"' + ":" + "\"" + curLabel + "\"";
    dataString =  dataString + "}";
    dataString = dataString + ",";
  }
  dataString = dataString.substring(0, dataString.length - 1)
  dataString = dataString + "]";

  //Parse the string into JSON and update the vis.js nodes object. This will update the nw accordinly
  var networkJson  = JSON.parse(dataString);
  nodes.update(
    networkJson
  );
}


/*********************************************************************************************************************
This function returns true if the global variable resourceType has an option set. Returns false otherwise
**********************************************************************************************************************/
function IsShowingDocs(){
  if(ResourceTypes.activities || ResourceTypes.lessons || ResourceTypes.curricularunits){
    return true;
  }
  return false;
}


/********************************************************************************************************************
Sets the global resoureType object based on the contents of the resourceType multi select dropdown
********************************************************************************************************************/
function SetResourceTypesFromDropdown(){
  if(document.getElementById(docTypesForDropDown[0].checkBoxId).checked){
    ResourceTypes.activities = true;
  }
  else{
    ResourceTypes.activities = false;
  }
  if(document.getElementById(docTypesForDropDown[1].checkBoxId).checked){
    ResourceTypes.lessons = true;
  }
  else{
    ResourceTypes.lessons = false;
  }
  if(document.getElementById(docTypesForDropDown[2].checkBoxId).checked){
    ResourceTypes.curricularunits = true;
  }
  else{
    ResourceTypes.curricularunits = false;
  }
}


/*******************************************************************************************************
Function handles the logic of the resource type dropdown. Calls helper functions accordingly
*******************************************************************************************************/
function HandleResouceTypeDropdown(){
    //show or hide documents label in the graph legend
    showHideDocsLabel();

    //the previous state of the ResorceTypes dropdown (prior to click event)
    var showingDocsPrev = IsShowingDocs();

    //update the resouceTypes object to reflect click changes to dropdown and get current state of resourceTypes dropdown
    SetResourceTypesFromDropdown();
    var showingDocsCur = IsShowingDocs();

    //if we went from no item to on item or from all items to not all items, redraw the graph
    if(showingDocsCur != showingDocsPrev){
      submit(currentSelectedNode);
    }
    //Just show/hide alignment nodes as required and rebuild the alignments table to reflect which alignments are showing.
    else{
      ShowHideAlignmentsBasedOnDropdown();
      if(IsShowingDocs()){
              BuildAlignedDocumentsTable(currentSelectedNode);
      }
    }
}


/**************************************************************************************************
Takes a refennce to a DOM element and iterativly removes it from the DOM. Ised to clear the
network before redrawing.

Parameters:
  1) domRef: The DOM element to remove.
**************************************************************************************************/
function RemoveNetwork(domRef){
	var html = document.getElementById(domRef);
	while(html.firstChild){
	    html.removeChild(html.firstChild);
	}
}


/****************************************************************************************************
Sets the gradeband to its default and calls submit to build the network based on the value in the
submit textbox. This function is called as an onclick event when the submit button is clicked.
****************************************************************************************************/
function submitBtn(){

   document.getElementById("gradeBand").value = 0;
   var input = document.getElementById("sCode").value;
   var inputType = GetInputType(input);
   if(inputType == "DCI"){
     var dciList = GetDCIList(input);
      if(dciList.length == 0){
       alert("Could not find DCI")
     }
     else{
       ClearTable(document.getElementById('dciTable'));
       document.getElementById("dciTable").deleteTHead();
       DisplayDCIModal(dciList, input);
     }
   }
   else submit(input)
}

/*
ETS1.A
*/
function DisplayDCIModal(dciList, input){
   //show the modal
    $('#myModal').modal('show');

    //display the modal header
    document.getElementById("dciPopup").innerText = "Disiplinary core ideas for " + input

    //get a reference to the table in the DOM
    var tableRef = document.getElementById("dciTable").getElementsByTagName('tbody')[0];

    //insert a row for each dci in the list of options
    for(var i = 0; i < dciList.length; i++){
      var dci = dciList[i];
      var newRow = tableRef.insertRow(tableRef.rows.length);
      var rowHtml = "<tr>";
      var className = "dci_" + dci.sCode;
      rowHtml += "<td style='padding:5px' class = "+className+">" + dci.sCode.toString() +  "</td>"
      rowHtml += "<td style='padding:5px' class = "+className+" >"+ dci.gradeBand +"</td>"
      rowHtml += "<td style='padding:5px' class = "+className+">" +  dci.des +"</td>"
      rowHtml += "</tr>"
      newRow.innerHTML = rowHtml;
      newRow.addEventListener("click", function(e){
        var classNameClicked = e.target.className;
        var sCode = classNameClicked.slice(4, classNameClicked.length)
        submit(sCode);
        $('#myModal').modal('hide');
        console.log(sCode)
      });
    }
}

function foo(){
  console.log("foo called")
}

function GetDCIList(dciCategory){
   var dCiList = [];
   var count = 0;
   for(var i = 0; i < NGSSGraph.length; i++){
     var t = NGSSGraph[i].nodeType;
     if(t == "Disciplinary Core Ideas"){
         dci = NGSSGraph[i].pCode
         if(dci == dciCategory){
           var item = {sCode: NGSSGraph[i].sCode, des: NGSSGraph[i].des, gradeBand: NGSSGraph[i].gradeBand }
           dCiList[count] = item
           count++
         }
     }
   }
   return dCiList;
}


function GetInputType(imput){
  if(imput.includes(".A") || imput.includes(".B") || imput.includes(".C") || imput.includes(".D")){
    return "DCI";
  }
  else if(sCode[0] == "S"){
    return "ASN";
  }
  else return "NGSS";
}



/*********************************************************************************************************
This function is called when the sCode in the Standards table is clicked. The submit function is then called
to rebuild the nw using the clicked sCode as a root node.

Parameters:
   1) sCode: The ASN identifier of the table row that was clicked. Also represents the DOM id of the table row.
**********************************************************************************************************/
function SubmitTableClick(sCode){
  RemoveNetwork("mynetwork");
  if(document.getElementById("gradeBand").value != 0){
    document.getElementById("gradeBand").value =0;
  }
  submit(sCode);

}


/*******************************************************************************************************
Searches the global NGSSGraph object for a sCode with the given pCode and returns that sCode.

Parameters:
 1) pCode: the NGSS identifier of the Standard.
********************************************************************************************************/
function GetSCodeFromPCode(pCode){
  for(var i = 0; i < NGSSGraph.length; i++){
    if(NGSSGraph[i].pCode && NGSSGraph[i].pCode == pCode){
      return NGSSGraph[i].sCode;
    }
  }
  //Throws an exception of a node with the pCode can't be found for some reason
  throw new Error("Stanard with NGSS code " + pCode + " not found\n");
}



/*************************************************************************************
  This function will get the imput values from the form elements and than call BuildNetwork()
  to genereate the network.

  Parameters:
    1) sCode: The sCode of the root node from which we build the graph.
**************************************************************************************/
function submit(code){

  curNodeSize = 18
  var sCode = null;
  //Set the display type based of if parameter is a pCode or an sCode
  if(code != null && code.substring(0,1) == "S"){
    sCode = code;
  }
  else if(code != null){
    sCode = GetSCodeFromPCode(code);  //get the sCode that corisponds with the NGSS code
    document.getElementById("displayType").value = 2  //set the dropdown to NGSS codes option
  }
  if(document.getElementById("networkDepth").value == 0){
    document.getElementById("networkDepth").value = 2;
  }

  if(document.getElementById("displayType").value == 1 || document.getElementById("displayType").value == 0){
      NodeDisplayType = ModeEnum.ASN;
  }
  else{
      NodeDisplayType = ModeEnum.NGSS;  //set the display type to be for ASN codes
  }

  //Update the global that holds the current sCode to be the sCode just submitted
  currentSelectedNode = sCode;
  document.getElementById("sCode").value = code

  //Clear the dom for the standards table and the alignments table and the network
  ClearTable(document.getElementById('t1'));
  ClearTable(document.getElementById('t2'));
  RemoveNetwork("mynetwork");
  //Get the user specified network depth from the dropdown menu. Default to 2 if no option selected.
  var depth = document.getElementById("networkDepth").value;
  depth = (depth == 0) ? 2 : depth;

  //Get the display type from the dropdown. Either NGSS or ASN
  var displayType = document.getElementById("displayType").value;
  displayType = (displayType == 0) ? 1 : displayType;

  //Get the gradeband from the dropdown. Will override all other selections and show the entire gradeband.
  var gradeBand = document.getElementById("gradeBand").value;


  //Get the checkbox values that determine what type of alignments will be displayed.
  var showActivies = document.getElementById("item1Box").checked;
  var showLessons = document.getElementById("item2Box").checked;
  var showCurricularUnits = document.getElementById("item3Box").checked;
  var showAll = document.getElementById("item4Box").checked;

  //Set the dropdowns to display their defaults
  var nodeLabel = document.getElementById("displayType");
  var curDepth = document.getElementById("networkDepth");
  if(nodeLabel.value == 0 ){
     nodeLabel.value = 1;
  }


  //show the loading bar if showing an entire network with documents (exept for k-2 since it loads fast)
  var selectedGradeBand = document.getElementById("gradeBand").value;
  if( (showActivies || showLessons || showCurricularUnits) && selectedGradeBand > 1 ){
    ShowLoadingScreen();
  }

  //Entry point for building the network and the alignments and standards tables.
 BuildNetwork(sCode, depth, displayType, gradeBand, showActivies, showLessons, showCurricularUnits, showAll);

}


/****************************************************************************************
Takes options on how to genereate the network and calls the approprate function
based on if an entire gradeband is being searched or not.

Parameters:
  1) sCode: ASN identifier of the standard that will be at the root of the network
  2) depth: The max from the root node for which to build the network
  3) displayType: The type of node label to display (either NGSS or ASN)
  4) gradeBand: The gradeBand of the current subnetwork (formatted as lowgrade - highGrade)
  5) showActivies: a boolean that determines if aligned activities will be displayed.
  6) showLessons: a boolean that determines if aligned lessons will be displayed.
  7) showCurricularUnits: a boolean that determines if units will be displayed.
  8) showAll: a boolean that overrides the previous 3 that determines if all alignment types will be displayed.
****************************************************************************************/
function BuildNetwork(sCode, depth, displayType, gradeBand, showActivies, showLessons, showCurricularUnits, showAll){

  //If user has selected a gradeband, we search by that gradeBand and iterate up to a depth of 50 to display the entire gradeband.
  if(gradeBand != 0){
    if(gradeBand == 1) sCode = "S2454361";
    else if(gradeBand == 2) sCode = "S2454378"; //3-5 gradeband
    else if(gradeBand == 3) sCode = "S2467886"; //6-8 gradeband
    else if(gradeBand == 4) sCode = "S2467907"; //9-12 gradeband
    currentSelectedNode = sCode;
    document.getElementById("sCode").value = sCode
    BuildNetworkNSteps(sCode, 50, displayType, showActivies, showLessons, showCurricularUnits, showAll);
  }

  //if user has not selected a gradeband, we build the network up to the specified depth.
  else{
    BuildNetworkNSteps(sCode, depth, displayType, showActivies, showLessons, showCurricularUnits, showAll);
  }
    var test = document.getElementById("myItem1")

}


/*****************************************************************************************************
Takes the id of a standard and returns an array id's of neighboring standards.
*****************************************************************************************************/
function GetNeighboringStandards(id){
    var neighborNodes = [];
    var neighborIds = NGSSGraph[id].neighbors;
    for(var i = 0; i < neighborIds.length; i++){
      neighborNodes[neighborNodes.length] = NGSSGraph[neighborIds[i]]
    }
    return neighborNodes;
}


/******************************************************************************************************
Takes an vertex array of neighboring vertex objects. Addes neighbors to graph if not aleardy in graph.
Adds edge between each pair if edge does not already exist. Uses the global graph object

Parameters:
  1) neighbors: an array of ids of standards.
  2) vertex: a vertex object to add to the graph.
  3) depth: the depth from the root of the vertex being added.
*******************************************************************************************************/
function addNeighborStandards(neighbors, vertex, depth){
    for(var i = 0; i < neighbors.length; i++){
        if(!graph.hasVertex(neighbors[i])){
          neighbors[i].order = depth;
          graph.addVertex(neighbors[i]);
        }
    }
}


/*******************************************************************************************************
Addes an edge between each neighboring standard in the global graph object.
*******************************************************************************************************/
function AddStandardsEdges(){
   for(var i = 0; i < graph.numVertices; i++){ //for each vertex
      var neighbors = graph.vertices[i].neighbors; //get neighbors of vertex
      for(var j = 0; j < neighbors.length; j++){//for each neighbor
        if(graph.hasVertex(neighbors[j])){  //only add edge if node currently in graph
          if(!graph.hasEdge(neighbors[j], graph.vertices[i].id)){ //add edge if edge does not already exist in graph
            graph.addEdge(graph.vertices[i].id, neighbors[j]); //add edge from vertex to neighbor vertex
          }
        }
      }
   }
}


/**************************************************************************************************
Takes the edge list in the global graph object and zero indexes them. This is the required format
for igraph in R. Finally, we take the zero-indexed edge list and build a string parameter that
can be passed to R.
*************************************************************************************************/
function GetEdgesInRFormat(){
   edges = JSON.parse(JSON.stringify(graph.edges));
/*   for(var i = 0; i < edges.length; i++){
        console.log(edges[i].to + ", " + edges[i].from)
    }*/
/*   var nodes = JSON.parse(JSON.stringify(graph.vertices));
    for(var i = 0; i < edges.length; i++){
        var from = edges[i].from;
        var to = edges[i].to;
        for(var j = 0; j < nodes.length; j++){
      if(nodes[j].id == from){
         var v = nodes[j].rId;
            edges[i].from = nodes[j].rId;
          }
          if(nodes[j].id == to){
            edges[i].to = nodes[j].rId;
          }
        }
    }
*/

   edgesToPrint = edges;

   var rString = GetGMLData();
   return rString;
}


/*******************************************************************************************************
Returns true if an element from the documentTypes dropdown is selected. Returns false otherwise.
*******************************************************************************************************/
function ShowResourceType(){
  if(document.getElementById(docTypesForDropDown[0].checkBoxId).checked ||
     document.getElementById(docTypesForDropDown[1].checkBoxId).checked ||
     document.getElementById(docTypesForDropDown[2].checkBoxId).checked){
       return true;
     }
     return false;
}


/************************************************************************************************
Description:
    Builds the network graph object by adding the standards, adding the edges for standards, adding the nodes,
    and adding the edges for alignments. The last function makes an AJAX post which is the entry point for
    actualy drawing the network.
Parameters:
  1)  sCode: the ASN code of the root node of the network
  2) depth: the distince from the root node that we will have in the network
  3) displayType: The option for if ASN or NGSS codes will be displayed
  4) showActivies: true if activity documents will be displayed in the graph.
  5) showLessons: True if lesson documents will be displayed in the graph
  6) showCurricularUnits: True if curricularunits will be displayed in the graph
  7) showAll: True if all document types will be displayed in the graph
*************************************************************************************************/
function BuildNetworkNSteps(sCode, depth, displayType, showActivies, showLessons, showCurricularUnits, showAll){
  graph = new GraphObject(); //Allocate a new Graph object to store the current graph
  if(depth){
      AddStandarsNodes(depth, sCode);  //add all the standards to the graph up to the specified depth
  }
  else AddAllStandards();

  AddStandardsEdges();  //add vertex connections to the graph for the standards
  //Add the alignemnts only if selected from the check box
  if(ResourceTypes.activities || ResourceTypes.lessons || ResourceTypes.curricularunits){
       AddAlignmentsNodes(); //Add all alignments to the graph
       AddAlignmentEdges();  //Add edges to each alignment
  }
  var edgesRFormat = GetEdgesInRFormat(); //Format edge list as zero indexed so R can compute KK on it
  //GetGMLData(); //used to print nw data to the console in .gml format.
  GetKamadaKawaiCoords(edgesRFormat); //gets the kk layout via an AJAX post. Begins the chain of events for drawing the netork
}


function GetGMLData(){
  var gmlString = "graph[\n";
  var padding = "\t\t";
  var label = "NGSS k-2";
  gmlString += "\t"+  "label " + "\"" + label + "\"" + "\n";
  for(var i = 0; i < graph.numVertices; i++){
     var nodeString = "\tnode[\n";
     nodeString += padding + "id " +  (graph.vertices[i].id + 1).toString()  + "\n";
    /* nodeString += padding + "ASN " + "\"" + graph.vertices[i].sCode + "\"" + "\n";
     if(graph.vertices[i].nodeType == "Performance Expectation" || graph.vertices[i].nodeType == "Standard"){
        nodeString += padding + "NGSS " + "\"" +  graph.vertices[i].pCode + "\"" + "\n";
     }
     else{
       nodeString += padding + "NGSS " + "\"" +  "\"" + "\n";
     }
     nodeString += padding + "type " + "\"" +  _GetGMLDataType(graph.vertices[i].nodeType) + "\"" + "\n";
     nodeString += padding + "desc " + "\"" + "des" + "\"" + "\n";*/
     nodeString += "\t]\n"
     gmlString += nodeString;
  }

 for(var i = 0; i < graph.numAlignments; i++){
   var nodeString = "\tnode[\n";
    nodeString += padding + "id " +  (graph.alignments[i].id + 1).toString()  + "\n";
    nodeString += "\t]\n"
    gmlString += nodeString
 }


   for(var i = 0; i < edgesToPrint.length; i++){
     var edgeString = "\tedge[\n";
     edgeString += padding + "source " + (edgesToPrint[i].to + 1).toString()  + "\n";
     edgeString += padding + "target " +  (edgesToPrint[i].from + 1).toString() + "\n";
     edgeString += "\t]\n";
     gmlString += edgeString;
   }
   gmlString += "]";

  gmlString = gmlString.replace("'","");

  var res =  "GetKKCoords(" + "'" +  gmlString.toString()  + "'" +  ")";

  return res;
}


/****************************************************************************************
A helper function to GetGMLData(). Returns an abbr of the standard type string.

Parameters:
 1) nodeType: a string representing the node type.
****************************************************************************************/
function _GetGMLDataType(nodeType){
  var nodeTypeAbbr = "";
  if(nodeType == "Standard") return "Std";
  if(nodeType == "Performance Expectation") return "PE";
  if(nodeType == "Disciplinary Core Ideas") return "DCI";
  if(nodeType == "Crosscutting Concepts") return "CC";
  if(nodeType == "Science and Engineering Practices") return "SEP";
  return "error retrieving node type \n" + nodeType;
}


/****************************************************************************************************
For every standard in the globa graph object, this function adds any alignments to it.
****************************************************************************************************/
function AddAlignmentsNodes(){
  for(var i = 0; i < graph.numVertices; i++){  //for each standard
       var alignmentIds = graph.vertices[i].docNeighbors;  //get list of documnets aligned to that standard
       if(alignmentIds.length == 0) continue;  //skip if no aligned documents to add
       for(var j = 0; j < alignmentIds.length; j++){
            var curAlignmentId = alignmentIds[j];
            var curAlignment = Alignments[curAlignmentId];
            if(!graph.hasAlignment(curAlignment)){ //If alignment not in graph, add it to the graph
              graph.addAlignment(curAlignment);
            }
       }
  }
}


/****************************************************************************************************
     This function addes edges between all standards and their alignments in the global graph object.
****************************************************************************************************/
function AddAlignmentEdges(){
  for(var i = 0; i < graph.numVertices; i++){  //for every standard in the graph
    var alignmentIds = graph.vertices[i].docNeighbors;  //get all alignments for that standard
    if(alignmentIds.length == 0) continue;  //skip if no documents to add
    for(var j = 0; j < alignmentIds.length; j++){   //for every alignment, add edge if alignment in graph
         var curAlignmentId = alignmentIds[j];
         var curAlignment = Alignments[curAlignmentId].id;
         graph.addEdge(graph.vertices[i].id, curAlignment);
     }
  }
}


/****************************************************************************************************
Description:
     This function builds a root standard node, and iterates up to the given depth adding standards to
     the graph. The function makes use of the global graph object.
Parameters:
     1) depth: the depth that we iterate to from the root to build the graph
     2) sCode: the sCode of the starting standard.
****************************************************************************************************/
function AddStandarsNodes(depth, sCode){

  var curDepth = 0;

  //Get the starting node and add it to the NGSSGraph
  var root = GetStandardFromSCode(sCode);
  root.order = 0;
  graph.addVertex(root);

  //Iterate up to the specified depth. At each level, add neihboring standards and their connections to the graph
  while(curDepth < depth){
    //for each node at current depth, get its neighboring standards
    for(var i = 0; i < graph.numVertices; i++){
      if(graph.vertices[i].order != curDepth) continue; //skip over nodes that are not at the current depth.
      var neighbors = GetNeighboringStandards(graph.vertices[i].id); //array of nighboring vertex objects
      addNeighborStandards(neighbors, graph.vertices[i], curDepth + 1);
    }
    curDepth++;
  }
}


/*************************************************************************************************
Addes every standard from NGSSGraph[] that is in the current gradeband to the global graph object.
**************************************************************************************************/
function AddAllStandards(){
  var gradeBand = document.getElementById("gradeBand").value;
  if(gradeBand == 1) gradeBand = "k-2"
  else if(gradeBand == 2) gradeBand = "3-5";
  else if(gradeBand == 3) gradeBand = "6-8";
  else if(gradeBand == 4) gradeBand = "9-12";
  for(var i = 0; i < NGSSGraph.length; i++){
    if(NGSSGraph[i].gradeBand == gradeBand){
      graph.addVertex(NGSSGraph[i])
    }
  }
}


function GetNetworkOptions(options){
    options = {
    shapeProperties: {
    interpolation: false    // 'true' for intensive zooming
  }
  };
  return options;
}


function BuildNetworkStandards(kkCoords){
  var i = 0;
  for(i = 0; i < graph.numVertices; i++){
    var nodeLabel = graph.vertices[i].sCode;
    if(NodeDisplayType == ModeEnum.NGSS){
      if(graph.vertices[i].nodeType == "Standard" || graph.vertices[i].nodeType == "Performance Expectation" || graph.vertices[i].nodeType == "Disciplinary Core Ideas"){
          nodeLabel = graph.vertices[i].pCode;

      }
      else nodeLabel = "               ";
    }
    nodes.add({
      id:graph.vertices[i].id,
      title:FormatNodeDescriptionForPopup(graph.vertices[i].des),
      color:graph.vertices[i].color,
      label:nodeLabel,
      sCode:graph.vertices[i].sCode,
      font: {color:'black', size:REGULAR_NODE_SIZE},
      highlightColor:graph.vertices[i].highlightColor,
      nodeType:"Standard", //FIXME
      x: kkCoords[i].x,
      y:-kkCoords[i].y
    });
  }
}


function BuildNetworkAlignments(kkCoords){
  //Build a vertex for every document in the graph object
  for(var j = 0; j < graph.numAlignments; j++){
    nodes.add({
      id:graph.alignments[j].id,
      title:graph.alignments[j].title,
      color: graph.alignments[j].color,
      shape:'circle',
      width:.1,
      font:{size:DOC_NODE_SIZE},
      labal:" ",
      nodeType:graph.alignments[j].nodeType,
      doc:graph.alignments[j].document,
      x:kkCoords[graph.numVertices + j].x,
      y:-kkCoords[graph.numVertices + j].y,
      hidden:true
    });
  }
}


function BuildNetworkEdges(){
  for(i = 0; i < graph.numEdges; i++){
   edges.add({
      from:graph.edges[i].from,
      to:graph.edges[i].to
    });
  }
}

/*******************************************************************************************
Description: This function is the entry point for drawing the vis.js network on the canvas.
             It also calls the functions for creating the documents and standards tables.
Parameters:
  1) kkCoords: An array of kamada kawai coordinates for the network where the even
               indices represent the x-coords and the odd indices represent the y-coords
*******************************************************************************************/
 function BuildNGSSNetwork(kkCoords){

     var options = GetNetworkOptions();
     nodes = new vis.DataSet(options);
     edges = new vis.DataSet({});
     BuildNetworkStandards(kkCoords)
     BuildNetworkAlignments(kkCoords)
     BuildNetworkEdges()



 //Build an edge for edge edge in the graph's edge list.



  //The graph data for vis.js
  var data = {
    nodes: nodes,
    edges: edges
  };

  //The options for vis.js
  var options = {
        physics:false //don't want the graph to behave like jello
  };

  //Show the document nodes filtered by the resouce type dropdown list that the user selected. Default is none.
  ShowHideAlignmentsBasedOnDropdown();
  //draw the vis.js network graph
  var container = document.getElementById("mynetwork");
  var nw = new vis.Network(container, data, options)

   ImproveNetworkLayout(nw)
   HideLoadingScreen();

}


function ImproveNetworkLayout(nw){
  //Pull all PEs towards the center to give the graph a nice curved shape
/*  var moveX = 35;
  var moveY = 35;
  var resultArr = [];
  var count = 0;
  for(var i = 0; i< graph.numVertices; i++){
    if(graph.vertices[i].nodeType == "Performance Expectation"){
        var oldX = nw.body.nodes[ graph.vertices[i].id].x;
        var oldY = nw.body.nodes[ graph.vertices[i].id].y;
        if(oldX > 0) oldX = oldX - moveX
        else oldX = oldX +  moveX
        if(oldY > 0) oldY = oldY - moveY
        else oldY = oldY + moveY
        var row = {id: graph.vertices[i].id, x:oldX, y:oldY }
        resultArr[count] = row;
        count++

    }

  }
  nodes.update(resultArr)*/

   //document.getElementById(docTypesForDropDown[docTypesForDropDown.length - 1].Index);

    //Create the tables for Alignments and Standards. Also get the root node since it gets mixed up during sorting
    var tmp = CreateStandardsTable(REGULAR_NODE_SIZE, REGULAR_NODE_SIZE + 10)
    BuildAlignedDocumentsTable(tmp.sCode)

    //Highlight the starting node that was returned from CreateStandardsTable().
    HighlightNode(tmp.id, tmp.color, REGULAR_NODE_SIZE, REGULAR_NODE_SIZE + 10);

    //callback for clicking action on a node
    nw.on("click", function(properties){
        if(properties.nodes.length > 0){
          var ids = properties.nodes;
          var clickedNodes = nodes.get(ids);
          if(clickedNodes[0].nodeType != "Document"){
            if(clickedNodes[0].sCode != currentTableRow) { //only perform action if not already selected
              var id = clickedNodes[0].id;
              var nodesList = nodes.get(nodes._data);
              var sCode = clickedNodes[0].sCode;
              UnhighlightPreviousNode();
              UnHighlightDocumentNode(selectedDocNodeId);
              HighlightNode(id, clickedNodes[0].color, 8, 18);
                 document.getElementById(sCode).style.border = "4px solid" +  _GetMatchingBorderColor(clickedNodes[0].color, 0);
                 if(document.getElementById(currentTableRow)){
                   document.getElementById(currentTableRow).style.border = "none";
                 }
                  currentTableRow = sCode;
                  SetTableRowColor(document.getElementById('t1'), sCode, clickedNodes[0].color);
                  _unighlightStandardsTable();
                  _highlightStandardsTableRow(clickedNodes[0].color, sCode);
                   document.getElementById(sCode).scrollIntoView();
                  BuildAlignedDocumentsTable(sCode);
                  currentSelectedNode = sCode;
            }
          }
          else{  //node clicked on was a document
              //only clicking on an Alignment connected with the currently selected standard does anything
              if(IsAlignedToStandard(clickedNodes[0].id)){
                HighlightDocumentNode(clickedNodes[0].id);
                HighlightDocsTableCell(clickedNodes[0].doc) //handle docs table highlighting
                if(document.getElementById(clickedNodes[0].doc) && IsShowingDocs()){
                    document.getElementById(clickedNodes[0].doc).scrollIntoView();  //Scroll to the document in the documents table
                }
              }
              //Clicking on a random node will unighlight the current standard.
              else UnHighlightDocumentNode(selectedDocNodeId)
          }
        }
    });

    //Callback for doubleClick action on a node. Note: sometimes doesn't work properly. vis.js bug?
    nw.on("doubleClick", function(properties){
      if(properties.nodes.length > 0){
        var ids = properties.nodes;
        var clickedNodes = nodes.get(ids);
        sCode = clickedNodes[0].sCode;
        if(!sCode) return;
        if(document.getElementById("gradeBand").value != 0){
          document.getElementById("gradeBand").value =0;
        }
        submit(sCode);
      }
    });

    curScale = SetZoom(graph.numVertices);

    nw.moveTo({scale: curScale})
    nw.on("zoom", function(e){
      var minScale = .5;
      var maxScale = 5;
          if(e.direction == "-"){
            curScale -= .05
          }
          else{
            curScale += .05
          }
          var newScale =  curScale
          nw.moveTo({scale:newScale})
          e.scale = newScale
          scaleNw(e);
    });

}

function SetZoom(nwSize){
  var total = nwSize + graph.numAlignments
  var res = -.224 * Math.log(total) + 1.6379;
  if(graph.numAlignments > 100 && nwSize > 50) res = 1.6* res
  if(graph.numAlignments > 500 && nwSize > 50){
    res = 1.5*res
  }


  return res
}

function GetSizeIncrement(){
  return .4
}
var curScale = 1;



function scaleNw(e){

  //Set the global value curNodeSize to increment if user is zooming in and decrement if user zooming out.
  if(e.direction == "+"){
      curNodeSize -= GetSizeIncrement()
  }
  else if(e.direction == "-"){
    curNodeSize += GetSizeIncrement()
  }
  else return

  //update font size of each node based on zoom
  var nodesList = nodes.get(nodes._data);
  var resultArr = [];
  for(var i = 0; i < nodesList.length; i++){
    var row = {  id:nodesList[i].id, font:{size: curNodeSize}}
    resultArr[i] = row;

  }
  nodes.update(
    resultArr
  )
}

var curNodeSize = 18;
/**************************************************************************************************
Function toggles the display of the alignments label in the legend depending on if documents are
showing in the graph. Also adjusts the position of the legend accordinly.
**************************************************************************************************/
function showHideDocsLabel(){
  var showActivies = document.getElementById(docTypesForDropDown[0].checkBoxId).checked;
  var showLessons = document.getElementById(docTypesForDropDown[1].checkBoxId).checked;
  var showCurricularUnits = document.getElementById(docTypesForDropDown[2].checkBoxId).checked;

  var docsLabel = document.getElementById("alignedDocsLabel");
  var legend = document.getElementById("theLegend");
  if(showActivies || showLessons || showCurricularUnits){
    if(legend){
     legend.style.top = "74vh"
    }
    docsLabel.style.display = "inline";
  }
  else{
    if(legend){
     legend.style.top = "76vh"
    }
    docsLabel.style.display = "none";
  }
}


function alignLegend(){
  var legend = document.getElementById("theLegend");
  if(legend){
   legend.style.top = "76vh"
  }
}


/******************************************************************************************
Functions handles the display of alignments in the nw based on items selected from the dropwown.
A json string is build and then passed to vis.js to update the nw to show/hide alignments.
******************************************************************************************/
function ShowHideAlignmentsBasedOnDropdown(){

   //don't to anything if the graph has not been drawn yet
   if(graph == null) return;

   //Get the selections from the docTypes dropdown checkboxes
   var showActivies = document.getElementById(docTypesForDropDown[0].checkBoxId).checked;
   var showLessons = document.getElementById(docTypesForDropDown[1].checkBoxId).checked;
   var showCurricularUnits = document.getElementById(docTypesForDropDown[2].checkBoxId).checked;
   var showAll =  document.getElementById(docTypesForDropDown[3].checkBoxId).checked;

   //Build a json string in vis.js format based on the options above
   var count = 0;
   var hidden = "true"
   var dataString = "[";
   for(var i = 0; i < graph.numAlignments; i++){
     var curAlignment = graph.alignments[i];
     if(graph.alignments[i].docType == "activity" && showActivies) hidden = "false";
     else if(graph.alignments[i].docType == "lesson" && showLessons) hidden = "false";
     else if(graph.alignments[i].docType == "curricularUnit" && showCurricularUnits) hidden = "false";
     dataString =  dataString + "{";
     dataString =  dataString + '"'+ "id" + '"' + ":" +  graph.alignments[i].id.toString()  + ",";
     dataString =  dataString +'"'+ "hidden" + '"' + ":" + hidden;
     dataString =  dataString + "}"
     dataString = dataString + ","

     if(hidden == "false"){
       graph.alignments[i].showing = true;
     }
     else{
       graph.alignments[i].showing = false;
     }

     count++;
     hidden = "true";
   }
   if(!count) return;  //don't update network if there are no documents to show
   dataString = dataString.substring(0, dataString.length - 1)
   dataString = dataString + "]";

    //Update vis.js with the json string.
    var networkJson  = JSON.parse(dataString);
    nodes.update(
      networkJson
    );
}


/********************************************************************************************
Takes a node id of a vis.js node and unhighlights it.

Paremeters:
 1) id: the id of the vis.js node.
********************************************************************************************/
function UnHighlightDocumentNode(id){
  if(id != null){
    nodes.update([{
      id:id,
      color:DOCS_COLOR[0],
      font:{size:DOC_NODE_SIZE},
      label:"       "
    }])
  }
}


/*******************************************************************************************
Takes the id of an alignment and returns true if it is aligned to the currentSelectedNode.
Otherwise, returns false.

prameters:
 1) docId: the id of the alignments. Also the id of the coorisponding table row.
*******************************************************************************************/
function IsAlignedToStandard(docId){
  var ids = [];
  for(var i = 0; i < graph.numVertices; i++){
    if(graph.vertices[i].sCode == currentSelectedNode){
      ids = graph.vertices[i].docNeighbors;
      break;
    }
  }
  for(var i = 0; i < ids.length; i++){
    if(docId == Alignments[ids[i]].id) return true;
  }
  return false;
}


/***************************************************************************************
returns true if current selected standard is aligned with the given node document

Parameters:
 1) sCode: the ASN identifier of the standard.
***************************************************************************************/
function GetAlignmentsForStandard(sCode){
  var curStandard = null;
  for(var i = 0; i < graph.numVertices; i++){
    if(graph.vertices[i].sCode == sCode){
      curStandard = graph.vertices[i]
    }
  }
  var alignments = curStandard.docNeighbors;
  var als = [];
  for(var i = 0; i < alignments.length; i++){
     als[i] = Alignments[alignments[i]].id
  }
  return als;
}


/*****************************************************************************************
A generic helper function that takes an array and a value. If the array contains an element
with that value we return true. Otherwise we return false.

Parameters:
 1) arr: an array of stuff
 2) value: the value that we will search arr for.
*****************************************************************************************/
function ArrayContains(arr, value){
  for(var i = 0; i < arr.length; i++){
    if(arr[i] == value) return true;
  }
  return false;
}


/*********************************************************************************************
This function is responsible for building the alignments table on the fly. Takes an standard and
gets all documents aligned with that standard. It then builds the table in the DOM

Parameters:
 1) sCode: the ASN identifier of the stadard for which we are will build the table.
********************************************************************************************/
function BuildAlignedDocumentsTable(sCode){
    var alignmentsCount = 0;

    //get a reference to the table in the DOM and clear the previously build table if any.
    var tableRef = document.getElementById('t2');
    ClearTable(tableRef);

    //Get a list of resources aligned to the standard with the given sCode.
    myList = GetAlignmentsForStandard(sCode);

    //For every resource aligned to sCode, add a row to the table with its metadata and onclick event handler
    for(var i = 0; i < graph.numAlignments; i++){
      if(!ArrayContains(myList, graph.alignments[i].id)) continue;
      if(!graph.alignments[i].showing) continue;
      alignmentsCount++;
      var curDocId = graph.alignments[i].document;
      var newRow = tableRef.insertRow(tableRef.rows.length);
      newRow.id = curDocId;
      newRow.style.background = DOCS_COLOR[0];

      //add closure to on click callback for row click action
      newRow.onclick = (function(){
        var currentDoc = curDocId;
        var currentId = graph.alignments[i].id;
        return function(){
          HighlightDocsTableCell(currentDoc);  //highlight documents table cell when clicked
          HighlightDocumentNode(currentId);
        }
      })();

      //build the inner html for the new table row.
      var docType = graph.alignments[i].docType;
      if(docType == "curricularUnit") docType = "curricular unit";
      newRow.innerHTML =
      '<span style ="color:blue; cursor: pointer; letterSpacing:20px" onclick = GoToTEPage(\'' + graph.alignments[i].TEURI + '\')>' + graph.alignments[i].title + '</span>' + '<span>' + ' (' + docType + ') ' + '</span>'  + '<br>'
      + '<span>' + _TruncateDocDescription(graph.alignments[i].summary, graph.alignments[i].document) + '</span>'
      +'<hr style= margin:3px>'
    }
      document.getElementById("alignmentsTableHeader").innerText =  "Aligned resources" + " (" + alignmentsCount.toString() + ")";
}



/*********************************************************************************************
Takes the id of a vis.js alignment node and highlights it in the graph by making it larger.

Parameters:
 1) id: id of the alignment node in the vis.js network.
********************************************************************************************/
function HighlightDocumentNode(id){
  var nodesList = nodes.get(nodes._data);
  var edgeData = edges.get(edges._data);

  //If no node yet selected, just return to normal size
  if(selectedDocNodeId != null){
    nodes.update([{
      id:selectedDocNodeId,
      color:DOCS_COLOR[0],
      font:{size:DOC_NODE_SIZE},
      label:"       "
    }]);
  }

  //Update the node to be bigger so it appears highlighted.
  nodes.update([{
    id:id,
    color: DOCS_COLOR[1],
    font:{size:SELECTED_DOC_NODE_SIZE},
    label:"    "
  }]);
  selectedDocNodeId = id; //update the global var that holds the currently selected doc node id
}


/***********************************************************************************************
Takes the id of a row in the alignments table and highligts that row by making it a lighter color
and putting a border around it.

Parameters:
 1) docId: the id of the table row in the DOM that will get highlighed.
************************************************************************************************/
function HighlightDocsTableCell(docId){
   //unighlight table row if set
   if(document.getElementById(currentDocsTableRow)){
     document.getElementById(currentDocsTableRow).style.border = "none"
     document.getElementById(currentDocsTableRow).style.background = DOCS_COLOR[0]
   }

   //highlight the table row and add border
   if(document.getElementById(docId)){
      document.getElementById(docId).style.border = "4px solid grey";
      document.getElementById(docId).style.background = DOCS_COLOR[1];
   }

   //update the global that tracks the currently selected table row.
   currentDocsTableRow = docId;
}


/**********************************************************************************
Function takes a URL and opens the a new window in the browser and navigates to that
URL. Note: some browsers require popups to be enabled for this to work.

Parameters:
 1) url: the destination url we are navigating to
***********************************************************************************/
function GoToTEPage(url){
  var win = window.open(url, '_blank');
  win.focus();
}


/************************************************************************************************
Function takes a description string and formats it to only show the first 100 characters.
The rest of the string can be seen using a show/hide option. This function also uses a regex
to remove any html tags from the string. This should eventually get handled on the server side.

Parameters:
  1) des: the string that we are formatting.
  2) The document id which is the name of the document that gets displayed.
*************************************************************************************************/
function _TruncateDocDescription(des, id){
  if(!des)return "error"
  des = des.substring(0, des.length);
  if (des.length > 100){
    var newId = id.toString();
    des=des.replace(/<br>/gi, "\n");
   des=des.replace(/<p.*>/gi, "\n");
   des=des.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ");
   des=des.replace(/<(?:.|\s)*?>/g, "");

      return "<span 'style= display:inline'> " + des.substring(0, 100) +
      "<span style = 'display:inline' id = " + newId + '-elipsis' +">" +'...' +
      "</span>" + "</span>" + "<span id = " + newId + '-doc' +" style = 'display:none'>" + des.substring(100, des.length) +
      "<span style = 'color:blue; cursor: pointer'  id = " + newId + '-less' + ' onclick = _showLessDocDescription(\'' + newId + '\')>' +' less'+ "</span>" +
      "</span>" + '<span  onclick = "_ShowFullDocDescription(\'' + newId + '\')">  <span  style = "color:blue; cursor: pointer" id = \'' + newId + "-more" +'\' > more</span></span>';
  }
  else {
    return des + '.';
  }
}


/****************************************************************************************************
Takes a reference to a table in the DOM and removes it and all its children from the DOM.

Paremeters:
 1) tableRef: the DOM table element that will be removed.
****************************************************************************************************/
function ClearTable(tableRef){
  var rows = tableRef.rows;
    var i = rows.length;
    while (--i) {
      rows[i].parentNode.removeChild(rows[i]);
    }
}


/************************************************************************************************
Finds the matching highlight color and highlights the table row to that color

Parameters:
 1) color: the hex code for the color we are checking against
 2) rowSCode: the id of the row we will be checking the color of.
************************************************************************************************/
function _highlightStandardsTableRow(color, rowSCode){
    //highlight boder of clicked table row
   if(color == ORANGE_COLOR[0]){
        document.getElementById(rowSCode).style.border="4px solid " + ORANGE_COLOR[1];
        document.getElementById(rowSCode).style.background = ORANGE_COLOR[2];
    }
    else if(color==GREY_COLOR[0]){
        document.getElementById(rowSCode).style.border="4px solid " + GREY_COLOR[1];
          document.getElementById(rowSCode).style.background = GREY_COLOR[2];
    }
    else if(color==PURPLE_COLOR[0]){
        document.getElementById(rowSCode).style.border="4px solid " + PURPLE_COLOR[1];
        document.getElementById(rowSCode).style.background = PURPLE_COLOR[2];
    }
    else if(color==BLUE_COLOR[0]){
        document.getElementById(rowSCode).style.border="4px solid " + BLUE_COLOR[1];
          document.getElementById(rowSCode).style.background = BLUE_COLOR[2];
    }
    else if(color==GREEN_COLOR[0]){
        document.getElementById(rowSCode).style.border="4px solid " + GREEN_COLOR[1];
              document.getElementById(rowSCode).style.background = GREEN_COLOR[2];
    }
}


/****************************************************************************************************
Clears current table highlighing and adds the background color to the specified row

Parameters:
 1) tableRef: the DOM element that is the table
 2) sCode: the id of the table row we are working with
 3) color: the color to set the table row to
****************************************************************************************************/
function SetTableRowColor(tableRef, sCode, color){
	 var rows = tableRef.rows;
	 tableRow = document.getElementById(sCode);
	if(tableRow){
    		tableRow.style.backgroundColor = color;
  }
}


/***************************************************************************************************
Goes through each row in the standards table and unhighlights/unselects it.
*************************************************************************************************/
function _unighlightStandardsTable(){
  var nodesList =  nodes.get(nodes._data);
  for(var i = 0; i < nodesList.length; i++){
      //iterate through all rows in the table
      if(document.getElementById(nodesList[i].sCode + "Color")){
        var tableRowColor = document.getElementById(nodesList[i].sCode + "Color").textContent; //origonal color of row

        var curRow = document.getElementById(nodesList[i].sCode); //The current table row in the interaction
        curRow.style.background = tableRowColor;  //Set current row to unhighlighted color
      }
  }
}


/************************************************************************************************
Searches by a given color and returns the coorisponding border color as defined in the COLOR
global constants.

Parameters:
 1) color: the color to search for in the COLOR constants.
 2) the index of the COLOR arrays. Each index is a different color hue.
************************************************************************************************/
function _GetMatchingBorderColor(color, index){
  if(PURPLE_COLOR[index] == color) return PURPLE_COLOR[1];
  if(GREY_COLOR[index] == color) return GREY_COLOR[1];
  if(BLUE_COLOR[index] == color) return BLUE_COLOR[1];
  if(ORANGE_COLOR[index] == color) return ORANGE_COLOR[1];
  if(GREEN_COLOR[index] == color ) return GREEN_COLOR[1];
  return 'black';
}


/*********************************************************************************************
Will unset all selected nodes and set the specified node to ge highlighted

Parameters:
 1) id: the vis.js node id of the node to highlight
 2) origonalColor: the origonal color that the node gets set to when selected.
*********************************************************************************************/
function HighlightNode(id, origonalColor){
  var nodesList = nodes.get(nodes._data);
  var prevId = null;

  //Search the vis.js for the current selected node.
  for( var i = 0; i < nodesList.length; i++){
    if (nodesList[i].sCode == currentSelectedNode){
      prevId = nodesList[i].id
      next = nodesList[i].label
    }
  }

  //If no previously selected node, just default to regular node size.
  if(prevId != null){
    nodes.update([{
    id:prevId,
    chosen:false,
    font: {
         strokeWidth:0,
         strokeColor:"black",
         size:REGULAR_NODE_SIZE,
    }
   }]);
  }

 //update the current node to its highlighed size and color.
 nodes.update([{
	id:id,
  color:getNodeHighlightColor(origonalColor),
	font: {
		 strokeWidth:1,
		 strokeColor:  SELECTED_NODE_COLOR,
		 size:SELECTED_DOC_NODE_SIZE,
     color:SELECTED_NODE_COLOR
	}
 }]);
}


/**************************************************************************************************
Searches the vis.js network for the current selected node and unhighlights it.
***************************************************************************************************/
function UnhighlightPreviousNode(){
    var nodesList = nodes.get(nodes._data);
    for( var i = 0; i < nodesList.length; i++){
      if(nodesList[i].sCode == currentSelectedNode){
        nodes.update([{
          id:nodesList[i].id,
          color:  getNodeUnighlightColor(nodesList[i].color)
        }]);
      }
    }
}


/******************************************************************************************************
Takes a hex color code and searches the global COLOR arrays to find the coorisponding color
to that highlight color.

Parameters:
 1) color: a hex color code of a highlighted node.
*****************************************************************************************************/
function getNodeUnighlightColor(color){
  if(color == GREY_COLOR[2]) return GREY_COLOR[0];
  if(color == PURPLE_COLOR[2]) return PURPLE_COLOR[0];
  if(color == BLUE_COLOR[2]) return BLUE_COLOR[0];
  if(color == GREEN_COLOR[2]) return GREEN_COLOR[0];
  if(color == ORANGE_COLOR[2]) return ORANGE_COLOR[0];
  return 'red';
}


/*****************************************************************************************************
Takes a hex color code and searches the global COLOR arrays to find the coorisponding color
to that highlight color.

Parameters:
 1) color: a hex color code of a node.
******************************************************************************************************/
function getNodeHighlightColor(color){
  if(color == GREY_COLOR[0]) return GREY_COLOR[2];
  if(color == PURPLE_COLOR[0]) return PURPLE_COLOR[2];
  if(color == BLUE_COLOR[0]) return BLUE_COLOR[2];
  if(color == GREEN_COLOR[0]) return GREEN_COLOR[2];
  if(color == ORANGE_COLOR[0]) return ORANGE_COLOR[2];
  return 'blue';
}


/**********************************************************************************************
Builds the Standards table based on the nodes in the graph object.

Parameters:
 1) regularNodeSize: the size of a unselected node in the vis.js network display
 2) largeNodeSize: the size of a selected node in the vis.js network display
*********************************************************************************************/
function CreateStandardsTable(regularNodeSize, largeNodeSize){
  var tmp = graph.vertices[0];
  graph.sortStandards();
  document.getElementById("standardsTableHeader").innerText = "Standards (" + graph.numVertices.toString() + ")"
  var setBorder = false;
  var tableRef = document.getElementById('t1').getElementsByTagName('tbody')[0];

  //For every standard in the graph, build a network.
  for(var i = 0; i < graph.numVertices; i++){

    //If we are on the first row, we want to set it to be highlighted
    if(graph.vertices[i].sCode == graph.vertices[0].sCode){
      setBorder = true;
    }

    //Helper function that actually builds the row and formats everything.
    _InsertRowIntoStandardsTable(tableRef, graph.vertices[i].des, graph.vertices[i].sCode,
                                 graph.vertices[i].pCode, graph.vertices[i].gradeBand, graph.vertices[i].color,
                                 graph.vertices[i].highlightColor, graph.vertices[i].id, graph.vertices[i].uri,
                                 setBorder, regularNodeSize, largeNodeSize);

    //All rows after the first one will not be highlighted
    setBorder = false;
  }

  return tmp;
}


/************************************************************************************************************************************************
Helper function responsible for inserting an individual row into the standards table. Each row is given an onclick action and when a row
is clicked on, the row gets highlighed and so does the coorisponding standard in the vis.js graph.

Parameters:
 1) tableRef: the DOM element of the standards table
 2) description: The discription of the standard according to the NGSS
 3) sCode: the ASN identifier of the standard
 4) NGSSCode: the NGSS identifier of the standard: null if not a PE or a topic.
 5) gradeBand: the gradeband of the standard (lowgrade - highgrade)
 6) color: the color to make the row depending on the type of standard.
 7) highlightColor: the color to make the row when it is selected.
 8) id: the id of the coorisponding node in the raph object and the vis.js network.
 9) uri: the URI of the NGSS page the the standard will link to
 10) setBorder: a bool telling us if this node is highlighted and will have a border around it.
 11) regNodeSize: size to make the coorisponding node in the network if this row is not selected
 12) largeNodeSize: size to make the coorisponding node in the network if this row is selected.
*************************************************************************************************************************************************/
function _InsertRowIntoStandardsTable(tableRef, description, sCode, ngssCode,  gradeBand, color, highlightColor, id, uri, setBorder, regNodeSize, largeNodeSize){
     var  newRow = tableRef.insertRow(tableRef.rows.length);
     newRow.id = sCode;
     newRow.style.backgroundColor = color;
     newRow.style.borderBottom = "1px solid #A0A0A0";

    //Set this row to be highlighted and have a border
    if(sCode == currentSelectedNode ){
      currentTableRow = sCode;
      newRow.style.border = "4px solid" +  _GetMatchingBorderColor(color, 0);
      _highlightStandardsTableRow(color, sCode);
    }

    //The onclick action for the row: Highlights the row and the coorisponding node in the nw. Unighlights all other rows and nodes.
     newRow.onclick = function(){
       if(sCode == currentTableRow) return //dont perform any action if clicking on already selected row
       TableRowClickAction(sCode, color, highlightColor);
       HighlightNode(id, color, regNodeSize, largeNodeSize);
       UnhighlightPreviousNode();
       BuildAlignedDocumentsTable(sCode);
       unHighlightCurrentSelectedDocument();
       currentSelectedNode = sCode;
     }

     //Build and format the html for the table row
     var ul = "underline";
     var n = "none";
     var NGSSLink = '';
     var colorId = sCode + "Color";
     if(color == GREY_COLOR[0] || color == PURPLE_COLOR[0] || color == ORANGE_COLOR[0]){
       NGSSLink =  '<span style="margin-right:3%">|</span>' + '<span style="">'
       + '<a class = "clickableTableCell" onclick=SubmitTableClick(\'' + sCode + '\'); style = "margin-right:2%; color:blue; cursor: pointer; font-size:10pt;">' + ngssCode + '</a>'
       + '<a onmouseover= this.style.textDecoration="underline" onmouseout=this.style.textDecoration="none"  onclick=ViewNGSSPage(\'' + uri + '\') style="color:blue; cursor:pointer; hover:red">NGSS/NSTA</a>'
       + '</span>' + '<br>';
     }
     else{
       NGSSLink = '<span style="margin-right:3%">|</span>' + '<span style="display:inline; color:blue; cursor:pointer">' + "No NGSS code."  + '</span>'
     }
     newRow.innerHTML = '<div style="margin-bottom:6px">' +
        '<a class = "clickableTableCell" onclick = SubmitTableClick(\'' + sCode + '\') style = "margin-right:2%; float:left; color:blue; cursor: pointer; font-size:10pt">' + sCode + '</a>'

        + '<a href=http://asn.jesandco.org/resources/'+sCode+' target="_blank" style="color:blue;margin-right:3% ">ASN</a>'
        +'<span style="">'
        + NGSSLink + FormatStdDescription(description, sCode, gradeBand) + ' </span>'
        + '<span id = '+colorId+' style = "display:none">' + color + '</span>'; //hidden field so each table row remembers its origonal color when highlighted
       +"</div>"
}


/**********************************************************************************************************
Takes the uri of a page on the NGSS website and builds the complete URL. Then opens a new window and
navigates to that page. Opens new tab to load the page. Note: some browsers require popups to be enables
in order for this to work.

Parameters:
 1) uri: the URI to the page we will navigate to.
********************************************************************************************************/
function ViewNGSSPage(uri){
/*  var url = "https://www.nextgenscience.org/" + uri;*/
  var win = window.open(uri, '_blank');
  win.focus();

}


/***********************************************************************************************************
takes the current selected alignment (id any) and updates the vis.js network to set an alignments node
to its regular size, thus unhighlighting it.
**********************************************************************************************************/
function unHighlightCurrentSelectedDocument(){
  if(selectedDocNodeId){
    nodes.update([{
    id:selectedDocNodeId,
    color:DOCS_COLOR[0],
    font:{size:DOC_NODE_SIZE},
    label:"    "
    }]);
  }
}


/***********************************************************************************************************
Handles the onclick action fired when user clicks on a row in the Standards table. Table row will get
highlighed and all other rows will be unhighlighted.

Parameters:
 1) rowSCode: the sCode of the row that was clicked on.
 2) color: the color to make the table row when it is deselected
 3) highlightColor: the color to make the table row when it is selected.
**********************************************************************************************************/
function TableRowClickAction(rowSCode, color, highlightColor){
  if(!document.getElementById(rowSCode)) return; //user clicked on sCode link but not on table cell
  //unhighlight prev selected table cell if any
  if(document.getElementById(currentTableRow)){
    var curRow = document.getElementById(currentTableRow);
    curRow.style.border= "none";
    curRow.style.borderBottom = "1px solid #A0A0A0"
    curRow.style.borderTop = "1px solid #A0A0A0"
  }
	//Highligh the appropreate row with its color
	SetTableRowColor(document.getElementById('t1'), rowSCode, color)
  _unighlightStandardsTable();
  document.getElementById(rowSCode).style.border="4px solid " + _GetMatchingBorderColor(color, 0);
  document.getElementById(rowSCode).style.background = highlightColor;

  currentTableRow = rowSCode;
}


/*********************************************************************************************
Takes a string representation of an edge list matrix, and makes a AJAX post request to the server
to get the kamada kawai coord for the network. Then, the function for actually building the
vis.js nw is called.

Parameters:
 1) edgesRFormat: a string representation of the nw edge list that is used as the input for the
    R server function.
*********************************************************************************************/
function GetKamadaKawaiCoords(edgesRFormat){
  var params = "edgeList=" + edgesRFormat;
  var uri = "getKKCoordsAPI.php";
  var req = new XMLHttpRequest();
  var kkCoords2D = null;
  req.open("POST", uri, true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onload = function(){
     if(req.status == 200){

       var kkCoords = JSON.parse(req.responseText);

        kkCoords2D = FormatKamadaKawaiCoords(kkCoords);
       BuildNGSSNetwork(kkCoords2D);  //Build the vis.js nw using the graph object and the kk coords.
     }
     else{
       console.log("Failure Getting KK coordinates");
     }
  }
  req.send(params);
}


/***************************************************************************************
Foramts the kkCoordsArr as an adge list array to make things easy since R returns the result
as a 1d array which is awkward to work with. returns the array as an list of edges.

Parameters:
 1) kkCoordsArr: An array where odd indeces are x-coords and even indeces are y-coords.
**************************************************************************************/
function FormatKamadaKawaiCoords(kkCoordsArr){
  var kkCoords2D = [];
  var mid = kkCoordsArr.length/2;
  for(var i = 0;  i< mid; i++){
    var edge = {x:kkCoordsArr[i], y:kkCoordsArr[i + mid]};
    kkCoords2D[i] = edge;
  }
  return kkCoords2D;
}


/*****************************************************************************************
Takes an sCode and returns the node in the NGSSGraph object with that sCode.

Parameters:
 1) sCode: the ASN identifier if the standard we search for in the NGSSGraph object.
****************************************************************************************/
function GetStandardFromSCode(sCode){
    for(var i = 0 ; i < NGSSGraph.length; i++){
      if(NGSSGraph[i].sCode == sCode){
        return NGSSGraph[i];
      }
    }
    return "Error: S-Code not in graph";
}


function HideLoadingScreen(){
  var loader = document.getElementById("loader");
  var loadingPage = document.getElementById("loadingPage");
  loader.style.display = "none";
  loadingPage.style.display = "none";
  document.getElementById("dropdownToggle").style.backgroundColor = "white" //change the custom dropdown since it's color was set manually
}


function ShowLoadingScreen(){
    document.getElementById("dropdownToggle").style.backgroundColor = "grey"//change the custom dropdown since it's color was set manually
  var loader = document.getElementById("loader");
  var loadingPage = document.getElementById("loadingPage");
  loader.style.display = "block";
  loadingPage.style.display = "block";


}

/*********************************************************************************************
Makes a post request to "getNetworkDataAPI.php" and returns the response from the server. This
response is stored as the global value NGSSGraph. This holds all the netowrk data needed for
drawing different parts of the NGSS network.
**********************************************************************************************/
function GetNetworkDataAJAX(){
   var req = new XMLHttpRequest();
   var uri = "getNetworkDataAPI.php";
   req.open("POST", uri, true);
   req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
   req.onload = function(){
           if(req.status == 200){

               var result = JSON.parse(req.responseText);
               NGSSGraph = result[0];
               Alignments = result[1];
              setTimeout(function(){
               HideLoadingScreen();
               submit("S2467886")
             }, 200);

           }
           else {
             console.log("Error posting to server")
             console.log(req.status);
           }
   }
   req.send(null)
}


 //tracks if the alignments dropdown is open. Initialize to not showing.
var isShowing = false;

/************************************************************************************
Initializes the resourceType drowpdown, including all onclick event handlers and the
logic for how the dropdown handles items being selected.
*************************************************************************************/
function initDropdown(){

   //initialize all checkboxes to unchecked since some browsers will check them on page refresh
   for(var i = 0; i < docTypesForDropDown.length; i++){
     document.getElementById(docTypesForDropDown[i].checkBoxId).checked = false;
   }
      //make sure cursor is set to default when user hovers over dropdown
      document.getElementById("alignments").addEventListener("mouseover", (e) =>{
      document.getElementById(e.target.id).style.cursor = "default"
    });


  var displayType = "";
    document.getElementById("alignments").addEventListener("click", function(){

      //if dropdown options  is not currently being displayed
      if(!isShowing){
        //disable network when dropdown showing and set dropdown options to showing
        isShowing = true;
        document.getElementById("mynetwork").style.pointerEvents = "none"
        displayType = "block"
      }

      //if dropdown options are being shown
      else{
        //hide set dropdown options to not showing
         isShowing = false;
         displayType = "none"
         document.getElementById("mynetwork").pointerEvents = "auto"
      }

      //show or hide the items in the dropdown based on the previously set dropdown options.
      for(var i = 0; i < docTypesForDropDown.length; i++){
        document.getElementById( docTypesForDropDown[i].labelId).style.display = displayType //enable network when dropdown not showing
      }
    });

    //Onclick handler for when user clicks anywhere on the page outside of the dropdown.
    document.addEventListener("click", function(event){
      if(isShowing){
        if(event.target.id != null && event.target.className != "customDropdown"){
            document.getElementById("mynetwork").style.pointerEvents = "auto"
          displayType = "none";
          isShowing = false;
          for(var i = 0; i < docTypesForDropDown.length; i++){
            document.getElementById( docTypesForDropDown[i].labelId).style.display = displayType //enable network when dropdown not showing
          }
        }
      }
    });

    //event listener for the show all option in the alignments dropdown
    var showAllChecked = document.getElementById(docTypesForDropDown[docTypesForDropDown.length - 1].checkBoxId);
    showAllChecked.addEventListener("click", function(){
      var isChecked = showAllChecked.checked;
      var showAll = false;
      if(isChecked){
        showAll = true;
      }
      for(var i = 0; i < docTypesForDropDown.length; i++){
        document.getElementById(docTypesForDropDown[i].checkBoxId).checked = showAll
      }
    });

  //onclick event for each item. If all is selected, all boxes are checked. If all is deselected, all boxes are also deselected.
  for(var i = 0; i < docTypesForDropDown.length; i++){
    //Add closure to this loop.
    (function(i){
        document.getElementById(docTypesForDropDown[i].checkBoxId).addEventListener("click", function(){
          if(i  == docTypesForDropDown.length - 1){

          }
          else{
            if(areAllSelected()){

                document.getElementById(docTypesForDropDown[docTypesForDropDown.length - 1].checkBoxId).checked = true

            }
            else if(areAllNotSelected()){
                document.getElementById(docTypesForDropDown[docTypesForDropDown.length - 1].checkBoxId).checked = false
            }

          }
       },true)
    })(i);
  }
}


/******************************************************************************************
returns true if activies, lessons and curricular units are all not selected. Returns false
otherwise.
*****************************************************************************************/
function areAllNotSelected(){
    for(var i = 0; i < docTypesForDropDown.length - 1; i++){  //every item in  dropdown except for last item
      if(!document.getElementById(docTypesForDropDown[i].checkBoxId).checked){
        return true;
      }
    }
    return false;
}


/******************************************************************************************
returns true if activies, lessons and curricular units are all selected Returns false
otherwise.
*****************************************************************************************/
//returns true if activies, lessons and curricular units are all selected
function areAllSelected(){
    for(var i = 0; i < docTypesForDropDown.length - 1; i++){  //every item in  dropdown except for last item
      if(!document.getElementById(docTypesForDropDown[i].checkBoxId).checked){
        return false;
      }
    }
    return true;
}


/***********************************************************************************************
returns true if the docType parameter is also selected in the Alignments dropdown list.

Paremeters:
1) docType: the type of document we are filtering by (topic, Performance Expectation, etc.)
************************************************************************************************/
function FilterDocType(docType){
  for(var i = 0; i < docTypesForDropDown.length - 1; i++){
    if(docType == docTypesForDropDown[i].docType && document.getElementById(docTypesForDropDown[i].checkBoxId).checked ){
      return true;
    }
  }
  return false;
}


/***************************************************************************************************
Returns the array holding the alignments dropdown item ids and document types.
Array is built from the global array "DOC_TYPES" and used to quickly loop through the resouceTypes
***************************************************************************************************/
function getDropDownTypesArray(){
  var docTypesArr = [];
  for(var i = 0; i < DOC_TYPES.length; i ++){
    docForDropDown = new Object();
    docForDropDown.docType = DOC_TYPES[i]
    docForDropDown.labelId = "item" + (i + 1).toString();
    docForDropDown.checkBoxId = "item" + (i + 1).toString() + "Box";
    docTypesArr[i] = docForDropDown
  }
  return docTypesArr;
}


/****************************************************************************************************
Formats the title of the node that shows when hovering over the node. We want to limit the width
of the popup by using line breaks in the text.

Parameters:
  1) des: string that we are formatting.
***************************************************************************************************/
function FormatNodeDescriptionForPopup(des){

  var curPos = 0;
  var lineCount = 0;
  var resultHTML = '<div style = "font-size:10pt">';

// loop through the string and after evert 40 characters, look for the end of a word and add a line break.
  while(curPos != des.length){
    var curChar = des.substring(curPos, curPos + 1);
    if(lineCount >= 40 && curChar == ' '){
      resultHTML += '<br>'
      lineCount= 0
    }
    else{
        resultHTML += curChar;
    }
    curPos++;
    lineCount++;
  }
  resultHTML += '</div>'
  return resultHTML

}


/****************************************************************************************************************
Replaces the html of description to have a show hide feature if description is less than STD_DESCRIPTION_LENGTH
Uses to only show part of a standards description in the standards table. We also have a more/less option to toggle
the entire description

Parameters:
 1) des: the description that gets formatted.
 2) sCode: the identifier of the standard in the table row
 3) gradeBand: the grade band of the standard in the row (formatted as lowgrade-highgrade)
*****************************************************************************************************************/
function FormatStdDescription(des, sCode, gradeBand){
  if(des == null) var des = "error";
  var resultHTML = '<div style=line-height:' + STD_LINE_HEIGHT + ' >';
  if(des.length < STD_DESCRIPTION_LENGTH){
    resultHTML +=  '('+gradeBand+')  ' + des;
  }

  //If long discription and need to have a show hide feature
  else{
    var firstChunk = '('+gradeBand+')  ' + des.substring(0, STD_DESCRIPTION_LENGTH);
    var secondChunk = des.substring(STD_DESCRIPTION_LENGTH);
    resultHTML += firstChunk;
    resultHTML += '<span id = elipsis_' + sCode +'>...</span>'
    resultHTML += '<span style ="color:blue;cursor: pointer" id = more_'+ sCode +' onclick = showFullStdDescription(\'' + sCode + '\')> more </span>'
    resultHTML += '<span style="display:none" id = secondChunk_'+sCode+'>' + secondChunk + '</span>'
    resultHTML += '<span style = "display:none; color:blue;cursor: pointer" id = less_'+sCode+' onclick = showLessStdDescription(\'' + sCode + '\')> less</span>'
  }
  resultHTML += '</div>'
  return resultHTML
}


/**************************************************************************************************************
Used to show the full description in the documents table when the user clickes "more"

Parameters:
 1) id: the identifier of the table row for which to show the full doc description
**************************************************************************************************************/
function _ShowFullDocDescription(id){
  var doc = document.getElementById(id + "-doc");
  doc.style.display = "inline"
  var e = document.getElementById(id + "-elipsis");
  e.style.display = "none";
  var e = document.getElementById(id + "-less");
  e.style.display = "inline";
  var m = document.getElementById(id + "-more");
  m.style.display = "none";
}


/**************************************************************************************************************
Used to hide the full description in the documents table when the user clickes "less"

Parameters:
 1) id: the identifier of the table row for which to show the hide doc description
**************************************************************************************************************/
function _showLessDocDescription(id){
     var doc = document.getElementById(id + "-doc");
     doc.style.display = "none";
     var e = document.getElementById(id + "-elipsis");
     e.style.display = "inline";
     var m = document.getElementById(id + "-more");
     m.style.display = "inline";
}


/***********************************************************************************************************************
A graph class that is used to represend a subset of the NGSS as a network. An instance of this class called "graph" is
created when the user builds generates the network. The "graph" object is used to then build the vis.js network quickly
***********************************************************************************************************************/
class GraphObject{
  constructor(){
    this.graphHashMap = {};//Hash map of all nodes in the graph by id
    this.vertices = [];   //Array of nodes as they are added to the graph
    this.curDepth = 0;    //the current distance from the root node. We add nodes from curDepth to depth
    this.numVertices = 0; //the total number of ngss vertices in the graph.
    this.edges = [];     //List of edges in the graph
    this.edgesHashMap = {}; //hash map of edges to track if an edge is currently in the graph.
    this.numEdges = 0;      //the total number of edges in the graph
    this.kamadaKawaiCoords = [];  //array of x-y kk coord for each vertex in the graph.
    this.alignments = [];         //array of alignment vertices
    this.numAlignments = 0;       //total number of alignments in the graph
    this.alignmentsHash = {};    //Hash map of the alignmenst in the graph so we can quickly check if an alignment is in the graph.
    this.numNodes = 0;          //Total node count = numStandards + numAlignments
  }

  //Prints the verices in the graph to the console.
  printVertices(){
    for(var i = 0; i < this.numVertices; i++){
      console.log(this.vertices[i].sCode)
    }
  }

  //Added a vertex to the graph object. Throws an exception if vertex already in graph.
  //Make sure to first call hasVertex() to make sure vertex not already in graph.
  addVertex(v){
    var id = v;
    if(v.id) id = v.id
    if(this.graphHashMap[id]){
      throw new Error("A vertex with this id already exists");
    }
    else{
      v.rId = this.numVertices;
      this.vertices[this.vertices.length] = v;
      this.graphHashMap[id] = id;
      this.numVertices++;
      this.numNodes++;
    }
  }

  //Adds an alignment vertex to the graph.
  addAlignment(a){
    if(this.alignmentsHash[a.id]){
      throw new Error("An alignment with this id already exists");
    }
     this.alignments[this.numAlignments] = a;
     this.alignments[this.numAlignments].showing =  false;
     this.numAlignments++;
     this.alignmentsHash[a.id] = a.id;
     a.rId = this.numNodes;
     this.numNodes++;
  }

  //Takes a vertex object and returns true if alignment is in the graph already. Returns false otherwise
  hasAlignment(a){
    if(this.alignmentsHash[a.id]){
      return true;
    }
    return false;
  }

  //Takes a vertex id or a vertex object. Returns true if vertex is in the graph.
  hasVertex(v){
    var id = v;
    if(v.id){
      id = v.id
    }
    if(this.graphHashMap[id]){
      return true;
    }
    return false;
  }

  //returns true if an edge exists between the given verteces with ids "to" and "from"
  hasEdge(to, from){
    if(this.edgesHashMap[to.toString() + "," + from.toString()] || this.edgesHashMap[from.toString() + "," + to.toString()]){
      return true;
    }
    return false;
  }

  //Adds an edge from two vertices with ids "to" and "from". Throws an exeption if edge already exists in graph.
  //Must make sure that both source and target vertex are in the graph before calling this function.
  addEdge(to, from){
     if(this.edgesHashMap[to.toString() + "," + from.toString()] || this.edgesHashMap[from.toString() + "," + to.toString()]){
        throw "Edge already exists in graph";
     }
     else{
       var edge = {};
       edge.to = to;
       edge.from = from;
       this.edges[this.numEdges] = edge;
       this.edgesHashMap[to.toString() + "," + from.toString()] = to.toString() + "," + from.toString();
       this.numEdges++;
     }
  }


  //Sorts the standards in the graph by their type
  sortStandards(){
      //Assign numverical values to the standards ranking them by node type.
      for (var i = 0; i < this.numVertices; i++) {
          if(this.vertices[i].nodeType == "Standard"){
            this.vertices[i].order = 1;
          }
          else if(this.vertices[i].nodeType == "Performance Expectation"){
            this.vertices[i].order = 2;
          }
          else if(this.vertices[i].nodeType == "Disciplinary Core Ideas"){
            this.vertices[i].order = 3;
          }
          else if(this.vertices[i].nodeType == "Science and Engineering Practices"){
            this.vertices[i].order = 4;
          }
          else if(this.vertices[i].nodeType == "Crosscutting Concepts"){
            this.vertices[i].order = 5;
          }
      }

    //perform insertion sort on the standards, sorting on order which was computed above
    for (var i = 0; i < this.numVertices; i++) {
      let value = this.vertices[i]
      for (var j = i - 1; j > -1 && this.vertices[j].order > value.order; j--) {
        this.vertices[j + 1] = this.vertices[j]
      }
      this.vertices[j + 1] = value
    }
  }
}
