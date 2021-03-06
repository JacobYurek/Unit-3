(function(){
var attrArray = ["Acres - Human", "Acres - Lightning", "Fires - Human", "Fires - Lightning", "Number of Residences at extreme Wildfire Risk by State"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
window.onload = setMap();
//execute script when window is loaded
function setMap(){  
    function callback(data){    
        csvData = data[0];    
        state = data[1]; 
        country = data[2];   

        setGraticule(map, path);
        
        var Countries = topojson.feature(country, country.objects.ne_50m_admin_0_countries),
        	states = topojson.feature(state, state.objects.noattributes).features;

        var countries = map.append("path")
            .datum(Countries)
            .attr("class", "countries")
            .attr("d", path);

        //join csv data to GeoJSON enumeration units
        states = joinData(states, csvData);

        var colorScale = makeColorScale(csvData);

        //add enumeration units to the map
        setEnumerationUnits(states, map, path, colorScale);
        setChart(csvData, colorScale);
        createDropdown(csvData);
     };

    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 430;

    //create new svg container for the map7
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    
    var projection = d3.geoAlbersUsa()

        .scale(900)
        .translate([width / 2, height / 2]);
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/Forest_fire_ata.csv")); //load attributes from csv    
    promises.push(d3.json("data/noattributes.topojson")); //load background spatial data     
    promises.push(d3.json("data/use.topojson")); 
    Promise.all(promises).then(callback);
};

//...

///function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 45,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 240000]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.adm1_code;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 150)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Amount of Burned Forest " + expressed + " in each state");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);



    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};
function setGraticule(map, path){
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
        .attr("d", path); //project graticule lines   //...GRATICULE BLOCKS FROM Week 8
};

function joinData(states, csvData){
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.Name; //the CSV primary key
        //loop through geojson regions to find correct region
        for (var a=0; a<states.length; a++){
            var geojsonProps = states[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.woe_name; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };
    return states;
};

function setEnumerationUnits(states, map, path, colorScale){
    var mystates = map.selectAll(".mystates")
        .data(states)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "mystates " + d.properties.woe_name;
        })
        .attr("d", path)        
            .style("fill", function(d){            
                var value = d.properties[expressed];            
                if(value) {                
                    return colorScale(d.properties[expressed]);            
                } else {                
                    return "#ccc";            
                }    
        });
    var mystates = map.append("path")
        .datum(states)
        .attr("class", "mystates")
        .attr("d", path);
};

//function to create color scale generator
function makeColorScale(data){
    
    var colorClasses = [
        "#ffffb2",
        "#fecc5c",
        "#fd8d3c",
        "#f03b20",
        "#bd0026"
    ];

    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    
    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
};
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};
function changeAttribute(attribute, csvData) {
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);
    console.log("hell")
    //recolor enumeration units
    var states = d3.selectAll(".mystates").style("fill", function (d) {
        var value = d.properties[expressed];
        console.log("hell")
        if (value) {
            console.log("hell")
            return colorScale(d.properties[expressed]);
        } else {
            return "#ccc";
        }
    });
}

})(); //last line of main.js


