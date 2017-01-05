readRSS();

//changeOptions() changes the sport dropdown menu depending on gender selected
function changeOptions() {
	var gender = document.getElementById("gender").value;
	var sport = document.getElementById("sport");

	var men_sport = ['Baseball', 'Basketball', 'Football', 'Lacrosse', 'Soccer'];
	var women_sport = ['Basketball', 'Lacrosse', 'Soccer', 'Softball', 'Volleyball'];


	if(gender=="Women"){
		for(i=0;i<women_sport.length;i++){
			sport.options[i] = new Option(women_sport[i]);
		}
	}

	if(gender == "Men"){
		for(i=0;i<men_sport.length;i++){
			sport.options[i] = new Option(men_sport[i]);
		}			
	}
}

//This function takes reads gender and sport from the dropdown menu and returns an ID number that is correlated to an RSS feed
function returnSportID() {
	var gender = document.getElementById("gender").value;
	var sport = document.getElementById("sport").value;

	if (gender=="Women"){
		switch (sport) {
			case 'Basketball':
			return '12';
			break;
			case 'Lacrosse':
			return '13';
			break;
			case 'Soccer':
			return '14';
			break;
			case 'Softball':
			return '10';
			break;
			case 'Volleyball':
			return '17';
			break;
		}
	}

	if (gender=="Men"){
		switch (sport) {
			case 'Baseball':
			return '1';
			break;
			case 'Basketball':
			return '5';
			break;
			case 'Football':
			return '3';
			break;
			case 'Lacrosse':
			return '6';
			break;
			case 'Soccer':
			return '7';
			break;
		}
	}
}


function readRSS() {

	//Clears table to allow it to be repopulated
	clearTable();


	//Use Yahoo Query Language (YQL) to read RSS feed from Stony Brook Athletics.
	YUI().use('yql', function(Y){
		var sportID = returnSportID();

		/*Different sports have different RSS feed. We use the returnSportID() function to return the ID number of the selected
		and concat to our query request*/
		var query = 'select title, description, localstartdate from rss where url = "http://stonybrookathletics.com/calendar.ashx/calendar.rss?sport_id='
		query = query.concat(sportID);
		query = query.concat('\"');
		
		var q = Y.YQL(query, function(r){
			var index=0;
			while (r.query.results.item[index] != null) {
				var game = r.query.results.item[index].title
				var score = r.query.results.item[index].description
				var year = r.query.results.item[index].localstartdate

				//Populate table
				populateTable(game, score, year);

				index++
			}
		})
	})
}

//Parse date from text. Date is before the first space. Find the index of the space, then parse data before it
function parseDate(text) {
	var date;
	var space = text.indexOf(' ');
	date = text.substring(0, space);
	date = date.trim();

	//Checks to make sure date is in correct format.
	if (!date.includes('/')) {
		date = "TBD"; //Listed as ERROR before. Have not run into issue with date. TBD should be a softer response
	}
	return date;
}

//Parse time from text. Locate the string AM or PM and concatenate the date from it.
function parseTime(text) {
	var time;
	if (text.includes('PM') || text.includes('AM')) {
		var start = text.indexOf(' ');
		var end = text.indexOf('M');
		time = text.substring(start + 1, end+1);
	}
	else {
		time = "";
	}
	time = time.trim();
	return time;
}
//Parse location and opponent from text. Locates string at or vs and concatenate the location from it.
function parseMatch(text) {
	var location;
	var opponent;
	if (text.includes(' at ')) {
		location = 'at';
		opponent = text.substring(text.indexOf(' at ') + 3, text.length);
	}

	if (text.includes(' vs ')) {
		location = 'vs';
		opponent = text.substring(text.indexOf(' vs ') + 3, text.length);
	}

	opponent = opponent.trim();

	//Removes ranking next to school name. Example "No. 5 UConn"
	if (opponent.includes('No. ')) {
		opponent = opponent.substring(6, opponent.sustring);
		opponent = opponent.trim();
	}

	/*RSS feed includes an extra space between vs/at and opponent. 
	For the sake of saving one pixel, we included this convulated method.*/
	var match = "SBU ".concat(location).concat(' ').concat(opponent);
	return match;
}

//Parse WL from text. Locates brackets and concatenate W or L between it.
function parseWL(text) {
	var WL;
	if (text.includes('[')) {
		var leftBracket = text.indexOf('[');
		var rightBracket = text.indexOf(']');
		WL = text.substring(leftBracket+1, rightBracket);
	}
	else {
		WL = '-';
	}
	WL = WL.trim();

	return WL;
}

/*Parse Score from text. Scores are only displayed for games that have been played.
If the text contains W, L or T in title, game has been played.
Score is located between two \n indicators. Parse the data between them.
*/
function parseScore(text) {

	var score;
	var played = parseWL(text);
	if ((played == 'W') || (played == 'L') || (played== 'T')) {

		var first = text.indexOf("\\n");
		var second = text.indexOf("\\n", first + 1);
		score = text.substring(first+3, second);

		//Some scores show (OT), specifically soccer. Remove to save space.
		if ((score.includes("(OT)")) || (score.includes("2 OT"))) {
			//Double-check how safe this code is.
			score = score.substring(0, score.indexOf("OT")-2);
		}

		if (score.includes("OT")) {
			score = score.substring(0, score.indexOf("OT"));
		}

		if (score.includes("PKs")) {
			score = score.substring(0, score.indexOf("PKs"));
		}

		score = score.trim();
	}
	else {
		score = "";
	}

	return score;
}

/*Parse year from localStartDate*/
function parseYear(text){

	var year = text.substring(2,4);
	return year;

}

function populateTable(game, score, year) {
	var table = document.getElementById("gameTable");
	var row = table.insertRow(-1);

	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	var cell3 = row.insertCell(2);

	row.className = "teams";
	
	cell1.className = "date";
	cell1.colSpan = "1";
	
	cell2.className = "game";
	cell2.colSpan = "2";
	
	cell3.className = "score";
	cell3.colSpan = "1";

	var yearFormat = "/".concat(parseYear(year));

	cell1.innerHTML = parseDate(game).concat(yearFormat).concat("<br>").concat(parseTime(game));
	cell2.innerHTML = parseMatch(game);

	
	/*Changes how WL is displayed. If W, L or T, font is 125% the size of the score. 
	  If W, then letter is Green. If L then letter is Red. T is black.*/
	var WLStyle; 

	if (parseWL(game)=='W') {
		WLStyle = "<span style='color:green; font-size: 125%'>" + parseWL(game) + "</span>";
	}
	else if (parseWL(game)=='L') {
		WLStyle = "<span style='color:red; font-size: 125%'>" + parseWL(game) + "</span>";
	}
	else {
		WLStyle = "<span style='font-size: 125%'>" + parseWL(game) + "</span>";
	}


	//Checks if the game was played. If played (W, L, T) then post score. Otherwise, posts '-'
	if (parseWL(game) != '-') {
		cell3.innerHTML = WLStyle.concat(', ').concat(parseScore(score));
	}
	else {
		cell3.innerHTML = parseWL(game);
	}
}

function clearTable(){
	var table = document.getElementById("gameTable");
	var rowCount = table.rows.length;
	
	while(table.rows.length > 0) {
		table.deleteRow(0);
	}
}