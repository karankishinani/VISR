const graphFile = 'data/edgefile.csv';
const institutionFile = 'data/labels_clusters.csv';
const fosFile = 'data/fos_table.csv';
const fosSizeFile = 'data/weight_degree_fit.csv';

const bodyMargins = 16;

const width = window.innerWidth;
let height = 0;

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

    var tooltip_just_created = false;

    let tip = d3.tip()
        .attr('class', 'tooltip')
        .html(d =>  {
            tooltip_just_created = true;
            const ID = Math.random().toString(36).substring(7);
            knowledgeGraphRequest(ID, d)
            return "<div id=" + ID + ">Loading..</div>"
        })
        .direction('n') 
        .offset([-20, 0]);

    //svg.call(tip);

    // define the nodes
    var node = g.selectAll(".node")
    .data(force.nodes())
    .enter().append("g")
    .attr("id", "node")
    .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
         );


    // Disable tooltip
    d3.select('body').on('click', (d) => {
        if (tooltip_just_created) {
            tooltip_just_created = false;
        }else {
            tip.hide(d)
        }
    });


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
            if (!d3.select(this).classed('path-active')){
                if (d.weight > avgWeight) {
                    return 'red';
                } else {
                    return 'teal'
                }
            }
            else{
                return "orange";
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

    node.on("click", function(d){
        d3.select(this).classed('active',!d3.select(this).classed('active'));
        //tip.show(d);
        if (d3.select(this).classed('active')){
            path.attr("d",function(i){
                if ((i.source.name == d.name) || (i.target.name == d.name)){
                    d3.select(this).classed('path-active',true);
                    d3.select(this).attr("stroke", 'red');
                    d3.select(this).attr("stroke-width", '5px');
                }

                else{
                    d3.select(this).classed('path-active',false);
                    d3.select(this).attr("stroke", 'teal');
                    d3.select(this).attr("stroke-width", '1px');
                }
            });
        }
        else{
            path.attr("d",function(i){
                d3.select(this).classed('path-active',false);
                d3.select(this).attr("stroke-width", '1px');
            });
        }
    
            });
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

function knowledgeGraphRequest(ID, d) {
    const Http = new XMLHttpRequest();
    const key = "AIzaSyBu15yBGhAoJp3u7pudHj7egNoA54Yr538";
    const query = institutions[d.name];
    const url="https://kgsearch.googleapis.com/v1/entities:search?limit=1&prefix=true&query=" + query + "&key=" + key;
    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange=(e)=> {
        var response = JSON.parse(Http.responseText)['itemListElement']
        var name = query.toUpperCase();
        var desc = '';
        var url = '';
        var image = '';
        if (response != "" && 'result' in response[0]) {
            if (parseFloat(response[0]['resultScore']) >= 100.0) {
               response = response[0]['result']
                if ('name' in response) {
                    name = response['name'];
                }
                if ('description' in response) {
                    desc = response['description'];
                }
                if ('url' in response) {
                    url = response['url'];
                }
                if ('image' in response && 'contentUrl' in response['image']) {
                    image = response['image']['contentUrl'];
                }  
            }
        }
        document.getElementById(ID).innerHTML =
                                (image ? "<img width=\"100px\" src=\"" + image + "\"/>" : "") +
                                "<div style=\"float: right; padding-left:5px\">" +
                                    "<b>" + name + "</b><br /><br />" +
                                    (desc ? "" + desc + "</br>" : "") +
                                    (url ? "<a href="  +url + " target=\"_blank\">Homepage</ a></br>" : "") +
                                "</div>";
    };
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

    height =  window.innerHeight - document.getElementById("topBox").offsetHeight - bodyMargins - 10;

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
    d3.select("#instSearchBox").property("value", "");

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

    if (institutionId) {
        minWeight = 5;
        minDegree = 5;

        const filteredArray = [];

        dataset.forEach(function(d){

            if (+d.weight > minWeight && fosId == +d.fos && (+d.source == institutionId || +d.target == institutionId)){
                filteredArray.push(Object.assign({}, d));
            }
        })
        plotGraph(filteredArray, minDegree, true);
    } else {
        alert("The institution could not be found in this field.");
    }
}
