// input csv graph data into following format:
/*
  source: node id (int)
  target: node id (int)
  weight: edge weight (int)
  fos: fos id (int) ~ optional
*/
// NOTE - run this code in firefox to avoid a CORS request error
var graphFile = 'dummy-graph.csv';
d3.csv(graphFile).then(function(edges) {
  edges.forEach(function(d) {
    d.source = +d.source;
    d.target = +d.target;
    d.weight = +d.weight;
    console.log(d);
  })
  plotGraph(edges);
  return edges;
});

// TODO:
  // input institution lookup table, store into hashmap
  // input fos lookup table, store into hashmap
  // input node total degree lookup table, store into hash map

function plotGraph(graph) {

  var nodes = {};

  // edges.forEach(function(link)) {
  //   edge.source = nodes[edge.source];
  //   edge.target = nodes[edge.target];
  // }
  //
  // var width = 1200,
  //     height = 700;
  //
  // var force = d3.forceSimulation()
  //               .nodes(d3.values(nodes))
  //               .force("link", d3.forceLink(links).distance(60))
  //               .force('center', d3.forceCenter(width / 2, height / 2))
  //               .force("x", d3.forceX())
  //               .force("y", d3.forceY())
  //               .force("charge", d3.forceManyBody().strength(-250))
  //               .alphaTarget(1)
  //               .on("tick", tick);
  //
  // var svg = d3.select("body").append("svg")
  //     .attr("width", width)
  //     .attr("height", height);

}
