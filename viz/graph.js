const graphFile = 'data/edgefile.csv';
const institutionFile = 'data/labels_clusters.csv';
const fosFile = 'data/fos_table.csv';
const fosSizeFile = 'data/weight_degree_fit.csv';

var marginTop = 160;

const width = window.innerWidth,
    height = window.innerHeight - marginTop;


const dataset = [];
const institutions = {};
const fos = {};
const fosSize = {};

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

function plotGraph(links, fosDegree, isSingleInstitution) {

    // console.log(links);

    const nodes = {};

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

    var totalWeight = 0,
        maxNodeDegree = 0,
        maxEdgeWeight = 0,
        maxNodeDegreeId;


    links.forEach(function(d) {
        nodes[d.source.name].degree += d.weight;
        nodes[d.target.name].degree += d.weight;

        totalWeight += d.weight;

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

    var avgWeight = totalWeight * 2 / links.length;

    filtered_nodes = {};

    allNodes = Object.keys(nodes);

    allNodes.forEach(function(d) {
        // CHANGE
        if (nodes[d].degree > fosDegree){
            filtered_nodes[d] = nodes[d];
        } 
    })
    var strengthVal;
    if (isSingleInstitution) { 
        strengthVal = -1000;
    } else {
        strengthVal = -390;
    }
    var force = d3.forceSimulation()
    .nodes(d3.values(filtered_nodes))
    .force("link", d3.forceLink(links).distance(200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("charge", d3.forceManyBody().strength(strengthVal))
    .alphaTarget(0)
    .on("tick", tick);

    var svg = d3.select("body").append("svg")
    .attr("id","svg_id")
    .attr("width", width)
    .attr("height", height);

    //add encompassing group for the zoom 
    var g = svg.append("g")
    .attr("class", "everything");

    // add the links and the arrows

    var path = g.append("g")
    .selectAll("path")
    .data(links)
    .enter()
    .append("path");

    // define the nodes
    var node = g.selectAll(".node")
    .data(force.nodes())
    .enter().append("g")
    .attr("class", "node")
    .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
         );


    var scale = d3.scaleLinear().domain([0, maxNodeDegree]).range([3,20]);
    var singleScale = d3.scaleLinear().domain([0, maxNodeDegree]).range([8,18]);

    var cScale = d3.scaleQuantize()                   
    .domain([0, maxNodeDegree])                   
    .range(d3.schemeBlues[9]);

    var edgeScale = d3.scaleLinear().domain([0, maxEdgeWeight]).range([0.1,1]);

    if (!isSingleInstitution) {
        // add the nodes
        node.append("circle")
            .attr("r", function(d) { return scale(d.degree); })
            .style("fill", function(d) { return cScale(d.degree); });
    } else {
        // add the nodes
        node.append("circle")
            .attr("r", function(d) { return singleScale(d.degree); })
            .style("fill", function(d) { return cScale(d.degree); });
    }


    // add the labels
    node.append("text")
        .attr("y", function(d) { return scale(d.degree)+10; })
        .attr("text-anchor", "middle")
        .attr("style", "font-weight: bold;")
        .text(function(d) { return institutions[d.name].toUpperCase(); });

    // add the curvy lines
    function tick() {
        path.attr("d", function(d) {
            const dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = 0;
            return "M" +
                d.source.x + "," +
                d.source.y + "A" +
                dr + "," + dr + " 0 0,1 " +
                d.target.x + "," +
                d.target.y;
        })
            .attr('stroke', function(d) {
            if (d.weight > avgWeight) {
                return 'red';
            } else {
                return 'teal'
            }
        })
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
            d3.select(this.firstChild)
                .style('stroke', 'black')
                .style('stroke-width', '1px');
        } else {
            d.fixed = true
            d.fx = d.x;
            d.fy = d.y;
            d3.select(this.firstChild)
                .style('stroke', '#FF8C00')
                .style('stroke-width', '3px')
            ;
        }

    });

    //add zoom capabilities 
    var zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);

    zoom_handler(svg);  

    //Zoom functions 
    function zoom_actions(){
        g.attr("transform", d3.event.transform);
    }
    
    svg.on("dblclick.zoom", null)

}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}


Promise.all(promises).then(ready)

function ready([us]) {

    const data = [];

    //TODO: Year ranges
    for (var key in fos){
        data.push(fos[key].toUpperCase());
    }

    const select = d3.select('select')
    const body = d3.select('body')

    select.selectAll('option')
        .data(data).enter()
        .append('option')
        .text(function (d) { return d; });

    d3.select("body")
        .append("svg")
        .attr("id","svg_id")
        .attr("width", width)
        .attr("height", height);
    
    document.body.removeChild(document.querySelector('.overlay'));
}

function load() {

    // delete svg
    d3.select("#svg_id").remove();

    selectValue = d3.select('select').property('value');

    fosId = getKeyByValue(fos, selectValue.toLowerCase());
    minWeight = fosSize[fosId].weight;
    minDegree = fosSize[fosId].degree;


    const filteredArray = [];

    dataset.forEach(function(d){

        if (+d.weight > minWeight && +d.fos == fosId){
            filteredArray.push(Object.assign({}, d));
        }
    })
    plotGraph(filteredArray, minDegree, false);
}

function searchButtonPress() {
    d3.select('#svg_id').remove();

    selectValue = d3.select('select').property('value');
    fosId = getKeyByValue(fos, selectValue.toLowerCase());

    searchString = d3.select('input').property('value');
    institutionId = getKeyByValue(institutions, searchString.toLowerCase());

    minWeight = 5;
    minDegree = 5;

    const filteredArray = [];

    dataset.forEach(function(d){

        if (+d.weight > minWeight && fosId == +d.fos && (+d.source == institutionId || +d.target == institutionId)){
            filteredArray.push(Object.assign({}, d));
        }
    })
    plotGraph(filteredArray, minDegree, true);
}
