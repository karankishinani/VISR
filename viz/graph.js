// input csv graph data into following format:
/*
  source: node id (int)
  target: node id (int)
  weight: edge weight (int)
  fos: fos id (int) ~ optional
*/
// NOTE - run this code in firefox to avoid a CORS request error
var graphFile = 'edgefile.csv';
var institutionFile = '../output/labels_clusters.csv';
var fosFile = 'fos_table.csv';
var fosSizeFile = 'weight_degree_fit.csv';

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

var width = screen.width,
    height = screen.height-150;


var dataset = [];
var institutions = {};
var fos = {};
var fosSize = {};

var promises = [
    d3.csv(graphFile, function(d) {
        if (+d.source != -1 && +d.target != -1){ //(+d.weight > fosWeight && +d.fos == fosId && ...)
            dataset.push({"source": +d.source, "target": +d.target, "weight": +d.weight, "fos": +d.fos});
        }
    }),

    d3.csv(institutionFile, function(d) {
        institutions[d.id] = d.label;
    }),

    d3.csv(fosFile, function(d) {
        fos[d.id] = d.label;
    }),

    d3.csv(fosSizeFile, function(d) {
        fosSize[d.id] = {"weight": +d.weight, "degree": +d.degree};
    })
]


// TODO:
// input institution lookup table, store into hashmap
// input fos lookup table, store into hashmap
// input node total degree lookup table, store into hash map

function plotGraph(links, fosDegree) {

    console.log(links);

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
        maxEdgeWeight = 0,
        maxNodeDegreeId;


    links.forEach(function(d) {
        nodes[d.source.name].degree += d.weight;
        nodes[d.target.name].degree += d.weight;

        if (nodes[d.source.name].degree > maxNodeDegree) {      
            maxNodeDegree = nodes[d.source.name].degree;
            maxNodeDegreeId = d.source.name;
        }      

        if (nodes[d.target.name].degree > maxNodeDegree) {       
            maxNodeDegree = nodes[d.target.name].degree;    
            maxNodeDegreeId = d.target.name;
        }

        if (d.weight > maxEdgeWeight) {      
            maxEdgeWeight = nodes[d.source.name].degree;    
        }      
    });

    //console.log(maxNodeDegreeId);

    filtered_nodes = {};

    allNodes = Object.keys(nodes);

    allNodes.forEach(function(d) {
        // CHANGE
        if (nodes[d].degree > fosDegree){
            filtered_nodes[d] = nodes[d];
        } 
    })

    //    console.log(maxNodeDegree);
    //
    //    console.log(nodes);

    //console.log("nodes");
    //console.log(filtered_nodes);
    //    console.log(nodes);
    //    var filtered = _.result(_.find(nodes, function(chr) {
    //        return chr.degree > 1;
    //    }), 'name');
    //    console.log(filtered);

    var force = d3.forceSimulation()
    .nodes(d3.values(filtered_nodes))
    .force("link", d3.forceLink(links).distance(200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("charge", d3.forceManyBody().strength(-250))
    .alphaTarget(0)
    .on("tick", tick);

    var svg = d3.select("body").append("svg")
    .attr("id","svg_id")
    .attr("width", width)
    .attr("height", height);

    // add the links and the arrows

    var path = svg.append("g")
    .selectAll("path")
    .data(links)
    .enter()
    .append("path")
    //    .attr("class", function(d) { return "link " + d.type; })
    //    .attr("style", function(d) {
    //        if (d.value == 1){
    //            return "stroke: green; stroke-width: 3" }
    //        else if (d.value == 0) {
    //            return "stroke: blue; stroke-width: 1"
    //        }; } )
    ;

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

    var edgeScale = d3.scaleLinear().domain([0, maxEdgeWeight]).range([0.1,1]);

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
            .attr('stroke', 'blue')
            .attr('stroke-opacity', function(d) { return edgeScale(d.weight); });

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

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}


Promise.all(promises).then(ready)

function ready([us]) {

    var data = []
    var i = 0

    //TODO: Year ranges
    for (var key in fos){
        data.push(fos[key].toUpperCase());
    }

    d3.select('body')
        .append('div')
        .text('Field of Study');

    var select = d3.select('div')
    .append('select')
    .attr('class','select')
    .on('change',onchange)

    d3.select('body')
        .append('br')

    var options = select
    .selectAll('option')
    .data(data).enter()
    .append('option')
    .text(function (d) { return d; });

    var svg = d3.select("body").append("svg")
    .attr("id","svg_id")
    .attr("width", width)
    .attr("height", height);

    function onchange() {

        // delete svg
        d3.select("#svg_id").remove();

        selectValue = d3.select('select').property('value');

        // console.log(fosSize)

        fosId = getKeyByValue(fos, selectValue.toLowerCase());
        fosWeight = fosSize[fosId].weight;
        fosDegree = fosSize[fosId].degree;


        var filteredArray = [];
        console.log('test');
        console.log('dataset');
        console.log(dataset.length);
        console.log(dataset[0]);

        j = 0;
        dataset.forEach(function(d){

            if (+d.weight > fosWeight && +d.fos == fosId){
                if(j<5){
                    j=j+1
                    console.log(d);
                }
                filteredArray.push(Object.assign({}, d));
            }
        })
        //
        //        var data = { records : dataset }
        //        
        //        var filteredArray = data.records.filter(function(itm){
        //            return (itm.weight > fosWeight && itm.fos == fosId);
        //        });
        //        
        //        console.log('dataset with size: ' + dataset.length);
        //        console.log(dataset[0]);
        //        console.log('filteredArray with size: ' + filteredArray.length);
        //        console.log(filteredArray[0]);
        //        console.log('i= ' + i);
        i = i + 1; 
        plotGraph(filteredArray, fosDegree);
    }

    //    console.log("The dataset contains: ");
    //    console.log(dataset);

    //filteredArray = filteredArray["records"];
    //
    //    console.log(filteredArray);
    //
    //    console.log(institutions);
    //    console.log(fos);

}