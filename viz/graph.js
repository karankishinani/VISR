// input csv graph data into following format:
/*
  source: node id (int)
  target: node id (int)
  weight: edge weight (int)
  fos: fos id (int) ~ optional
*/
// NOTE - run this code in firefox to avoid a CORS request error
var graphFile = 'dummy-graph.csv';
var institutionFile = '../output/labels_clusters.csv';
var fosFile = 'fos_table.csv';

//d3.csv(graphFile).then(function(edges) {
//edges.forEach(function(d) {
//    d.source = +d.source;
//    d.target = +d.target;
//    d.weight = +d.weight;
//    console.log(d);
//})
//plotGraph(edges);
//return edges;
//});

var dataset = [];
var institutions = {};
var fos = {};

var promises = [
    d3.csv(graphFile, function(d) {
        dataset.push({"source": +d.source, "target": +d.target, "weight": +d.weight, "fos": +d.fos});
    }),
    
    d3.csv(institutionFile, function(d) {
        institutions[d.id] = d.label;
    }),
    
    d3.csv(fosFile, function(d) {
        fos[d.id] = d.label;
    })
]

Promise.all(promises).then(ready)

function ready([us]) {
    console.log("The dataset contains: ");
    console.log(dataset);
    console.log(institutions);
    console.log(fos);
    plotGraph(dataset);    
}

// TODO:
// input institution lookup table, store into hashmap
// input fos lookup table, store into hashmap
// input node total degree lookup table, store into hash map

function plotGraph(links) {

    var nodes = {};

    // Compute the distinct nodes from the links.
    links.forEach(function(link) {
        link.source = nodes[link.source] ||
            (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] ||
            (nodes[link.target] = {name: link.target});
    });

    links.forEach(function(d) {
        nodes[d.source.name].degree = 0;
        nodes[d.target.name].degree = 0;
    });

    var maxNodeDegree = 0,
        maxEdgeWeight = 0;

    links.forEach(function(d) {
        nodes[d.source.name].degree += d.weight;
        nodes[d.target.name].degree += d.weight;

        if (nodes[d.source.name].degree > maxNodeDegree) {      
            maxNodeDegree = nodes[d.source.name].degree;    
        }      

        if (nodes[d.target.name].degree > maxNodeDegree) {       
            maxNodeDegree = nodes[d.target.name].degree;     
        }
        
        if (d.weight > maxEdgeWeight) {      
            maxEdgeWeight = nodes[d.source.name].degree;    
        }      
    });
    
//    console.log(maxNodeDegree);
//
//    console.log(nodes);

    var width = 1200,
        height = 700;

    var force = d3.forceSimulation()
    .nodes(d3.values(nodes))
    .force("link", d3.forceLink(links).distance(100))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("charge", d3.forceManyBody().strength(-250))
    .alphaTarget(1)
    .on("tick", tick);

    var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

    // add the links and the arrows

    var path = svg.append("g")
    .selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("class", function(d) { return "link " + d.type; })
    .attr("style", function(d) {
        if (d.value == 1){
            return "stroke: green; stroke-width: 3" }
        else if (d.value == 0) {
            return "stroke: blue; stroke-width: 1"
        }; } );

    // define the nodes
    var node = svg.selectAll(".node")
    .data(force.nodes())
    .enter().append("g")
    .attr("class", "node")
    .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
         );

    var scale = d3.scaleLinear().domain([0, maxNodeDegree]).range([3,20]);

    var cScale = d3.scaleQuantize()                   
    .domain([0, maxNodeDegree])                   
    .range(d3.schemeBlues[9]);
    
    var edgeScale = d3.scaleQuantize()                   
    .domain([0, maxEdgeWeight])                   
    .range(d3.schemeReds[9].slice(3,10));
    // add the nodes
    node.append("circle")
        .attr("r", function(d) { return scale(d.degree); })
        .style("fill", function(d) { return cScale(d.degree); });

    // add the labels
    node.append("text")
        .attr("y", function(d) { return scale(d.degree)+10; })
        .attr("text-anchor", "middle")
        .attr("style", "font-weight: bold;")
        .text(function(d) { return institutions[d.name].toUpperCase(); });

    // add the curvy lines
    function tick() {
        path.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = 0;
            return "M" +
                d.source.x + "," +
                d.source.y + "A" +
                dr + "," + dr + " 0 0,1 " +
                d.target.x + "," +
                d.target.y;
        })
        .style('stroke', function(d) { return edgeScale(d.weight); });

        node
            .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; })
    };

    function dragstarted(d) {
        if (!d3.event.active) force.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    };

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    };

    function dragended(d) {
        if (!d3.event.active) force.alphaTarget(0);
        if (d.fixed == true){
            d.fx = d.x;
            d.fy = d.y;
        }
        else{
            d.fx = null;
            d.fy = null;
        }

    };

    node.on("dblclick",function(d){

        if (d.fixed == true){
            d.fixed = false
            d.fx = null;
            d.fy = null;
        }
        else {
            d.fixed = true
            d.fx = d.x;
            d.fy = d.y;
        }

    });

}