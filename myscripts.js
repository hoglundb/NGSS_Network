
var standardsCount = 0;
var alignmentsCount = 0;

//Submits the search form if enter key is pressed
document.onkeyup = enter;
function enter(e){
  if(e.which == 13)
	submit();
	else e.preventDefault
}

window.onload = function(){
  init()  //regester events for alignments dropdown
  alignLegend();
  input = document.getElementById("sCode");  //set the default sCode in the search bar
  input.value = "S2467886"
  document.getElementById("networkDepth").value = 0;
  window.location.hash = ''

  //Set the legend colors
  document.getElementById("label1").style.background = PURPLE_COLOR[0];
  document.getElementById("label2").style.background = GREY_COLOR[0];
  document.getElementById("label3").style.background = BLUE_COLOR[0];
  document.getElementById("label4").style.background = ORANGE_COLOR[0];
  document.getElementById("label5").style.background = GREEN_COLOR[0];
}




window.addEventListener("hashchange", async (e) => {

  if(isBack && window.location.hash){

    submitViaHash();
  }
  isBack = true;
});



function submitBtn(){
  submit()
  updateHash();
}

function submitViaHash(){
      var hash = window.location.hash;
      var params = parseHash(hash);


      //set the alignments check boxes to their previous state
        for(var i = 0; i < docTypesForDropDown.length; i++){
          var newVal = false;
          if(params.alignments[i] == 't'){
             newVal = true;
          }
          document.getElementById(docTypesForDropDown[i].checkBoxId).checked = newVal
        }
        //set other inputs to their previous state
        document.getElementById("networkDepth").value = params.networkDepth;
        document.getElementById("gradeBand").value = params.gradeBand;
        document.getElementById("displayType").value = params.displayType;


        ClearTable(document.getElementById("t1"))
	      RemoveNetwork("mynetwork");
        //build the post array from the hash parameters that have been parsed
        var depth = params.networkDepth;
        if(depth = 0) depth = 2
        var params = "sCode=" + params.sCode + "&gradeBand=" + params.gradeBand + "&networkDepth=" + 2;
        var req = new XMLHttpRequest();
        var url = "getGradebandNetworkAPI2.php";

        req.open("POST", url, true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.onload = function(){
          if(req.status == 200){
            rawMapData = req.responseText;
            CreateMap(REGULAR_NODE_SIZE, LARGE_NODE_SIZE, DOC_NODE_SIZE);
            BuildAlignedDocumentsTable(sCode);
          }
        }
        req.send(params);

}
/*ClearTable(document.getElementById('t1'));
var req = new XMLHttpRequest();
var url = "getGradebandNetworkAPI2.php";
var params = "sCode=" + sCode
           + "&gradeBand=0"
           + "&networkDepth=" + networkDepth;

req.open("POST", url, true);
req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
req.onload = async function(){
  if(req.status == 200){
    rawMapData = req.responseText;
    CreateMap(REGULAR_NODE_SIZE, LARGE_NODE_SIZE, DOC_NODE_SIZE);
    BuildAlignedDocumentsTable(sCode);

    await updateHash();
  isGoingBack = true;
    //CreateTable(req.responseText, REGULAR_NODE_SIZE, LARGE_NODE_SIZE, 3);
  }
}
req.send(params);*/


//parse the hash into the parameters that can be submitted via ajax
function parseHash(hash){
  var params = new Object();
  var startSCode = 1;
  var endSCode = 9;
  params.sCode = hash.substring(startSCode,endSCode);

  var alignments = [];
  var startAlignments = endSCode;
  for(var i = 0; i < docTypesForDropDown.length; i++){
     alignments[i] = hash.substring(startAlignments, startAlignments + 1);
     startAlignments ++;
  }
  params.alignments = alignments;

  var next = startAlignments;
  params.networkDepth = hash.substring(next, next + 1);
  next++;
  params.displayType = hash.substring(next, next + 1);
  next++;
  params.gradeBand = hash.substring(next, next + 1);
  return params
}


function init(){
  initDropdown();
  initNetworkDepth();
  initDisplayType();
  initGradeBand();
}

function initNetworkDepth(){
  node = document.getElementById("networkDepth")
  node.addEventListener("change", (e) =>{
    submitBtn()
  });
}

function initDisplayType(){
  node = document.getElementById("displayType");
  node.addEventListener("change", (e) => {
    updateHash();
    displayToggle();
  });
}

function initGradeBand(){
  node = document.getElementById("gradeBand");
  node.addEventListener("change", (e) => {
    updateHash();
    generateEntireNGSS();
  });
}
//Objects to hold all the nodes and edges for the vis.js dataset
var nodes;
var edges;

//Deterimins nodes sizes on the graph
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

//global array that holds alignments dropdown list info
var docTypesForDropDown = getDropDownTypesArray();


var currentSelectedNode = 'S2454554'; //tracks the current standard being viewd
var currentSelectedNodeColor = PURPLE_COLOR[0];  //default the selected node to purple since it is a topic
var selectedDocNodeId = null;
var currentTableRow = "";
var currentDocsTableRow = null;
var rawMapData = null;
var nw = null;
var isGoingBack = true;


var isBack = true;
function updateHash(){
  isBack = false;
  var hashString = currentSelectedNode;

  for(var i = 0; i < docTypesForDropDown.length; i++){
    if(document.getElementById(docTypesForDropDown[i].checkBoxId).checked){
      hashString += "t"
    }
    else {
      hashString += 'f'
    }
  }

  //end of hash string

  hashString += document.getElementById("networkDepth").value;
  hashString += document.getElementById("displayType").value;
  hashString += document.getElementById("gradeBand").value;
  window.location.hash = hashString

}



//gets the current page state: textboxes and dropdowns, etc.
function getPageState(){
   var pageState = new Object();
   pageState.sCode = currentSelectedNode;
   pageState.gradeBand = document.getElementById("gradeBand").value
   pageState.networkDepth = document.getElementById("networkDepth").value;
   pageState.displayType = document.getElementById("displayType").value;

   var alignments = []
   for(var i = 0; i < docTypesForDropDown.length; i++){
     if(document.getElementById(docTypesForDropDown[i].checkBoxId).checked){
       alignments[i] = true;
     }
     else alignments[i] = false;
   }
   pageState.alignments = alignments

   return pageState
}


function setTextBoxOnSearch(sCode){
  //set the text box for sCode to have the code searched by
  var showNGSSCode = false;
  if(document.getElementById("displayType").value == 2){
    showNGSSCode = true;
  }

  if(showNGSSCode && rawMapData){

    var theData = JSON.parse(rawMapData)
     //get the coorisponding pCode
     for(var i = 0; i < theData[0].length; i++){
       if(theData[0][i].sCode == sCode){

         if(theData[0][i].pCode != "error1"){
            document.getElementById("sCode").value = theData[0][i].pCode;
         }
         else{
           document.getElementById("sCode").value = null
         }
         break;
       }
     }
  }
  else{
    document.getElementById("sCode").value = sCode;
  }
}

//If parameter is selected, submit with it as the sCode. Otherwise use the sCode in the search box.
function submit(sCodeSearch){
  isGoingBack = false
  var sCode = null;
  if(sCodeSearch) sCode = sCodeSearch;

  else sCode = document.getElementById('sCode').value;
  setTextBoxOnSearch(sCode);

  document.getElementById("gradeBand").options.selectedIndex = 0;  //reset gradeband dropdown to default

  currentSelectedNode = sCode;
  var networkDepth = document.getElementById('networkDepth').value;

  //the default network depth if not selected
  if(networkDepth == 0) {
    networkDepth = 2;
    document.getElementById('networkDepth').value = 2;
  }
//Set to default node label if not selected
if(document.getElementById("displayType").value == 0){
  document.getElementById("displayType").value = 1;
}
  document.getElementById("currentNodeScode").value = sCode;
	ClearTable(document.getElementById('t1'));
	var req = new XMLHttpRequest();
	var url = "getGradebandNetworkAPI2.php";
	var params = "sCode=" + sCode
             + "&gradeBand=0"
             + "&networkDepth=" + networkDepth;

	req.open("POST", url, true);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onload = async function(){
		if(req.status == 200){
      rawMapData = req.responseText;
      var d = JSON.parse(rawMapData)[0];
      console.log(JSON.parse(rawMapData)[3])
      for(var i = 0; i < d.length; i++){
        console.log(i.toString() + ": " + d[i].xCoordinate + ", " + d[i].yCoordinate);
      }
      console.log(JSON.parse(rawMapData)[3]);
			CreateMap(REGULAR_NODE_SIZE, LARGE_NODE_SIZE, DOC_NODE_SIZE);
      BuildAlignedDocumentsTable(sCode);
      setTextBoxOnSearch(sCode)
      console.log(sCode)
      document.getElementById(sCode).scrollIntoView();
		}
	}
	req.send(params);
}


//Changes the display of the network from sCode to pCode and vice versa
function displayToggle(){
  var ASNToNGSS = true;
  if(document.getElementById("displayType").value == 1) ASNToNGSS = false;
  //get node and network data
  var rawNetwork= JSON.parse(rawMapData);
  var networkSize = rawNetwork[0].length;

  var dataString = "[";
  for(i = 0; i < networkSize; i++){
     if(rawNetwork[0][i].id >= 10000) continue; //skip over document nodes

     //if we have reached the node that was serched by, update sCode to pCode or visa versa

     setTextBoxOnSearch(currentSelectedNode); //set the text box value based on if the display type selected

      dataString += "{";
      dataString += '"' + "id" + '"' + ":" +  rawNetwork[0][i].id + ",";
      if( ASNToNGSS ){
        if(rawNetwork[0][i].nodeType == "Performance Expectation" || rawNetwork[0][i].nodeType == "Standard"){
            var pCode = rawNetwork[0][i].pCode;
            dataString += '"' + "label" + '"' + ":" +  '"' + pCode + '"';
        }
        else {
            dataString += '"' + "label" + '"' + ":" + '"' + BLANK_NODE_LABEL + '"';
        }
      }
      else{
          dataString += '"' + "label" + '"' + ":" + '"' + rawNetwork[0][i].sCode  + '"';
      }
      dataString += "},";
  }

  dataString = dataString.substring(0, dataString.length - 1);
  dataString += "]";
  nodes.update(JSON.parse(dataString));
}


function alignLegend(){
  var legend = document.getElementById("theLegend");
  var docsLabel = document.getElementById("alignedDocsLabel");

  if(hasCheckboxItemSelected()){ //show docs label because item checked from alignemnts dropdown
    if(legend){
     legend.style.top = "74vh"
    }
    docsLabel.style.display = "inline";
  }
  else{  //hide docs label because item not checked in alignemnts dropdown
    if(legend){
     legend.style.top = "76vh"
    }
    docsLabel.style.display = "none";
  }
}

function hasCheckboxItemSelected(){
  for(var i = 0; i < docTypesForDropDown.length; i++){
    if(document.getElementById(docTypesForDropDown[i].checkBoxId).checked) return true
  }
  return false;
}

//Submits by sCode or gradeBand when user clicks the "show aligned documents" checkbox
function checkBoxSubmit(){
  var legend = document.getElementById("theLegend");
  var docsLabel = document.getElementById("alignedDocsLabel");
  if(document.getElementById("myCheckBox").checked){
    if(legend){
     legend.style.top = "74vh"
    }
    docsLabel.style.display = "inline";
  }
  else {
    if(legend){
     legend.style.top = "76vh"
    }
    docsLabel.style.display = "none";
  }
  //If an item is selected from GradeBand dropdown, than submit for that gradeBand showing the documents
  if(document.getElementById("gradeBand").value > 0){
    generateEntireNGSS();
  }
  else{
    sCode = document.getElementById("currentNodeScode").value;
    currentSelectedNode = sCode;
    submit();
  }
}


//Uses insertion sort to sort the network by standard type
function sortNetwork (tmpNetwork) {
  for (var i = 0; i < tmpNetwork.length; i++) {
    let value = tmpNetwork[i]
    for (var j = i - 1; j > -1 && tmpNetwork[j].order > value.order; j--) {
      tmpNetwork[j + 1] = tmpNetwork[j]
    }
    tmpNetwork[j + 1] = value
  }
  return tmpNetwork
}


//Create the Standards table
function CreateTable(network, regularNodeSize, largeNodeSize, nodeToHighlight){
  document.getElementById("standardsTableHeader").innerText = "Standards (" + standardsCount.toString() + ")"
  var setBorder = false;
  var rowToHighlight = network[0][0].sCode;
	var tableRef = document.getElementById('t1').getElementsByTagName('tbody')[0];
  //Get a sorted nw for building the table
  var sortedNw = network[0];
  sortedNw = sortNetwork(sortedNw);

  //only the searched by node will have a table cell border
  var setBorder = false;

	  for(i = 0; i < sortedNw.length; i++){

       if(sortedNw[i].nodeType == "Document" ) continue; //Skip over document nodes. They get their own table

        if(sortedNw[i].sCode == rowToHighlight){  //This is the row to highlight
           setBorder = true;
        }
        //Creates a table row and highlights it if "setBorder" is true
         _InsertRow(tableRef, sortedNw[i].des, sortedNw[i].sCode,
                    sortedNw[i].pCode, sortedNw[i].gradeBand, sortedNw[i].color,
                    sortedNw[i].highlightColor, sortedNw[i].id, setBorder,
                    regularNodeSize, largeNodeSize);

        setBorder = false;
    }
}


//Performs a ajax post to get the aligned documents. Then it builds them into a tabel.
function BuildAlignedDocumentsTable(sCode){

  var req = new XMLHttpRequest();
  var url = "getAlignmentsAPI.php";
  var params = "scode=" + sCode;
  req.open("POST", url, true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onload = function(){
    if(req.status == 200){
      _CreateDocumentsTable(sCode, JSON.parse(req.responseText));
    }
  }
  req.send(params);
}



function _CreateDocumentsTable(sCode, documents){
    alignmentsCount = 0;
    var tableRef = document.getElementById('t2');
    ClearTable(tableRef);
    for(var i = 0; i < documents.length; i++){
      if(!FilterDocType(documents[i].docType)) continue;
      alignmentsCount++
      var curDocId = documents[i].doc_id
      console.log("here" + curDocId)
      var curNodeId = _GetDocNodeId(documents[i].doc_id);
      var newRow = tableRef.insertRow(tableRef.rows.length);
      newRow.id = documents[i].doc_id;
      newRow.style.background = DOCS_COLOR[0];

      //Add closure to onclick event since inside a loop
      newRow.onclick = (function(){
        var currentDoc = curDocId
        var currentId = curNodeId;
        return function(){
        HighlightDocsTableCell(currentDoc);
        if(hasCheckboxItemSelected()){
            HighlightDocumentNode(currentId);
        }
         }
      })();
      if(documents[i].doc_id == "uva_eardevice_less"){
        var sum = documents[i].summary;
        documents[i].summary = documents[i].summary.replace(/<a\b[^>]*>(.*?)<\/a>/i,""); //removes html junk from the text
      }
      documents[i].summary = documents[i].summary.replace(/<a href/, "\n");
      var docType = documents[i].docType;
      if(docType == "curricularUnit") docType = "curricular unit";
      newRow.innerHTML =
      '<span style ="color:blue; cursor: pointer; letterSpacing:20px" onclick = GoToTEPage(\'' + documents[i].url + '\')>' +documents[i].title + '</span>' + '<span>' + ' (' + docType + ') ' + '</span>'  + '<br>'
      + '<span>' + _TruncateDocDescription(documents[i].summary, documents[i].doc_id) + '</span>'
      +'<hr style= margin:3px>'
    }
    document.getElementById("alignmentsTableHeader").innerText =  "Aligned resources" + " (" + alignmentsCount.toString() + ")";
}


function _GetDocNodeId(docNodeId){
   var data = JSON.parse(rawMapData);
   for(i = 0; i < data[0].length; i++){
     if(data[0][i].nodeType == "Document" && data[0][i].document == docNodeId){
       return data[0][i].id;
     }
   }
   return null;
  /*  for(var i = 0; i < nodesList.length; i++){
    /*  if(nodeList)*/
    /*}*/
/*  for(var i = 0; i < nodesList.length; i++){
    if(nodesList[i].sCode == currentSelectedNode){  //get the selected parent of the clicked document node
      parentId = nodesList[i].id;
    }
  }*/
}


function GoToTEPage(url){
  var win = window.open(url, '_blank');
  win.focus();
}


function _TruncateDocDescription(des, id){
  des = des.substring(0, des.length);
  if (des.length > 100){
    var newId = id.toString();
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


function _showLessDocDescription(id){
     var doc = document.getElementById(id + "-doc");
     doc.style.display = "none";
     var e = document.getElementById(id + "-elipsis");
     e.style.display = "inline";
     var m = document.getElementById(id + "-more");
     m.style.display = "inline";
}


//Calls the api to get the ngss url for viewing the standard with the given sCode
function ViewNGSSPage(sCode){
  var req = new XMLHttpRequest();
  var url = "GetNgssUrlAPI.php";
  var params = "scode=" + sCode;
  req.open("POST", url, true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onload = function(){
    if(req.status == 200){
       var uri = JSON.parse(req.responseText);
      // if(uri == "error" || uri == null) return;
       url = "https://www.nextgenscience.org/" + uri;
       var win = window.open(url, '_blank');
       win.focus();
    }
  }
  req.send(params);
}


function _GetMatchingBorderColor(color, index){
  if(PURPLE_COLOR[index] == color) return PURPLE_COLOR[1];
  if(GREY_COLOR[index] == color) return GREY_COLOR[1];
  if(BLUE_COLOR[index] == color) return BLUE_COLOR[1];
  if(ORANGE_COLOR[index] == color) return ORANGE_COLOR[1];
  if(GREEN_COLOR[index] == color ) return GREEN_COLOR[1];
  return 'black';
}


//Inserts a clickable row into the standards table.
function _InsertRow(tableRef, description, sCode, ngssCode,  gradeBand, color, highlightColor, id, setBorder, regNodeSize, largeNodeSize){

	var newRow   = tableRef.insertRow(tableRef.rows.length);
	newRow.id = sCode
  newRow.style.backgroundColor = color;
  newRow.style.borderBottom= "1px solid #A0A0A0";
  //highlight the approprate border in the standards table.
  if(setBorder){
    currentTableRow = sCode;
     newRow.style.border = "4px solid " +  _GetMatchingBorderColor(color, 0);
     _highlightStandardsTableRow(color, sCode);
  }
	newRow.onclick = function(){
    if(sCode == currentTableRow) return;  //don;t do anything if clicking on an already selected node
		TableRowClickAction(sCode, color, highlightColor);
		HighlightNode(id, color, regNodeSize, largeNodeSize)
    UnhighlightPreviousNode();
    currentSelectedNode = sCode
    BuildAlignedDocumentsTable(sCode);
    unHighlightCurrentSelectedDocument();
    updateHash();
	};

  //Build the html for the table row
  var ul = "underline";
  var n = "none";
  var NGSSLink = '';
  var colorId = sCode + "Color";
  if(color == GREY_COLOR[0] || color == PURPLE_COLOR[0]){
    NGSSLink =  '<span style="margin-right:3%">|</span>' + '<span style="">'
    + '<a class = "clickableTableCell" onclick=SubmitTableClick(\'' + sCode + '\'); style = "margin-right:2%; color:blue; cursor: pointer; font-size:10pt;">' + ngssCode + '</a>'
    + '<a onmouseover= this.style.textDecoration="underline" onmouseout=this.style.textDecoration="none"  onclick=ViewNGSSPage(\'' + sCode + '\') style="color:blue; cursor:pointer; hover:red">NGSS.org</a>'
    + '</span>' + '<br>';
  }
  else{
    NGSSLink = '<span style="margin-right:3%">|</span>' + '<span style="display:inline; color:blue; cursor:pointer">' + "No NGSS code."  + '</span>'
  }
  newRow.innerHTML = '<div style="margin-bottom:6px">' +
     '<a class = "clickableTableCell" onclick = SubmitTableClick(\'' + sCode + '\') style = "margin-right:2%; float:left; color:blue; cursor: pointer; font-size:10pt">' + sCode + '</a>'

     + '<a href=http://asn.jesandco.org/resources/'+sCode+' target="_blank" style="color:blue;margin-right:3% ">ASN.org</a>'
     +'<span style="">'
     + NGSSLink + FormatStdDescription(description, sCode, gradeBand) + ' </span>'
     + '<span id = '+colorId+' style = "display:none">' + color + '</span>'; //hidden field so each table row remembers its origonal color when highlighted
    +"</div>"
}


//Replaces the html of description to have a show hide feature if description is less than STD_DESCRIPTION_LENGTH
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


function showFullStdDescription(sCode){
  document.getElementById("secondChunk_" + sCode).style.display = "inline";
  document.getElementById("less_" + sCode).style.display = "inline";
  document.getElementById("more_" + sCode).style.display = "none";
  document.getElementById("elipsis_" + sCode).style.display = "none";
}


function showLessStdDescription(sCode){
  document.getElementById("more_" + sCode).style.display = "inline";
  document.getElementById("elipsis_" + sCode).style.display = "inline";
  document.getElementById("less_" + sCode).style.display = "none";
  document.getElementById("secondChunk_" + sCode).style.display = "none";
}

//Unighlights any selecte table cell in the standards table
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


//Finds the matching highlight color and highlights the table row to that color
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


//Highlighs the clicked row and the coorisponding node in the graph. Unhighlights everything else.
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


function FormatNodeDescriptionForPopup(des){
  if(des == "Engineering Design"){

  }

  var curPos = 0;
  var lineCount = 0;
  var resultHTML = '<div style = "font-size:10pt">';


//unit entire string has been parsed
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


//Uses the network data form the post request to "server.php" and builds the vis.js network
 function CreateMap(standardNodeSize, highlightedStandardNodeSize, docNodeSize){
  standardsCount = 0;
  var networkCount = 0;
  var isChecked = false;
  for(var i = 0; i < docTypesForDropDown.length; i++){
    if(document.getElementById(docTypesForDropDown[i].checkBoxId).checked){
      isChecked = true;
    }
  }
  var displayType = document.getElementById("displayType").value;  //1 for ASN, 2 for NGSS

	//Create the network nodes
	var network = JSON.parse(rawMapData);
  var num = 0;
  for(var i = 0; i < network[1].length; i++){
    if(network[1][i].id1 == 733 && network[1][i].id2 >= 10000){
          num++
    }
  }

  //Create an empty vis Dataset object
	var options = { };
  nodes = new vis.DataSet(options);
  //Fill the vis Dataset with the nodes
  for(i = 0; i < network[0].length; i++){
    var xCoord = network[0][i].xCoordinate;
    var yCoord = -network[0][i].yCoordinate;
    if(network[0][i].nodeType != "Document"){
      var nodeLable = network[0][i].sCode;
      if(displayType == 2 && (network[0][i].nodeType == "Standard" || network[0][i].nodeType == "Performance Expectation")) {
        nodeLable = network[0][i].pCode;
      }
      else if (displayType == 2){
        nodeLable = BLANK_NODE_LABEL;
      }
      networkCount++;
      standardsCount++
        nodes.add({id:network[0][i].id,
                    title: FormatNodeDescriptionForPopup(network[0][i].des),
                    color:network[0][i].color,
                    origonalColor:network[0][i].origonalColor,
                    label:network[0][i].id,
                    sCode:network[0][i].sCode,
                    pCode:network[0][i].NGSSCode,
                    font: {color:'black', size:standardNodeSize},
                    x:xCoord,
                    y:yCoord
                    });
    }

    //Build the document nodes but hide any not selected in the alignments dropdown
    else {
      var hidden = FilterDocType(network[0][i].docType) ? false : true;  //determine if the document will be shown based on the filter
      networkCount++;
      nodes.add({id:network[0][i].id,
         color:network[0][i].color,
         docId:network[0][i].document,
         docType:network[0][i].docType,
         shape:'circle',
         width:.1,
         font:{size:docNodeSize},
         label:" ",
         x:xCoord,
         y:yCoord,
         hidden:hidden
        }); //widthConstraint:{minimum:DOC_NODE_SIZE, maximum:DOC_NODE_SIZE}});
    }
	}

  //Create the edge list
	var edgeOptions = {
		//width:3
	};

	edges = new vis.DataSet(edgeOptions);
  var num = 0;
	for(i = 0; i < network[1].length; i++){

		edges.add({from:network[1][i].id1, to: network[1][i].id2, width:1.5, color: { color: EDGE_COLOR}})
	}


  //Gets the canvas element for vis.js to draw the network on
	var container = document.getElementById('mynetwork');
     document.getElementById("mynetwork").style.zIndex = -1
	// provide the data in the vis format
	var data = {
			nodes: nodes,
			edges: edges
	};
	var options = {
     physics:false
	};

	nw = new vis.Network(container, data, options);
  /*container.style.zIndex = -1*/
  //disable the nw if custom dropdown is showing so that items can be selected t
//container.style.pointerEvents = "none"
  //  container.style.pointerEvents = "none"
  document.getElementById(docTypesForDropDown[docTypesForDropDown.length - 1].labelId).zIndex = 12
  HighlightNode(network[1][0].id1, network[0][0].color, standardNodeSize, highlightedStandardNodeSize)//highlight the root node that was searched for

  //Pull all PEs towards the center to give the graph a nice curved shape
  var moveX = 30;
  var moveY = 30;
/*  for(var i = 0; i< 100; i++){
    if(network[0][i] && network[0][i].id< 1000  &&  network[0][i].nodeType == "Performance Expectation"){
        var oldX = nw.body.nodes[ network[0][i].id].x;
        var oldY = nw.body.nodes[ network[0][i].id].y;
        if(oldX > 0) oldX = oldX - moveX
        else oldX = oldX +  moveX
        if(oldY > 0) oldY = oldY - moveY
        else oldY = oldY + moveY
      nodes.update([{
       id: network[0][i].id,
       x: oldX,
       y:oldY
      }]);
    }
  }*/

	//Create table and register a click hanlder for each row clicked using the nw as a parameter
  CreateTable(network, standardNodeSize, highlightedStandardNodeSize)

  nw.on('stabilized', function(properties){

  });
  //Register click handler for nodes
	nw.on( 'click', function(properties) {
		if(properties.nodes.length > 0 ){
			var ids = properties.nodes;
	    var clickedNodes = nodes.get(ids);
      var pos=  nw.getPositions(ids);
      console.log(pos[ids].x + ", " + pos[ids].y)
      if(clickedNodes[0].id <  10000){  //above 10000 are document nodes
           if(clickedNodes[0].sCode != currentTableRow){  //only perform action if not clicking on already selected node
             unHighlightCurrentSelectedDocument();
             var sCode = clickedNodes[0].sCode;
             var id = clickedNodes[0].id;
             var nodesList = nodes.get(nodes._data);
             UnhighlightPreviousNode();
             HighlightNode(id, clickedNodes[0].origonalColor, standardNodeSize, highlightedStandardNodeSize);
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

    //if node clicked on was a document.
    else{
      HighlightDocumentNode(clickedNodes[0].id); //handle highlighting doc and unhighlighting other docs//set the text box for sCode to have the code searched by
      var showNGSSCode = false;
      if(document.getElementById("displayType").value == 2){
        showNGSSCode = true;
      }
      if(showNGSSCode && rawMapData){
        var theData = JSON.parse(rawMapData)
         //get the coorisponding pCode
         for(var i = 0; i < theData[0].length; i++){
           if(theData[0][i].pCode == sCode){
             document.getElementById("sCode").value = theData[0][i].pCode;
             break;
           }
         }
      }
      else{
        document.getElementById("sCode").value = sCode;
      }
      HighlightDocsTableCell(clickedNodes[0].docId) //handle docs table highlighting
      if(document.getElementById(clickedNodes[0].docId)){
          document.getElementById(clickedNodes[0].docId).scrollIntoView();  //Scroll to the document in the documents table
      }
    }

    document.getElementById("submitButton").scrollIntoView(); //make sure everything is in view after the table is rebuilt
    window.scrollTo(0,0);

		}
	});


  //Register double click handlers
	nw.on('doubleClick', function(properties){
    console.log("double clicked")
		if(properties.nodes.length > 0){
			var ids = properties.nodes;
			var clickedNodes = nodes.get(ids);
      if(clickedNodes[0].id < 10000){
			var sCode = clickedNodes[0].sCode;

			RemoveNetwork("mynetwork");
			ClearTable(document.getElementById('t1'));

			submit(sCode)
    }
		 }
	});
}


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


function _HasNodeInNetwork(id){
    var nodesData = nodes.get(nodes._data);
      for(var i = 0; i < nodesData.length; i++){
        if(id == nodesData[i].id){
          return true;
        }
      }
    return false;
}

//Clears current table highlighing and adds the background color to the specified row
function SetTableRowColor(tableRef, sCode, color){
	 var rows = tableRef.rows;
	 tableRow = document.getElementById(sCode);
	if(tableRow){
    		tableRow.style.backgroundColor = color;
  }
}


function HighlightDocsTableCell(docId){
   //unighlight table row if set
   if(document.getElementById(currentDocsTableRow)){
     document.getElementById(currentDocsTableRow).style.border = "none"
     document.getElementById(currentDocsTableRow).style.background = DOCS_COLOR[0]
   }

   if(document.getElementById(docId)){
      document.getElementById(docId).style.border = "4px solid grey";
      document.getElementById(docId).style.background = DOCS_COLOR[1];
   }

  // var tableRef = document.getElementById("t2");
   currentDocsTableRow = docId;
}


function HighlightDocumentNode(id){
  var nodesList = nodes.get(nodes._data);
  var edgeData = edges.get(edges._data);

  //Get parent of clicked on node
  var parentId = null;
  for(var i = 0; i < nodesList.length; i++){
    if(nodesList[i].sCode == currentSelectedNode){  //get the selected parent of the clicked document node
      parentId = nodesList[i].id;
    }
  }

  //check if clicked node is a child of currently selected standard
  var foundClicked = false;
  for(i = 0; i < edgeData.length; i++){
          if(edgeData[i].to == id && edgeData[i].from == parentId && !foundClicked){ //make clicked doc node selected if a child of selected PE
             foundClicked = true;
          }
  }

  if(foundClicked){ //if clicked node is a child of current selected standard, perform highlight action
    nodes.update([{
    id:id,
    color: DOCS_COLOR[1],
    font:{size:SELECTED_DOC_NODE_SIZE},
    label:"    "
   }]);
  }
  if(selectedDocNodeId != null && selectedDocNodeId != id){ //unselect currently selected document if it exists and wasn't the one just highlighed
    nodes.update([{
    id:selectedDocNodeId,
    color:DOCS_COLOR[0],
    font:{size:DOC_NODE_SIZE},
    label:"    "
    }]);
  }
  selectedDocNodeId = id; //update the global var that holds the currently selected doc node id
}


//Will highlight neihboring document nodes
function HighlightNbhDocumentNodes(id, size){
    var edgeData = edges.get(edges._data);
    //For each neighboring document node
   for(i = 0; i < edgeData.length; i++){
      if(edgeData[i].to == id && edgeData[i].from >= 10000 && edgeData[i].to < 10000 && edgeData[i].from < 10200){  //> 10000 is for documents
             if(_HasNodeInNetwork(edgeData[i].from)){
               nodes.update([{
               id:edgeData[i].from,
               font:{size:20},
               label:"    "
              }]);
             }
      }
    }
}


//Will un-highlight neighboring document nodes
function unHighlightNbhDocumentNodes(id, size){
  var edgeData = edges.get(edges._data);
  //For each neighboring document node
  for(i = 0; i < edgeData.length; i++){
    if(edgeData[i].to == id && edgeData[i].from > 10000 && edgeData[i].to < 10000 && edgeData[i].from < 11000){  //> 10000 is for documents
           if(_HasNodeInNetwork(edgeData[i].from)){
             nodes.update([{
             id:edgeData[i].from,
             color:DOCS_COLOR[0],
             width:.1,
             font:{size:6},
             label:" ",
             size:.1,
            }]);
           }
    }
  }
}


function getNodeHighlightColor(color){
  if(color == GREY_COLOR[0]) return GREY_COLOR[2];
  if(color == PURPLE_COLOR[0]) return PURPLE_COLOR[2];
  if(color == BLUE_COLOR[0]) return BLUE_COLOR[2];
  if(color == GREEN_COLOR[0]) return GREEN_COLOR[2];
  if(color == ORANGE_COLOR[0]) return ORANGE_COLOR[2];
  return 'red';
}


function getNodeOrigonalColor(color){
  if(color == GREY_COLOR[0]) return GREY_COLOR[0];
  if(color == PURPLE_COLOR[0]) return PURPLE_COLOR[0];
  if(color == BLUE_COLOR[0]) return BLUE_COLOR[0];
  if(color == GREEN_COLOR[0]) return GREEN_COLOR[0];
  if(color == ORANGE_COLOR[0]) return ORANGE_COLOR[0];
  return 'black';
}


//Will unset all selected nodes and set the specified node to ge highlighted
function HighlightNode(id, origonalColor, regSize, largeSize){
  var nodesList = nodes.get(nodes._data);
  var prevId = null;

  for( var i = 0; i < nodesList.length; i++){
    if (nodesList[i].sCode == currentSelectedNode){
      prevId = nodesList[i].id
      next = nodesList[i].label
    }
  }
  if(prevId != null){
    nodes.update([{
    id:prevId,

    chosen:false,
    font: {
         strokeWidth:0,
         strokeColor:"black",
         size:regSize,
    }
   }]);
  }
 nodes.update([{
	id:id,
  color:getNodeHighlightColor(origonalColor),
	font: {
		 strokeWidth:1,
		 strokeColor:  SELECTED_NODE_COLOR,
		 size:largeSize,
     color:SELECTED_NODE_COLOR
	}
 }]);
 unHighlightNbhDocumentNodes(prevId, 5);
 HighlightNbhDocumentNodes(id, 20);
}


function UnhighlightPreviousNode(){
    var nodesList = nodes.get(nodes._data);
    for( var i = 0; i < nodesList.length; i++){
      if(nodesList[i].sCode == currentSelectedNode){
        nodes.update([{
          id:nodesList[i].id,
          color: nodesList[i].origonalColor
        }]);
      }
    }
}

//removes all table rows exept the header from the DOM
function ClearTable(tableRef){
	var rows = tableRef.rows;
	  var i = rows.length;
	  while (--i) {
	    rows[i].parentNode.removeChild(rows[i]);
	  }
}


//Clears the canvas
function RemoveNetwork(domRef){
	var html = document.getElementById(domRef);
	while(html.firstChild){
	    html.removeChild(html.firstChild);
	}
}


//Handles the form submission when clicking on the link in the table
function SubmitTableClick(sCode){
  submit(sCode); return;
  document.getElementById("currentNodeScode").value = scode;
  currentSelectedNode = scode;
  var networkDepth = document.getElementById('networkDepth').value;
  BuildAlignedDocumentsTable(scode);
  RemoveNetwork("mynetwork");
  ClearTable(document.getElementById('t1'));
	var req = new XMLHttpRequest();
	var url = "getGradebandNetworkAPI2.php";
	var params = "scode=" + scode + "&gradeBand=0" + "&networkDepth="+networkDepth;

	req.open("POST", url, true);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	req.onload = function(){
		if(req.status == 200){
				ClearTable(document.getElementById('t1'));
        rawMapData = req.responseText;
			  CreateMap(REGULAR_NODE_SIZE, LARGE_NODE_SIZE, DOC_NODE_SIZE);
        window.scrollTo(0,0)
		}
	}
	req.send(params);
}


function generateEntireNGSS(){

  var start = new Date().getTime();
  var selection = document.getElementById("gradeBand").value;
  if(!selection || selection == 0 ) {  //selecting default will reset everything
    ClearTable(document.getElementById('t1'));
    RemoveNetwork("mynetwork");
    return;
  }

  //set all other selection options to default when searching by gradeband
  document.getElementById("networkDepth").value = 0;
//  document.getElementById("displayType").value = 0;

  //Set to default node label if not selected
  if(document.getElementById("displayType").value == 0){
    document.getElementById("displayType").value = 1;
  }


  var currentValue =  document.getElementById('sCode').value;
    setTextBoxOnSearch(currentValue);
//  var showAlignedDocuments = document.getElementById("myCheckBox").checked;
  currentSelectedNode = currentValue;
  var networkDepth = document.getElementById('networkDepth').value;
   document.getElementById("currentNodeScode").value = currentValue;
  ClearTable(document.getElementById('t1'));
  var req = new XMLHttpRequest();
  var url = "getGradebandNetworkAPI2.php";
  var params = "sCode=" + document.getElementById('sCode').value + "&gradeBand=" + selection.toString() + "&networkDepth=100";

  req.open("POST", url, true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onload = function(){
    if(req.status == 200){
      var end = new Date().getTime();
     rawMapData = req.responseText;
      CreateMap(12, 22, 6);
      BuildAlignedDocumentsTable(currentValue);
    }
  }
  req.send(params);
}


//No longer being used.
function CreateMapOfEntireNGSS(){

    var nodeSize = 12;
    var network = JSON.parse(rawMapData); //the network data
  //  document.getElementById("sCode").value = network[2]
    var options = {};
     nodes = new vis.DataSet(options);
    for(i = 0; i < network[0].length; i++){

      if(network[0][i].nodeType == "Document"){
          if(network[0][i].document == "uoh_hp_lesson_square")
        var isChecked = document.getElementById("myCheckBox").checked;
        if(isChecked == false) continue;
          nodes.add({
                    id:network[0][i].id,
                    color:network[0][i].color,
                    docId:network[0][i].document,
                    shape:'circle',
                    width:.1,
                    font:{size:6},
                    label:" ",
                    x:network[0][i].xCoordinate,
                    y: -network[0][i].yCoordinate
                  });
        continue;
      }
      var nodeLable = network[0][i].sCode;
      if(displayType == 2 && (network[0][i].nodeType == "Standard" || network[0][i].nodeType == "Performance Expectation")) {
        nodeLable = network[0][i].pCode;
      }
      var xCoord = network[0][i].xCoordinate
      var yCoord = -network[0][i].yCoordinate

      nodes.add({
        id:network[0][i].id,
        title: "title goes here", //FIXME
        color:network[0][i].color,
        origonalColor:network[0][i].origonalColor,
        label: nodeLable,
        sCode:network[0][i].sCode,
        pCode:network[0][i].NGSSCode,
        font: {color:'black', size:nodeSize}, //FIXME
        x: xCoord,
        y: yCoord
      });
    }

    var edgeOptions = {

    }
    edges = new vis.DataSet(edgeOptions);
    for(var i = 0; i < network[1].length; i++){
      edges.add({from:network[1][i].id1,
                 to:network[1][i].id2}) //FIXME add color
    }

    var container = document.getElementById("mynetwork");

    data = {
      nodes: nodes,
      edges: edges
    };

    var options = {
      physics:false
    };

    nw = new vis.Network(container, data, options);

    HighlightNode(network[1][0].id1, network[0][0].color, nodeSize, nodeSize + 10); //FIXME
    CreateTable(network, nodeSize, nodeSize + 10)

    nw.on("click", function(properties){
      if(properties.nodes.length > 0){
        var ids = properties.nodes;
        var pos=  nw.getPositions(ids);
        var clickedNodes = nodes.get(ids);
        if(clickedNodes[0].id <  10000){  //above 10000 are document nodes
             if(clickedNodes[0].sCode != currentTableRow){  //only perform action if not clicking on already selected node
               var sCode = clickedNodes[0].sCode;
               var id = clickedNodes[0].id;
               var nodesList = nodes.get(nodes._data);
               UnhighlightPreviousNode();
               HighlightNode(id, clickedNodes[0].origonalColor, 8, 18);
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
      else {
      }
      }
    });
}


var isShowing = false; //tracks if the alignments dropdown is open

//initailize the alignments dropdown, including all onclick event handlers
function initDropdown(){

   //initialize all checkboxes to unchecked since some browsers will check them on page refresh
   for(var i = 0; i < docTypesForDropDown.length; i++){
     document.getElementById(docTypesForDropDown[i].checkBoxId).checked = false;
   }

    document.getElementById("alignments").addEventListener("mouseover", (e) =>{
      document.getElementById(e.target.id).style.cursor = "default"
    });


  var displayType = "";
    document.getElementById("alignments").addEventListener("click", function(){
      if(!isShowing){
        isShowing = true;
        document.getElementById("mynetwork").style.pointerEvents = "none"  //disable network when dropdown showing
        displayType = "block"
      }
      else{
         isShowing = false;
         displayType = "none"
         document.getElementById("mynetwork").pointerEvents = "auto"
      }
      for(var i = 0; i < docTypesForDropDown.length; i++){
        document.getElementById( docTypesForDropDown[i].labelId).style.display = displayType //enable network when dropdown not showing
      }
    });

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

  for(var i = 0; i < docTypesForDropDown.length; i++){
    (function(i){
        document.getElementById(docTypesForDropDown[i].checkBoxId).addEventListener("click", function(){
          alignLegend();
          UpddateMapDocuments((i));
          updateHash()

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
      // await CreateMap(REGULAR_NODE_SIZE, LARGE_NODE_SIZE, DOC_NODE_SIZE);
           BuildAlignedDocumentsTable(currentSelectedNode);
       },true)
    })(i);
  }
}


//returns true if activies, lessons and curricular units are all selected
function areAllSelected(){
    for(var i = 0; i < docTypesForDropDown.length - 1; i++){  //every item in  dropdown except for last item
      if(!document.getElementById(docTypesForDropDown[i].checkBoxId).checked){
        return false;
      }
    }
    return true;
}


//returns true if activies, lessons and curricular units are all not selected
function areAllNotSelected(){
    for(var i = 0; i < docTypesForDropDown.length - 1; i++){  //every item in  dropdown except for last item
      if(!document.getElementById(docTypesForDropDown[i].checkBoxId).checked){
        return true;
      }
    }
    return false;
}


//Updates the netork to show only document types selected in the alignments dropdown
function UpddateMapDocuments(id){

  if(rawMapData == null) return  //don't do anything if the map has not been drawn
  var showing = "true";
  if(document.getElementById(docTypesForDropDown[id].checkBoxId).checked) showing = "false";
  var docType = docTypesForDropDown[id].docType;
  var nodesList = nodes.get(nodes._data);
 var dataString = "[";
  for(i = 0; i < nodesList.length; i++){
    if (nodesList[i].id > 10000 &&  (nodesList[i].docType == docType || docType == "all")){
      dataString =  dataString + "{";
      dataString =  dataString + '"'+ "id" + '"' + ":" +  nodesList[i].id.toString()  + ",";
      dataString =  dataString +'"'+ "hidden" + '"' + ":" + showing;
      dataString =  dataString + "}"
      dataString = dataString + ","
    }
  }
  dataString = dataString.substring(0, dataString.length - 1)
  dataString = dataString + "]"

  var networkJson  = JSON.parse(dataString)
   nodes.update(
     networkJson
   );
}


//returns true if the docType parameter is also selected in the Alignments dropdown list
function FilterDocType(docType){
  for(var i = 0; i < docTypesForDropDown.length - 1; i++){
    if(docType == docTypesForDropDown[i].docType && document.getElementById(docTypesForDropDown[i].checkBoxId).checked ){
      return true;
    }
  }
  return false;
}


//Returns the array holding the alignments dropdown item ids and document types.
//Array is build from the global array "DOC_TYPES"
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


function ShowingAlignments(){
  for(var i = 0; i < docTypesForDropDown[i].length; i++){
    id = docTypesForDropDown[i].checkBoxId;
    if(document.getElementById(id).checked) return true;
  }
  return false;
}
