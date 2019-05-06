const graphFile = 'https://media.githubusercontent.com/media/karankishinani/VISR/master/viz/data/edgefile.csv';
const institutionFile = 'https://media.githubusercontent.com/media/karankishinani/VISR/master/viz/data/labels_clusters.csv';
const fosFile = 'https://media.githubusercontent.com/media/karankishinani/VISR/master/viz/data/fos_table.csv';
const fosSizeFile = 'https://media.githubusercontent.com/media/karankishinani/VISR/master/viz/data/weight_degree_fit.csv';

const bodyMargins = 16;

const width = window.innerWidth;
let height = 0;

const dataset = [];
const institutions = {};
const fos = {};
const fosSize = {};

var tip;

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

    tip = d3.tip()
        .attr('class', 'tooltip')
        .html(d =>  {
        const ID = Math.random().toString(36).substring(7);
        knowledgeGraphRequest(ID, d)
        return "<div id=" + ID + ">Loading..</div>"
    })
        .direction('n') 
        .offset([-60, 0]);

    svg.call(tip);

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

    node.on("click", function(d) {
        d3.select(this).classed('active',!d3.select(this).classed('active'));
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

    node.on('contextmenu', (d) => {
        d3.event.preventDefault();
        tip.show(d);
    })

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
        console.log(Http);
        var response = JSON.parse(Http.responseText)['itemListElement']
        var name = query.toUpperCase();
        var desc = '';
        var url = '';
        var image = '';
        if (Http['status'] == 200 && response != "" && 'result' in response[0]) {
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
            "<div style=\"float: right; padding-left:5px; padding-right:20px; position:relative; \">" +
            '<img src="https://karankishinani.github.io/VISR/blob/master/viz/download.png" width="26px" style="position:absolute; top:-13px; right:-13px;" onclick="tip.hide()" </img>' +
            "<b>" + name + "</b><br />" +
            (desc ? "<br />" + desc : "") +
            (url ? "<br /><a href="  +url + " target=\"_blank\">Homepage</ a></br>" : "") +
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

    var institutions_list = {}

    /*An array containing all the country names in the world:*/
    for (key in institutions){
        institutions_list[institutions[key][0]] = []
    }
    for (key in institutions){
        institutions_list[institutions[key][0]].push(institutions[key])
    }

    //var institutions_list = _.values(institutions);

    /*initiate the autocomplete function on the "instSearchBox" element, and pass along the countries array as possible autocomplete values:*/
    autocomplete(document.getElementById("instSearchBox"), institutions_list);
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

// Autocomplete Feature implemented Below 
// Adapted from https://www.w3schools.com/howto/howto_js_autocomplete.asp

function autocomplete(inp, hashmap) {
    /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/

    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {

        var a, b, i, val = this.value;

        console.log(hashmap);
        var arr = hashmap[val[0].toLowerCase()];

        // Only autocomplete if length is bigger than 5
        if (val.length >= 5){
            /*close any already open lists of autocompleted values*/
            closeAllLists();
            if (!val) { return false;}
            currentFocus = -1;
            /*create a DIV element that will contain the items (values):*/
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            /*append the DIV element as a child of the autocomplete container:*/
            this.parentNode.appendChild(a);
            /*for each item in the array...*/
            for (i = 0; i < arr.length; i++) {
                /*check if the item starts with the same letters as the text field value:*/
                if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                    /*create a DIV element for each matching element:*/
                    b = document.createElement("DIV");
                    /*make the matching letters bold:*/
                    b.innerHTML = "<strong>" + arr[i].toUpperCase().substr(0, val.length) + "</strong>";
                    b.innerHTML += arr[i].toUpperCase().substr(val.length);
                    /*insert a input field that will hold the current array item's value:*/
                    b.innerHTML += "<input type='hidden' value='" + arr[i].toUpperCase() + "'>";
                    /*execute a function when someone clicks on the item value (DIV element):*/
                    b.addEventListener("click", function(e) {
                        /*insert the value for the autocomplete text field:*/
                        inp.value = this.getElementsByTagName("input")[0].value;
                        /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
                        closeAllLists();
                    });
                    a.appendChild(b);
                    
                    // if more than 3000 results and starts with U (as in university), break
                    if (val[0].toLowerCase() == 'u' && i >= 3000)
                        break;
                }
            }

        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}
