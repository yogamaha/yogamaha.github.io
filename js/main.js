data = null;
async function load_data() {
	file_name = "data/Summer-Olympic-medals-1976-to-2008.csv";
	file_name = "https://raw.githubusercontent.com/yogamaha/yogamaha.github.io/main/data/Summer-Olympic-medals-1976-to-2008.csv";
	//data = await d3.csv(file_name);

	// console.log(data.length)
	// console.log(data[0])
	data = await d3.csv(file_name, function(row) {
		//City,Year,Sport,Discipline,Event,Athlete,Gender,Country_Code,Country,Event_gender,Medal
		row.Game = row.City + "-" + row.Year
		return row;
	});

	print_data();
	/*
	d3.csv(file_name, function(data) {
		console.log(data.City + "-" + data.Year);
	    for (var i = 0; i < data.length; i++) {
	    	console.log(data[i]);
	    	//City,Year,Sport,Discipline,Event,Athlete,Gender,Country_Code,Country,Event_gender,Medal
	        console.log(data[i].City);
	        console.log(data[i].Year);
	        console.log(data[i].Sport);
	        console.log(data[i].Discipline);
	        console.log(data[i].Event);
	        console.log(data[i].Athlete);
	        console.log(data[i].Gender);
	        console.log(data[i].Country_Code);
	        console.log(data[i].Country);
	        console.log(data[i].Event_gender);
	        console.log(data[i].Medal);
	    }
	});	
	*/
	return data;
}

async function print_data() {
	console.log(data.length)
	console.log(data[0])
}

load_data();
