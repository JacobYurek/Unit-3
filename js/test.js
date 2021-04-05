window.onload = setMap();
//execute script when window is loaded
function setMap(){  
    function callback(data){    
        csvData = data[0];    
        state = data[1]; 
        country = data[2];   
        countrycsv = data[3];
        
        var states = topojson.feature(state, state.objects.MyLab2_13),
            Countries = topojson.feature(country, country.objects.ne_50m_admin_0_countries);

    

        //examine the results
        console.log(states);
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
        //Example 2.6 line 5...create graticule lines
        //add Europe countries to map
        var countries = map.append("path")
            .datum(Countries)
            .attr("class", "countries")
            .attr("d", path);
        var mystates = map.selectAll(".mystates")
            .data(states)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "mystates " + d.properties.woe_name;
            })
            .attr("d", path);
        var mystates = map.append("path")
            .datum(states)
            .attr("class", "mystates")
            .attr("d", path);
     };

    //map frame dimensions
    var width = 860,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    
    var projection = d3.geoAlbersUsa()

        .scale(1000)
        .translate([width / 2, height / 2]);
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/Forest_fire_ata.csv")); //load attributes from csv    
    promises.push(d3.json("data/noattributes.topojson")); //load background spatial data     
    promises.push(d3.json("data/use.topojson")); 
    promises.push(d3.csv("data/ne_50m_admin_0_countries.csv"));
    Promise.all(promises).then(callback);
};
