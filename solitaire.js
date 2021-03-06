/* Solitaire JavaScript */

// start with number of empty and the alternating number of set and number of empty
var boardConfigEnglish = [
   [{none:2},{occupied:3},{none:2}],
   [{none:2},{occupied:3},{none:2}],
   [{occupied:7}],
   [{occupied:3},{empty:1},{occupied:3}],
   [{occupied:7}],
   [{none:2},{occupied:3},{none:2}],
   [{none:2},{occupied:3},{none:2}]
];
var boardConfigFrench = [ 
   [{none:2},{occupied:3},{none:2}],
   [{none:1},{occupied:5},{none:1}],
   [{occupied:3},{empty:1},{occupied:3}],
   [{occupied:7}],
   [{occupied:7}],
   [{none:1},{occupied:5},{none:1}],
   [{none:2},{occupied:3},{none:2}] ];
var boardConfigDiamond = [ 
   [{none:4},{occupied:1},{none:4}],
   [{none:3},{occupied:3},{none:3}],
   [{none:2},{occupied:5},{none:2}],
   [{none:1},{occupied:7},{none:1}],
   [{occupied:4},{empty:1},{occupied:4}],
   [{none:1},{occupied:7},{none:1}],
   [{none:2},{occupied:5},{none:2}],
   [{none:3},{occupied:3},{none:3}],
   [{none:4},{occupied:1},{none:4}]
];
var boardConfigList = [{config: boardConfigEnglish, name: "Englisch",         preslected: true},
                       {config: boardConfigFrench,  name: "Franz&ouml;sisch", preslected: false},
                       {config: boardConfigDiamond, name: "Diamant",          preslected: false}];
var boardConfig = boardConfigList[0].config;
var numFigures = 0;
var undoList = [];
var animationSpeed = 500;

function initLayoutSelector() {
   $("#layoutSelector").html();
   var selectedConfig = -1;
   for(var idx = 0; idx < boardConfigList.length; idx++) {
      var config = boardConfigList[idx];
      var cfgName = config.name;
      var selected = config.preslected && (selectedConfig == -1);
      $("#layoutSelector").append('<option value="'+idx+'" '+(selected ? "selected" : "")+'>'+cfgName+'</option>');
      if(selected) {
         boardConfig = config.config;
         selectedConfig = idx;
      }
   }
}

function initGameBoard() {
   $("#gameBoard").html("");
   numFigures = 0;
   var boardHtml = "";
   for(var rowIdx = 0; rowIdx < boardConfig.length; rowIdx++) {
      boardHtml = boardHtml + "<tr>";
      var rowConfig = boardConfig[rowIdx];
      var colIdx = 0;
      for(var arrIdx = 0; arrIdx < rowConfig.length; arrIdx++) {
         var rowObj = getConfObj(rowConfig[arrIdx]);
         numFigures += rowObj.occupied;
         for(var cnt = 0; cnt < rowObj.total; cnt++) {
            boardHtml += "<td>" + getFieldAndFigureHtml(rowIdx,colIdx,rowObj) + "</td>";
            colIdx++;
         }
      }
      boardHtml += " </tr>";
   }
   $("#gameBoard").html(boardHtml);
   initDragnDrop();
}

function initDragnDrop() {
   enableDraggables(".draggable");
   $(".droppable").droppable({
      accept: ".draggable",
      tolerance: "pointer",
      //hoverClass: "droppable-hover",
      //activeClass: "droppable-active",
      drop: function(event,ui) {
         var dragId = $(ui.draggable)[0].id;
         $(this).parent().addClass("dropped");
      },
      out: function(event,ui) {
         var dragId = $(ui.draggable)[0].id;
         var droppedId = $(this).attr("data-occupied-by");
         if(dragId == droppedId) {
            $(this).parent().removeClass("dropped");
         }
      }
   });  
}

function enableDraggables(elemSelector) {
   $(elemSelector).draggable({
      containment: "#drop-area",
      stack: ".draggable,.droppable",
      snap: ".droppable",
      snapMode: "inner",
      revert: function(dropped) {
         if(isDropAllowed(dropped,this)) {
            // don't revert, it's in the droppable
            executeMove(dropped,this);
            return false;
         } else {
            // don't rely on the built in revert, do it yourself
            //$(this).animate({ top: 0, left: 0 }, 'slow');
            return true;
         }
      }
   });
}

function getConfObj(obj) {
   var confObj = { empty: 0, none: 0, occupied: 0, total: 0 }
   confObj.empty = getProp(obj,'empty');
   confObj.none = getProp(obj,'none');
   confObj.occupied = getProp(obj,'occupied');
   confObj.total = confObj.empty + confObj.none + confObj.occupied;
   return confObj;
}

function getProp(obj,propName) {
   return (propName in obj ? obj[propName] : 0);
}

function getFieldAndFigureHtml(rowIdx,colIdx,rowObj) {
   var result = "";
   // if empty or occupied then create field
   if(rowObj.empty > 0 || rowObj.occupied > 0) {
      var figureHtml = "";
      var occupiedValue = "none";
      // if occupied then create figure
      if(rowObj.occupied > 0) {
         occupiedValue = getDragId(rowIdx,colIdx);
         figureHtml = getFigureHtml(rowIdx,colIdx);
      }
      
      result =   '<div class="droppable" id="' + getDropId(rowIdx,colIdx) 
                                    + '" data-row="' + rowIdx 
                                    + '" data-col="' + colIdx 
                                    + '" data-occupied-by="' + occupiedValue + '">'
               + figureHtml
               + '</div>';
   }
   return result;
}

function getFigureHtml(rowIdx,colIdx,invisable) {
   var invisableText = (invisable ? 'style="opacity: 0;"' : '');
   return '<div class="draggable" id="' + getDragId(rowIdx,colIdx) 
                             + '" data-row="' + rowIdx 
                             + '" data-col="' + colIdx 
                             + '" ' + invisableText 
                             + '></div>';
}

function addUndoStep(movedRow,movedCol,clearedRow,clearedCol,dropRow,dropCol) {
   undoList.push({movedRow: movedRow, 
                  movedCol: movedCol, 
                  clearedRow: clearedRow, 
                  clearedCol: clearedCol,
                  dropRow: dropRow,
                  dropCol: dropCol});
}

function execUndoStep() {
   if(undoList.length > 0) {
      var undoStep = undoList.pop();
      var movedDropId = getDropId(undoStep.movedRow,undoStep.movedCol);
      var movedDragId = getDragId(undoStep.movedRow,undoStep.movedCol);
      var clearedDropId = getDropId(undoStep.clearedRow,undoStep.clearedCol);
      var clearedDragId = getDragId(undoStep.clearedRow,undoStep.clearedCol);
      var droppedDropId = getDropId(undoStep.dropRow,undoStep.dropCol);
      var droppedDragId = getDragId(undoStep.dropRow,undoStep.dropCol);
      // clear message
      $("#message,#text").text("");
      numFigures++;
      // recreate moved figure at original place
      $("#"+movedDropId).append(getFigureHtml(undoStep.movedRow,undoStep.movedCol,true));
      setOccupiedBy("#"+movedDropId,movedDragId);
      enableDraggables("#"+movedDragId);
      // recreate cleared figure
      $("#"+clearedDropId).append(getFigureHtml(undoStep.clearedRow,undoStep.clearedCol,true));
      setOccupiedBy("#"+clearedDropId,clearedDragId);
      enableDraggables("#"+clearedDragId);
      // remove figure at move-destination
      animatedRemoveFigure("#"+droppedDragId);
      clearOccupiedBy("#"+droppedDropId);
      // let recreated figures appear
      animatedAppearFigure("#"+clearedDragId+",#"+movedDragId, true);
   }
}

function animatedRemoveFigure(id, checkPosMoves) {
   $(id).animate({opacity: 0},animationSpeed, function() { 
      $(this).remove(); 
      if(checkPosMoves) {
         checkForPossibleMove();
      }
   });
}

function animatedAppearFigure(id, checkPosMoves) {
   $(id).animate({opacity: 1}, animationSpeed, function() {
      if(checkPosMoves) {
         checkForPossibleMove();
      }
   });
}

function getDropId(row,col,addHash) {
   return (addHash ? '#' : "") + 'droppable-' + row + '-' + col;
}

function getDragId(row,col,addHash) {
   return (addHash ? '#' : "") + 'draggable-' + row + '-' + col;
}

function getNumberAttr(elem,attr) {
   return $(elem).attr(attr) * 1;
}

function setAttr(elem,attr,value) {
   $(elem).attr(attr,value);
}

function isFieldOccupied(field) {
   return $(field).attr("data-occupied-by") != "none";
}

function clearOccupiedBy(field) {
   setOccupiedBy(field,"none");
}

function setOccupiedBy(field,value) {
   $(field).attr("data-occupied-by",value);
}

function isDropAllowed(droppable, draggable) {
   var dropCol = getNumberAttr(droppable,"data-col");
   var dropRow = getNumberAttr(droppable,"data-row");
   var dragCol = getNumberAttr(draggable,"data-col");
   var dragRow = getNumberAttr(draggable,"data-row");
   var middleCol = (dropCol + dragCol) / 2;
   var middleRow = (dropRow + dragRow) / 2;
   var isMiddleOccupied = isFieldOccupied("#"+getDropId(middleRow,middleCol));
   
   var verticalMove = (dropCol == dragCol && Math.abs(dropRow - dragRow) == 2);
   var horizontalMove = (dropRow == dragRow && Math.abs(dropCol - dragCol) == 2);
   
   return isMiddleOccupied && (verticalMove || horizontalMove);
}

function executeMove(droppable,draggable) {
   var dragId = "#" + $(draggable)[0].id;
   var dropId = "#" + $(droppable[0])[0].id;
   
   var dropCol = getNumberAttr(dropId,"data-col");
   var dropRow = getNumberAttr(dropId,"data-row");
   var dragCol = getNumberAttr(dragId,"data-col");
   var dragRow = getNumberAttr(dragId,"data-row");
   var clearCol = (dropCol + dragCol) / 2;
   var clearRow = (dropRow + dragRow) / 2;
   var clearDragId = "#" + getDragId(clearRow,clearCol);
   var clearDropId = "#" + getDropId(clearRow,clearCol);
   var prevDropId = "#" + getDropId(dragRow,dragCol);
   var newDragId = getDragId(dropRow,dropCol);
   addUndoStep(dragRow,dragCol,clearRow,clearCol,dropRow,dropCol);
   // update moved figure
   $(dragId).attr("data-col",dropCol);
   $(dragId).attr("data-row",dropRow);
   var figure = $(dragId).detach();
   figure.appendTo(dropId);
   $(dragId).css("left",0);
   $(dragId).css("top",0);
   $(dragId).prop("id",newDragId);
   setOccupiedBy(dropId,newDragId);
   // remove figure in between
   animatedRemoveFigure(clearDragId, true);
   clearOccupiedBy(clearDropId);
   // clear previous occupied field
   clearOccupiedBy(prevDropId);
   
   numFigures--;
   if(numFigures == 1) {
      $("#message").text("Gewonnen!");
   }
}

function resetGame() {
   initGameBoard();
   $("#message").text("");
   undoList = [];
}

function layoutSelectorChanged(event, ui) {
   var value = $("#layoutSelector").val() * 1;
   boardConfig = boardConfigList[value].config;
   resetGame();
}

var numPossibleSteps = 0;

function checkForPossibleMove() {
   numPossibleSteps = 0;
   $(".draggable").each(function(elemIndex,element) {
      var dragCol = getNumberAttr(element,"data-col");
      var dragRow = getNumberAttr(element,"data-row");
      var stepList = [ { occupiedCol: -1, occupiedRow:  0, emptyCol: -2, emptyRow:  0},
                       { occupiedCol:  0, occupiedRow: -1, emptyCol:  0, emptyRow: -2},
                       { occupiedCol:  1, occupiedRow:  0, emptyCol:  2, emptyRow:  0},
                       { occupiedCol:  0, occupiedRow:  1, emptyCol:  0, emptyRow:  2} ];
      for(var idx = 0; idx < stepList.length; idx++) {
         var stepConfig = stepList[idx];
         var occupiedDragId = getDragId(dragRow + stepConfig.occupiedRow, dragCol + stepConfig.occupiedCol, true);
         var emptyDropId = getDropId(dragRow + stepConfig.emptyRow, dragCol + stepConfig.emptyCol, true);
         var emptyDragId = getDragId(dragRow + stepConfig.emptyRow, dragCol + stepConfig.emptyCol, true);
         var isPossibleMove = $(occupiedDragId).length == 1 
                           && $(emptyDropId).length == 1 
                           && $(emptyDragId).length == 0;
         if(isPossibleMove) {
            numPossibleSteps++;
         }
      }
   });
   $("#hint").html("Anzahl m&ouml;glicher Z&uuml;ge: "+numPossibleSteps);
   
   if(numPossibleSteps == 0 && numFigures > 1) {
      $("#message").text("Game over!");
   }
}

$(document).ready(function() {
   initLayoutSelector();
   initGameBoard();
   $("#layoutSelector").change(layoutSelectorChanged);      
   $("#btnReset").click(resetGame);
   $("#btnUndo").click(execUndoStep);
   checkForPossibleMove();
});

/*
Link-List for backtracking solving algos:
https://ece.uwaterloo.ca/~dwharder/aads/Algorithms/Backtracking/Peg_solitaire/
*/
