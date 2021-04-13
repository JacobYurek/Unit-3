//creates a function to include others to allow variables to be expressed at local scale
(function () {
    //declare vars globally so all functions can access 
    //creates and array to store the attributes from csvdata later on
    var attrArray = [
        "Acres burned by Human caused Fires",
        "Acres burned by Lightning caused Fires",
        "Number of Fires caused by Humans",
        "Number of Fires caused by Lightning",
        "Number of Residences at Risk of Fire by State",
    ]; 
    //sets the global variable expressed to the initial state of "Acres burned by Human caused Fires"
    var expressed = attrArray[0];
    //variable to set the charts frame dimensions globally 
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 45,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //variable of yScale to set the initial range and domain of the variable
    var yScale = d3.scaleLinear().range([463, 0]).domain([0, 250000]);
    //variable that allows storage of the maximun value of yscale for each attr to be used later in resizing y scale
    var attrMax = {
        "Acres burned by Human caused Fires": 250000,
        "Acres burned by Lightning caused Fires": 2600000,
        "Number of Fires caused by Humans": 9000,
        "Number of Fires caused by Lightning": 1400,
        "Number of Residences at Risk of Fire by State": 250000,
    };
    //execute setMap function when window is loaded
    window.onload = setMap();
//Setmap function to initialize the d3 map 
function setMap() {
    //creates a callback function to allow data loaded later in the script to be processed here
    function callback(data) {
        //following lines of code create varibles from csv and topojson files pushed to callback later
        csvData = data[0];
        state = data[1];
        country = data[2];
        //creates a graticle element
        setGraticule(map, path);
        //makes two variables to store information on both countries and states attirbute and location
        var Countries = topojson.feature(country, country.objects.ne_50m_admin_0_countries),
            states = topojson.feature(state, state.objects.noattributes).features;
        //creates the counties element with varibales that can be altered in style.css
        var countries = map
            .append("path")
            .datum(Countries)
            .attr("class", "countries")
            .attr("d", path);

        //joinData function to merge the csv data to GeoJSON enumeration units
        states = joinData(states, csvData);
        //makeColorScale function called with csvData
        var colorScale = makeColorScale(csvData);

        //add enumeration units function called to add the state varaibels declared earlier
        setEnumerationUnits(states, map, path, colorScale);
        //calls on the set chart function
        setChart(csvData, colorScale);
        //calls on the createDropdown function
        createDropdown(csvData);
        //calls on the setTextbox function
        setTextbox();
    }

    //creates two varibles that set the height and width of the map 
    var width = window.innerWidth * 0.5,
        height = 430;

    //creates new svg container for the map with the width and height properties defined above
    var map = d3
        .select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    //creates a d3 projection with a set scale and a height and weight that defiend above
    var projection = d3
        .geoAlbersUsa()
        .scale(900)
        .translate([width / 2, height / 2]);
    //variable path is created that is altered in the callback function above
    var path = d3.geoPath().projection(projection);

    //creates an empty list to store promise data 
    var promises = [];
    //load attributes from csv
    promises.push(d3.csv("data/Forest_fire_ata.csv")); 
    //load the data on the united states positions
    promises.push(d3.json("data/noattributes.topojson")); 
    //load background spatial data
    promises.push(d3.json("data/use.topojson"));
    //promise all to store the asynchronous data stored in the promises array
    Promise.all(promises).then(callback);


}
//Creates a function to set the graticule of the map
function setGraticule(map, path) {
    //varibale graticule with .step to place graticule lines every 5 degrees of longitude and latitude
    var graticule = d3.geoGraticule().step([5, 5]); 
    //creates a variable to store the map graticule
    var gratBackground = map
        //choose the predefiend path element to make the backgorund 
        .append("path")
        //bind graticule backgrounds position in the map
        .datum(graticule.outline()) 
        //assign class for styling in css
        .attr("class", "gratBackground") 
        //project graticule in the previously assigned path element
        .attr("d", path); 
    //create graticule lines
    var gratLines = map
        //select graticule elements that will be created
        .selectAll(".gratLines")
        //bind graticule lines to each element to be created
        .data(graticule.lines()) 
        //create an element for each datum
        .enter() 
        //append each element to the svg as a path element
        .append("path") 
        //assign class for styling in css
        .attr("class", "gratLines") 
        //project graticule lines 
        .attr("d", path); 

}
//creates function that will join data from topojson states and the csv attribute data
function joinData(states, csvData) {
    //loop through csv to assign each set of csv attribute values to geojson state
    for (var i = 0; i < csvData.length; i++) {
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.Name; //the CSV primary key
        //loop through geojson regions to find correct state
        for (var a = 0; a < states.length; a++) {
            //the current region geojson properties
            var geojsonProps = states[a].properties;
            //the geojson primary key 
            var geojsonKey = geojsonProps.woe_name; 

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey) {
                //assign all attributes and values
                attrArray.forEach(function (attr) {
                    //get csv attribute value
                    var val = parseFloat(csvRegion[attr]); 
                    //assign attribute and value to geojson properties
                    geojsonProps[attr] = val; 
                });
            }
        }
    }
    //returns states to be utilized
    return states;
}
//creates a function to create the enumerated units/states from data
function setEnumerationUnits(states, map, path, colorScale) {
    //creates a variable to store the map states
    var mystates = map
        //select state elements that will be created
        .selectAll(".mystates")
        //bind states to each element to be created
        .data(states)
        //create a state element
        .enter()
        //append each element to the svg as a path element
        .append("path")
        //assign class for styling
        .attr("class", function (d) {
            return "mystates " + d.properties.woe_name;
        })
        //project states
        .attr("d", path)
        //.stlye used to alter the elements color based on the colorScale function defiend below
        .style("fill", function (d) {
            var value = d.properties[expressed];
            if (value) {
                return colorScale(value);
            } else {
                return "#ccc";
            }
        })
        //creates a event listener to call the highlight function for the state that is selected by the cursors path
        .on("mouseover", function (event, d) {
            highlight(d.properties.woe_name, d.properties);
        })
        //creates a event listener to call the dehighlight the state that is selected by the cursors path
        .on("mouseout", function (event, d) {
            dehighlight(d.properties.woe_name, d.properties);
        })
        //creates an event listener that calles on the moveLabel function to enable said function to have state label follow mouse when cursor is over a state
        .on("mousemove", moveLabel);
    //variable to allow easy transfer of information to the dehighliting function
    var desc = mystates.append("desc").text('{"stroke": "#000", "stroke-width": "0.5px"}');
    //variable to create the background of the map
    var mapBackground = map
        //select rectangle elements that will be created
        .append("rect")
        //assign class for styling
        .attr("class", "mapBackground")
        //following assign the positioning and size descriptions of the element
        .attr("width", 500)
        .attr("height", 45)
        .attr("x", 395)
        .attr("y", 0);
    //variable to create the title of the map
    var mapTitle = map
        //select text elements that will be created
        .append("text")
        //following assign the positioning and size descriptions of the element
        .attr("x", 400)
        .attr("y", 20)
        //assign class for styling
        .attr("class", "mapTitle")
        //assigns the text that will become the map title
        .text("Variations in Forest Fire Numbers and ");
    //variable to create the title of the map
    var mapTitle = map
        //select text elements that will be created
        .append("text")
        //following assign the positioning and size descriptions of the element
        .attr("x", 400)
        .attr("y", 40)
        //assign class for styling
        .attr("class", "mapTitle")
        //assigns the text that will become the map title
        .text("Land Damaged in the United States");
}

//function to create color scale generator
function makeColorScale(data) {
    //array to store the color styles selected from color brewer
    var colorClasses = ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"];

    //create color scale generator
    var colorScale = d3.scaleThreshold().range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    //for loop to parse threw the data and select the value based on globally defined expressed attribute 
    for (var i = 0; i < data.length; i++) {
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    }

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function (d) {
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
}
//creates a dropdown function 
function createDropdown(csvData) {
    //add select element
    var dropdown = d3
        //select body elements that will be created
        .select("body")
        //this appends the select option to the body 
        .append("select")
        //assign class for styling
        .attr("class", "dropdown")
        //This creates an event listener that calls the change attribute function when the dropdown is changed
        .on("change", function () {
            changeAttribute(this.value, csvData);
        });

    //add initial option
    var titleOption = dropdown
        //ensures that the option is whats being appened
        .append("option")
        //assign class for styling
        .attr("class", "titleOption")
        //this makes the element have no attribute 
        .attr("disabled", "true")
        //sets the text to be the selected attribute
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown
        //selects attribute options element
        .selectAll("attrOptions")
        //sets the data to be the globally defined array
        .data(attrArray)
        //create an element
        .enter()
        //ensures that an element is created for each attribute
        .append("option")
        //allows the selection of the value 
        .attr("value", function (d) {
            return d;
        })
        //the selection of the text data occurs in this line
        .text(function (d) {
            return d;
        });
}

///function to create coordinated bar chart
function setChart(csvData, colorScale) {
    //create a second svg element to hold the bar chart
    var chart = d3
        //select body elements that will be created
        .select("body")
        //this appends svg with the body
        .append("svg")
        //following assign the size descriptions of the element
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        //assign class for styling
        .attr("class", "chart");
    //create a rectangle for chart background fill
    var chartBackground = chart
        //select rectangle elements that will be created
        .append("rect")
        //assign class for styling
        .attr("class", "chartBackground")
        //following assign the positioning and size descriptions of the element
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    //create a text element for the chart title
    var chartTitle = chart
        //select text elements that will be created
        .append("text")
        //following assign the positioning and size descriptions of the element
        .attr("x", 78)
        .attr("y", 40)
        //assign class for styling
        .attr("class", "chartTitle")
        //assigns the text that will become the chart title
        .text("Amount of Burned Forest " + expressed + " in each state");
    //create frame for chart border
    var chartFrame = chart
        //select rectangle elements that will be created
        .append("rect")
        //assign class for styling
        .attr("class", "chartFrame")
        //following assign the positioning and size descriptions of the element
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    //set bars for each province
    var bars = chart
        //select bar elements that will be created
        .selectAll(".bar")
        //sets the data that will be used in bar height determination
        .data(csvData)
        //create a bar element
        .enter()
        //following ensures the element being affected is a rectanlge
        .append("rect")
        //the sort function enables the comparison of elements in the array to determine the larger and smaller
        .sort(function (a, b) {
            return b[expressed] - a[expressed];
        })
        //assign class for styling
        .attr("class", function (d) {
            return "bar " + d.Name;
        })
        //following assign the positioning and size descriptions of the element
        .attr("width", chartInnerWidth / csvData.length - 1)
        //creates a event listener to call the highlight function for the bar that is selected by the cursors path
        .on("mouseover", function (event, d) {
            console.log(d);
            highlight(d.Name, d);
        })
        //creates a event listener to call the dehighlight the bar that is selected by the cursors path
        .on("mouseout", function (event, d) {
            dehighlight(d.Name, d);
        })
        //creates an event listener that calles on the moveLabel function to enable said function to have bar label follow mouse when cursor is over a state
        .on("mousemove", moveLabel);
    //variable to allow easy transfer of information to the dehighliting function
    var desc = bars.append("desc").text('{"stroke": "none", "stroke-width": "0px"}');
    //calls the update chart function 
    updateChart(bars, csvData.length, colorScale);
}
//function to allow altering of which of 5 attributes is expressed
function changeAttribute(attribute, csvData) {
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);
    //recolor enumeration units
    var states = d3
        //select state elements that will be altered
        .selectAll(".mystates")
        //transition to allow cleaner changing of state color when attribute changes
        .transition()
        //sets duration time of the transition
        .duration(950)
        //sets the style and color fill of the state
        .style("fill", function (d) {
            //try except to prevent error from undefined data
            try {
                //creates value to store expressed attribute
                var value = d.properties[expressed];
                //if else statements to determien whether to call the color scheme for a value or if value has no data defined it sets its color to grey
                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
            } catch (exception) {}
        });
    //recolor bars
    var bars = d3
        //select bar elements that will be altered
        .selectAll(".bar")
        //Sort bars by value
        .sort(function (a, b) {
            return b[expressed] - a[expressed];
        })
        //transition to allow cleaner changing of state color when attribute changes
        .transition() 
        //puts delay on the function 
        .delay(function (d, i) {
            return i * 20;
        })
        //sets duration time of the transition
        .duration(500);
    //calls the update chart function
    updateChart(bars, csvData.length, colorScale);
}
//updateChart function to alter the chart positioning when expresed attribute changes
function updateChart(bars, n, colorScale) {
    var maxscale = attrMax[expressed];
    //updates yScale based on the expressed attribute since the domain varies
    yScale = d3.scaleLinear().range([463, 0]).domain([0, maxscale]);

    // update axis
    // remove old axis
    d3.select(".axis").remove();
    //create vertical axis generator
    var yAxis = d3.axisLeft().scale(yScale);
    //place axis
    var axis = d3
        //select previously created chart elements that will be created
        .select(".chart")
        //append the g element
        .append("g")
        //assign class for styling
        .attr("class", "axis")
        //alters the postion of hte axis
        .attr("transform", translate)
        //calls on altered yAxis variable
        .call(yAxis);

    //position bars based on altered y sclae
    bars.attr("x", function (d, i) {
        return i * (chartInnerWidth / n) + leftPadding;
    })
        //size/resize bars
        .attr("height", function (d, i) {
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function (d, i) {
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars based on the expressed attribute
        .style("fill", function (d) {
            var value = d[expressed];
            if (value) {
                return colorScale(value);
            } else {
                return "#ccc";
            }
        });
    //creates the chart title variable based on changed attribute
    var chartTitle = d3.select(".chartTitle").text("Number of " + expressed + " in each state");
}
//function that creates a temporary glow of lines around the slected state element
function highlight(props, d) {
    //variabel selected used to change stroke
    var selected = d3
        //selects the element with props
        .selectAll("." + props)
        //following set the style to allow the blue tint around each state
        .style("stroke", "blue")
        .style("stroke-width", "2");
    //calls on the setLabel function
    setLabel(props, d);
}
//function that creates a temporary glow of lines around the slected bar 
function dehighlight(props) {
    //variabel selected used to change stroke
    var selected = d3
        //selects the element with props
        .selectAll("." + props)
        //calls on the getstyle function for each color style
        .style("stroke", function () {
            return getStyle(this, "stroke");
        })
        //calls on the getstyle function for each color style width
        .style("stroke-width", function () {
            return getStyle(this, "stroke-width");
        });
    //function to retries the current dom elements 
    function getStyle(element, styleName) {
        //varibale styleText is used to select previously created text from the desc elements 
        var styleText = d3.select(element).select("desc").text();
        //parses through the elements selected by the variable styleText
        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    }
    // update lable
    // remove old lable
    d3.select(".infolabel").remove();
}
//function to create a lable element
function setLabel(props, d) {
    //following varible assings the label content
    var labelAttribute = "<h1>" + d[expressed] + "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3
        //select body elements that will be created
        .select("body")
        //this appends div with the body
        .append("div")
        //assign class for styling
        .attr("class", "infolabel")
        //creates text for id based on name of state
        .attr("id", props.Name + "_label")
        //creates the html element for the previously created element
        .html(labelAttribute);
    //crates region name variable
    var regionName = infolabel.append("div")
        //assign class for styling
        .attr("class", "labelname")
        //creates the html element for the previously created element
        .html(props);
}
//function to move info label with mouse
function moveLabel() {
    //get width of label
    var labelWidth = d3.select(".infolabel").node().getBoundingClientRect().width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = event.clientY < 75 ? y2 : y1;
    //slectes the infomation label element
    d3.select(".infolabel")
        //passes the coordinates of the mouse to the style 
        .style("left", x + "px")
        .style("top", y + "px");
}
//function to create source textboc
function setTextbox(){
    var width = 1000;
    var height = 500;

    //Create SVG element
    var svg = d3.select("body")
        //selects the svg element to be altered 
        .append("svg")
        //following assign the size descriptions of the element
        .attr("width", width)
        .attr("height", height);
    //alters to postioning of the element based transform parameters
    var g = svg.append("g")
       .attr("transform", function(d, i) {
                return "translate(0,0)";
       });
    //Create and append rectangle element
    var textBlock = g.append("rect")
        //following assign the size descriptions of the rect element
        .attr("x", 22)
        .attr("y", 0)
        .attr("width", 700)
        .attr("height", 30)
        //alters the style of the rectangle element
        //assign class for styling
        .attr("class", "textBlock")
        .append("text")
    g.append("text")
        //following assign the size descriptions of the text element
        .attr("x", 30)
        .attr("y", 20)
        //alters the style of the text element
        .attr("class", "sourceText")
        //sets the text to be the source info
        .text("National Report of Wildland Fires and Acres Burned by State: 2019 (Forest_fire_ata) Source: National Interagency Fire Center");
    };

})();
