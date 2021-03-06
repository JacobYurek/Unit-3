(function(){
var attrArray = ["Acres burned by Human caused Fires", "Acres burned by Lightning caused Fires", "Number of Fires caused by Humans", "Number of Fires caused by Lightning", "Number of Residences at extreme Wildfire Risk by State"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 45,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
var attrMax = {
        "Acres burned by Human caused Fires": 250000,
        "Acres burned by Lightning caused Fires": 2600000,
        "Number of Fires caused by Humans": 9000,
        "Number of Fires caused by Lightning": 1400,
        "Number of Residences at extreme Wildfire Risk by State": 250000,
    }; //list of attributes

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
                return colorScale(value);            
            } else {                
                return "#ccc";            
            }    
        })
        .on("mouseover", function(event, d){
            highlight(d.properties.woe_name, d.properties);
        })
        .on("mouseout", function(event, d){
            dehighlight(d.properties.woe_name, d.properties);
        })
        .on("mousemove", moveLabel);
    var desc = mystates.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');

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

///function to create coordinated bar chart
function setChart(csvData, colorScale){
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
    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 78)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Amount of Burned Forest " + expressed + " in each state");
    //create vertical axis generator
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 240000]);
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
    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.Name;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", function(event, d){
            highlight(d.Name, d);
        })
        .on("mouseout", function(event, d){
            dehighlight(d.Name, d);
        })
        .on("mousemove", moveLabel);
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
    updateChart(bars, csvData.length, colorScale);
};
function changeAttribute(attribute, csvData) {
    //change the expressed attribute
    expressed = attribute;
    //recreate the color scale
    var colorScale = makeColorScale(csvData);
    //recolor enumeration units
    var states = d3.selectAll(".mystates")
        .transition()
        .duration(1000)
        .style("fill", function (d) {
            try {  
                var value = d.properties[expressed];
                
                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
            } catch (exception) {
            }
    });
    var bars = d3.selectAll(".bar")
        //Sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);

    updateChart(bars, csvData.length, colorScale, expressed);
    newMaximum(bars);
};

function updateChart(bars, n, colorScale, expressed){
    //position bars
    expressed = expressed
        if (expressed = "Acres burned by Human caused Fires") {
            var yScale = d3.scaleLinear()
                console.log('HF')
                .range([463, 0])
                .domain([0, 240000]);
        } else if (expressed = "Acres burned by Lightning caused Fires") {
            var yScale = d3.scaleLinear()
                console.log('LF')
                .range([463, 0])
                .domain([0, 300000]);
        } else if (expressed = "Number of Fires caused by Humans") {
            var yScale = d3.scaleLinear()
                console.log('HFN')
                .range([463, 0])
                .domain([0, 300000]);
        } else if (expressed = "Number of Fires caused by Lightning") {
            var yScale = d3.scaleLinear()
                console.log('LFN')
                .range([463, 0])
                .domain([0, 300000]);
        } else {
            var yScale = d3.scaleLinear()
                .range([463, 0])
                .domain([0, 300000]);
        };
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){            
            var value = d[expressed];            
            if(value) {                
                return colorScale(value);            
            } else {                
                return "#ccc";            
            }    
    });
    
    var chartTitle = d3.select(".chartTitle")
        .text("Number of " + expressed + " in each state");
    

};
function highlight(props, d){
    //change stroke
    var selected = d3.selectAll("." + props)
        .style("stroke", "blue")
        .style("stroke-width", "2");
    setLabel(props, d);
};
function dehighlight(props){
    var selected = d3.selectAll("." + props)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];

    };
    d3.select(".infolabel")
        .remove();
};
function setLabel(props, d){
    //label content
    var labelAttribute = "<h1>" + d[expressed] + "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.Name + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props);
};
//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
})();