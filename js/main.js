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

	// Filter records without medals
	data = post_process_data(data);
	main_data = data;

	file_name = "data/noc_regions.csv";
	file_name = "https://raw.githubusercontent.com/yogamaha/yogamaha.github.io/main/data/noc_regions.csv";

	noc_regions_data = await d3.csv(file_name);
	noc_regions_data = new Map(noc_regions_data.map(d => [d.NOC, d.region]));
	// console.log("noc_regions_data=")
	// console.log(noc_regions_data)

	initialize_olympics_selector(data);

	update_medals_summary(data, get_selected_year());

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

function initialize_olympics_selector(data) {
	console.log("initialize_olympics_selector:Begin")
	data = d3.flatRollup(data, v => v.length, d => d.Games, d => d.City)

	data = data.sort(function compare(a, b)  {
		val = d3.descending(a[0], b[0])
		return val;
	});

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
        update_medals_summary(main_data, get_selected_year())
    })

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
	d3.select("#chart").selectAll('*').remove();
	d3.select("#legend").selectAll('*').remove();
	d3.select("#heading").selectAll('*').remove();
	d3.select("#path").selectAll('*').remove();
}

function format_data_for_viz(data) {
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

	data = data.sort(function compare(a, b)  {
		val = d3.descending(a[1].get("Total"), b[1].get("Total")) 
			|| d3.descending(a[1].get("Gold"), b[1].get("Gold")) 
			|| d3.descending(a[1].get("Silver"), b[1].get("Silver")) 
			|| d3.descending(a[1].get("Bronze"), b[1].get("Bronze"))


		return val;
	});
	

	//console.log([...data])

	console.log(data)
	//console.log(data.get("USA"))
	console.log("format_data_for_viz:End")

	return data;	
}


function show_medal_details(data, xaxis_tick_mapper, next_scene_caller) {
	console.log("show_medal_details:Begin")

	data = format_data_for_viz(data)

	settings = {
		width : 600,
		height : 300,
		margin : 50,
		padding : 0.4,
		barWidth: 25
	}
	graph_width = (settings.barWidth + settings.padding * settings.barWidth) * (data.length +1)
	max_count = Math.ceil(data[0][1].get("Total")/10) * 10;

	var x = d3.scaleBand().domain(data.map(d => d[0])).range([0, graph_width]).padding([settings.padding]);
	var y = d3.scaleLinear().domain([0, max_count]).range([settings.height, 0])

	clear_page();

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
	    .attr("y", 10)
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

	d3.select("#heading").append("h2").text("Olympic Medals")

	heading_setting = {
		legend_x : 600,
		legend_y : 10,
		legend_size : 20,
		legend_margin : 25,
	}

	legend_svg = d3.select("#legend").append("svg")
		.attr("width", "100%")
		.attr("height", "100%")
		//.style("max-width", settings.width + 2*settings.margin)
		//.attr("height", settings.height + 2*settings.margin + 100)		

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
		path.append("a").html(filter_1).attr("href", "javascript:update_medals_summary(main_data, filter_1);")
		path.append("br")
	}
	if (filter_2) {
		path.append("span").text("Country:")
		path.append("a").html(noc_regions_data.get(filter_2)).attr("href", "javascript:update_medal_details_scene_2(main_data, filter_2);")
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

function update_medals_summary(data, filter) {
	filter_1 = filter;
	filter_2 = null;
	filter_3 = null;
	filter_4 = null;
	data = get_medal_details_scene_1(data);

	//show_medals_summary(data);
	xaxis_tick_mapper = (d,i) => noc_regions_data.get(d);
	next_scene_caller = update_medal_details_scene_2;
	show_medal_details(data, xaxis_tick_mapper, next_scene_caller);

}

function get_medal_details_scene_1(data) {
	console.log("get_medals_summary:Begin")

	summary_filter = d => d.Games == filter_1;
	data = d3.filter(data, summary_filter)
	data = d3.rollup(data, v => v.length, d => d.NOC, d => d.Medal)

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

	summary_filter = d => d.Games == filter_1 && d.NOC == filter_2;
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

	summary_filter = d => d.Games == filter_1 && d.NOC == filter_2 && d.Sport == filter_3;
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

	summary_filter = d => d.Games == filter_1 && d.NOC == filter_2 && d.Sport == filter_3 && d.Event == filter_4;
	data = d3.filter(data, summary_filter)
	data = d3.rollup(data, v => v.length, d => d.Sex, d => d.Medal)
	console.log(data)

	console.log("get_medal_details_scene_4:End")

	return data;	
}


//------------------------------------------------------------------------------------------------------------------

load_data();
