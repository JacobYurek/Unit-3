//Example 1.3 line 4...set up choropleth map

window.onload = setMap();
//execute script when window is loaded
function setMap(){

    //var container = d3.select("body") 
        //.append("svg") //put a new svg in the body
    var promises = [d3.csv("data/Forest_fire_ata.csv"),                    
                    d3.json("data/MyLab2_13.topojson"),                                                         
                    ];    
        Promise.all(promises).then(callback);    


        function callback(data){    
            csvData = data[0];    
            state = data[1];    
            
            console.log(state);
             
            var States = topojson.feature(state, state.objects.MyLab2_13);

            //examine the results
            console.log(States);
            //translate europe TopoJSON
            var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
                franceRegions = topojson.feature(france, france.objects.FranceRegions).features;

            //add Europe countries to map
            var countries = map.append("path")
                .datum(europeCountries)
                .attr("class", "countries")
                .attr("d", path);

            //add France regions to map
            var regions = map.selectAll(".regions")
                .data(franceRegions)
                .enter()
                .append("path")
                .attr("class", function(d){
                    return "regions " + d.properties.adm1_code;
                })
                .attr("d", path);
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

    
    var projection = d3.geoAlbersUsa()
        .center([0, 37])
        .rotate([-2, 0, 0])
        .parallels([35, 43])
        .scale(2500)
        .translate([width / 2, height / 2]);
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/Forest_fire_ata.csv")); //load attributes from csv    
    promises.push(d3.json("data/MyLab2_13.topojson")); //load background spatial data      
    Promise.all(promises).then(callback);

        };



