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
	var public_spreadsheet_url = '1lJTxKh2F98tEuCeHnlJsVAl1FgEx5nkEwuvAfUlTUFU'; // summer fuels + disposable income

	// function for initializing tabletop
	function loadSpreadsheet() {
		// STEO + summer fuels data
		Tabletop.init( {
			key: public_spreadsheet_url,
			callback: showInfo,
			wanted: [ "wind_over_hydro_cap", "wind_over_hydro_gen", "record_crude_prod", "dom_crude_prod", "record_ng_prod", "ng_exp_by_type", "lng_exp_by_country", "monthly_fuel_price", "annual_summer_fuel_avg", "monthly_disp_income", "summer_disp_income" ], // specify sheets to load
			parseNumbers: true,
			orderby: "year",
			reverse: true,
			postProcess: function ( element ) {
				// format date string
				element[ "year" ] = Date.parse( element[ "year" ] );
			}
			// , debug: true
		} )
	}

	// load spreadsheet data
	loadSpreadsheet();

	/* D3 data output */
	function showInfo( data ) {
		// get current date and extract year
		var today = new Date(),
			currYear = today.getFullYear();

		console.log( "Spreadsheet data is loaded.", today.toJSON() );
		// console.log( data.wind_over_hydro );

		/****
		 LOAD DATA INTO VARIABLES
		****/

		/* WIND OVER HYDRO */
		// load wind sheet into variable
		var windData = data.wind_over_hydro_cap.elements;
		// console.table( windData );

		// loop through array of data
		for ( var w = 0; w < windData.length; w++ ) {
			// parse date to year
			var wDate = new Date( windData[ w ].year );
			windData[ w ].year = wDate.getUTCFullYear();
			// console.log( windData[ w ].year );
		}

		// create a variable to parse year with D3
		var parseYear = d3.timeParse( "%Y" );

		// get chart container dimensions + set universal margins
		var contWidth = $( "#wind-over-hydro" ).width(),
			contHeight = $( "#wind-over-hydro" ).height(),
			chartMargins = {
				top: 200,
				right: 70,
				bottom: 100,
				left: 70
			}
		/*console.log( "W: ", contWidth, "H: ", contHeight );
		console.log( d3.extent( windData, function ( d ) {
			return d[ "Wind Net Summer Capacity" ];
		} ) );*/

		// select container div and create svg + g elements within
		var windRecord = d3.select( "#wind-over-hydro" ),
			windWidth = contWidth * 0.65,
			windHeight = 0 + chartMargins.top + chartMargins.bottom,
			g = windRecord.append( "svg:svg" )
			.attr( "width", windWidth )
			.attr( "height", windHeight )
			.append( "svg:g" )
			.attr( "transform", "translate(" + chartMargins.left + "," + chartMargins.top + ")" );

		// X AXIS
		var windX = d3.scaleTime()
			.domain( d3.extent( windData, function ( d ) {
				return parseYear( d.year );
			} ) )
			.range( [ 0, windWidth ] ),
			xAxis = d3.axisBottom( windX );

		// Y AXIS
		var windY = d3.scaleLinear()
			.domain( d3.extent( windData, function ( d ) {
				return d[ "Wind Net Summer Capacity" ];
			} ) )
			.range( [ windHeight, 0 ] ),
			yAxis = d3.axisLeft( windY );

		// create wind capacity line
		var windLine = d3.line()
			.x( function ( d ) {
				// console.log( parseYear( d.year ) );
				return windX( parseYear( d.year ) );
			} )
			.y( function ( d ) {
				// console.log( d[ "Wind Net Summer Capacity" ] );
				return windY( d[ "Wind Net Summer Capacity" ] );
			} );

		g.append( "g" )
			.attr( "transform", "translate(0, " + windHeight + ")" )
			.call( xAxis )
			.select( ".domain" );

		g.append( "g" )
			.call( yAxis )
			.select( ".domain" )
		// .attr( "transform", "translate(" + chartMargins.left + ", 0)" )
		/*.append( "text" )
		.attr( "fill", "#000" )
		.attr( "transform", "rotate(-90)" )
		.attr( "y", 6 )
		.attr( "dy", "0.71em" )
		.attr( "text-anchor", "end" )
		.text( "Price ($)" )*/
		;

		g.append( "path" )
			.datum( windData )
			.attr( "class", "line" )
			.attr( "d", windLine );

		//
		//
		//
		//
		// create variables for averages
		var yearAvg = data.annual_summer_fuel_avg.elements,
			monthAvgAll = data.monthly_fuel_price.elements,
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
		// console.log( monthAvgSummer /*[ 0 ].month - 1*/ );

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