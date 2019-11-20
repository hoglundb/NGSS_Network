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
const SELECTED_NODE_COLOR = '#3F3D3D';
const BLANK_NODE_LABEL = "          ";

//node and standards table colors. First entry is regular color, second value is matching border highlight color, third is highlight node color
const PURPLE_COLOR = ["#EFB2F2", "#EA39F0", "#FEE2FF", "#F2CFF3" ];
const GREY_COLOR = ['#D4D4D4',"#808080", "#EFEFEF"];
const BLUE_COLOR =   ["#9FBDE4", "#2B7BE4", "#C2DAF9", "#C2D0E4"];
const ORANGE_COLOR = ["#FBC08C","#F67401","#FFE4CB", "#FBCFAB"];
const GREEN_COLOR =  ["#CDE49F", "#85C702","#E8F3D6", "#D8E4C2"];

const COLOR_INDEX = 2;

const DEFAULT_STANDARD = "S2467886";

var RESOURCE_TYPES_CHECKBOXES = ["TE"];
var RESOURCE_TYPES_NAMES = ["TeachEngineering"];

RESOURCE_TYPES_NAMES.sort().reverse();


//Globals to keep track of which color and symbol go with which resource.
var resourceColors = [];
resourceColors[0] = {color:"#F3C300", highlightColor:"#FFDF63"} //brown
resourceColors[1] = {color:"#A1CAF1", highlightColor:"#C9E4FF"} //cyan
resourceColors[2] = {color:"#F38400", highlightColor:"#F6B764"} //orange
resourceColors[3] = {color:"#C1A784", highlightColor:"#CDB99E"} //purple pink
resourceColors[4] = {color:"#79A99E", highlightColor:"#9FC6BD"}//grey
resourceColors[5] = {color:"#FF6BA1", highlightColor:"#FFA4C5"} //light greeen
resourceColors[6] = {color:"#9ACD32", highlightColor:"#BAE85F"} //olive
resourceColors[7] = {color:"#E295E0", highlightColor:"#F5C6F3"} //cyan
resourceColors[8] = {color:"#C0C0C0", highlightColor:"#DEDEDE"} //orange



var resourceShapes = ["circle", "diamond", "square","triangle", "triangleDown", "star"];
var RESOURCE_SHAPE_SIZE = 15;
var RESOURCE_SHAPE_HIGHLIGHT_SIZE = 20;

var resourceSymbols = [];

var count = 0;
for(var i = 0; i < resourceColors.length; i++){
  for(var j = 0; j < resourceShapes.length; j++){
     resourceSymbols[count] = {color:resourceColors[i].color, highlightColor:resourceColors[i].highlightColor, shape:resourceShapes[j], size:RESOURCE_SHAPE_SIZE}
     count++;
  }
}


//Data structure to track the alignments dropdown list items and their node id'ss
const DOC_TYPES = ["activity", "lesson", "curricularUnit"]

//global variables for the network
var docTypesForDropDown = getDropDownTypesArray();
var NGSSGraph = null;
var NGSSResources = null;
var NGSSResourcesList = ["TE"];
var standardsCount = 0;
var ADD_DOCS = true;
var graph = null;
var currentTableRow = "";
var currentSelectedNode = null;
var currentDocsTableRow = null;
var currentDocsTableRowColor = null;
var currentDocsTableRowType = null;  //tracks the type of document selected in the alignments table
var selectedDocNode = null;
var edgesToPrint = null;
var FirstLoad = true;
var CurNetworkDepth = 2;
var hashChange = false;

//The options for viewing the network. Either we are viewing the ASN or the NGSS
var ModeEnum = {
  NGSS: 1,
  ASN:2
};

var NetworkModes = {
   GRADEBAND: 1,
   CATEGORY: 2
};

var CurrentNetworkMode = NetworkModes.GRADEBAND;


//The options for the types of alignments
var ResourceTypes = {
    activities:false,
    lessons:false,
    curricularunits:false
}

//Traks the display type as defined in ModeEnum{}
var NodeDisplayType;

function LoadPageStateToLocalMemory(index){
    index = index.toString() + "_";
    var curNetworkDepth = document.getElementById("networkDepth").value;
    var curDisplayType = document.getElementById("displayType").value;
    var curGradeband = document.getElementById("gradeBand").value;
    var curScode = (currentSelectedNode == null) ? DEFAULT_STANDARD : currentSelectedNode;

    var providerDropdownState = GetResourceTypeSelectionFromDropdown();


    localStorage.setItem(index + "networkDepth", curNetworkDepth);
    localStorage.setItem(index + "displayType", curDisplayType);
    localStorage.setItem(index + "gradeband", curGradeband);
      localStorage.setItem(index + "sCode", curScode);


    localStorage.setItem(index + "showActivies", providerDropdownState.activities);
    localStorage.setItem(index + "showLessons", providerDropdownState.lessons);
    localStorage.setItem(index + "showUnits", providerDropdownState.curricularUnits);

    for(var i = 0; i < providerDropdownState.otherResources.length; i++){
        localStorage.setItem(index + providerDropdownState.otherResources[i].item, providerDropdownState.otherResources[i].show);
    }

    localStorage.setItem(index + "networkMode", CurrentNetworkMode);
    localStorage.setItem(index+"Category3D", document.getElementById("Category3D").value);
    localStorage.setItem(index + "CategoryStandardsList", document.getElementById("CategoryStandardsList").value);
}


function LoadPageFromLocalMemoryState(){
    var index = location.hash;
    index = index.substring(1, index.length);
    index = parseInt(index, 10);
    index += "_";

    var node = localStorage.getItem(index + "networkMode");
    var category = localStorage.getItem(index + "Category3D");

    var networkDepth = localStorage.getItem(index + "networkDepth");
    var displayType = localStorage.getItem(index + "displayType");
    var gradeBand = localStorage.getItem(index + "gradeband");
    var sCode = localStorage.getItem(index + "sCode").toString();

    document.getElementById("networkDepth").value = parseInt(networkDepth, 10);
    document.getElementById("displayType").value = parseInt(displayType, 10);
    document.getElementById("gradeBand").value = parseInt(gradeBand, 10);
    document.getElementById("sCode").value = sCode;

    for(var i = 0; i < NGSSResourcesList.length; i++){
      var id = NGSSResourcesList[i] + "_Checkbox";
      var isChecked = localStorage.getItem(index + NGSSResourcesList[i]);
      if(isChecked == "true"){
          document.getElementById(id).checked = true;
      }
      else{
          document.getElementById(id).checked = false;
      }
    }

    var showActivies = localStorage.getItem(index + "showActivies");
    var showLessons = localStorage.getItem(index + "showLessons");
    var showUnits = localStorage.getItem(index + "showUnits");

    if(showUnits == "true"){
       document.getElementById("item3Box").checked = true;
    }
    else{
       document.getElementById("item3Box").checked = false;
    }

    if(showActivies == "true"){
          document.getElementById("item1Box").checked = true;
    }
    else{
       document.getElementById("item1Box").checked = false;
    }

    if(showLessons == "true"){
       document.getElementById("item2Box").checked = true;
    }
    else{
        document.getElementById("item2Box").checked = false;
    }

    if(showUnits == "true" && showLessons == "true" && showActivies == "true"){
      document.getElementById("TECheckBox").checked = true;
    }
    else{
        document.getElementById("TECheckBox").checked = false;
    }

    //set the category type dropdown based on the memory state
    document.getElementById("Category3D").value = localStorage.getItem(index + "Category3D")
    CurrentNetworkMode = localStorage.getItem(index + "networkMode");
    Category = localStorage.getItem(index + "CategoryStandardsList");
    Build3DCategoryDropdown(Category)
    document.getElementById("CategoryStandardsList").value = localStorage.getItem(index + "CategoryStandardsList");
    submit(sCode, false);
}

//increment hash without calling submit(). This will distinguish between manual hash change and browser back/forward buttons
function IncrementHash(){
  hashChange = false;
  var hash = location.hash;
  hash = hash.substring(1, hash.length)
  var curHash = parseInt(hash, 10);
  location.hash = curHash+ 1;
  LoadPageStateToLocalMemory(curHash + 1);
}

window.onhashchange = function(){
  if(hashChange){
    LoadPageFromLocalMemoryState();
  }
  hashChange = true;
}


function SubmitFromHash(){

   //Clear the dom for the standards table and the alignments table and the network
   ClearTable(document.getElementById('t1'));
   ClearTable(document.getElementById('t2'));
   RemoveNetwork("mynetwork");

   var hashStr = location.hash;
   params = _ParseHash(hashStr);

   var showAllTEDocs = false;
   if(params["showTE"]["showActivies"] && params["showTE"]["showLessons"] && params["showTE"]["showCurricularUnits"])
   showAllTEDocs = true;

   var r = {};
   r.activities =   params["showTE"]["showActivies"];
   r.lessons = params["showTE"]["showLessons"];
   r.curricularUnits = params["showTE"]["showCurricularUnits"];
   r.allTEDocs = params["allTEDocs"]


   otherResources = [];
   for(var i = 0; i < RESOURCE_TYPES_CHECKBOXES.length - 1; i++){
     var n = {}
     n.item = RESOURCE_TYPES_NAMES[i + 1];
     n.show =  params["other"][i];
     otherResources[i] = n;
   }

    r.otherResources = otherResources;
    var sCode = params["sCode"];
    var gradeBand = params["gradeBand"];
    var displayType = params["displayType"];
    var networkDepth = params["networkDepth"];
    if(gradeBand != 0) networkDepth = 50;

    BuildNetwork(sCode, networkDepth, displayType, gradeBand, r);
}

function _ParseHash(hashStr){

  //get the sCode from the hash string
  var i = 1;
  var sCodeLen = 8;
  var sCode = "";
  for(i; i <= sCodeLen; i++){
     sCode += hashStr[i];
  }

  var gradeBand = "none";
  var displayType = "none";
  var networkDepth = "none";
  var showTE = {};
  var showAll = false;
  var other = [];


  for(var i = 0; i < hashStr.toString().length; i++){
   if(hashStr[i] == "g"){
     gradeBand = hashStr[i + 1].toString();
   }
   else if(hashStr[i] == "l"){
     displayType = hashStr[i + 1].toString();
   }
   else if(hashStr[i] == "d"){
     networkDepth = hashStr[i + 1].toString();
   }

   else if(hashStr[i] == "t"){
     showTE["showActivies"] = (hashStr[i + 1] == 0) ? false : true;
     showTE["showLessons"] = (hashStr[i + 2] == 0) ? false : true;
     showTE["showCurricularUnits"] = (hashStr[i + 3] == 0) ? false : true;

     if(showTE["showActivies"] && showTE["showLessons"] && showTE["showCurricularUnits"]) showAll = true;

   }

   else if(hashStr[i] == "o"){
       for(var j = 1; j < 3 ; j++){
         other[j - 1] = (hashStr[i + j] == 0) ? false : true;
       }
   }
 }

  var resultArr = {};
  resultArr["sCode"] = sCode;
  resultArr["gradeBand"] = gradeBand;
  resultArr["displayType"] = displayType;
  resultArr["networkDepth"] = networkDepth;
  resultArr["showTE"] = showTE;
  resultArr["other"] = other;
  resultArr["allTEDocs"] = showAll;

  return resultArr;
}


/*function ShowCreditsPopup(){
  new Noty({
    type: 'success',
    layout: 'top',
    text: 'This Network was rendered using the <a href="https://visjs.org/" target="_blank">Vis.js<a> Library. </ br>'
           + 'The Kamada-Kawai layout was generated using the R  <a href="https://igraph.org/r/" target="_blank">igraph</a> Library.',
    timeout: '3000',
    killer:true
  }).show();

}*/

//Initization function
window.onload = function onLoad(){
     localStorage = null;
    //load the data for the 3d category option
    GetCategoryList("ccc.php", 1, true);
    GetCategoryList("dci.php", 2, false);
    GetCategoryList("sep.php", 3, false);


   ShowLoadingScreen();

  //Load the nw data via a post request to getNetworkDataAPI.php
   GetNetworkDataAJAX();

  hashChange = false;
  location.hash = 1;

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
  document.getElementById("sCode").value = DEFAULT_STANDARD;

  //Bind the "resouce type" dropdown to its action functions
  initDropdown();

  InitLegend();

  //event listender for the type of resources dropdown.
  document.getElementById("dropdownToggle").addEventListener("click", function(e){

        if(graph == null){
          SetResourceTypesFromDropdown()
          return;
        }
        HandleResouceTypeDropdown();
  });


   document.getElementById("Category3D").addEventListener("change", function (e){
        //set the global network mode based on the dropdown change state
        if(e.target.value == "None"){
          CurrentNetworkMode = NetworkModes.GRADEBAND;
        }
        else{
          CurrentNetworkMode = NetworkModes.CATEGORY;
        }
         Build3DCategoryDropdown(e.target.value);

/*
         IncrementHash();*/
   });

  //event listener for the display type dropdown
  document.getElementById("displayType").addEventListener("change", function(){
    //options 0 and 1 are ASN
    if(this.value == 0 || this.value == 1){
      NodeDisplayType = ModeEnum.ASN;
    }
    //option 2 is NGSS
    else{
      NodeDisplayType = ModeEnum.NGSS
    }

     //toggle network label depending on if network mode is gradeband or 3d
     if(CurrentNetworkMode == NetworkModes.GRADEBAND){
            ToggleNetworkLables();
     }

     else {
       ToggleNetworkLables3D();
     }
     IncrementHash();

     //update the hash but don't submit
/*     hashChange = false;
     location.hash = SetHashFromPageState();*/

     //update hash if item in displayType dropdown changed
  });

  //event listener for the network depth dropdown
  document.getElementById("networkDepth").addEventListener("change", function(e){
    if(graph != null && currentSelectedNode != null){
      document.getElementById("gradeBand").value = 0;
      CurNetworkDepth = e.target.value;

      //submit depending on the nw type showing
      if(document.getElementById("Category3D").value == "None"){
          submit(currentSelectedNode, true);
      }
      else{
        console.log("about to load the data 1")
        LoadNetworkData()
      }
    }
  });

  //event listener for the gradeband dropdown
  document.getElementById("gradeBand").addEventListener("change",  function(){
  /*   hashChange = false;
     location.hash = SetHashFromPageState();*/

     //update hash if gradeband is changed in the dropdown

     submit(null, true);
  });

//User can search by Enter key
 window.addEventListener("keyup", function(e){
    if(event.key == "Enter"){
      submitBtn(true);
    }
 });


 document.getElementById("TE").addEventListener("click", (e) =>{
   if(e.target.checked == undefined) return;  //return if not clicking right on check box

   var checked = false;
   if(e.target.checked){ //if check box was checked
      checked = true;
   }

   //set sub checkboxes bases on the computed display type
   document.getElementById("item1Box").checked = checked;
   document.getElementById("item2Box").checked = checked;
   document.getElementById("item3Box").checked = checked;

 });

 document.getElementById("dropdownSymbolForTEDocs").addEventListener("click", (e) =>{
   var displayType = "none"
   if(document.getElementById("item1").style.display == "none"){
     //document.getElementById("dropdownSymbolForTEDocs").innerHTML = "&#9650";
     displayType = "block";
   }
   else{
    //  document.getElementById("dropdownSymbolForTEDocs").innerHTML = "&#9660";
   }
   for(var i = 1; i < 4; i++){
     var id = "item" + i.toString();
     document.getElementById(id).style.display = displayType;
   }
 });

 document.getElementById("dropdownSymbolForTEDocs").addEventListener("mouseover", (e) => {
      document.getElementById(e.target.id).style.cursor = "pointer";
 });

}


//resets each dropdown in the legend toggle to on
function ResetLegendToggle(){
  document.getElementById("TopicsToggle").value = "On"
  document.getElementById("PEToggle").value = "On"
  document.getElementById("SEPToggle").value = "On"
  document.getElementById("DCIToggle").value = "On"
  document.getElementById("CCToggle").value = "On"
}



//initialize the legend toggle buttons that call the function to hide nodes of that type
function InitLegend(){

   //reset incase the browser gets any funny ideas
    ResetLegendToggle();

     document.getElementById("TopicsToggle").addEventListener("change", (e) =>{
          ShowHideNodesInNetwork("topic", e.target.value);
     });

     document.getElementById("PEToggle").addEventListener("change", (e) =>{
             ShowHideNodesInNetwork("PE", e.target.value);
     });

     document.getElementById("SEPToggle").addEventListener("change", (e) =>{
            ShowHideNodesInNetwork("SEP", e.target.value);
     });

     document.getElementById("DCIToggle").addEventListener("change", (e) =>{
          ShowHideNodesInNetwork("DCI", e.target.value);
     });

     document.getElementById("CCToggle").addEventListener("change", (e) =>{
           ShowHideNodesInNetwork("CC", e.target.value);
     });
}


//Shows or hides nodes of the given type based on the option
function  ShowHideNodesInNetwork(stdType, option){
    //build out the json structure to update the network
    var nwJson = [];
    var count = 0;
    var hidden = true;
    if(option == "On"){
      hidden = false;
    }

    if(CurrentNetworkMode == NetworkModes.GRADEBAND){
      var c = 0;
      for(var i = 0; i < graph.numVertices; i++){
        var vert = graph.vertices[i];
        if(
            (vert.nodeType == "Science and Engineering Practices" && stdType == "SEP") ||
            (vert.nodeType == "Crosscutting Concepts" && stdType == "CC") ||
            (vert.nodeType == "Disciplinary Core Ideas" && stdType == "DCI") ||
            (vert.nodeType == "Performance Expectation" && stdType == "PE") ||
            (vert.nodeType == "Standard" && stdType == "topic")
          )
        {
          var item = {id:vert.id, hidden:hidden}
          nwJson[c++] = item;
        }
      }
      nodes.update(nwJson);
      return;
    }

    else if(CurrentNetworkMode == NetworkModes.CATEGORY){
      for(var i = 0; i < GraphDataStructure.nodeCount; i++){
         var node = GraphDataStructure.nodesList[i];
            if(node.type == stdType){
               var item = {id:node.id, hidden:hidden}
               nwJson[count] = item;
               count++;
            }
      }
      v_Nodes.update(nwJson);
    }
}


function SetHashFromPageState(sCode){

  var hash = "";
  var nodeHash = null;

   if(sCode != undefined && sCode != null){
      nodeHash = sCode;
   }

   else if(currentSelectedNode) nodeHash = currentSelectedNode;

   else nodeHash = DEFAULT_STANDARD;

   hash += nodeHash.toString() + ";";

  //set the hash value  for the grade band dropdown state
   var gb = document.getElementById("gradeBand").value;
   hash += "g" + gb + ";";

   //set the hash value for the display type dropdown state
   var dt = document.getElementById("displayType").value;
   hash += "l" + dt + ";";

  //set the hash value for the network depth dropdown state
   var nwDepth = document.getElementById("networkDepth").value;
   hash += "d" + nwDepth + ";"

   //set the hash values for each of the aligned resource collections
   var a  = document.getElementById("item1Box").checked ? 1 : 0;
   var l = document.getElementById("item2Box").checked ? 1 : 0;
   var c = document.getElementById("item3Box").checked ? 1 : 0;


   //set the hash params for the TE data state
   var t =  "t" + a.toString() + l.toString() + c.toString() + ";";
   hash += t;

   //set the hash params for the other collections and their state
   var o = "o";

     var other = GetResourceTypeSelectionFromDropdown();
     resources = other.otherResources;

     for(var i = 0; i < resources.length; i++){
       var val = resources[i].show ? 1 : 0;
       o += val;
     }

   hash += o;

   return hash;
}

function ToggleNetworkLables3D(){
  var nodesJson = [];
  var nodeInfo = {};
  var curLabel = null;
  var curNode = null;
  var count = 0;
  for(var i = 0; i < GraphDataStructure.nodeCount; i++){
     curNode = GraphDataStructure.nodesList[i];
     if(curNode.type == "Bundle") continue;

     if(NodeDisplayType == ModeEnum.ASN){
       curLabel = curNode.metadata.sCode;
     }
     else{
       if(curNode.type == "SEP" || curNode.type == "CC"){
         curLabel = BLANK_NODE_LABEL;
       }
       else{
          curLabel = curNode.metadata.pCode;
       }
     }
     nodesJson[count] = {id:curNode.id, label:curLabel}
     count++;


  }
     v_Nodes.update(nodesJson);
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
    if(NodeDisplayType == ModeEnum.NGSS){
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

    //the previous state of the ResorceTypes dropdown (prior to click event)
    var showingDocsPrev = IsShowingDocs();

    //update the resouceTypes object to reflect click changes to dropdown and get current state of resourceTypes dropdown
    SetResourceTypesFromDropdown();
    var showingDocsCur = IsShowingDocs();

    //if we went from no item to on item or from all items to not all items, redraw the graph
    if(showingDocsCur != showingDocsPrev){

      submit(currentSelectedNode, true);
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
function submitBtn(resetDropdown){
   //reset dropdown to default if resetDropdown is true
   if(resetDropdown != undefined && resetDropdown != null && resetDropdown == true)
   document.getElementById("gradeBand").value = 0;

   //Get the value from the search textbox
   var input = document.getElementById("sCode").value;

   //Determine if input is an ASN code or a NGSS code or a DCI
   var inputType = GetInputType(input);
   if(inputType == "DCI"){
     var dciList = GetDCIList(input);
      if(dciList.length == 0){
       alert("Could not find DCI");
     }
     else{
       ClearTable(document.getElementById('dciTable'));
       document.getElementById("dciTable").deleteTHead();
       DisplayDCIModal(dciList, input);
     }
   }

   else {

     submit(input, true)
   }
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
        submit(sCode, true);
        $('#myModal').modal('hide');

      });
    }
}

function foo(){

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
/*
  hashChange = false;
  location.hash = SetHashFromPageState(sCode);*/

  submit(sCode, true);

}


function GetPCodeFromSCode(sCode){
   for(var i = 0; i < NGSSGraph.length; i++){
     if(NGSSGraph[i].sCode == sCode){
       return NGSSGraph[i].pCode;
     }
   }
   return "error";
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
  throw new Error("Standard with NGSS code " + pCode + " not found\n");
}


function submitGradeband(code, fromBrowserBackButton){

  Reset3DDropdowns();

  var sCode = null;
  //Set the display type based of if parameter is a pCode or an sCode
  if(code != null && code.substring(0,1) == "S"){
    sCode = code;
  }
  else if(code != null && code != undefined){
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
  var showActivities = document.getElementById("item1Box").checked;
  var showLessons = document.getElementById("item2Box").checked;
  var showCurricularUnits = document.getElementById("item3Box").checked;
/*  var showAll = document.getElementById("item4Box").checked;*/
  var showAllTEDocs = document.getElementById("TECheckBox").checked;

  //Set the dropdowns to display their defaults
  var nodeLabel = document.getElementById("displayType");
  var curDepth = document.getElementById("networkDepth");
  if(nodeLabel.value == 0 ){
     nodeLabel.value = 1;
  }

  //show the loading bar if showing an entire network with documents (exept for k-2 since it loads fast)
  var selectedGradeBand = document.getElementById("gradeBand").value;
  if( (showActivities || showLessons || showCurricularUnits) && selectedGradeBand > 1 ){
    ShowLoadingScreen();
  }

  //if grade band is set, we will automatically iterate up to the max depth to get every standard in that grade band

  if(document.getElementById("gradeBand").value > 0){
    document.getElementById("networkDepth").value = 0;
    depth = 50;
  }

   if(!FirstLoad && fromBrowserBackButton){
      IncrementHash();
   }
     FirstLoad = false;
  //Entry point for building the network and the alignments and standards tables.
  BuildNetwork(sCode, depth, displayType, gradeBand);

}


function Submit3D(fromBrowserBackButton){
/*  if(!FirstLoad && fromBrowserBackButton){
     IncrementHash();
  }
    FirstLoad = false;*/
console.log("about to load the data2")
  LoadNetworkData();
}


/*************************************************************************************
  This function will get the imput values from the form elements and than call BuildNetwork()
  to genereate the network.

  Parameters:
    1) sCode: The sCode of the root node from which we build the graph.
**************************************************************************************/
function submit(code, fromBrowserBackButton){
 if(CurrentNetworkMode == NetworkModes.GRADEBAND){
    submitGradeband(code, fromBrowserBackButton);
  }
  else{
    Submit3D(true);
  }
}


function GetResourceTypeSelectionFromDropdown(){

  var result = {};
  var showActivities = document.getElementById("item1Box").checked;
  var showLessons = document.getElementById("item2Box").checked;
  var showCurricularUnits = document.getElementById("item3Box").checked;
  var showAllTEDocs = document.getElementById("TECheckBox").checked;

  result.activities = showActivities;
  result.lessons = showLessons;
  result.curricularUnits = showCurricularUnits;
  result.allTEDocs = showAllTEDocs;

  var otherItems = [];
  for(var i = 0; i < NGSSResourcesList.length; i++){
   document.getElementById(NGSSResourcesList[i])
    var showIt = null;
     if(document.getElementById(NGSSResourcesList[i])){

       if(NGSSResourcesList[i] == "TE"){
         showIt = document.getElementById(NGSSResourcesList[i]).checked;
       }

       else{
         showIt = document.getElementById(NGSSResourcesList[i] + "_Checkbox").checked
       }
     }
     else showit = false;
     var item = {}
     item.item = NGSSResourcesList[i];
     item.show = showIt;

     otherItems[i] = item;
  }
  result.otherResources = otherItems;
  return result
}


/****************************************************************************************
Takes options on how to genereate the network and calls the approprate function
based on if an entire gradeband is being searched or not.

Parameters:
  1) sCode: ASN identifier of the standard that will be at the root of the network
  2) depth: The max from the root node for which to build the network
  3) displayType: The type of node label to display (either NGSS or ASN)
  4) gradeBand: The gradeBand of the current subnetwork (formatted as lowgrade - highGrade)
  5) showActivities: a boolean that determines if aligned activities will be displayed.
  6) showLessons: a boolean that determines if aligned lessons will be displayed.
  7) showCurricularUnits: a boolean that determines if units will be displayed.
  8) showAll: a boolean that overrides the previous 3 that determines if all alignment types will be displayed.
****************************************************************************************/
function BuildNetwork(sCode, depth, displayType, gradeBand){

  //If user has selected a gradeband, we search by that gradeBand and iterate up to a depth of 50 to display the entire gradeband.
  if(gradeBand != 0){
    if(gradeBand == 1) sCode = "S2454361";
    else if(gradeBand == 2) sCode = "S2454378"; //3-5 gradeband
    else if(gradeBand == 3) sCode = DEFAULT_STANDARD; //6-8 gradeband
    else if(gradeBand == 4) sCode = "S2467907"; //9-12 gradeband
    currentSelectedNode = sCode;
    document.getElementById("sCode").value = sCode
    depth = 50;  //set depth to max if grade band is set.
  }

  BuildNetworkNSteps(sCode, depth, displayType);
  //BuildAlignedDocumentsTable(sCode) //test me


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
          GetStandardColors(neighbors[i])
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

   //edges = JSON.parse(JSON.stringify(graph.edges));

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
var FOO = false;

/************************************************************************************************
Description:
    Builds the network graph object by adding the standards, adding the edges for standards, adding the nodes,
    and adding the edges for alignments. The last function makes an AJAX post which is the entry point for
    actualy drawing the network.
Parameters:
  1)  sCode: the ASN code of the root node of the network
  2) depth: the distince from the root node that we will have in the network
  3) displayType: The option for if ASN or NGSS codes will be displayed
  4) showActivities: true if activity documents will be displayed in the graph.
  5) showLessons: True if lesson documents will be displayed in the graph
  6) showCurricularUnits: True if curricularunits will be displayed in the graph
  7) showAll: True if all document types will be displayed in the graph
*************************************************************************************************/
var FIRST = true;
function BuildNetworkNSteps(sCode, depth, displayType){

  graph = new GraphObject(); //Allocate a new Graph object to store the current graph
  if(depth){
      AddStandarsNodes(depth, sCode);  //add all the standards to the graph up to the specified depth
  }
  else AddAllStandards();
  AddStandardsEdges();  //add vertex connections to the graph for the standards

  //add nodes and edges for resources
  var resourceTypes = GetResourceTypeSelectionFromDropdown()

  AddResourceAlignmentNodes(resourceTypes);
  AddResourceAlignmentEdges(resourceTypes);
  var edgesRFormat = GetEdgesInRFormat(); //Format edge list as zero indexed so R can compute KK on it
  if(FIRST){
      BuildResourcesDropdown();
      FIRST = false;
  }
  else{
    UpdateResourceDropdown();
  }

  BuildAlignedDocumentsTable(sCode)
  GetKamadaKawaiCoords(edgesRFormat); //gets the kk layout via an AJAX post. Begins the chain of events for drawing the netork


}


function GetGMLData(){

  var currentIndex = graph.alignments.length;
 	var temporaryValue, randomIndex;

     //sort the alignments.
     let length = graph.alignments.length;
      for (let i = 1; i < length; i++) {
          let key = graph.alignments[i];
          let j = i - 1;
          while (j >= 0 && graph.alignments[j].id > key.id) {
              graph.alignments[j + 1] = graph.alignments[j];
              j = j - 1;
          }
          graph.alignments[j + 1] = key;
      }



  var gmlString = "graph[\n";
  var padding = "\t\t";
  var label = "NGSS K-2";
  gmlString += "\t"+  "label " + "\"" + label + "\"" + "\n";
  for(var i = 0; i < graph.numVertices; i++){
    var lab = graph.vertices[i].sCode;
    lab = lab.substring(6,8);
     var nodeString = "\tnode[\n";
     nodeString += padding + "id " +  (graph.vertices[i].id).toString()  + "\n";
     nodeString += "\t]\n"
     gmlString += nodeString;
  }

 //build the node gml data for TE docs
 for(var i = 0; i < graph.numAlignments; i++){
   var nodeString = "\tnode[\n";
    nodeString += padding + "id " +  (graph.alignments[i].id).toString()  + "\n";
    nodeString += "\t]\n"
    gmlString += nodeString
 }


 //built the edges for every connection in the graph
 var edgeList = {};
 for(var i = 0; i < graph.edges.length; i++){
     var edgeString = "\tedge[\n";
     edgeString += padding + "source " + (graph.edges[i].to).toString()  + "\n";
     edgeString += padding + "target " +  (graph.edges[i].from ).toString() + "\n";
     edgeString += "\t]\n";
     gmlString += edgeString;
   }
   gmlString += "]";

  gmlString = gmlString.replace("'","");
  var res = "";
  if(graph.numVertices != 26){
     res = "GetKKCoords(" + "'" +  gmlString.toString()  + "'" +  ")";
  }
  else{
    res = "GetFRCoords(" + "'" +  gmlString.toString()  + "'" +  ")";
  }


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


function AddAlignmentsNodes(){
    //for each different resource in the list of collections
  for(var i = 0; i < NGSSResources.length; i++){
    _AddAlignmentsNodes(NGSSResources[i]);
  }
}


function _AddAlignmentsNodes(resouceItems){
/*  for(var i = 0; i < graph.numVertices; i ++){
    var resourceIds
  }*/
}

function AddOSAlignmentEdges(){
  for(var i = 0; i < graph.numVertices; i++){  //for every standard in the graph
        var alignmentIds = graph.vertices[i].outdoorschoolNeighbors;  //get all alignments for that standard
          if(alignmentIds.length == 0) continue;  //skip if no documents to add
          for(var j = 0; j < alignmentIds.length; j++){   //for every alignment, add edge if alignment in graph
           var curAlignmentId = alignmentIds[j];
           var curAlignment = OSAlignments[curAlignmentId]
           if(curAlignment == undefined) continue;
           graph.addEdge(graph.vertices[i].id, curAlignment.id);
        }
  }
}


function AddSBAlignmentEdges(){
  for(var i = 0; i < graph.numVertices; i++){  //for every standard in the graph
        var alignmentIds = graph.vertices[i].scienceBuddiesNeighbors;  //get all alignments for that standard
          if(alignmentIds.length == 0) continue;  //skip if no documents to add
          for(var j = 0; j < alignmentIds.length; j++){   //for every alignment, add edge if alignment in graph
           var curAlignmentId = alignmentIds[j];
           var curAlignment = SBAlignments[curAlignmentId]
           if(curAlignment == undefined) continue;
           graph.addEdge(graph.vertices[i].id, curAlignment.id);
        }
  }
}


function AddOSAlignmentEdges(){
  for(var i = 0; i < graph.numVertices; i++){  //for every standard in the graph
        var alignmentIds = graph.vertices[i].outdoorschoolNeighbors;  //get all alignments for that standard
          if(alignmentIds.length == 0) continue;  //skip if no documents to add
          for(var j = 0; j < alignmentIds.length; j++){   //for every alignment, add edge if alignment in graph
           var curAlignmentId = alignmentIds[j];
           var curAlignment = OSAlignments[curAlignmentId]
           if(curAlignment == undefined) continue;
           graph.addEdge(graph.vertices[i].id, curAlignment.id);
        }
  }
}


function ShouldShowResource(resourceName){
      for(var i = 0; i < RESOURCE_TYPES_NAMES.length; i++){
        if(resourceName == RESOURCE_TYPES_NAMES[i]){
          return true;
        }
      }
      return false;
}


function AddResourceAlignmentNodes(resourceTypes){
  for(var i = 0; i < graph.numVertices; i++){  //for each standard
     var alignmentIds = graph.vertices[i].alignedResources;  //get list of documnets aligned to that standard
       if(alignmentIds.length == 0) continue;  //skip if no aligned documents to add
       for(var j = 0; j < alignmentIds.length; j++){
            var curAlignmentId = alignmentIds[j];
            var curAlignment = NGSSResources[curAlignmentId];
            //skip nodes not in collecion list
            if(curAlignment == undefined || curAlignment == null){
              continue;
            }
            resourceTypes = GetResourceTypeSelectionFromDropdown();

            if(!_ShouldShowResource(curAlignment, resourceTypes, curAlignment.nodeType)) {
              if((document.getElementById("TECheckBox").checked && curAlignment.nodeType == "TeachEngineering")){

              }
              else
              continue;
            }


            if(!graph.hasAlignment(curAlignment)){ //If alignment not in graph, add it to the graph
              GetResourceColor2(curAlignment);
              graph.addAlignment(curAlignment);

            }
       }
  }
}

//foof
function GetResourceColor2(a){

     var t = a.nodeType;
     var i = 0;
     var symbolId = 0;
     for(i; i < NGSSResourcesList.length; i++){
       if(t == NGSSResourcesList[i]) {
         symbolId = getAlignmentSymbolIndex(a.nodeType);
         break;
       }
     }
     a.color = resourceSymbols[symbolId].color;
     a.highlightColor = resourceSymbols[symbolId].highlightColor;

}

function AddResourceAlignmentEdges(resourceTypes){
  for(var i = 0; i < graph.numVertices; i++){  //for every standard in the graph
    var alignmentIds = graph.vertices[i].alignedResources;  //get all alignments for that standard
    if(alignmentIds.length == 0) continue;  //skip if no documents to add
    for(var j = 0; j < alignmentIds.length; j++){   //for every alignment, add edge if alignment in grap
         //check if alignment should be showing or not
         var curAlignmentId = alignmentIds[j];
         var curAlignment = NGSSResources[curAlignmentId];

         //only add resources as specified in the resourceType dropdown object
      /*   if(_ShouldShowResource(curAlignment, resourceTypes) == false){
           continue;
         }*/
         if(!_ShouldShowResource(curAlignment, resourceTypes, curAlignment.nodeType)){
           if((document.getElementById("TECheckBox").checked && curAlignment.nodeType == "TeachEngineering")){

           }
           else
           continue;
         }
         if(graph.hasEdge(graph.vertices[i].id, curAlignment.id) == true) continue
         if(graph.vertices[i].sCode == "S2454533"){

         }
         graph.addEdge(graph.vertices[i].id, curAlignment.id);
     }
  }
}

//returns true if if documents of that type are selected in the resource dropdown..
//If TE and docType, return true if that TE doc type is selected in the dropdown.
function _ShouldShowResource(node, displayType, docType){

    var nodeType = node.nodeType; //the collection type identifier
    displayType = GetResourceTypeSelectionFromDropdown()
    //this is sometimes null for some weird reason
    if(displayType == undefined) return false;
    //return true if specific TE doc type is selected in dropdown
    if(nodeType == "TeachEngineering"){  //hard coded for TE
      if(docType != undefined){
        if(node.docType == "activity" && document.getElementById("item1Box").checked) return true;
        if(node.docType == "lesson" && document.getElementById("item2Box").checked) return true;
        if(node.docType == "curricularUnit" && document.getElementById("item3Box").checked) return true;
        return false;
      }

      //return true if any TE items selected in checbox
      return document.getElementById("TECheckBox").checked
    }

    else{ //handle all other doc type dynamically
        var nonTEResources = displayType.otherResources;
        //for every item in the global list of documents
           //if item is checked in displayType list, return true, else return false.
        for(var i = 0; i < nonTEResources.length; i++){
           r = nonTEResources[i];
           if(nodeType == r.item){
             if(r.show == null || r.show == undefined) return false;
             return r.show;
           }
        }


        throw new Error("Could not get item from dropdown");
    }

    return false;
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
  GetStandardColors(root);
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


function GetStandardColors(node){
  var highlightIndex = 2;
  if(node.nodeType == "Standard"){
    node.color = PURPLE_COLOR[0];
    node.highlightColor = PURPLE_COLOR[highlightIndex];
  }
  else if(node.nodeType == "Performance Expectation"){
    node.color = GREY_COLOR[0];
    node.highlightColor = GREY_COLOR[highlightIndex];
  }
  else if(node.nodeType == "Crosscutting Concepts"){
     node.color = GREEN_COLOR[0];
     node.highlightColor = GREEN_COLOR[highlightIndex];
  }
  else if(node.nodeType == "Science and Engineering Practices"){
    node.color = BLUE_COLOR[0];
    node.highlightColor = BLUE_COLOR[highlightIndex];
  }
  else if(node.nodeType == "Disciplinary Core Ideas"){
    node.color = ORANGE_COLOR[0];
    node.highlightColor = ORANGE_COLOR[highlightIndex];
  }


}

/*************************************************************************************************
Addes every standard from NGSSGraph[] that is in the current gradeband to the global graph object.
**************************************************************************************************/
function AddAllStandards(){
  var gradeBand = document.getElementById("gradeBand").value;
  if(gradeBand == 1) gradeBand = "K-2"
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

var foobar = 0;
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
      nodeType:"Standard",
      x:kkCoords[foobar].x,
      y:kkCoords[foobar].y,
      hidden:GetLegendToggleStatus(graph.vertices[i].nodeType ),
    });
    foobar = foobar + 1;
  }
}


function GetLegendToggleStatus(type){

  if((type == "topic" || type == "Standard") && document.getElementById("TopicsToggle").value == "Off"){
    return true;
  }
  if((type == "PE" || type == "Performance Expectation") && document.getElementById("PEToggle").value == "Off"){
    return true;
  }
  if((type == "Disciplinary Core Ideas" || type == "DCI") && document.getElementById("DCIToggle").value == "Off"){
    return true;
  }
  if((type == "Science and Engineering Practices" || type == "SEP") && document.getElementById("SEPToggle").value == "Off"){
    return true;
  }
  if((type == "Crosscutting Concepts" || type == "CC") && document.getElementById("CCToggle").value == "Off"){
    return true;
  }
  return false;
}


function FormatHoverTextForAlignment(title, collection){

    for(var i  = 0; i < RESOURCE_TYPES_NAMES.length; i++){
      if (collection == RESOURCE_TYPES_NAMES[i])
      collection = RESOURCE_TYPES_NAMES[i];
    }

    var resultHTML = '<div style = "font-size:10pt">';
    resultHTML += collection + ':<br /> ' + title;
    resultHTML += '</div>';
    return resultHTML;
}

function getAlignmentSymbolIndex(nodeType){
  for(var i = 0; i < NGSSResourcesList.length; i++){
    if(NGSSResourcesList[i] == nodeType){
      return i;
    }
  }
  return 0;
}

function BuildNetworkAlignments(kkCoords){
  //Build a vertex for every document in the graph object
 //foof
  for(var j = 0; j < graph.numAlignments; j++){
   var symbolId = getAlignmentSymbolIndex(graph.alignments[j].nodeType);
   var size = DOC_NODE_SIZE;
   if(graph.alignments[j].nodeType != "TeachEngineering"){
     size += 5;
   }
    nodes.add({
      id:graph.alignments[j].id,
      title:FormatHoverTextForAlignment(graph.alignments[j].title, graph.alignments[j].nodeType),
      color: resourceSymbols[symbolId].color,
      regularColor:graph.alignments[j].color,
      highlightColor:resourceSymbols[symbolId].highlightColor,
      shape:resourceSymbols[symbolId].shape,
      width:.1,
      font:{size:DOC_NODE_SIZE},
      size:size,
      nodeType:graph.alignments[j].nodeType,
      doc:graph.alignments[j].document,
      x:kkCoords[foobar].x,
      y:kkCoords[foobar].y,
      hidden:false,
    });
    foobar = foobar + 1;
  }
  foobar = 0;
  return graph.numVertices + j;
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
     //The vis.js data structure
     var options = GetNetworkOptions();
     nodes = new vis.DataSet(options);
     edges = new vis.DataSet({});

     //Build vis.js nodes for each standard in the graph
     BuildNetworkStandards(kkCoords)

     //Build vis.js nodes for each alignment according to the collection
     var index = 0;
     BuildNetworkAlignments(kkCoords)

     //Build edges between all connected nodes (standards and resources)
     BuildNetworkEdges();

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

     //Adjust positions of the standards to give the nw a curved look.
     ImproveNetworkLayout(nw);


    //Create the tables for Alignments and Standards. Also get the root node since it gets mixed up during sorting
     var root = CreateStandardsTable(REGULAR_NODE_SIZE, REGULAR_NODE_SIZE + 10)
  //   BuildAlignedDocumentsTable(root.sCode)

     //Highlight the starting node that was returned from CreateStandardsTable().
     HighlightNode(root.id, root.color, REGULAR_NODE_SIZE, REGULAR_NODE_SIZE + 10);

     //Handle single click actions for the network
     NWClickActionResult(nw);

     //Handle double click actions for the network
     NWDoubleClickActionResult(nw);

     //Set default zoom
     curScale = SetZoom(graph.numVertices);
     nw.moveTo({scale: curScale})

     //Handle mouse scroll zoom action for the network
     NWZoomActionResult(nw);

     HideLoadingScreen();

}


function NWClickActionResult(nw){
  //callback for clicking action on a node
  nw.on("click", function(properties){
      if(properties.nodes.length > 0){
        var ids = properties.nodes;
        var clickedNodes = nodes.get(ids);

        //Handle onclick event for standards
        if(clickedNodes[0].nodeType == "Standard"){
          if(clickedNodes[0].sCode != currentTableRow) { //only perform action if not already selected
            var id = clickedNodes[0].id;
            var nodesList = nodes.get(nodes._data);
            var sCode = clickedNodes[0].sCode;
            UnhighlightPreviousNode();
            //unhighlight current selected doc if exists
            if(selectedDocNode != null)
            UnHighlightDocumentNode(selectedDocNode);
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

      //clicked on aligned resource node foof
      else{
           //only clicking on an Alignment connected with the currently selected standard does anything
           if(IsAlignedToStandard(clickedNodes[0].id, clickedNodes[0].nodeType)){
             //highlight the node that was clicked on by making it bigger and giving it a lighter color
             HighlightDocumentNode(clickedNodes[0]);

             //Highlight the coorisponding alignments table cell to the highlight color of the selected node
             var newColor = clickedNodes[0].highlightColor;
             HighlightDocsTableCell(clickedNodes[0].doc, newColor);
             document.getElementById(clickedNodes[0].doc).scrollIntoView();

             //Set the global value that keeps track of the currently selected alignment node
             selectedDocNode = clickedNodes[0];
           }
      }
      }
  });
}


function NWDoubleClickActionResult(nw){
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

/*      hashChange = false;
      location.hash = SetHashFromPageState();*/
      submit(sCode, true);
    }
  });
}


function NWZoomActionResult(nw){
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


function ImproveNetworkLayout(nw){
  //Pull all PEs towards the center to give the graph a nice curved shape
  var moveX = 20;
  var moveY = 20;
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

  nodes.update(resultArr)
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

//alignes the legend based on the view height of the screen
function alignLegend(){
  var legend = document.getElementById("theLegend");
  if(legend){
   legend.style.top = "78vh"
  }
}


/******************************************************************************************
Functions handles the display of alignments in the nw based on items selected from the dropwown.
A json string is build and then passed to vis.js to update the nw to show/hide alignments.
******************************************************************************************/
function ShowHideAlignmentsBasedOnDropdown(){

   //don't to anything if the graph has not been drawn yet
  if(CurrentNetworkMode == NetworkModes.GRADEBAND){
   if(graph == null) return;

   //Get the selections from the docTypes dropdown checkboxes
   var showActivities = document.getElementById(docTypesForDropDown[0].checkBoxId).checked;
   var showLessons = document.getElementById(docTypesForDropDown[1].checkBoxId).checked;
   var showCurricularUnits = document.getElementById(docTypesForDropDown[2].checkBoxId).checked;


  /* var showAll =  document.getElementById(docTypesForDropDown[3].checkBoxId).checked;*/
    var showAll = document.getElementById("TECheckBox").checked;
   //Build a json string in vis.js format based on the options above
   var count = 0;

   var dataString = "[";
   for(var i = 0; i < graph.numAlignments; i++){
      var hidden = "false"
      if(graph.alignments[i].nodeType != "TeachEngineering" ) continue;
     var curAlignment = graph.alignments[i];
     if(graph.alignments[i].docType == "activity" &&  !showActivities) hidden = "true";
     else if(graph.alignments[i].docType == "lesson" && !showLessons) hidden = "true";
     else if(graph.alignments[i].docType == "curricularUnit" && !showCurricularUnits) hidden = "true";
     dataString =  dataString + "{";
     dataString =  dataString + '"'+ "id" + '"' + ":" +  graph.alignments[i].id.toString()  + ",";
     dataString =  dataString +'"'+ "hidden" + '"' + ":" + hidden;

     dataString =  dataString + "}";
     dataString = dataString + ",";

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

  else{
      if(GraphDataStructure == null) return;
      var nodesToUpdate = [];
      var count = 0;
      for(var i = 0; i < GraphDataStructure.nodeCount; i++){

        var node = GraphDataStructure.nodesList[i];
        if(node.type != "resource") continue;
        if(node.metadata.provider != "TeachEngineering") continue;
        var hidden = true;
        if(node.metadata.docType == "activity" &&  document.getElementById("item1Box").checked) hidden = false;
        else if(node.metadata.docType == "lesson" && document.getElementById("item2Box").checked) hidden = false;
        else if(node.metadata.docType == "curricularUnit" && document.getElementById("item3Box").checked) hidden = false;
            var  nodeToHide = GraphDataStructure.GetResourceNodeFromName(node.metadata.resource);
            var updateData = {id:nodeToHide.id, hidden:hidden};
            nodesToUpdate[count] = updateData;
            count++;
      }

      if(nodesToUpdate.length > 0){
         v_Nodes.update(nodesToUpdate);
      }

 }

}


/********************************************************************************************
Takes a node id of a document and returs it to its regular color

Paremeters:
 1) node: the vis.js node object to update
********************************************************************************************/
function UnHighlightDocumentNode(node){
  if(node != null){
    nodes.update([{
      id:node.id,
      color:node.regularColor,
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
function IsAlignedToStandard(docId, docType){
  //get list of aligned resources for the current selected node by sCode
  var ids = [];
  for(var i = 0; i < graph.numVertices; i++){

      if(graph.vertices[i].sCode == currentSelectedNode){
         ids = graph.vertices[i].alignedResources;
        break
      }
  }
  for(var i = 0; i < ids.length; i++){
    if(docId == NGSSResources[ids[i]].id) {
      var resourceTypes = GetResourceTypeSelectionFromDropdown();
      return _ShouldShowResource( NGSSResources[ids[i]], resourceTypes,  NGSSResources[ids[i]].nodeType);
    }
  }
  return false;
}


/***************************************************************************************
returns true if current selected standard is aligned with the given node document

Parameters:
 1) sCode: the ASN identifier of the standard.
 2) dataSet: itentifies the type of documents we are using)
***************************************************************************************/
function GetAlignmentsForStandard(sCode){

  //get the state of the ResourceTypes dropdown
  var resourceTypes = GetResourceTypeSelectionFromDropdown();

  var dataSet = null;
  var alignments = null
  var curStandard = null;

  //get the list of all aligned resources for that standard
  for(var i = 0; i < graph.numVertices; i++){
    if(graph.vertices[i].sCode == sCode){
      curStandard = graph.vertices[i]
    }
  }
  alignments = curStandard.alignedResources;

  //List of all NGSS resources indexed
  dataSet = NGSSResources;
  var als = [];
  var count = 0
  var resourceTypes = GetResourceTypeSelectionFromDropdown();

  //For every resource aligned to that standard
  for(var i = 0; i < alignments.length; i++){
     //Filter out all doctypes not selected from the dropdown
     if( _ShouldShowResource(dataSet[alignments[i]]), resourceTypes, dataSet[alignments[i]].nodeType){
       als[count] = dataSet[alignments[i]].id;
       count++
     }
  }

  //return list of ids of aligned resources to build the table for

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
    if(arr[i] == value){
      return true;
    }
  }
  return false;
}

function IsShowingResource(node){

  var resourceTypes = GetResourceTypeSelectionFromDropdown();
  var nodeType = node.nodeType;
  return _ShouldShowResource(node, resourceTypes, node.docType);
}


function _BuildAlignedDocumentsForCollection(nodeSet, sCode){
  var count = 0;
  //get a reference to the table in the DOM and clear the previously build table if any.
  var tableRef = document.getElementById('t2');

  //Get a list of resources aligned to the standard with the given sCode.
  myList = GetAlignmentsForStandard(sCode);
  //For every resource aligned to sCode, add a row to the table with its metadata and onclick event handler
  for(var i = 0; i < nodeSet.length; i++){
    var symbolIndex = getAlignmentSymbolIndex(nodeSet[i].nodeType);
    var curNode = nodeSet[i];
    if(!ArrayContains(myList, nodeSet[i].id)) continue;

    if(!IsShowingResource(nodeSet[i])) continue;
    count++;
    var curDocId = nodeSet[i].document.replace(/ /g,'');

    var newRow = tableRef.insertRow(tableRef.rows.length);

    newRow.id = curDocId;
    newRow.style.background = resourceSymbols[symbolIndex].color;

    var curColor = resourceSymbols[symbolIndex].color;
    var curHighlightColor = resourceSymbols[symbolIndex].highlightColor;

    //add closure to on click callback for row click action
    newRow.onclick = (function(){
       var currentDoc = curDocId;
       var currentId = nodeSet.id;
       var highlightColor = curHighlightColor;
       var c = curNode
       return function(){
         unHighlightCurrentSelectedDocument();
         HighlightDocsTableCell(currentDoc, highlightColor);  //highlight documents table cell when clicked
         HighlightDocumentNode(c)
       //  currentDocsTableRowType = type;
       }
     })();

    //build the inner html for the new table row.
    var docType = "";
   if(nodeSet[i].docType){
     docType = nodeSet[i].docType;
     if(docType == "curricularUnit") docType = "curricular unit";
     docType  = " (" + docType + ")";
   }
    newRow.innerHTML =
    '<span style ="color:blue; cursor: pointer; letterSpacing:20px" onclick = GoToTEPage(\'' + nodeSet[i].url + '\')>' + nodeSet[i].title + '</span>' + '<span>' + docType + '</span>'  + '<br>'
    + '<span>' + _TruncateDocDescription(nodeSet[i].summary, nodeSet[i].document) + '</span>'
    +'<hr style= margin:3px>'
  }
  return count;
}


//FIXME
function BuildAlignedDocumentsTable3D(standard){

   ClearTable(document.getElementById('t2'));

  //get all the aligned resource nodes and sort them alphabetically
  let alignedResources = GraphDataStructure.GetAlignedResources(standard.id);
  alignedResources.sort((a, b) => a.metadata.provider.localeCompare(b.metadata.provider));
  document.getElementById("alignmentsTableHeader").innerText = "Aligned Resources (" + alignedResources.length.toString() + ")";

  //build a row in the alignments table for each alignment
  var tableRef = document.getElementById('t2');
  for(var i = 0; i < alignedResources.length; i++){
    var newRow = tableRef.insertRow(tableRef.rows.length);
    newRow.id = alignedResources[i].id;
    newRow.style.background = alignedResources[i].color;
    newRow.metadata = {color:alignedResources[i].color, highlightColor:alignedResources[i].highlightColor}
    newRow.innerHTML =
    "<span style ='color:blue; cursor: pointer; letterSpacing:20px' onclick = GoToTEPage(\'" + alignedResources[i].metadata.url + "\') > "+ alignedResources[i].metadata.title+"</span>" + "<br>" +
    "<span>" + _TruncateDocDescription(alignedResources[i].metadata.summary, alignedResources[i].metadata.title) + "</span>" +
    '<hr style= margin:3px>'

    //onclick event to highlight clicked table row and coorisponding resource node in the newtork
    newRow.onclick = (function(){
         var clickedRow = newRow;
         return function(){
           HighlightDocsTableCell3D(clickedRow);
           HighlightResourceNodeFromTableClick(clickedRow);
         }
    })();
  }
}

function HighlightResourceNodeFromTableClick(row){

   //unhighlight all other resource nodes
   var updateInfo = [];
   var count = 0;
   if(CurrentSelectedResourceRow != null){
     v_Nodes.update({id:CurrentSelectedResourceRow.id, color:CurrentSelectedResourceRow.metadata.color, size:RESOURCE_SHAPE_SIZE});
   }
   if(CurrentSelectedResourceNode3D != null){
     v_Nodes.update({id:CurrentSelectedResourceNode3D.id, color:CurrentSelectedResourceNode3D.color, size:RESOURCE_SHAPE_SIZE});
   }
   CurrentSelectedResourceRow = row;
   //highlight the node coorisponding to the selected row
   v_Nodes.update({id:row.id, color:row.metadata.highlightColor, size:RESOURCE_SHAPE_HIGHLIGHT_SIZE});
}


function HighlightDocsTableCell3D(row){
  //first unhighlight all other rows
  for(var i = 0; i < GraphDataStructure.nodeCount; i++){
    if(GraphDataStructure.nodesList[i].type == "resource" && document.getElementById(GraphDataStructure.nodesList[i].id)){
      document.getElementById(GraphDataStructure.nodesList[i].id).style.border = "none";
      document.getElementById(GraphDataStructure.nodesList[i].id).style.background = GraphDataStructure.nodesList[i].color
    }
  }
  //make a border around the table cell to highlight it
  document.getElementById(row.id).style.border = "4px solid grey";
  document.getElementById(row.id).style.background = row.metadata.highlightColor;
}



/*********************************************************************************************
This function is responsible for building the alignments table on the fly. Takes an standard and
gets all documents aligned with that standard. It then builds the table in the DOM

Parameters:
 1) sCode: the ASN identifier of the stadard for which we are will build the table.
********************************************************************************************/
function BuildAlignedDocumentsTable(sCode){
    var alignmentsCount = 0;

    //Remove prevous stuff from the alignments table
    ClearTable(document.getElementById('t2'));

   //Build document table for TE documents
   graph.sortAlignments();

   alignmentsCount += _BuildAlignedDocumentsForCollection(graph.alignments, sCode);

   //Set the table row count in the table header
   document.getElementById("alignmentsTableHeader").innerText =  "Aligned resources" + " (" + alignmentsCount.toString() + ")";
}



/*********************************************************************************************
Takes the id of a vis.js alignment node and highlights it in the graph by making it larger.

Parameters:
 1) id: id of the alignment node in the vis.js network.
********************************************************************************************/
function HighlightDocumentNode(node){

  //get list of edges and nodes in the vis.js network
  var nodesList = nodes.get(nodes._data);
  var edgeData = edges.get(edges._data);

  //If no node yet selected, just return to normal size and color
  if(selectedDocNode != null){
    nodes.update([{
      id:selectedDocNode.id,
      color:selectedDocNode.regularColor,
      font:{size:DOC_NODE_SIZE},
      label:"       "
    }]);
  }

  //Update the node to be bigger so it appears highlighted.
  nodes.update([{
    id:node.id,
    color:node.highlightColor,
    font:{size:SELECTED_DOC_NODE_SIZE},
    label:"    "
  }]);
  selectedDocNode = node; //update the global var that holds the currently selected doc node id
}


/***********************************************************************************************
Takes the id of a row in the alignments table and highligts that row by making it a lighter color
and putting a border around it.

Parameters:
 1) docId: the id of the table row in the DOM that will get highlighed.
************************************************************************************************/
function HighlightDocsTableCell(docId, highlightColor){
   //unighlight table row if set
   if(document.getElementById(currentDocsTableRow)){

     //set the color to unhighlight table cell based on the type of the previous selected document in the table
     var color = null;

     //reset the color of the row that was previously selected
     document.getElementById(currentDocsTableRow).style.border = "none";
     document.getElementById(currentDocsTableRow).style.background =  GetResourceColor(currentDocsTableRow);
   }

   //highlight the table row and add border to the new row
   if(document.getElementById(docId)){
      document.getElementById(docId).style.border = "4px solid grey";
      document.getElementById(docId).style.background = highlightColor;
   }

   //update the global that tracks the currently selected table row.
   currentDocsTableRow = docId;
}

//foobar me
function GetResourceColor(resourceId){

   //Search the global resource list for the resource with the given id
    var color = null;
    for(var i = 0;  i < NGSSResources.length; i++){
      if(NGSSResources[i].document == resourceId){


         //get the color attribute of the resource
         color = NGSSResources[i].color;
         break;
      }
    }

    //return the color if found
    if(color != null)
    return color;

    //throw error if color not found
    throw new Error("Could not find resource color");
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

   var newId = id.replace(/ /g,'')
      return "<span 'style= display:inline'> " + des.substring(0, 100) +
      '<div style = "display:inline" id = '+newId+ '-elipsis' + '>' +'...' + '</div>' +
      "</span>" + "<span id = " + newId + '-doc' +" style = 'display:none'>" + des.substring(100, des.length) +
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
  var root = graph.vertices[0];
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

  return root;
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
       + '<a class = "clickableTableCell" onclick=SubmitTableClick(\'' + sCode +  '\'); style = "margin-right:2%; color:blue; cursor: pointer; font-size:10pt;">' + ngssCode + '</a>'
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
  if(selectedDocNode){
    nodes.update([{
    id:selectedDocNode.id,
    color:selectedDocNode.color,
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
  var req =new XMLHttpRequest();
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
       console.log(req.status)
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
               NGSSResources = result[1]; //array of alignments
               NGSSResourcesList = result[2]; //list of all resources in the collection
               for(var i = 0; i < NGSSResources.length; i++){
                var index =  getAlignmentSymbolIndex(NGSSResources[i].nodeType);
                  NGSSResources[i].color = resourceSymbols[index].color;
                 if(NGSSResources[i].document[0] == "\""){
                   NGSSResources[i].document = NGSSResources[i].document.substring(1,NGSSResources[i].document.length - 1 )
                 }
                   NGSSResources[i].document =  NGSSResources[i].document.replace(/ /g,'');
                   NGSSResources[i].document = NGSSResources[i].document.replace(" ","");
                   NGSSResources[i].document = NGSSResources[i].document + "_" + i.toString() //ensure that documents are unique
               }

               NGSSResourcesList[0] = "TE"
               NGSSResourcesList.sort().reverse()
               setTimeout(function(){
               submit(DEFAULT_STANDARD, true);
               LoadPageStateToLocalMemory(1);  //save the inital page to memory as item1
             }, 200);

           }
           else {
             console.log("Error posting to server")
             console.log(req.status);
           }
   }
   req.send(null)
}

function _isInGraph(standard){

    for(var i = 0; i < graph.numVertices; i++){

      if(standard == graph.vertices[i].sCode){
        return true;
      }
    }
   return false;
}


//fooooo
function getResourceCount(resource){
  resourceList = {};
  var resourceCount = 0

  //build resource count for Gradeband network mode
  if(CurrentNetworkMode == NetworkModes.GRADEBAND){
    if(graph == null) return resourceCount;

    for(var i = 0; i < graph.numVertices; i++){

      var alignmentsToVertex = graph.vertices[i].alignedResources;
      for(var j = 0; j < alignmentsToVertex.length; j++){
        var index = alignmentsToVertex[j]
        var alignment = NGSSResources[index]

        if (resource == alignment.nodeType && !resourceList[alignment.document]){
          resourceCount++;
          resourceList[alignment.document] = alignment.document;
        }
      }
    }

    return resourceCount;
  }

  //build resource count for Category network mode
  else{

    if(GraphDataStructure == null || GraphDataStructure == undefined) return resourceCount;

    var resourceHash = {};
    for(var i = 0; i < NGSSGraph.length; i++){
       var node = NGSSGraph[i];
       if(GraphDataStructure.containsStandardNode(node.sCode) == false) continue;

       var resourceIndexList = node.alignedResources;
       if(resourceIndexList.count == 0) continue;
       for(var j = 0; j < resourceIndexList.length; j++){
         var resourceNode = NGSSResources[resourceIndexList[j]];
         if(resourceNode.nodeType != "TeachEngineering" && resourceNode.nodeType == resource && !resourceHash[resourceNode.document]){
           resourceHash[resourceNode.document] = resourceNode.document;
           resourceCount++;
         }
       }
    }
  }
  return resourceCount;
}


//update the styling and resource count for each item in the custom dropdown. /FIXME
function UpdateResourceDropdown(){
  var count = 1;
  var teCount = GetTECount();
  var teLabel = document.getElementById("TECount");
  teLabel.innerText = "("+ teCount.docCount + ")";

   document.getElementById("activityCount").innerText =  "("+ teCount.activityCount + ")";
   document.getElementById("lessonCount").innerText =  "("+ teCount.lessonCount + ")";
    document.getElementById("unitCount").innerText =  "("+ teCount.unitCount + ")";


    var resourceCount = 0;
    for(var i = 0; i < NGSSResourcesList.length; i++){
      var resourceCount = getResourceCount(NGSSResourcesList[i]);
      var newItem = document.getElementById(NGSSResourcesList[i])

     document.getElementById(i.toString() + "_count").innerText = " (" + resourceCount.toString() + ")";
    var itemSymbol = document.getElementById(i.toString() + "_symbol");
    if(resourceCount == 0 && document.getElementById(i.toString() + "_label").innerText != "TE"){
       newItem.style.color = '#9F9F9F';
       itemSymbol = document.getElementById(i.toString() + "_symbol");
       itemSymbol.style.display = "none"
    }
    else{
        itemSymbol.style.display = "inline-block"
           newItem.style.color = 'black';
    }
 }
}

/*NGSSGraph = result[0];
NGSSResources = result[1]; //array of alignments

NGSSResourcesList = result[2]; //*/

function GetTECount(){
  var teCount = 0;
  var activityCount = 0;
  var unitCount = 0;
  var lessonCount = 0;
  var teResources = {};
  var result = {};

  if(CurrentNetworkMode == NetworkModes.GRADEBAND){
    for(var i = 0; i < graph.numVertices; i++){
      var aligned = graph.vertices[i].alignedResources;
      for(var j = 0; j < aligned.length; j++){
        var resource = NGSSResources[aligned[j]];
        if(resource.nodeType == 'TeachEngineering' && !teResources[resource.document]){
          teResources[resource.document] = resource.document;

          if(resource.docType == "curricularUnit"){
            unitCount ++;
          }
          else if(resource.docType == "lesson"){
            lessonCount++;
          }
          else if(resource.docType == "activity"){
            activityCount++
          }
          teCount++;
        }
      }

    }
  }

  else {
     var resourceHash = {};
     for(var i = 0; i < NGSSGraph.length; i++){
       var node = NGSSGraph[i];
       if(GraphDataStructure.containsStandardNode(node.sCode) == false) continue;
       var resourceIndexList = node.alignedResources;
       for(var j = 0; j < resourceIndexList.length; j++){
         var teNode = NGSSResources[resourceIndexList[j]];
         if(teNode.nodeType == "TeachEngineering" && !resourceHash[teNode.document]){
           resourceHash[teNode.document] = teNode.document;
           teCount++;
           if(teNode.docType == "activity") activityCount++;
           else if(teNode.docType == "lesson") lessonCount++;
           else if(teNode.docType == "curricularUnit") unitCount++;
         }
       }
     }
  }
  result.docCount = teCount;
  result.activityCount = activityCount;
  result.lessonCount = lessonCount;
  result.unitCount = unitCount;
  return result;
}

//Takes the post from the server and builds a dropdown to accomidate all the resource types
function BuildResourcesDropdown(){

  var teLabel = document.getElementById("TECount");
  teLabel.innerText = " (0)";

  for(var i = 0; i < NGSSResourcesList.length; i++){
     var symbolId = i.toString() + "_symbol";
     var color = resourceSymbols[i].color;
    if(resourceSymbols[i].shape == "circle" ){
      var symbol =  '<span id = '+symbolId+' style="height:12px; width:12px; border-radius:50%; margin-left:5px; background-color:'+color+'; display:inline-block" id = '+i.toString()+"_symbol"+'>'+'</span>'
    }
    else if(resourceSymbols[i].shape == "triangle"){
      var symbol = '<span id = '+symbolId+' style= "margin-left:5px;width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent; cursor: pointer; vertical-align: middle; display:inline-block; border-bottom:9px solid '+color+'"></span>'
    }
    else if(resourceSymbols[i].shape == "triangleDown"){
      var symbol = '<span id = '+symbolId+' style= "margin-left:5px;width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent; cursor: pointer; vertical-align: middle; display:inline-block; border-top:9px solid '+color+'"></span>'
    }
    else if(resourceSymbols[i].shape == "diamond"){
      var symbol =   "<span id="+symbolId+" style='margin-left:5px; width: 10px; transform:rotate(45deg); display:inline-block;     height: 10px;      background: "+color+"'></span>"
    }
    else if(resourceSymbols[i].shape == "square"){
      var symbol =   "<span id="+symbolId+"  style='margin-left:5px; width: 10px; display:inline-block;     height: 10px;      background: "+color+"'></span>"
    }
    else if(resourceSymbols[i].shape == "star"){
      var symbol = "<span id="+symbolId+"  style='color:"+color+"; font-size:150%'>&#x2605;</span>"
    }
    else if(resourceSymbols[i].shape == "ellipse"){
       var symbol = '<span id='+symbolId+'  style="margin-left:5px;height:10px; padding:none ;width:20px; background-color:'+color+'; color:'+color+'; border-radius:50%; font-size:0pt; line-height:0px"></span>';
    }
    else var symbol = "error"

    var resourceCount = getResourceCount(NGSSResourcesList[i]);
    var newItem = document.createElement("span");
    newItem.id = NGSSResourcesList[i]
    var newCheckbox = document.createElement("input")
    newCheckbox.type = "checkbox";
    newCheckbox.id = NGSSResourcesList[i] + "_Checkbox"
    var newLabel = document.createElement("Label");
    newLabel.setAttribute("for", newCheckbox);
    var countId = NGSSResourcesList[i]+"_count";
    newLabel.innerHTML = '<span id = '+i.toString() + "_label" +'>' + NGSSResourcesList[i] + '</span>' +
                          '<span id = '+i.toString()+"_count"+'>' +" ("+resourceCount+ ")" +'</span>' + symbol


    newItem.appendChild(newCheckbox);
    newItem.appendChild(newLabel)
    newItem.style.marginBottom = "0px"
    newItem.style.lineHeight = "14px";
    newItem.style.marginLeft = "3px"
    newItem.style.display = "none";
    newCheckbox.setAttribute("class", "customDropdown")
    newLabel.setAttribute("class", "customDropdown")

    var dropdown = document.getElementById("item3");
    dropdown.parentNode.insertBefore(newItem, dropdown.nextSibling)
   //rebuild the graph when the check box is checked or unchecked
    newItem.addEventListener("change", function(){
        submit(document.getElementById("sCode").value, true);
    });
  }

 //update to hide the symbols that have no corrisponding alignments
  UpdateResourceDropdown()
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


      var width = "150px";
      //if dropdown options  is not currently being displayed
      if(!isShowing){
        width = "500px";
        //disable network when dropdown showing and set dropdown options to showing
        isShowing = true;
        document.getElementById("mynetwork").style.pointerEvents = "none"
        displayType = "block"
        document.getElementById("dropdownToggle").style.height = "88vh";
          document.getElementById("dropdownToggle").style.overflow = "auto";

      }

      //if dropdown options are being shown
      else{
        document.getElementById("dropdownToggle").style.height = "22px";
          document.getElementById("dropdownToggle").style.overflow = "hidden";
        //hide set dropdown options to not showing
         isShowing = false;
         displayType = "none"
         document.getElementById("mynetwork").pointerEvents = "auto"
      }
      //show or hide the items in the dropdown based on the previously set dropdown options.
      for(var i = 0; i < NGSSResourcesList.length; i++){
        document.getElementById(NGSSResourcesList[i]).style.display = displayType;
        document.getElementById("dropdownToggle").style.width = width;
        document.getElementById(NGSSResourcesList[i]).style.lineHeight ="2px";
      }
    });

    //Onclick handler for when user clicks anywhere on the page outside of the dropdown.
    document.addEventListener("click", function(event){
      if(isShowing){

        //make sure top of dropdown is showing when it closes
        if(event.target.className != "customDropdown"){
          document.getElementById("alignments").scrollIntoView()
        }

        var width = "150px";
        if(event.target.id != null && event.target.className != "customDropdown"){
            document.getElementById("mynetwork").style.pointerEvents = "auto"
          displayType = "none";
          isShowing = false;
          for(var i = 0; i < docTypesForDropDown.length; i++){
            document.getElementById( docTypesForDropDown[i].labelId).style.display = displayType //enable network when dropdown not showing
          }
          for(var i = 0; i < NGSSResourcesList.length; i++){
            document.getElementById(NGSSResourcesList[i]).style.display = displayType;
            document.getElementById("dropdownToggle").style.width = width;
            document.getElementById("dropdownToggle").style.overflow = "hidden";
            document.getElementById("dropdownToggle").style.height = "21px";
          }
        }
      }
    });

    //event listener for the show all option in the alignments dropdown
    //var showAllChecked = document.getElementById(docTypesForDropDown[docTypesForDropDown.length - 1].checkBoxId);
    var showAllChecked = document.getElementById("TECheckBox");
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

   for(var i = 0; i < docTypesForDropDown.length; i++){
     (function(i){
         document.getElementById(docTypesForDropDown[i].checkBoxId).addEventListener("click", (e)=>{
             if(e.target.checked){
                document.getElementById("TECheckBox").checked = true;
              }
              else{
                if(HasTEDocSelected() == false){
                  document.getElementById("TECheckBox").checked = false;
                }
              }
         });
     })(i)
   }



  //onclick event for each item. If all is selected, all boxes are checked. If all is deselected, all boxes are also deselected.
/* for(var i = 0; i < docTypesForDropDown.length; i++){
    //Add closure to this loop.
    (function(i){
        document.getElementById(docTypesForDropDown[i].checkBoxId).addEventListener("click", function(){
          if(i  == docTypesForDropDown.length - 1){

          }
          else{
            if(areAllSelected()){

                document.getElementById(docTypesForDropDown[docTypesForDropDown.length - 1].checkBoxId).checked = true
                document.getElementById("TECheckBox").checked = true;
            }
            else if(areAllNotSelected()){
                document.getElementById(docTypesForDropDown[docTypesForDropDown.length - 1].checkBoxId).checked = false;
                document.getElementById("TECheckBox").checked = false;
            }

          }
       },true)
    })(i);
  }*/
}


function HasTEDocSelected(){
  var hasSelected = false;
     for(var i = 0; i < docTypesForDropDown.length; i++){
       var curId = docTypesForDropDown[i].checkBoxId;
       if(document.getElementById(curId).checked == true){
         return true;
       }
     }
     return false;
}


/******************************************************************************************
returns true if activities, lessons and curricular units are all not selected. Returns false
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
returns true if activities, lessons and curricular units are all selected Returns false
otherwise.
*****************************************************************************************/
//returns true if activities, lessons and curricular units are all selected
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
  var resultHTML = '<span style=line-height:' + STD_LINE_HEIGHT + ' >';
      resultHTML +=  '('+gradeBand+')  '

    resultHTML += '</span>'

    var displayElipsis = "none";
    var displayMore = "none";
    var displayD1 = "inline";
    var displayD2 = "inline";
    var displayLess = "inline";
    var d1 = des;
    var d2 = "";
    if(des.length > STD_DESCRIPTION_LENGTH){
      d1 = des.substring(0, STD_DESCRIPTION_LENGTH);
      d2 = des.substring(STD_DESCRIPTION_LENGTH, des.length)
      displayMore = "inline";
      displayElipsis = "inline";
      displayD2 = "none";
      displayLess = "none";
    }
    else{
      displayLess = "none"
    }

    resultHTML +=   '<span style="display:'+displayD1+'" id = d1_'+sCode+'>' + d1 + '</span>'
    resultHTML +=   '<span style="display:'+displayElipsis+'" id = elipsis_'+sCode+'>' + " ..." + '</span>';
    resultHTML +=   '<span style =" display:'+displayMore+';color:blue;cursor: pointer" id = more_'+ sCode +' onclick = showFullStdDescription(\'' + sCode + '\')> more </span>'
    resultHTML +=   '<span  style="display:'+displayD2+'" id = d2_'+sCode+'>' + d2 + '</span>'
    resultHTML +=   '<span style ="display:'+displayLess+'; color:blue;cursor: pointer" id = less_'+ sCode +' onclick = showLessStdDescription(\'' + sCode + '\')> less </span>'
    return resultHTML
}


function showFullStdDescription(sCode){
  document.getElementById("more_" + sCode).style.display = "none";
    document.getElementById("elipsis_" + sCode).style.display = "none";
    document.getElementById("less_" + sCode).style.display = "inline";
    document.getElementById("d2_" + sCode).style.display = "inline";
}


function showLessStdDescription(sCode){
  document.getElementById("more_" + sCode).style.display = "inline";
    document.getElementById("elipsis_" + sCode).style.display = "inline";
    document.getElementById("less_" + sCode).style.display = "none";
    document.getElementById("d2_" + sCode).style.display = "none";
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

    this.alignments = [];
    this.numAlignments = 0
    this.alignmentsHash = {};

    this.numNodes = 0;          //Total node count = numStandards + numAlignments
  }

  sortAlignments(){
    for(var i = 1; i < this.alignments.length; i++){
      var tmp = this.alignments[i];
      var j = i - 1;
      while(j >= 0 && this.alignments[j].order > tmp.order){
        this.alignments[j + 1] = this.alignments[j];
        j--;
      }
      this.alignments[j + 1] = tmp;
    }
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


  //Adds a TE alignment vertex to the graph.
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




/****************************************** 3d section ***************************************************************/
//global variables for the newtork data
var NetworkData = null;
var Category = null;
var Category3DType = null;
var GraphDataStructure = null;
var KKCoords3D = null;
var DCIList = null;
var SEPList = null;
var CCList = null;
var CurList = null;
var CurTableRowId = null;
var CategoryDepth = null;
var CurrentSelectedStandard3D = null;  //the selected standard or table row
var CurrentSelectedStandardNode3D = null; //The standard selected in the graph by being clicked on
var REGULAR_NODE_SIZE_3D = 18;
var LARGE_NODE_SIZE_3D = 30;
var BUNDLE_NODE_SIZE_3D = 30;
var HighlightedStandards3D = null;
var CurrentSelectedResourceRow = null;
var CurrentSelectedResourceNode3D = null;
var Gradeband3DTypes = {
  KToTwo:1,
  ThreeToFive:2,
  SixToEight:3,
  NineToTwelve:4,
  AllGrades:5
};

var CurrentGradebands3D = Gradeband3DTypes.AllGrades;
//global variables for the vis.js network
var v_Edges = null;
var v_Nodes = null;
var v_Data = null;
var v_NW = null;
var v_Options = null;

//Global constants
var GET_COMPRIZING = true;
var PrevCategory = null;
function Build3DCategoryDropdown(value){
   if(value == "CC"){
     Category3DType = 1;
     CurList = CCList;
   }
   else if(value == "DCI"){
     Category3DType = 2;
     CurList = DCIList;
   }
   else if(value == "SEP"){
     Category3DType = 3;
     CurList = SEPList;
   }
   else {
     Category3DType = 1;
     CurList = CCList;
   }

   //remove the current values in the dropdown list
   var select = document.getElementById('CategoryStandardsList');
   while (select.firstChild) {
       select.removeChild(select.firstChild);
   }
   var dropdown = document.getElementById('CategoryStandardsList');
   var op1 = new Option();
   op1.value = "--Category--";
   op1.text = "--Category--"
   dropdown.options.add(op1)
   for(var i = 0; i < CurList.length; i++){
     var op = new Option();
     op.value = CurList[i];
     op.text = CurList[i];
     dropdown.options.add(op)
   }

   //add click event to dropdown list we just made
   dropdown.addEventListener("change", function(e){
      Category = e.target.value;

     //for some reason this is sometimes called twice for one change, so make sure LoadNetworkData is only called if value differs from previous
      if(PrevCategory == null || Category != PrevCategory ){
             PrevCategory = Category;
              IncrementHash();
              LoadNetworkData();
      }
   });
}


function Reset3DDropdowns(){
  var select = document.getElementById('CategoryStandardsList');
  while (select.firstChild) {
      select.removeChild(select.firstChild);
  }
  document.getElementById("Category3D").value = "None";
}



function LoadNetworkData(){
  if(Category3DType == null) Category3DType = 1
  if(Category == null) Category = "Cause and Effect";
  console.log(Category)
  var uri = "getGradebandDataApi2.php";
  var req = new XMLHttpRequest();
  var params = "category=" + Category + "&3dType=" + Category3DType.toString();
  req.open("POST", uri, true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onload = async () => {
    if(req.status == 200){
          NetworkData = await JSON.parse(req.responseText);
          console.log("here is the network data ")
          console.log(NetworkData)
          BuildGraphDataStructure3D();
         var gmlString = GetGMLDataString()
          GetKamadaKawaiCoords3D(gmlString);
    }
    else{
      throw new Error("Bad request to GetCCCNetworkApi.php");
    }
  }
  req.send(params);
}

function GetKamadaKawaiCoords3D(dataString){
    var params = "edgeList=" + dataString;
    var uri = "getKKCoordsAPI.php";
    var req =new XMLHttpRequest();
    var kkCoords2D = null;
    req.open("POST", uri, true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = function(){
       if(req.status == 200){
          KKCoords3D = FormatKKCoords(JSON.parse(req.responseText));
          Draw3DNetwork();
          BuildStandardsTable3D(0);
       }
       else{
         console.log(req.status)
         console.log("Failure Getting KK coordinates");
       }

    }

    req.send(params);
}


//FIXME
function InsertRow3D(node){
    var domRef = document.getElementById('t1');
    var newRow = domRef.insertRow(domRef.rows.length);
    var highGrade = node.metadata.highGrade.toString();
    if(highGrade == '0') highGrade = 'K';
    var lowGrade = node.metadata.lowGrade.toString();
    if(lowGrade == '0') lowGrade = 'K';
    var gradeBand = highGrade + "-" + lowGrade;
    newRow.id = node.metadata.sCode;
    newRow.style.backgroundColor = node.color;
    newRow.innerHTML = '<div id = label_'+ node.metadata.sCode+'> <b id = bold_'+ node.metadata.sCode+'> '+node.metadata.sCode+' </b> </div>';
    newRow.innerHTML += '<span id = area_'+ node.metadata.sCode+'> ' + FormatStdDescription(node.metadata.description, node.metadata.sCode, gradeBand)  + '</span>';
    newRow.innerHTML += '<span style ="display:none" id = color_'+node.metadata.sCode+'>' + node.color + '</span>';
    newRow.innerHTML += '<span style = "display:none" id = highlightColor_' + node.metadata.sCode+'>' + node.highlightColor + '</span>';
    newRow.style.borderBottom = "1px solid #A0A0A0";
    newRow.metadata = {color:node.color, highlightColor:node.highlightColor};

    newRow.onclick = function(e){


       //get the sCode of the row that was clicked on
       var idString = e.target.id;
       if(idString.includes("_")){
         idString = idString.split("_")[1];
       }

       if(CurrentSelectedResourceNode3D != null){
         v_Nodes.update({id:CurrentSelectedResourceNode3D.id, color:CurrentSelectedResourceNode3D.color, size:RESOURCE_SHAPE_SIZE})
       }

       if(CurrentSelectedStandard3D != null){
         var oldRow = document.getElementById(CurrentSelectedStandard3D);
         oldRow.style.border = "none";
         oldRow.style.borderBottom = "1px solid #A0A0A0";
         oldRow.style.background = document.getElementById("color_" + CurrentSelectedStandard3D).innerText;
         if(GraphDataStructure.containsStandardNode(CurrentSelectedStandard3D)){
           var node = GraphDataStructure.GetNodeFromSCode(CurrentSelectedStandard3D);
           v_Nodes.update({id:node.id, color:node.color, size:REGULAR_NODE_SIZE_3D});
         }
       }

       CurrentSelectedStandard3D = idString;
       var ref = document.getElementById(idString);
       ref.style.border = "4px solid grey"
       ref.style.background=  document.getElementById("highlightColor_" + CurrentSelectedStandard3D).innerText;
       var node = null;
       if(GraphDataStructure.containsStandardNode(idString)){
          node = GraphDataStructure.GetNodeFromSCode(idString);
         v_Nodes.update({id:node.id, color:node.highlightColor, size:LARGE_NODE_SIZE_3D});
       }

      //rebuild the aligned resources table for the new node that was clicked
     BuildAlignedDocumentsTable3D(node) //fooooo


    }
}


function UnhighlightAllResources3D(){
  var updateResult= [];
  let count = 0;
  for(var i = 0; i  < GraphDataStructure.nodeCount; i++){

    let updateNode = GraphDataStructure.nodesList[i];
    if(updateNode.type == "resource"){

      var set = {id:updateNode.id, color:"red"}
       updateResult[count] = set;
       count++;
    }
  }

  if(count > 0)
  v_Nodes.update({updateResult});
}


var CurGradeBand3D = 0;

function BuildStandardsTable3D(gradeIndex){
//remove the old Standards table
  ClearTable(document.getElementById("t1"))

  var domRef = document.getElementById("standardsTableHeader");
  domRef.innerHTML = '<span>' + 'Standards (' + (GraphDataStructure.nodeCount - 4).toString() + ')    ' + '</span>'
                   + '<span><select id = "Gradeband3DFilter" onchange = RebuildTable3D()>'
                   + '<option value = "0">' + 'All Grades' + '</option>'
                   + '<option value = "1">' + 'K-2' + '</option>'
                   + '<option value = "2">' + '3-5' + '</option>'
                   + '<option value = "3">' + '6-8' + '</option>'
                   + '<option value = "3">' + '9-12' + '</option>'
                   + '</select></span>';

  document.getElementById("Gradeband3DFilter").value = CurGradeBand3D;

  //build the standards table for the 3D network
  for(var i = 0; i < GraphDataStructure.nodeCount; i++){
    var node = GraphDataStructure.nodesList[i];
    if(node.type != "Bundle" && node.type != "resource"){
        if(gradeIndex == 0){
            InsertRow3D(node);
        }

        else if(gradeIndex == 1){
            if(node.metadata.highGrade <= 2){
              InsertRow3D(node);
            }
        }

        else if(gradeIndex == 2){
           if(node.metadata.lowGrade >= 3 && node.metadata.highGrade <= 5){
             InsertRow3D(node);
           }
        }

        else if(gradeIndex == 3){
           if(node.metadata.lowGrade >= 6 && node.metadata.highGrade <= 8){
             InsertRow3D(node);
           }
        }

        else if(gradeIndex == 4){
          if(node.metadata.lowGrade >= 9){
            InsertRow3D(node);
          }
        }

    }
  }

}

function RebuildTable3D(){
  var index = document.getElementById("Gradeband3DFilter").value;
  CurGradeBand3D = index;
  BuildStandardsTable3D(index);
}

function Draw3DNetwork(){

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
     var x = KKCoords3D[i].x;
     var y = KKCoords3D[i].y;
      v_Nodes.add({
      id:node.id,
      label:nodeAtt.label,
      title: FormatNodeDescriptionForPopup(nodeAtt.title),
      color:node.color,
      highlightColor:node.highlightColor,
      font:{size:nodeAtt.size},
      type:nodeAtt.type,
      shape:nodeAtt.shape,
      size:nodeAtt.size,
      highlightSize:nodeAtt.highlightSize,
      x:x,
      y:y
    });
    count++;
  }
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
   v_NW.on("click", function(properties){
       if(properties.nodes.length > 0){
            ResetNodeSizes3D();
            var ids = properties.nodes;
            var clickedNode = v_Nodes.get(ids)[0];

            //handle click event for all standards
            if(clickedNode.id  <= 4){
              var nodeId = clickedNode.id;
              var CCCNode = GraphDataStructure.GetNodeFromID(nodeId);
              var nodesList = CCCNode.metadata.CCCList;
              HighlightNodes(nodesList)
            }

            //onclick events for standards
            else if(clickedNode.type != "resource" && clickedNode.type != "Bundle"){
              if(clickedNode.label != CurrentSelectedStandard3D){
                var myDataUpdate = [];
                var myDataCount = 0;
                for(var i = 0; i < GraphDataStructure.nodeCount; i++){
                  var theNode = GraphDataStructure.nodesList[i];
                  if(theNode.type != "resource") continue;
                  var myData = {id:theNode.id, color:theNode.color, size: RESOURCE_SHAPE_SIZE};
                  myDataUpdate[myDataCount] = myData;
                  myDataCount++;

                }
                v_Nodes.update(myDataUpdate)
              }
              BuildAlignedDocumentsTable3D(clickedNode);
              if(CurrentSelectedStandard3D != null && GraphDataStructure.containsStandardNode(CurrentSelectedStandard3D)){
                var node = GraphDataStructure.GetNodeFromSCode(CurrentSelectedStandard3D)
                v_Nodes.update({id:node.id, color:node.color, size:REGULAR_NODE_SIZE_3D});
                if(document.getElementById(CurrentSelectedStandard3D)){
                  document.getElementById(node.metadata.sCode).style.background = document.getElementById("color_" + CurrentSelectedStandard3D).innerText;
                  document.getElementById(node.metadata.sCode).style.border = "none"
                }
              }
              CurrentSelectedStandard3D = clickedNode.label;
              v_Nodes.update({id:clickedNode.id, color:clickedNode.highlightColor, size:LARGE_NODE_SIZE_3D});
              if(document.getElementById(clickedNode.label)){
                document.getElementById(clickedNode.label).style.background = clickedNode.highlightColor;
                document.getElementById(clickedNode.label).style.border = "4px solid grey";
                document.getElementById(CurrentSelectedStandard3D).scrollIntoView();
              }
            }


            //unhighlight the resource node no matter what type of node was clicked
            if(CurrentSelectedResourceNode3D != null){
              v_Nodes.update({id:CurrentSelectedResourceNode3D.id, color:CurrentSelectedResourceNode3D.color, size:RESOURCE_SHAPE_SIZE});
            }
            //onclick event for resource node. If node is in current graph, highlight it and the coorisponding table cell
           if(clickedNode.type == "resource"){


                //current node is updated to be the one just clicked
                CurrentSelectedResourceNode3D = clickedNode;

                //highlight the clicked resource node in the graph
                if(document.getElementById(clickedNode.id)){
                    v_Nodes.update({id: clickedNode.id, color:clickedNode.highlightColor, size:RESOURCE_SHAPE_HIGHLIGHT_SIZE});
                }

                //unhighlight all rows in the resources table
                for(var i = 0; i < GraphDataStructure.nodeCount; i++){
                  if(GraphDataStructure.nodesList[i].type == "resource" && document.getElementById(GraphDataStructure.nodesList[i].id)){
                    document.getElementById(GraphDataStructure.nodesList[i].id).style.border = "4px solid #A0A0A0";;
                    document.getElementById(GraphDataStructure.nodesList[i].id).style.background = GraphDataStructure.nodesList[i].color
                  }
                }

                //highlight the coorisponding row in the resource table
                if(document.getElementById(clickedNode.id)){
                  document.getElementById(clickedNode.id).style.background = clickedNode.highlightColor;
                  document.getElementById(clickedNode.id).style.border = "4px solid grey";
                }
            }

       }

   });
   ImproveNetworkLayout3D();
   ShowHideAlignmentsBasedOnDropdown();
  //double click event handling for the categories 3D network
   v_NW.on("doubleClick", function(properties){
     var ids = properties.nodes;
     var clicked = v_Nodes.get(ids)[0];
     if(clicked.type != "Bundle"){
        document.getElementById("Category3D").value = "None";
        document.getElementById("CategoryStandardsList").value="Category";

        document.getElementById("sCode").value = clicked.label;
        CurrentNetworkMode = NetworkModes.GRADEBAND
        submit(clicked.label, false);
        return;
     }
     //set the global enum that tracks which gradband bundle is showing. All show by default
     else if(clicked.id == 1){
       CurrentGradebands3D = Gradeband3DTypes.KToTwo;
     }
     else if(clicked.id == 2){
       CurrentGradebands3D = Gradeband3DTypes.ThreeToFive;
     }
     else if(clicked.id == 3){
       CurrentGradebands3D = Gradeband3DTypes.SixToEight;
     }
     else if(clicked.id == 4){
       CurrentGradebands3D = Gradeband3DTypes.NineToTwelve;
     }
     else {
        CurrentGradebands3D = Gradeband3DTypes.AllGrades;
     }
     GraphDataStructure = null;
     BuildGraphDataStructure3D();
     var gmlString = GetGMLDataString()

      GetKamadaKawaiCoords3D(gmlString);
   });


}


function ResetNodeSizes3D(){
   if(HighlightedStandards3D != null){
     for(var i = 0; i < HighlightedStandards3D.length; i++){
       if(GraphDataStructure.containsStandardNode(HighlightedStandards3D[i].sCode)){
         v_Nodes.update({
            id: GraphDataStructure.GetNodeFromSCode(HighlightedStandards3D[i].sCode).id,
            font:{size: REGULAR_NODE_SIZE_3D}
         });
       }
     }
   }
}


//highlights any of the nodes in the list if they are in the graph
function HighlightNodes(nodesList){

ResetNodeSizes3D();
HighlightedStandards3D = nodesList;
 for(var i = 0; i < nodesList.length; i++){
   var id = nodesList[i].id;
   if(GraphDataStructure.containsStandardNode(nodesList[i].sCode)){
     v_Nodes.update({
        id: GraphDataStructure.GetNodeFromSCode(nodesList[i].sCode).id,
        font:{size: LARGE_NODE_SIZE_3D}
     })
   }
 }
}


function ImproveNetworkLayout3D(){
  //Pull all PEs towards the center to give the graph a nice curved shape
  var moveX = 35;
  var moveY = 15;
  var resultArr = [];
  var count = 0;
  for(var i = 0; i< GraphDataStructure.nodeCount; i++){
    if(GraphDataStructure.nodesList[i].type == "Bundle"){
        var oldX = v_NW.body.nodes[ GraphDataStructure.nodesList[i].id].x;
        var oldY = v_NW.body.nodes[ GraphDataStructure.nodesList[i].id].y;
        if(oldX > 0) oldX = oldX - moveX
        else oldX = oldX +  moveX
        if(oldY > 0) oldY = oldY - moveY
        else oldY = oldY + moveY
        var row = {id: GraphDataStructure.nodesList[i].id, x:oldX, y:oldY }
        resultArr[count] = row;
        count++
    }
  }
  v_Nodes.update(resultArr)
}

function GetNodeAttributes(node){
   var attribs = {};
   attribs.type = node.type;
   if(node.type == "topic" || node.type == "PE" || node.type == "CC" || node.type == "DCI" || node.type == "SEP"){
     attribs.label = node.metadata.sCode;
     attribs.shape = null;
     //give pCode arrib if not a CC or SEP node
     var pCode = GetPCodeFromSCode(node.metadata.sCode);
     if(node.type != "CC" && node.type != "SEP"){
          attribs.pCode = pCode;
     }

     //set the label to pCode, sCode, or " " based on the display type and the node type
     if(NodeDisplayType == ModeEnum.NGSS){
         if(node.type != "CC" && node.type != "SEP"){
           attribs.label = pCode;
         }
         else{
           attribs.label = BLANK_NODE_LABEL;
         }
     }


     if(node.type != "CC" && node.type != "SEP"){
       attribs.pCode = GetPCodeFromSCode(node.metadata.sCode);
       if(document.getElementById("displayType").value == "2"){
         attribs.label = attribs.pCode;
       }
     }

     attribs.pCode = pCode;
     attribs.title = node.metadata.description;
     attribs.size = REGULAR_NODE_SIZE_3D;
     attribs.highlightSize = LARGE_NODE_SIZE_3D;

   }

   //get the node display info for resource nodes
   else if(node.type == "resource"){

     attribs.label = "";
     attribs.title = node.metadata.title;
     var symbolId = getAlignmentSymbolIndex(node.metadata.provider);
     attribs.size = RESOURCE_SHAPE_SIZE;
     attribs.highlightSize = RESOURCE_SHAPE_HIGHLIGHT_SIZE;
     var nodeShape = resourceSymbols[symbolId].shape;
     attribs.shape = nodeShape;
   }

   else if(node.type == "Bundle"){
     attribs.shape = null;
     attribs.title = "Category" //FIXME  hover description
     attribs.size = BUNDLE_NODE_SIZE_3D;
     attribs.highlightSize = BUNDLE_NODE_SIZE_3D;
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


function GetResourceNodesAndEdges3D(nodeIdStart){
   //Add all resource nodes in graph that are selected in the Provider dropdown
   let myId  = nodeIdStart
   //Get a list of the providers whose resources will be added to the graph
   var providersHash = {};
   if(document.getElementById("TECheckBox").checked){
       providersHash["TeachEngineering"]  = "TeachEngineering";
   }
   for(var i = 0; i < NGSSResourcesList.length; i++){
     if(document.getElementById(NGSSResourcesList[i] + "_Checkbox").checked){
        providersHash[NGSSResourcesList[i]] = NGSSResourcesList[i]
     }
   }

   //For every standard in the graph, get its aligned resources. For each resource, if showing, create new resource node and add to the graph
  var resourcesHash = {};

  //For every standard in NGSSGraph, get that standard if in the current graph data structure
  for(var i = 0; i < NGSSGraph.length; i++){
    var node = NGSSGraph[i];
    if(!GraphDataStructure.containsStandardNode(node.sCode)) continue;

    //get all the aligned resource to that node that are in the list of selected providers //nodeType == provider name
    var nodeAlignmentIds = node.alignedResources;
    for(var j = 0; j < nodeAlignmentIds.length; j++){
      var resourceNode = NGSSResources[nodeAlignmentIds[j]];
      if(!providersHash[resourceNode.nodeType]) continue; //skip if provider not selected from dropdown list

      //A new node to add to the graph data structure. If node already in graph, don't add to graph. Then add the edge from the current standard to the new resource node
      var newResourceNode = new Node();

      //get all the metadata for the new resource Node
      var m = {};
      if(resourceNode.nodeType == "TeachEngineering"){
           m.docType = resourceNode.docType;
      }
      newResourceNode.type = "resource";
      newResourceNode.order = 6;
      newResourceNode.id = nodeIdStart;
      m.resource = resourceNode.document;
      m.provider = resourceNode.nodeType;
      m.summary = resourceNode.summary;
      m.title = resourceNode.title;
      m.url = resourceNode.url;
      var symbolId = getAlignmentSymbolIndex(m.provider);
      newResourceNode.color =  resourceSymbols[symbolId].color;
      newResourceNode.highlightColor = resourceSymbols[symbolId].highlightColor
      newResourceNode.metadata = m;

      var theNode = null;

      //add the node the the graph if not already in the graph
      if(!GraphDataStructure.containsResourceNode(resourceNode.document)) {
         newResourceNode.id = myId;
         GraphDataStructure.addNode(newResourceNode);
         myId++;

         //The edge we add is to the new node just created
         theNode = newResourceNode;
      }

      //the edge node is one that is already in the graph object, so we find it
      else{
        theNode = GraphDataStructure.GetResourceNodeFromName(resourceNode.document)
      }

     //if no edge exists between standard and resource, add the edge
     if(!GraphDataStructure.hasEdge(theNode.id, GraphDataStructure.GetNodeFromSCode(node.sCode).id)){

         GraphDataStructure.addEdge(theNode.id, GraphDataStructure.GetNodeFromSCode(node.sCode).id);
     }
     newResourceNode = null;
    }
  }
}

function BuildGraphDataStructure3D(){

  //add the standard nodes
  var nextId  = GetNetworkNodes3D();

  //add the nodes and edges for resource alignments
  GetResourceNodesAndEdges3D(nextId);

  //add the edges between connected standards
  GetNetworkEdges3D();

  if(CurrentSelectedResourceRow != null){
    v_Nodes.update({id:CurrentSelectedResourceRow.id, color:CurrentSelectedResourceRow.color, size:RESOURCE_SHAPE_SIZE});
    CurrentSelectedResourceRow = null;
  }
  if(CurrentSelectedResourceNode3D != null){
    v_Nodes.update({id:CurrentSelectedResourceNode3D.id, color:CurrentSelectedResourceNode3D.color, size:RESOURCE_SHAPE_SIZE});
    CurrentSelectedResourceNode3D = null;
  }

  UpdateResourceDropdown();
  ClearTable(document.getElementById('t2'));
}



function GetGMLDataString(){

  var dataString = "GetKKCoords('graph[\n	 label \"NGSS K-2\"\n";

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


function GetNetworkNodes3D(){

  if(NetworkData == null){
    console.log("NetworkData has not been initailized");
    return;
  }
  var comprizorsHash = {};
  GraphDataStructure = new NGSSGraph3D();
  var nodeIdStart = 5;

  //Add a node for each gradband bundle of 3d standards for the current category
  for(var i = 0; i < NetworkData.length; i++){

     //don't add bundles not selected
     if(CurrentGradebands3D != Gradeband3DTypes.AllGrades){
       if(i == 0 && CurrentGradebands3D != Gradeband3DTypes.KToTwo) continue;
       if(i == 1 && CurrentGradebands3D != Gradeband3DTypes.ThreeToFive) continue;
       if(i == 2 && CurrentGradebands3D != Gradeband3DTypes.SixToEight) continue;
       if(i == 3 && CurrentGradebands3D != Gradeband3DTypes.NineToTwelve) continue;
     }
     //create the bundle node obect
     var node = new Node();
     node.id = (i + 1);
     node.type = "Bundle"
     node.order = 7;
     if(Category3DType == 1){
       node.color = GREEN_COLOR[0];
       node.highlightColor = GREEN_COLOR[0];
     }
     else if(Category3DType == 2){
       node.color = ORANGE_COLOR[0];
       node.highlightColor = ORANGE_COLOR[0];
     }
     else if(Category3DType == 3){
       node.highlightColor = BLUE_COLOR[0];
     }
     var cccList = NetworkData[i].CCCList
     var m = {};
     m.CCCList = cccList;
     node.metadata = m;

     GraphDataStructure.addNode(node);
     nodeIdStart++;
  }


  //Add PEs and comprizing standards to the network for each gradeband
  for(var i = 0; i < NetworkData.length; i++){  //for each gradeband
       for(var j = 0; j < NetworkData[i].PEList.length; j++){ //for each pe in that gradeband

         //add that pe
         var pe = NetworkData[i].PEList[j];
         if(CurrentGradebands3D != Gradeband3DTypes.AllGrades){
            if(pe.highGrade <= 2 && CurrentGradebands3D != Gradeband3DTypes.KToTwo) continue;
            if(pe.highGrade <= 5 && pe.lowGrade >= 3 && CurrentGradebands3D != Gradeband3DTypes.ThreeToFive) continue;
            if(pe.highGrade <= 8 && pe.lowGrade >= 6 && CurrentGradebands3D != Gradeband3DTypes.SixToEight) continue;
            if(pe.highGrade <= 12 && pe.lowGrade >= 9 && CurrentGradebands3D != Gradeband3DTypes.NineToTwelve) continue;
         }
         var peNode = new Node();
          peNode.id =  nodeIdStart;
          peNode.type = "PE";
          peNode.color = GREY_COLOR[0];
          peNode.highlightColor = GREY_COLOR[2];
          peNode.order = 2;
          var metadata = {};
          metadata.description = pe.description;
          metadata.lowGrade = pe.lowGrade;
          metadata.highGrade = pe.highGrade;
          metadata.sCode = pe.sCode;
          metadata.pCode = GetPCodeFromSCode(pe.sCode);
          if(comprizorsHash[pe.sCode]){  //skip ones already added
            continue;
          }
          comprizorsHash[pe.sCode] = pe.sCode
          peNode.metadata = metadata;
          GraphDataStructure.addNode(peNode);
          nodeIdStart++;

          //add all the 3d standards to the graph.
          if(CurNetworkDepth != 1){
            //make sure duplicate 3d standards are not added
            for(var k = 0; k < pe.ComprizingStandards.length; k++){
               var compId = pe.ComprizingStandards[k];
               var comp = NetworkData[i].ComprizingStandardsList[compId]
               if(CurrentGradebands3D != Gradeband3DTypes.AllGrades){
                  if(comp.highGrade <= 2 && CurrentGradebands3D != Gradeband3DTypes.KToTwo) continue;
                  if(comp.highGrade <= 5 && comp.lowGrade >= 3 && CurrentGradebands3D != Gradeband3DTypes.ThreeToFive) continue;
                  if(comp.highGrade <= 8 && comp.lowGrade >= 6 && CurrentGradebands3D != Gradeband3DTypes.SixToEight) continue;
                  if(comp.highGrade <= 12 && comp.lowGrade >= 9 && CurrentGradebands3D != Gradeband3DTypes.NineToTwelve) continue;
               }
               if(comprizorsHash[comp.sCode]){  //skip ones already added
                 continue;
               }

                m = {};
               comprizorsHash[comp.sCode] = comp.sCode;
               var node3D = new Node();
               node3D.id = nodeIdStart;
               node3D.type  = comp.category;
               if(comp.category == "CC"){
                 node3D.color = GREEN_COLOR[0];
                 node3D.highlightColor = GREEN_COLOR[2];
                 node3D.order = 3;
               }
               else if(comp.category == "DCI"){
                 node3D.color = ORANGE_COLOR[0];
                 node3D.highlightColor = ORANGE_COLOR[2];
                 m.pCode = GetPCodeFromSCode(comp.sCode);
                 node3D.order = 4;
               }
               else if(comp.category == "SEP"){
                 node3D.color = BLUE_COLOR[0];
                 node3D.highlightColor = BLUE_COLOR[2];
                 node3D.order = 5;
               }
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

  if(CurNetworkDepth != 1){
  for(var i = 0; i <  NetworkData.length; i++){
    var topics = NetworkData[i].TopicsList;
    for(var j = 0; j < topics.length; j++){
      if(CurrentGradebands3D != Gradeband3DTypes.AllGrades){
         if(topics[j].highGrade <= 2 && CurrentGradebands3D != Gradeband3DTypes.KToTwo) continue;
         if(topics[j].highGrade <= 5 && topics[j].lowGrade >= 3 && CurrentGradebands3D != Gradeband3DTypes.ThreeToFive) continue;
         if(topics[j].highGrade <= 8 && topics[j].lowGrade >= 6 && CurrentGradebands3D != Gradeband3DTypes.SixToEight) continue;
         if(topics[j].highGrade <= 12 && topics[j].lowGrade >= 9 && CurrentGradebands3D != Gradeband3DTypes.NineToTwelve) continue;
      }
      comprizorsHash[topics[j].sCode] = topics[j].sCode
      var n = new Node();
      var m = {};
      n.id = nodeIdStart;
      m.sCode = topics[j].sCode;
      m.description = topics[j].description;
      m.lowGrade = topics[j].lowGrade;
      m.highGrade = topics[j].highGrade;
      m.pCode =  GetPCodeFromSCode(topics[j].sCode);
      n.metadata = m;
      n.type = "topic";
      n.order = 1;
      n.color = PURPLE_COLOR[0];
      n.highlightColor = PURPLE_COLOR[2];
      GraphDataStructure.addNode(n);
      nodeIdStart++;
    }
  }
  }
  GraphDataStructure.SortStandards();
  return nodeIdStart; //so we know what id to start with when building any aligned resources
}


function GetNetworkEdges3D(){

     //add edges connecting the gradeband categories
     if(CurrentGradebands3D == Gradeband3DTypes.AllGrades){
      for(var i = 1; i < 4; i++){
        GraphDataStructure.addEdge(i, i + 1);
      }
    }
      //add connections from gradband categories to PE's
      for(var i = 0; i < 4; i++){
           var categoryId = (i + 1);
           var category = NetworkData[i];

           //add every PE connected to that category in the gradeband
           for(var j = 0; j < category.PEList.length; j++){
             var pe = GraphDataStructure.GetNodeFromSCode(category.PEList[j].sCode);
             if(!pe) continue;
             if(!GraphDataStructure.hasEdge(categoryId, pe.id))
             GraphDataStructure.addEdge(categoryId, pe.id);
           }
      }

      //add connections from PEs to comprizing standards
        if(CurNetworkDepth != 1){
        for(var i = 0; i < 4; i++){
          for(var j = 0; j < NetworkData[i].PEList.length; j++){
            var pe = NetworkData[i].PEList[j];
            for(var k = 0; k < pe.ComprizingStandards.length; k++){
              var connected3DStandardIndex = pe.ComprizingStandards[k];
              var connected3DStandard = NetworkData[i].ComprizingStandardsList[connected3DStandardIndex];
              var peInGraph = GraphDataStructure.GetNodeFromSCode(pe.sCode);
              if(peInGraph == null) continue;
              var connected3DStandard = GraphDataStructure.GetNodeFromSCode(connected3DStandard.sCode);
              if(connected3DStandard == null) continue;
              if(!GraphDataStructure.hasEdge(peInGraph.id, connected3DStandard.id)){
                  GraphDataStructure.addEdge(peInGraph.id, connected3DStandard.id);
              }
            }
          }
        }
      }

      //add connections from topics to PE's
    if(CurNetworkDepth != 1){
      for(var i = 0; i < 4; i++){
        for(var j = 0; j < NetworkData[i].PEList.length; j++){
            var pe = NetworkData[i].PEList[j];
            var topicId = pe.topicIndex;
            var topic = NetworkData[i].TopicsList[topicId];
            var  topicInGraph = GraphDataStructure.GetNodeFromSCode(topic.sCode);
            var peInGraph = GraphDataStructure.GetNodeFromSCode(pe.sCode);
            if(topicInGraph == null || peInGraph == null) continue;

           if(!GraphDataStructure.hasEdge(peInGraph.id, topicInGraph.id)){
                GraphDataStructure.addEdge(peInGraph.id, topicInGraph.id)
           }
        }
      }
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

           }
      }
      else{
        throw new Error("Bad request to ccc.php");
      }
    }
    req.send(null);
}




class Node{

  constructor(){
    this.id = null;
    this.type = null;
    this.color = null;
    this.highlightColor = null;
    this.order = null;
    this.metadata = [];
  }
}

class NGSSGraph3D{
  constructor(){
    this.nodesList = [];
    this.edgesList = [];
    this.nodeCount = 0;
    this.edgeCount = 0;

    //private members for data integrity checking
    this.StandardsHashMap = {};
    this.resourcesHashMap = {};
    this.nodesHashMap = {};
    this.EdgesHashMap = {};
  }


  //Add a node object to the graph. Throw exeption if node already in the graph.
  addNode(newNode){

    //If new node is a standard, check that node with this sCode is not already in the graph object
      if(newNode.type == "PE" || newNode.type == "CC" || newNode.type == "SEP" || newNode.type == "DCI" || newNode.type == "topic"){
        if(this.StandardsHashMap[newNode.sCode]){
          throw new Error("A PE with sCode = " + newNode.sCode + " already exists");
        }
        this.StandardsHashMap[newNode.metadata.sCode] = newNode.metadata.sCode;
      }

      //if node being added is a resource, check that a resource node with that name not already in the graph
      if(newNode.type == "resource"){
        if(this.resourcesHashMap[newNode.metadata.resource]){
          throw new Error("The resource " + newNode.metadata.resource + " already exists");
        }
        this.resourcesHashMap[newNode.metadata.resource] = newNode.metadata.resource;
      }
      this.nodesList[this.nodeCount] = newNode;
      this.nodeCount +=1;

      //check that no node with this id is already in network
      if(this.nodesHashMap[newNode.id]){
          throw new Error("A node with id = " + newNode.sCode + " already exists");
      }
      this.nodesHashMap[newNode.id] = newNode.id;
  }

  containsStandardNode(sCode){
      if(this.StandardsHashMap[sCode]){
        return true;
      }
      return false;
  }

  containsResourceNode(resourceName){
    if(this.resourcesHashMap[resourceName]){
      return true;
    }
    return false;
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

  SortStandards(){
    for(var i = 1; i < this.nodeCount; i++){
      var tmp = this.nodesList[i];
      var j = i - 1;
      while(j >= 0 && this.nodesList[j].order > tmp.order){
        this.nodesList[j + 1] = this.nodesList[j];
        j--;
      }
      this.nodesList[j + 1] = tmp;
    }
  }

 //returns an array of resource nodes that are aligned to the standard with the given id
 GetAlignedResources(id){
    //get list of node ids that have an edge to id
    var ids = [];
    var index = 0;
    for(var i = 0; i < this.edgesList.length; i++){
       if(this.edgesList[i].target == id){
          ids[index] = this.edgesList[i].source;
          index++;
       }
       else if(this.edgesList[i].source == id){
         ids[index] = this.edgesList[i].target;
         index++;
       }
    }

    var resourcesList = [];
    index = 0;
    for(var i = 0; i < ids.length; i++){
       var node = this.GetNodeFromID(ids[i]);
       if(node.type == "resource"){
         resourcesList[index] = node;
         index++;
       }
    }
    return resourcesList;
 }


  //takes the name/title of the resource, and returns the coorisponding resource
  GetResourceNodeFromName(resourceName){
    for(var i = 0; i < this.nodeCount; i++){
      if(this.nodesList[i].type == "resource"){
        if(this.nodesList[i].metadata.resource == resourceName){
          return this.nodesList[i];
        }
      }
    }
    return null;
  }


 //Takes the sCode of a standard and returns the coorisponding node
  GetNodeFromSCode(sCode){
    for(var i = 0; i < this.nodeCount; i++){
      if(this.nodesList[i].type != "Bundle"){
        if(this.nodesList[i].metadata.sCode == sCode) {
          return this.nodesList[i];
        }
      }
    }
    return null;  //lets us know that node with that sCode was not in the graph
  }

  GetNodeFromID(id){
    for(var i = 0; i < this.nodeCount; i++){
        if(this.nodesList[i].id == id) {
          return this.nodesList[i];
        }
    }
    return "not found";  //lets us know that node with that sCode was not in the graph
  }


}
