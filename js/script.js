/***********
	Do not remove below!
***********/

// initates pym! DO NOT REMOVE
var pymChild = new pym.Child();

/***********
	Do not remove above!
***********/

$( document ).ready( function () {
	console.log( "Page loaded. Jquery is running. Now, do stuff." );

	/* TABLETOP.JS: LOADING DATA */
	// Google sheets ID
	// Summer fuels data spreadsheet sare url: https://docs.google.com/spreadsheets/d/1lWN0rt2LLa43iC2hmPnTMouiUFkba9zcQtWwRkfNnXQ
	//https://docs.google.com/spreadsheets/d/e/2PACX-1vRrnBnnaJClEqSazVi__pLtzZZcC1_7mQq2rClH8L28xI1ffD8SxcIN_MKB_c7VlWrjy2AtmWUqVs63/pub?output=csv
	var public_spreadsheet_url = '1lWN0rt2LLa43iC2hmPnTMouiUFkba9zcQtWwRkfNnXQ';

	// function for initializing tabletop
	function loadSpreadsheet() {
		// Multisheet version:
		Tabletop.init( {
			key: public_spreadsheet_url,
			callback: showInfo,
			wanted: [ "annual_summer_fuel_avg", "monthly_fuel_avg", ], // specify sheets to load
			parseNumbers: true
			/*,
						 postProcess: function( element ) {
							// format date string
							element["launch_date"] = Date.parse( element["launch_date"] );
						 }*/
			// , debug: true
		} )
	}

	// load spreadsheet data
	loadSpreadsheet();

	/* Create a function to dump variable arrays */
	/*function dump( obj ) {
		var out = '';
		for ( var i in obj ) {
			out += i + ": " + obj[ i ] + "\n";
		}
		document.write( out[ i ] );
	}
*/
	/* D3 data output */
	function showInfo( data ) {
		console.log( "Spreadsheet data is loaded." );

		/* LOAD DATA INTO VARIABLE */
		// assign DOE social stats to a variable
		var yearAvg = data.annual_summer_fuel_avg.elements;
		var monthAvg = data.monthly_fuel_avg.elements;

		dump( yearAvg );
		// get current date and extract year
		var today = new Date(),
			currYear = today.getFullYear();
		// 	prevYear = currYear - 1;

		// // create variables for followers column name
		// var oldFoll = "followers_" + ( prevYear - 1 ),
		// 	newFoll = "followers_" + ( prevYear );

		// // create arrays for platform content
		// var follNum = [], // followers ([old year][new year])
		// 	percentChange = [], // percent difference in followers
		// 	platformInfo = []; // handles + urls

		// // loop through data and push followers to new array
		// for ( var i = 0; i < doeStats.length; i++ ) {
		// 	// create new object from each array entry
		// 	var follObj = new Object(), // for followers
		// 		changeObj = new Object(), // for difference
		// 		infoObj = new Object(); // for account info

		// 	// populate array for followers
		// 	follObj[ oldFoll ] = doeStats[ i ][ oldFoll ]; // equate old followers
		// 	follObj[ newFoll ] = doeStats[ i ][ newFoll ]; // equate new followers
		// 	follNum.push( follObj ); // push to new followers-only array

		// 	// populate array for percent change
		// 	changeObj[ "difference" ] = doeStats[ i ][ "difference" ]; // equate difference
		// 	percentChange.push( changeObj ); // push to new difference-only array

		// 	// populate array for platform info
		// 	infoObj[ "handle" ] = doeStats[ i ][ "handle" ]; // equate account handle
		// 	infoObj[ "url" ] = doeStats[ i ][ "url" ]; // equate profile url
		// 	platformInfo.push( infoObj ); // push to new account-only array
	}
} );