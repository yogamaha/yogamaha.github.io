function load_data() {
	file_name = "data/Summer-Olympic-medals-1976-to-2008.csv";
	file_name = "https://raw.githubusercontent.com/yogamaha/yogamaha.github.io/main/Summer-Olympic-medals-1976-to-2008.csv";
	d3.csv(file_name, function(data) {
		console.log(data.City + "-" + data.Year);
		/*
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
	    */
	});	
}

load_data();