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

	// get current date and extract year
	var today = new Date(),
		currYear = today.getFullYear(),
		currMonth = today.getMonth();

	if ( 2 < currMonth < 9 ) {
		console.log( "it's summer", currMonth, currYear );
	}

	/* TABLETOP.JS: LOADING DATA */
	// Google sheets ID
	var public_spreadsheet_url = '1lWN0rt2LLa43iC2hmPnTMouiUFkba9zcQtWwRkfNnXQ'; // summer fuels + disposable income

	// function for initializing tabletop
	function loadSpreadsheet() {
		// Multisheet version:
		Tabletop.init( {
			key: public_spreadsheet_url,
			callback: showInfo,
			wanted: [ "annual_summer_fuel_avg", "monthly_fuel_avg" ], // specify sheets to load
			parseNumbers: true,
			postProcess: function ( element ) {
				// format date string
				element[ "launch_date" ] = Date.parse( element[ "launch_date" ] );
			}
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
		// create variables for averages
		var yearAvg = data.annual_summer_fuel_avg.elements,
			monthAvgAll = data.monthly_fuel_avg.elements,
			monthAvgSummer = [];

		// loop through all months and filter summer months only
		for ( var i = 0; i < monthAvgAll.length; i++ ) {
			// find summer months
			if ( monthAvgAll[ i ].summer == "TRUE" ) {
				// push to summer-only multi-dimensional array
				monthAvgSummer.push( {
					year: monthAvgAll[ i ].year,
					month: monthAvgAll[ i ].month,
					price: monthAvgAll[ i ].dollars
				} )
			}
		}
		console.log( monthAvgSummer /*[ 0 ].month - 1*/ );

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

	var svg = d3.select( "svg" ),
		margin = {
			top: 250,
			right: 40,
			bottom: 250,
			left: 40
		},
		width = svg.attr( "width" ) - margin.left - margin.right,
		height = svg.attr( "height" ) - margin.top - margin.bottom;

	var locale = d3.timeFormatLocale( {
		"dateTime": "%A, %e %b %Y",
		"date": "%m %Y",
		"months": [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
		"shortMonths": [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
	} );

	var formatMonth = locale.format( "%B" ),
		formatYear = locale.format( "%Y" );

	var x = d3.scaleTime()
		.domain( [ new Date( 1990, 0, 1 ), new Date( 2018, 12, 1 ) ] )
		.range( [ 0, width ] );

	svg.append( "g" )
		.attr( "transform", "translate(" + margin.left + "," + margin.top + ")" )
		.call( d3.axisBottom( x )
			.tickFormat( multiFormat ) );

	function multiFormat( date ) {
		return (
			d3.timeMonth( date ) < date ? ( d3.timeWeek( date ) < date ? formatDay : formatWeek ) :
			d3.timeYear( date ) < date ? formatMonth :
			formatYear )( date );
	}
} );