//node ids are in order in which nodes come in existence
var nodes = [
            {id: 0},
            {id: 1},
            {id: 2},
            {id: 3},
            {id: 4},
            {id: 5},
            {id: 6},
            {id: 7},
            {id: 8},
            {id: 9},
            {id: 10},
            {id: 11},
];

var lastNodeId = nodes.length-1;

var links = [
            {source:0, target:1},
            {source:0, target:7},
            {source:0, target:8},
            {source:0, target:9},
            {source:1, target:2},
            {source:1, target:9},
            {source:2, target:3},
            {source:2, target:9},
            {source:2, target:10},
            {source:3, target:4},
            {source:3, target:10},
            {source:4, target:5},
            {source:4, target:10},
            {source:4, target:11},
            {source:5, target:6},
            {source:5, target:11},
            {source:6, target:7},
            {source:6, target:8},
            {source:6, target:11},
            {source:7, target:8},
];

var w = 700,
    h = 500,
    rad = 10;

var svg = d3.select("#svg-wrap")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

var dragLine = svg.append("path")
									.attr("class", "dragLine hidden")
									.attr("d", "M0,0L0,0");

var edges = svg.append("g")
								.selectAll(".edge");

var vertices = svg.append("g")
									.selectAll(".vertex");

var force = d3.layout.force()
            .nodes(nodes)
            .links(links)
            .size([w, h])
            .linkDistance(60)
            .charge(-600)
            .on("tick",tick);
            //.start();

var colors = d3.scale.category10();

var mousedownNode = null, mouseupNode = null;

function resetMouseVar(){
	mousedownNode = null;
	mouseupNode = null;
}

//update the simulation
function tick() {

  edges.attr("x1", function(d) { return d.source.x; })
       .attr("y1", function(d) { return d.source.y; })
       .attr("x2", function(d) { return d.target.x; })
       .attr("y2", function(d) { return d.target.y; });

  vertices.attr("cx", function(d) { return d.x; })
       .attr("cy", function(d) { return d.y; });

}

function addNode(){
  if(d3.event.button==0){
    var coords = d3.mouse(this);
    var newNode = {x:coords[0], y:coords[1], id: ++lastNodeId,};
    nodes.push(newNode);
    restart();
  }
}

function removeNode(d, i){    //d is data, i is index according to selection
  nodes.splice(nodes.indexOf(d),1);
  var linksToRemove = links.filter(function(l){
    return l.source===d || l.target===d;
  });
  linksToRemove.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
  d3.event.preventDefault();
  restart();
}

function removeEdge(d, i){
  links.splice(i,1);
  d3.event.preventDefault();
  restart();
}

function beginDragLine(d){
	d3.event.stopPropagation();		//to prevent call of addNode through svg
	d3.event.preventDefault();		//to prevent dragging of svg in firefox
	if(d3.event.ctrlKey || d3.event.button!=0) return;
	mousedownNode = d;
	dragLine.classed("hidden", false)
					.attr("d", "M" + mousedownNode.x + "," + mousedownNode.y + 
						"L" + mousedownNode.x + "," + mousedownNode.y);
	restart();
}

function updateDragLine(){
	if(!mousedownNode) return;
	dragLine.attr("d", "M" + mousedownNode.x + "," + mousedownNode.y + 
									"L" + d3.mouse(this)[0] + "," + d3.mouse(this)[1]);
	restart();
}

function hideDragLine(){
	dragLine.classed("hidden", true);
	resetMouseVar();
	restart();
}

//no need to call hideDragLine in endDragLine
//mouseup on vertices is propagates to svg and hence hideDragLine
function endDragLine(d){
	//if(d3.event.ctrlKey) return;
	if(!mousedownNode || mousedownNode===d) return;
	//return if link already exists
	for(var i=0; i<links.length; i++){
		var l = links[i];
		if((l.source===mousedownNode && l.target===d) || (l.source===d && l.target===mousedownNode)){
			return;
		}
	}
	var newLink = {source: mousedownNode, target:d};
	links.push(newLink);
}

//one response per ctrl keydown
var lastKeyDown = -1;

function keydown(){
	d3.event.preventDefault();
	if(lastKeyDown !== -1) return;
	lastKeyDown = d3.event.key;

	if(lastKeyDown === "Control"){
		vertices.call(force.drag);
	}
}

function keyup(){
	lastKeyDown = -1;
	if(d3.event.key === "Control"){
		vertices.on("mousedown.drag", null);
	}
}

//updates the graph by updating links, nodes and binding them with DOM
//interface is defined through several events
function restart(){
  edges = edges.data(links);
  //vertices are known by id
  vertices = vertices.data(nodes, function(d){return d.id;});

  edges.enter()
        .append("line")
        .attr("class","edge")
        .on("mousedown", function(){d3.event.stopPropagation();})
        .on("contextmenu", removeEdge)
        .on("mouseover", function(d){
        	d3.select(this)
        		.append("title")
        		.text("v"+d.source.id+"-v"+d.target.id);
        });

  edges.exit().remove();

  vertices.enter()
          .append("circle")
          .attr("r", rad)
          .attr("class", "vertex")
          .style("fill", function(d,i){
          	return colors(d.id);
          })
          .on("mousedown", beginDragLine)
          .on("mouseup", endDragLine)
          .on("mouseover", function(d){
          	d3.select(this)
          		.append("title")
          		.text("v"+d.id);
          })
          .on("contextmenu", removeNode);

  vertices.exit().remove();
  force.start();
}

//further interface
svg.on("mousedown", addNode)
	  .on("mousemove", updateDragLine)
	  .on("mouseup", hideDragLine)
	  .on("contextmenu", function(){d3.event.preventDefault();})
	  .on("mouseleave", function(){hideDragLine(); resetMouseVar();});

d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);

restart();
