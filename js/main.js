main_data = null;
noc_regions_data = null;
default_filter = "2016 Summer";
filter_1 = null;
filter_2 = null;
filter_3 = null;
filter_4 = null;


data_post_process_enable_team_grouping = true;

//------------------------------------------------------------------------------------------------------------------

//Common

async function load_data() {
	file_name = "data/athlete_events.csv";
	file_name = "https://raw.githubusercontent.com/yogamaha/yogamaha.github.io/main/data/athlete_events.csv";

	data = await d3.csv(file_name, function(row) {
		//athlete_events.csv
		//"ID","Name","Sex","Age","Height","Weight","Team","NOC","Games","Year","Season","City","Sport","Event","Medal"

		return row;
	});

	file_name = "data/noc_regions.csv";
	file_name = "https://raw.githubusercontent.com/yogamaha/yogamaha.github.io/main/data/noc_regions.csv";

	noc_regions_data = await d3.csv(file_name);
	noc_regions_data = new Map(noc_regions_data.map(d => [d.NOC, d.region]));
	// console.log("noc_regions_data=")
	// console.log(noc_regions_data)

	// Filter records without medals
	data = post_process_data(data);
	data = map_region_data(data, noc_regions_data);
	main_data = data;

	//initialize_olympics_selector(data);
	//update_medal_details_scene_1(data, get_selected_year());
	build_scene_1(data);

	return data;
}

function print_data() {
	console.log(data.length)
	console.log(data[0])
}

function post_process_data(data) {
	console.log("post_process_data:Begin")

	filter = d => (d.Medal != "NA");
	data = d3.filter(data, filter)

	if (data_post_process_enable_team_grouping) {
		data = d3.flatGroup(data, d => d.Team, d => d.NOC, d => d.Games, d => d.Year, d => d.Season, d => d.City, d => d.Sport, d => d.Event, d => d.Medal);

		data = data.map(function (d) {
			return {
				"Team" : d[0],
				"NOC" : d[1],
				"Games" : d[2],
				"Year" : d[3],
				"Season" : d[4],
				"City" : d[5],
				"Sport" : d[6],
				"Event" : d[7],
				"Medal" : d[8],
				"Athletes" : d[9]
			};
		});

	}
	console.log(data)

	console.log("post_process_data:End")

	return data;

}


function map_region_data(data, noc_regions_data) {
	console.log("map_region_data:Begin")

	data = data.map(function(d) {
		region = noc_regions_data.get(d.NOC)
		d.Region = region;
		return d;
	}); 

	console.log(data)

	console.log("map_region_data:End")

	return data;

}

function initialize_olympics_selector(data) {
	console.log("initialize_olympics_selector:Begin")
	data = d3.flatRollup(data, v => v.length, d => d.Games, d => d.City)

	data = data.sort(function compare(a, b)  {
		val = d3.descending(a[0], b[0])
		return val;
	});

	d3.select("#input").append("span").text("Game Selector:")

	d3.select("#input")
		.append("select")
			.attr("id", "selectButton")

	select_button = d3.select("#selectButton");
	select_button
	      .selectAll('option')
	     	.data(data)
	      	.enter()
	    	.append('option')
		      .text(function (d) { 
		      	return d[0] + ", " + d[1]; 
		      }) // text showed in the menu
		      .attr("value", function (d) { 
		      	return d[0]; 
		      }) // corresponding value returned by the button

    // When the button is changed, run the updateChart function
    select_button.on("change", function(d) {
        // recover the option that has been chosen
        update_medal_details_scene_1(main_data, get_selected_year())
    })

    if (filter_1) {
	    select_button.property('value', filter_1)
    }

	console.log("initialize_olympics_selector:End")
	return data
}

function get_selected_year() {
	select_button = d3.select("#selectButton");

	selected_year = select_button.property("value")

	if (!selected_year) {
		select_button.property('value', default_filter);
		selected_year = select_button.property("value")
	}

	return selected_year
}

function clear_page() {
	d3.select("#heading").selectAll('*').remove();
	d3.select("#nav").selectAll('*').remove();
	d3.select("#input").selectAll('*').remove();
	d3.select("#chart").selectAll('*').remove();
	d3.select("#legend").selectAll('*').remove();
	d3.select("#path").selectAll('*').remove();
	clear_drilldown();
}

function clear_drilldown() {
	d3.select("#heading-2").selectAll('*').remove();
	d3.select("#chart-2").selectAll('*').remove();
	d3.select("#legend-2").selectAll('*').remove();
}

function format_data_for_viz(data, sort_data) {
	console.log("format_data_for_viz:Begin")

	data = [...data]
	data.forEach((d, i) => {
		if (!d[1].get("Gold")) {
			d[1] = d[1].set("Gold", 0)
		}
		if (!d[1].get("Silver")) {
			d[1] = d[1].set("Silver", 0)
		}
		if (!d[1].get("Bronze")) {
			d[1] = d[1].set("Bronze", 0)
		}

		if (!d[1].get("Total")) {
			total = d[1].get("Gold") + d[1].get("Silver") + d[1].get("Bronze")
			d[1].set("Total", total)
		}

	});

	if (sort_data) {
		data = data.sort(function compare(a, b)  {
			val = d3.descending(a[1].get("Total"), b[1].get("Total")) 
				|| d3.descending(a[1].get("Gold"), b[1].get("Gold")) 
				|| d3.descending(a[1].get("Silver"), b[1].get("Silver")) 
				|| d3.descending(a[1].get("Bronze"), b[1].get("Bronze"))


			return val;
		});		
	}
	

	//console.log([...data])

	console.log(data)
	//console.log(data.get("USA"))
	console.log("format_data_for_viz:End")

	return data;	
}


function show_medal_details(data, xaxis_tick_mapper, next_scene_caller, sort_data = true) {
	console.log("show_medal_details:Begin")

	data = format_data_for_viz(data, sort_data)

	settings = {
		width : 2000,
		height : 300,
		margin : 50,
		padding : 0.4,
		barWidth: 25
	}
	graph_width = (settings.barWidth + settings.padding * settings.barWidth) * (data.length +1)
	max_count = d3.max(data.map(d => d[1].get("Total")))
	max_count = Math.ceil(max_count/10) * 10;

	var x = d3.scaleBand().domain(data.map(d => d[0])).range([0, graph_width]).padding([settings.padding]);
	var y = d3.scaleLinear().domain([0, max_count]).range([settings.height, 0])

	clear_page();

	initialize_olympics_selector(main_data);

	d3.select("#nav")
		.append("button")//.selectAll()
		.text("Back")
		.attr("onclick", "active_scene()")

	d3.select("#chart")
		.attr("width", settings.width + 2*settings.margin)
		.style("max-width", settings.width + 2*settings.margin)
		.attr("height", settings.height + 2*settings.margin + 100)		

	svg = d3.select("#chart").append("svg")
		.attr("width", graph_width + 2*settings.margin)
		.attr("height", settings.height + 2*settings.margin + 100)

	// Stacked Bar chart
	subgroups = ["Gold", "Silver", "Bronze"]
	var stackGen = d3.stack().keys(subgroups).value((obj, key) => obj[1].get(key));
	stackedData = stackGen(data)
	console.log(stackedData)

 	var color = d3.scaleOrdinal()
    	.domain(subgroups)
    	//.range(['gold','silver','bronze'])
    	.range(['#FFD700','#C0C0C0','#CD7F32'])

  svg
	.append("g")
	.attr("transform","translate("+settings.margin+","+ settings.margin+")")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .enter().append("g")
      .attr("fill", function(d) { return color(d.key); })
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function(d) { return d; })
      .enter().append("rect")
      	//.attr("width", "100%").attr("height", "100%")
        .attr("x", function(d) { 
        	//console.log(d)
        	//return x(d.data.group); 
        	return x(d.data[0]); 
        })
        .attr("y", function(d) { return y(d[1]); })
        .attr("width", settings.barWidth)
        //.transition()//.ease(d3.easeLinear)
        //.duration(1000)    
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .on("mouseover", function(event,d) {
    	var tooltip = d3.select("#tooltip")
       
       tooltip.transition()
         .duration(200)
         .style("opacity", .9);
       
       tooltip.html(
       	//"Country: " + d.data[0] + "<br/>" +
       	"Gold: " + d.data[1].get("Gold") + "<br/>" +
      	"Silver: " + d.data[1].get("Silver") + "<br/>" +
      	"Bronze: " + d.data[1].get("Bronze") + "<br/>" +
      	"Total: " + d.data[1].get("Total") + "<br/>")

         tooltip.style("left", (event.pageX) + "px")
         	.style("top", (event.pageY - 28) + "px");
       })
     .on("mouseout", function(event, d) {
     	var tooltip = d3.select("#tooltip")

       tooltip.transition()
         .duration(500)
         .style("opacity", 0);
       })
     .on("click", function(event, d) {
     	new_filter = d.data[0]
     	//update_country_medal_details(main_data, new_filter)
     	if (next_scene_caller) {
	     	next_scene_caller(main_data, new_filter);
     	}
     })


    //Scales - Y-axis
	svg
		.append("g")
		.attr("transform","translate("+settings.margin+","+settings.margin+")")
		.call(d3.axisLeft(y));

	svg.append("text")
	    .attr("text-anchor", "end")
	    .attr("transform", "rotate(-90)")
	    .attr("x", -settings.height/2)
	    .attr("y", 15)
	    .text("Medal count")

	//Scales - X-axis
	xAxisGenerator = d3.axisBottom(x);
	if (xaxis_tick_mapper) {
		xAxisGenerator.tickFormat(xaxis_tick_mapper)
	}
	/*
	xAxisGenerator.tickFormat((d,i) => {
		return noc_regions_data.get(d);
	});
	*/

	svg
		.append("g")
		.attr("transform","translate("+settings.margin+","+ (settings.height + settings.margin) +")")
		.call(xAxisGenerator)
	.selectAll("text")
  		.attr("y", 0)
    	.attr("x", 9)
    	.attr("transform", "rotate(90)")
    	.style("text-anchor", "start");

	d3.select("#heading").append("h2").text("Olympic Medals - Drill Down")

	heading_setting = {
		width: 200,
		height: 200,
		legend_x : 50,
		legend_y : 10,
		legend_size : 20,
		legend_margin : 25,
	}

	legend_svg = d3.select("#legend").append("svg")
		.attr("width", heading_setting.width)
		.attr("height", heading_setting.height)
		.append("g")//.selectAll()

	legend_svg.selectAll("random")
	  .data(subgroups)
	  .enter()
	  .append("rect")
	    .attr("x", heading_setting.legend_x)
	    .attr("y", function(d,i){ return heading_setting.legend_y + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
	    .attr("width", heading_setting.legend_size)
	    .attr("height", heading_setting.legend_size)
	    .style("fill", function(d){ return color(d)})

	legend_svg.selectAll("random")
	  .data(subgroups)
	  .enter()
	  .append("text")
	    .attr("x", heading_setting.legend_x + heading_setting.legend_size *1.2 )
	    .attr("y", function(d,i){ return heading_setting.legend_y + i*(heading_setting.legend_size+5) + (heading_setting.legend_size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
	    .text(function(d){ return d})
	    .attr("text-anchor", "left")
	    .style("alignment-baseline", "middle")

	show_traversal_path()

	console.log("show_medal_details:End")
	return data;	
}

function show_traversal_path() {
	console.log("show_traversal_path:Begin")
	path = d3.select("#path")
	d3.select("#path").append("span").append("b").text("Drill Down Path:").append("br")
	if (filter_1) {
		path.append("span").text("Game:")
		path.append("a").html(filter_1).attr("href", "javascript:update_medal_details_scene_1(main_data, filter_1);")
		path.append("br")
	}
	if (filter_2) {
		path.append("span").text("Country:")
		path.append("a").html(filter_2).attr("href", "javascript:update_medal_details_scene_2(main_data, filter_2);")
		path.append("br")
	}
	if (filter_3) {
		path.append("span").text("Sport:")
		path.append("a").html(filter_3).attr("href", "javascript:update_medal_details_scene_3(main_data, filter_3);")
		path.append("br")
	}
	if (filter_4) {
		path.append("span").text("Event:")
		path.append("a").html(filter_4).attr("href", "javascript:update_medal_details_scene_4(main_data, filter_4);")
		path.append("br")
	}

	console.log("show_traversal_path:End")
}


//------------------------------------------------------------------------------------------------------------------


//Scene-1

function update_medal_details_scene_1(data, filter) {
	filter_1 = filter;
	filter_2 = null;
	filter_3 = null;
	filter_4 = null;
	data = get_medal_details_scene_1(data);

	//xaxis_tick_mapper = (d,i) => noc_regions_data.get(d);
	xaxis_tick_mapper = null;
	next_scene_caller = update_medal_details_scene_2;
	show_medal_details(data, xaxis_tick_mapper, next_scene_caller);

}

function get_medal_details_scene_1(data) {
	console.log("get_medals_summary:Begin")

	summary_filter = d => d.Games == filter_1;
	data = d3.filter(data, summary_filter)
	data = d3.rollup(data, v => v.length, d => d.Region, d => d.Medal)

	console.log(data)
	//console.log(data.get("USA"))
	console.log("get_medals_summary:End")

	return data;
}

//------------------------------------------------------------------------------------------------------------------

//Scene-2
function update_medal_details_scene_2(data, filter) {
	filter_2 = filter;
	filter_3 = null;
	filter_4 = null;

	data = get_medal_details_scene_2(data);

	xaxis_tick_mapper = null;
	next_scene_caller = update_medal_details_scene_3;
	show_medal_details(data, xaxis_tick_mapper, next_scene_caller);
}

function get_medal_details_scene_2(data) {
	console.log("get_medal_details_scene_2:Begin")

	summary_filter = d => d.Games == filter_1 && d.Region == filter_2;
	data = d3.filter(data, summary_filter)
	data = d3.rollup(data, v => v.length, d => d.Sport, d => d.Medal)
	console.log(data)

	console.log("get_medal_details_scene_2:End")

	return data;	
}

//------------------------------------------------------------------------------------------------------------------

//Scene-3
function update_medal_details_scene_3(data, filter) {
	filter_3 = filter;
	filter_4 = null;

	data = get_medal_details_scene_3(data);

	xaxis_tick_mapper = null;
	//next_scene_caller = update_medal_details_scene_4;
	next_scene_caller = null;
	show_medal_details(data, xaxis_tick_mapper, next_scene_caller);
}

function get_medal_details_scene_3(data) {
	console.log("get_medal_details_scene_3:Begin")

	summary_filter = d => d.Games == filter_1 && d.Region == filter_2 && d.Sport == filter_3;
	data = d3.filter(data, summary_filter)
	data = d3.rollup(data, v => v.length, d => d.Event, d => d.Medal)
	console.log(data)

	console.log("get_medal_details_scene_3:End")

	return data;	
}

//------------------------------------------------------------------------------------------------------------------

//Scene-4

function update_medal_details_scene_4(data, filter_4) {
	filter_4 = filter;
	data = get_medal_details_scene_4(data);

	xaxis_tick_mapper = null;
	next_scene_caller = null;
	show_medal_details(data, xaxis_tick_mapper, next_scene_caller);

}

function get_medal_details_scene_4(data) {
	console.log("get_medal_details_scene_4:Begin")

	summary_filter = d => d.Games == filter_1 && d.Region == filter_2 && d.Sport == filter_3 && d.Event == filter_4;
	data = d3.filter(data, summary_filter)
	data = d3.rollup(data, v => v.length, d => d.Sex, d => d.Medal)
	console.log(data)

	console.log("get_medal_details_scene_4:End")

	return data;	
}


//------------------------------------------------------------------------------------------------------------------



//Scene-1

active_scene = null;
function build_scene(year,scene, scene_name) {
	active_scene = scene;
	data = get_data_scene_1(main_data);

	next_scene_caller = null;
	show_line_chart(year, scene_name, data, next_scene_caller);

}

function build_scene_1() {
	scene = build_scene_1;
	year = 1920;
	scene_name = "Scene-1";
	build_scene(year, scene, scene_name)
}

function build_scene_2() {
	scene = build_scene_2;
	year = 1936;
	scene_name = "Scene-2";
	build_scene(year, scene, scene_name)
}

function build_scene_3() {
	scene = build_scene_3;
	year = 1968;
	scene_name = "Scene-3";
	build_scene(year, scene, scene_name)
}

function build_scene_4() {
	scene = build_scene_4;
	year = 1984;
	scene_name = "Scene-4";
	build_scene(year, scene, scene_name)
}


function build_scene_5() {
	scene = build_scene_5;
	year = 2016;
	scene_name = "Scene-5";
	build_scene(year, scene, scene_name)
}

function get_data_scene_1(data) {
	console.log("get_data_scene_1:Begin")

	summary_filter = d => d.Season == "Summer"
	data = d3.filter(data, summary_filter)
	data = data.sort(function (a, b)  {
		//val = d3.descending(a[0], b[0])
		val = d3.ascending(a.Year, b.Year)
		return val;
	});

	data = d3.flatGroup(data, d => d.Region, d => d.Year, d => d.City)

	data = data.map(d => {
		medals = d3.rollup(d[3], v => v.length, d => d.Medal);
		process_medals(medals);

		tmp = d[3];

		d[3] = medals.get("Total");
		d.push(medals)
		d.push(tmp)
		return d;
	})

	console.log(data)
	//console.log(data.get("USA"))
	console.log("get_data_scene_1:End")

	return data;
}

function process_medals(medals) {
	if (!medals.get("Gold")) {
		medals = medals.set("Gold", 0)
	}
	if (!medals.get("Silver")) {
		medals = medals.set("Silver", 0)
	}
	if (!medals.get("Bronze")) {
		medals = medals.set("Bronze", 0)
	}

	if (!medals.get("Total")) {
		total = medals.get("Gold") + medals.get("Silver") + medals.get("Bronze")
		medals.set("Total", total)
	}
}

function show_line_chart(year, scene_name, data, next_scene_caller) {
	console.log("show_line_chart:Begin")

	settings = {
		width : 1000,
		height : 300,
		margin : 50,
		padding : 1,
		barWidth: 10
	}
	//graph_width = (settings.barWidth + settings.padding * settings.barWidth) * (data.length +1)
	graph_width = settings.width

	max_count = d3.max(data.map(d => d[3]))
	max_count = Math.ceil(max_count/10) * 10;
	
	x_axis_map = new Map(data.map(d => [d[1], d[1] + " " + d[2]]).sort((a,b) => d3.ascending(a[0], b[0])))

	var x = d3.scaleBand()
			//.domain(data.map(d => d[1]).sort((a,b) => d3.ascending(a, b)))
			.domain(x_axis_map.keys())
			.range([0, graph_width]).padding([settings.padding]);

	//var x = d3.scaleLinear().domain([d3.min(data.map(d => d[1])), d3.max(data.map(d => d[1]))]).range([0, graph_width])
	var y = d3.scaleLinear().domain([0, max_count]).range([settings.height, 0])

	clear_page();

	d3.select("#nav")
		.append("button")//.selectAll()
		.text("1")
		.attr("id", "Scene-1")
		.attr("onclick", "build_scene_1()")

	d3.select("#nav")
		.append("button")//.selectAll()
		.text("2")
		.attr("id", "Scene-2")
		.attr("onclick", "build_scene_2()")
	d3.select("#nav")
		.append("button")//.selectAll()
		.text("3")
		.attr("id", "Scene-3")
		.attr("onclick", "build_scene_3()")
	d3.select("#nav")
		.append("button")//.selectAll()
		.text("4")
		.attr("id", "Scene-4")
		.attr("onclick", "build_scene_4()")
	d3.select("#nav")
		.append("button")//.selectAll()
		.text("5")
		.attr("id", "Scene-5")
		.attr("onclick", "build_scene_5()")

	d3.select("#nav")
		.append("button")//.selectAll()
		.text("Drill down")
		.attr("id", "drilldown")
		.attr("onclick", "update_medal_details_drilldown_year('" + year + "')")

	d3.select("#chart")
		.attr("width", settings.width + 2*settings.margin)
		.style("max-width", settings.width + 2*settings.margin)
		.attr("height", settings.height + 2*settings.margin + 100)

	d3.select("#" + scene_name).style("background-color", "#555555")

	svg = d3.select("#chart").append("svg")
		.attr("width", graph_width + 2*settings.margin)
		.attr("height", settings.height + 2*settings.margin + 100)

country_list = ["USA", "Russia", "China", "UK", "France", "Japan", "Germany", "Sweden"]
//country_list = ["USA", "Russia", "China"]
summary_filter = d => d[1] <= year && country_list.indexOf(d[0]) > -1
//summary_filter = d => d.Season == "Summer" && ["USA"].indexOf(d.Region) > -1  //&& d.Year <= 1950
data = d3.filter(data, summary_filter)

x_points = data.map(d => d[1]).sort((a,b) => d3.ascending(a, b))
//x_axis_map = new Map(data.map(d => [d[1], d[1] + " " + d[2]]).sort((a,b) => d3.ascending(a[0], b[0])))

var data = d3.groups(data, d => d[0]);


var color = d3.scaleOrdinal()
	//.domain(data.map(d => d[0]))
	.domain(country_list)
	.range(["blue", "red", "orange", "green", "brown", "violet", "pink", "grey", "slateblue", "grey1", "orange"])

  svg
	.append("g")
	.attr("transform","translate("+settings.margin+","+ settings.margin+")")
	//.attr("id", "test")	
	.selectAll()
	//.selectAll("#test")
    .data(data).enter()
	    .append("path")
		    .attr("fill", "none")
		    .attr("stroke", function(d){ return color(d[0]) })
		    //.attr("stroke", "steelblue")
		    .attr("stroke-width", 1.5)
		    .attr("d", function(d){
		    	fn = d3.line()
		    	.curve(d3.curveCardinal)
		    	.x(function(d) { 
		    		return x(d[0])
		    	})
		        .y(function(d) { 
		        	return y(d[1]) 
		        })

		        x_points_map = new Map()

		        x_points.forEach(r => x_points_map.set(r, 0));

		        d[1].forEach(r => {
		        	key = r[1]
		        	value = r[3]
		        	x_points_map.set(key, value)
		        })


		        //return fn(d[1]);
		        return fn(x_points_map.entries());
		    })

svg.append('g')
	.attr("transform","translate("+settings.margin+","+ settings.margin+")")
    .selectAll().data(data).enter()
    	.append("g")
		.selectAll().data(d => d[1]).enter()
			.append("circle")
		      .attr("cx", function (d) { 
		      	return x(d[1]); 
		      } )
		      .attr("cy", function (d) { 
		      	return y(d[3]); 
		      } )
		      .attr("r", 10)
		      //.style("fill", "#69b3a2")
		      .style("fill-opacity", "0")
		    .on("mouseover", function(event,d) {
		    	// console.log(d)
		    	// console.log(event)
		    	var tooltip = d3.select("#tooltip")
		       
		       tooltip.transition()
		         .duration(200)
		         .style("opacity", .9);
		       
		       country = d[0]
		       year = d[1]
		       medals_data = d[4];

		       tooltip.html(
		       	"Country: " + country + "<br/>" +
		       	"Year: " + year + "<br/>" +
		       	"Gold: " + medals_data.get("Gold") + "<br/>" +
		      	"Silver: " + medals_data.get("Silver") + "<br/>" +
		      	"Bronze: " + medals_data.get("Bronze") + "<br/>" +
		      	"Total: " + medals_data.get("Total") + "<br/>")

		         tooltip.style("left", (event.pageX))
		         	.style("top", (event.pageY - 28));
		       })
		     .on("mouseout", function(event, d) {
		     	var tooltip = d3.select("#tooltip")

		       tooltip.transition()
		         .duration(500)
		         .style("opacity", 0);
		       })
		     .on("click", function(event, d) {
		     	console.log(d);
		     	filter_data = d[5][0];
				filter_1 = filter_data.Games;
				filter_2 = filter_data.Region;
				filter_3 = null;
				filter_4 = null;

				update_medal_details_drilldown();
		     })

	  annotations = [
	  	{
        	note: {
            	title: "Phase 1",
            	label: "Till 1920, host nations are the leaders in Medals table"
          	},
	  		year: "1920"
	  	},
	  	{
        	note: {
            	title: "Phase 2",
            	label: "World war 2 era - Emergence of USA & Germany as big powers in the world reflects in the Olympics medal table"
          	},
	  		year: "1936"
	  	},
	  	{
        	note: {
            	title: "Phase 3",
            	label: "Post World War - USA & Russia emerging as the new super powers"
          	},
	  		year: "1968"
	  	},
	  	{
        	note: {
            	title: "Phase 4",
            	label: "Cold war era - USA skipping Olympics in 1980 & Russia missing 1984 event"
          	},
	  		year: "1984"
	  	},
	  	{
        	note: {
            	title: "Phase 5",
            	label: "New world order - Emergence of China"
          	},
	  		year: "2012"
	  	}
	  ]

	  annotations = d3.filter(annotations, d => d.year <= year)

	  annotations = annotations.map(d => {
	  	d.type = d3.annotationLabel
	  	d.x = x(d.year)
        d.y = y(0)
        d.dx = 0
        d.dy = y(150) - y(0)

	  	return d;
	  })

        makeAnnotations = d3.annotation().annotations(annotations)
        svg.append("g")
        	.attr("transform","translate("+settings.margin+","+ settings.margin+")")
          .attr("class", "annotation-group")
          .call(makeAnnotations)


    //Scales - Y-axis
	svg
		.append("g")
		.attr("transform","translate("+settings.margin+","+settings.margin+")")
		.call(d3.axisLeft(y));

	svg.append("text")
	    .attr("text-anchor", "end")
	    .attr("transform", "rotate(-90)")
	    .attr("x", -settings.height/2)
	    .attr("y", 15)
	    .text("Medal count")

	//Scales - X-axis
	xAxisGenerator = d3.axisBottom(x);

	xAxisGenerator.tickFormat((d,i) => {
		//return noc_regions_data.get(d);
		return x_axis_map.get(d);
	});

	svg
		.append("g")
		.attr("transform","translate("+settings.margin+","+ (settings.height + settings.margin) +")")
		.call(xAxisGenerator)
	.selectAll("text")
  		.attr("y", 0)
    	.attr("x", 9)
    	.attr("transform", "rotate(90)")
    	.style("text-anchor", "start");

	d3.select("#heading").append("h2").text("Olympic Medals - Performance Overtime")

	heading_setting = {
		width: 200,
		height: 200,
		legend_x : 50,
		legend_y : 10,
		legend_size : 20,
		legend_margin : 25,
	}

	legend_svg = d3.select("#legend").append("svg")
		.attr("width", heading_setting.width)
		.attr("height", heading_setting.height)
		.append("g").selectAll()

	legend_svg
	  .data(country_list)
	  .enter()
	  .append("rect")
	    .attr("x", heading_setting.legend_x)
	    .attr("y", function(d,i){ return heading_setting.legend_y + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
	    .attr("width", heading_setting.legend_size)
	    .attr("height", heading_setting.legend_size)
	    .style("fill", function(d){ return color(d)})

	legend_svg
	  .data(country_list)
	  .enter()
	  .append("text")
	    .attr("x", heading_setting.legend_x + heading_setting.legend_size *1.2 )
	    .attr("y", function(d,i){ return heading_setting.legend_y + i*(heading_setting.legend_size+5) + (heading_setting.legend_size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
	    .text(function(d){ return d})
	    .attr("text-anchor", "left")
	    .style("alignment-baseline", "middle")

	console.log("show_line_chart:End")
	return data;	
}

//------------------------------------------------------------------------------------------------------------------

//Drill-down

function update_medal_details_drilldown() {
	update_medal_details_scene_2(main_data, filter_2)
	// data = get_medal_details_drilldown(main_data);


	// xaxis_tick_mapper = null;
	// next_scene_caller = null;
	// show_medal_details(data, xaxis_tick_mapper, next_scene_caller);

}

function update_medal_details_drilldown_year(year) {
	update_medal_details_scene_1(main_data, year + " Summer")

}

//------------------------------------------------------------------------------------------------------------------


load_data();
