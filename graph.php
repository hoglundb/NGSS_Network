<?php
?>

<!DOCTYPE html>
<html>
        <head>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"/>
        <script  src="myscripts.js"></script>

         <script type="text/javascript" src="MapLib/vis.min.js"></script>
        <link rel="stylesheet" href="MapLib/vis.min.css" />
        <link rel="stylesheet" href="styles.css">
        </head>
        <body style="font-family:Helvetica, sans-serif">
          <div class="row">
            <div class="col-lg-7" style="" >
              <div class='input-group' style='margin-top:15px; margin-left:3%; margin-bottom: 10px;width:100%'>
              <input class="form-control" id = "sCode" type="text" style="min-width:100px;max-width: 110px;margin-right:5px; margin-top:3px; height:35px" aria-label="Search" >
              <input type="button" id="submitButton" name="submitButton" class="btn btn-info" value="Generate" style="line-height:2px; margin-top:0.31%; margin-right:20px; height:35px; display:inline-flex; align-items:center" onclick = "submitBtn(); return false;"/>
                  <div id = "start" style="margin-left:230px; position:fixed; z-index:10000; margin-top: 2px">
                    <div id = "dropdownToggle" class="customDropdown" style="background:white; position:fixed; border:solid grey; border-radius:4px; width:140px; border-width:1px">
                      <div id = "alignments" class="customDropdown" style="font-size:10.5pt ; height: 18.4px; margin-left:5px">  --Resource type--  <span id="dropdownSymbol" class="customDropdown" style="float:right; margin-top:3px; margin-right:5px; font-size:6pt">&#9660</span></div>
                      <div id = "item1" class="customDropdown" style="display:none"><input id="item1Box" type="checkbox" class="customDropdown" name = "activies" value = "1" style='margin-left:3px'> activies </div>
                      <div id = "item2" class="customDropdown" style="display:none"><input id="item2Box" type="checkbox" class="customDropdown" name = "lessons" value = "2" style='margin-left:3px'> lessons</div>
                      <div id = "item3" class="customDropdown" style="display:none"><input id="item3Box" type="checkbox" class="customDropdown" name = "curricular units" value = "3" style='margin-left:3px'> curricular units</div>
                      <div id = "item4" class="customDropdown" style="display:none; position:relative"><input id="item4Box" type="checkbox" class="customDropdown" name = "showAll" value = "5" style='margin-left:3px'> all </div>
              </div>
                </div>
                <label style="" for "networkDepth">
              <select id = "networkDepth" style ='width:80px; border-radius:4px; margin-left:152px; font-size:10pt'>
                <option value = "0">--Depth--</option>
                <option value = "1">1</option>
                <option value = "2">2</option>
                <option value = "3">3</option>
              </select>

              </label>
                <label  for "displayType">
              <select id = "displayType" style ='width:115px; margin-left:10px;border-radius:4px;font-size:10pt'>
                <option value = "0">--Node label--</option>
                <option value = "1">ASN codes</option>
                <option value = "2">NGSS codes</option>
              </select>
              </label>
              <select id = "gradeBand" style ='width:120px; border-radius:4px;font-size:10pt; margin-left:10px; height:20px; margin-top:3px'  >
                   <option value = "0">--Grade band--</option>
                   <option value = "1">k-2</option>
                   <option value = "2">3-5</option>
                   <option value = "3">6-8</option>
                   <option value = "4">9-12</option>
              </select>
            </div>
          <div id="mynetwork" style="height:82vh">
              </div>
                 <div id= "theLegend" style="top:75vh; position:absolute; margin-left:3.2%">
                    <div id="label1" style = "font-size: 9pt; margin-left:2%; width:190px; margin-top:0px; position:absolute;; float:left;border-radius:3px ; padding-left:4px">Topics</div>
                    <div id="label2" style = "font-size: 9pt;  margin-left:2%; width:190px; margin-top:20px; position:absolute; float:left;border-radius:3px; padding-left:4px">Performance Expectations</div>
                    <div id="label3" style = "font-size: 9pt; margin-left:2%; width:190px; margin-top:40px; position:absolute; float:left;border-radius:3px; padding-left:4px">Science and Engineering Practices</div>
                    <div id="label4" style = "font-size: 9pt; margin-left:2%; width:190px; margin-top:60px; position:absolute; float:left;border-radius:3px; padding-left:4px">Disiplinary Core Ideas</div>
                    <div id="label5" style = "font-size: 9pt; margin-left:2%; width:190px; margin-top:80px; position:absolute; float:left;border-radius:3px; padding-left:4px">Cross Cutting Concepts</div>
                    <div id = "alignedDocsLabel" style = "display:none; font-size: 9pt; background: #DFD4C8; margin-left:2%; width:190px; margin-top:100px; position:absolute; float:left;border-radius:3px; padding-left:4px">Aligned TE Documents</div>
                </div>
            </div>
            <div class="stdTable" style=" margin-top:38px; margin-left:1.4% ;padding-right:0%; padding-left:0%;width:18%; " >
           <span id="standardsTableHeader" style ="font-size:10pt; font-weight:bold">Standards</span>
           <div style = "height:84vh; overflow-y:auto;" class="scroller">
           <table class="table" style="width:100%;  font-size:10pt"  id = "t1">
         <thead>
         <tr>
         <th scope="col" style="width:100%; padding:0px"></th>
         </tr>
         </thead>
         <tbody id= 't1Body' >
         <tr>
         </tr>
         </tbody>
         </table>
       </div>
         </div>
            <div class="docsTable" style="margin-top:38px ;padding-right:0%; margin-left:.3%; width:18%">
                 <span id="alignmentsTableHeader" style ="font-size:10pt; font-weight:bold">Aligned Resources</span>
                 <div style="height:84vh; overflow-y:auto">
              <table class="table" style="line-height: 1.2 ;width:100%; font-size:10pt; table-layout: fixed"  id = "t2">
                <tr>
                <th scope="col" style="padding:0px"><div id=t2Title></div></th>
                </tr>
              </table>
            </div>
            </div>
          </div>
          <input id="currentNodeScode" style = "display:none"/>
        </body>
</html>
