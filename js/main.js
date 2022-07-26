main_data = null;
default_year = "2016";

data_post_process_enable_team_grouping = true;

async function load_data() {
	file_name = "data/Summer-Olympic-medals-1976-to-2008.csv";
	file_name = "https://raw.githubusercontent.com/yogamaha/yogamaha.github.io/main/data/Summer-Olympic-medals-1976-to-2008.csv";
	file_name = "https://raw.githubusercontent.com/yogamaha/yogamaha.github.io/main/data/athlete_events.csv";
	//data = await d3.csv(file_name);

	data = await d3.csv(file_name, function(row) {
		//athlete_events.csv
		//"ID","Name","Sex","Age","Height","Weight","Team","NOC","Games","Year","Season","City","Sport","Event","Medal"

		return row;
	});

	// Filter records without medals
	data = post_process_data(data);

	data = get_medals_summary(data);

	show_medals_summary(data);

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

function get_medals_summary(data, year) {
	console.log("get_medals_summary:Begin")
	if (!year) {
		year = default_year;
	}
	summary_filter = d => d.Year == year;
	data = d3.filter(data, summary_filter)
	data = d3.rollup(data, v => v.length, d => d.NOC, d => d.Medal)
	console.log(data)

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


		//console.log(val)

		return val;
	});
	

	//console.log([...data])

	console.log(data)
	//console.log(data.get("USA"))
	console.log("get_medals_summary:End")

	return data;
}

function compare_val(a, b) {
	val = 0;
	if (a && b) {
		val = a - b;
	} else if (a) {
		val = 1
	} else if (b) {
		val = -1
	}
	return val * -1
}

function show_medals_summary_1(data) {
	data = data.slice(0, 10)
	console.log("show_medals_summary:Begin")

	settings = {
		width : 600,
		height : 300,
		margin : 50,
		padding : 0.4,
		barWidth: 25
	}

	var x = d3.scaleBand().domain(data.map(d => d[0])).range([0, settings.width]).padding([settings.padding]);
	//var x = d3.scaleBand().domain(data.map(d => d[0])).range([0, settings.barWidth * (data.length +1)]).padding([settings.padding]);

	//var x = d3.scaleOrdinal().domain(data.map(d => d[0])).range([0, (data.length +1) * settings.barWidth]);
	// range = d3.range(settings.barWidth, (data.length +1) * settings.barWidth, settings.barWidth)
	// console.log(range)
	// var x = d3.scaleBand().domain(data.map(d => d[0])).range(range).padding([settings.padding]);

	var y = d3.scaleLinear().domain([0, data[0][1].get("Total")]).range([settings.height, 0])

	svg = d3.select("#svg1")
		.attr("width", settings.width + 2*settings.margin)
		.attr("height", settings.height + 2*settings.margin)
		.append("g")
		.attr("transform","translate("+settings.margin+","+ settings.margin+")")

	// Bar chart
	/*
	svg.selectAll().data(data).enter()
	  .append('rect')
	    .attr('x', function(d,i) {
	    	//console.log(x(d[0]))
	    	return x(d[0]);
	    	//return bandwidth()
	    })
	    .attr('y', function(d,i) {
	    	//console.log(y(d[1].get("Total")))
	    	return y(d[1].get("Total"));
	    })
	    .attr('width', x.bandwidth())
	    .attr('height', function(d,i) {return settings.height - y(d[1].get("Total"));});
	*/

	// Stacked Bar chart
	subgroups = ["Gold", "Silver", "Bronze"]
	var stackGen = d3.stack().keys(subgroups).value((obj, key) => obj[1].get(key));
	stackedData = stackGen(data)
	console.log(stackedData)

 	var color = d3.scaleOrdinal()
    	.domain(subgroups)
    	//.range(['gold','silver','bronze'])
    	.range(['#FFD700','#C0C0C0','#CD7F32'])

  svg.append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .enter().append("g")
      .attr("fill", function(d) { return color(d.key); })
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d) { 
        	console.log(d)
        	//return x(d.data.group); 
        	return x(d.data[0]); 
        })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        //.attr("width",x.bandwidth())
        .attr("width", settings.barWidth)


    //Scales
	d3.select("svg")
		.append("g")
		.attr("transform","translate("+settings.margin+","+settings.margin+")")
		.call(d3.axisLeft(y));


	d3.select("svg")
		.append("g")
		.attr("transform","translate("+settings.margin+","+ (settings.height + settings.margin) +")")
		.call(d3.axisBottom(x));

	console.log("show_medals_summary:End")

	return data;
}

function show_medals_summary(data) {
	//data = data.slice(0, 10)
	console.log("show_medals_summary:Begin")

	settings = {
		width : 600,
		height : 300,
		margin : 50,
		padding : 0.4,
		barWidth: 25
	}

	//var x = d3.scaleBand().domain(data.map(d => d[0])).range([0, settings.width]).padding([settings.padding]);
	graph_width = (settings.barWidth + settings.padding * settings.barWidth) * (data.length +1)
	var x = d3.scaleBand().domain(data.map(d => d[0])).range([0, graph_width]).padding([settings.padding]);

	//var x = d3.scaleOrdinal().domain(data.map(d => d[0])).range([0, (data.length +1) * settings.barWidth]);
	//range = d3.range(settings.barWidth + settings.padding * settings.barWidth, (data.length +1) * (settings.barWidth + settings.padding * settings.barWidth), settings.barWidth + settings.padding * settings.barWidth)
	// console.log(range)
	//var x = d3.scaleBand().domain(data.map(d => d[0])).range(range).padding([settings.padding]);

	var y = d3.scaleLinear().domain([0, data[0][1].get("Total")]).range([settings.height, 0])

	d3.select("#chart1")
		.attr("width", settings.width + 2*settings.margin)
		.style("max-width", settings.width + 2*settings.margin)
		.attr("height", settings.height + 2*settings.margin)		

	svg = d3.select("#svg1")
		.attr("width", graph_width + 2*settings.margin)
		.attr("height", settings.height + 2*settings.margin)		
		.append("g")
		.attr("transform","translate("+settings.margin+","+ settings.margin+")")

	// Bar chart
	/*
	svg.selectAll().data(data).enter()
	  .append('rect')
	    .attr('x', function(d,i) {
	    	//console.log(x(d[0]))
	    	return x(d[0]);
	    	//return bandwidth()
	    })
	    .attr('y', function(d,i) {
	    	//console.log(y(d[1].get("Total")))
	    	return y(d[1].get("Total"));
	    })
	    .attr('width', x.bandwidth())
	    .attr('height', function(d,i) {return settings.height - y(d[1].get("Total"));});
	*/

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
        	console.log(d)
        	//return x(d.data.group); 
        	return x(d.data[0]); 
        })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        //.attr("width",x.bandwidth())
        .attr("width", settings.barWidth)

    //Scales
	d3.select("#svg1")
		.append("g")
		.attr("transform","translate("+settings.margin+","+settings.margin+")")
		.call(d3.axisLeft(y));


	d3.select("#svg1")
		.append("g")
		.attr("transform","translate("+settings.margin+","+ (settings.height + settings.margin) +")")
		.call(d3.axisBottom(x));



	console.log("show_medals_summary:End")

	return data;
}

load_data();
