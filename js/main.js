window.onload = setMap();
//execute script when window is loaded
function setMap(){  
    function callback(data){    
        csvData = data[0];    
        state = data[1];    
        
        console.log(state);
        var States = topojson.feature(state, state.objects.MyLab2_13).features;

        //examine the results
        console.log(States);
        var mystates = map.selectAll(".mystates")
            .data(States)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "mystates " + d.properties.woe_name;
            })
            .attr("d", path);
        var mystates = map.append("path")
            .datum(States)
            .attr("class", "mystates")
            .attr("d", path);
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
        //Example 2.6 line 5...create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
        //create graticule background
        
     };

    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    
    var projection = d3.geoAlbers()
        .center([-20, 127])
        .parallels([35, 43])
        .scale(450)
        .translate([width / 2, height / 2]);
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/Forest_fire_ata.csv")); //load attributes from csv    
    promises.push(d3.json("data/usefile.topojson")); //load background spatial data      
    Promise.all(promises).then(callback);
};
