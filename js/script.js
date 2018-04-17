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
			wanted: [ "wind_over_hydro", "record_crude_prod", "dom_crude_prod", "record_ng_prod", "ng_exp_by_type", "lng_exp_by_country", "monthly_fuel_price", "annual_summer_fuel_avg", "monthly_disp_income", "summer_disp_income" ], // specify sheets to load
			parseNumbers: true,
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
		var windData = data.wind_over_hydro.elements;
		// console.table( windData );

		// loop through array of data
		for ( var w = 0; w < windData.length; w++ ) {
			// parse date to year
			var wDate = new Date( windData[ w ].year );
			windData[ w ].year = wDate.getUTCFullYear();
			// console.log( windData[ w ].year );
			/*// populate individual arrays for each variable
			windYr.push( windData[ w ].year );
			windCap.push( windData[ w ][ "Wind Net Summer Capacity" ] );
			hydroCap.push( windData[ w ][ "Conventional Hydroelectric Net Summer Capacity" ] );
			// populate array for all summer capacity
			allCap.push( windData[ w ][ "Conventional Hydroelectric Net Summer Capacity" ] );
			allCap.push( windData[ w ][ "Wind Net Summer Capacity" ] );*/
		}

		// X AXIS SCALE
		var minYear = d3.min( windData, function ( wd ) {
				return wd.year;
			} ),
			maxYear = d3.max( windData, function ( wd ) {
				return wd.year;
			} ),
			windX = d3.scaleTime().domain( [ minYear, maxYear ] );

		// Y AXIS SCALE
		var minY = d3.min( windData, function ( wd ) {
				return wd[ "Wind Net Summer Capacity" ];
			} ),
			// set min to min summer capacity value divided by 2 rounded to the nearest 100
			minY = Math.floor( ( minY / 2 ) / 100 ) * 100,
			maxY = d3.max( windData, function ( wd ) {
				return wd[ "Wind Net Summer Capacity" ];
			} ),
			// set max to max summer capacity value times 1.2 rounded to the nearest 100
			maxY = Math.ceil( ( maxY * 1.2 ) / 100 ) * 100,
			// set Y axis scale
			windY = d3.scaleLinear().domain( [ minY, maxY ] ) /*.range( [ 0 + windMargin, windHeight - windMargin ] )*/ ;

		var windRecord = d3.select( "#wind-over-hydro" ),
			/*windMargin = {
				top: 20,
				right: 20,
				bottom: 30,
				left: 50
			},*/
			windWidth = 600 /*+windRecord.attr( "width" ) -windMargin.left - windMargin.right*/ ,
			windHeight = 400 /*+windRecord.attr( "height" ) -windMargin.top - windMargin.bottom,*/
		g = windRecord.append( "svg:svg" )
			.attr( "width", windWidth )
			.attr( "height", windHeight )
			.append( "svg:g" )
		/*.attr( "transform", "translate(" + windMargin.left + "," + windMargin.top + ")" )*/
		;

		// create wind capacity line
		var windLine = d3.line()
			.x( function ( d ) {
				return windX( d.year );
			} )
			.y( function ( d ) {
				return windY( d[ "Wind Net Summer Capacity" ] );
			} );

		g.append( "path" )
			.datum( windData )
			.attr( "fill", "none" )
			.attr( "stroke", "steelblue" )
			.attr( "stroke-linejoin", "round" )
			.attr( "stroke-linecap", "round" )
			.attr( "stroke-width", 1.5 )
			.attr( "d", windLine );

		// g.append( "g" )
		// 	// .attr( "transform", "translate(0," + windHeight + ")" )
		// 	.call( d3.axisBottom( windX ) )
		// /*
		// 			.select( ".domain" )*/
		// ;

		// g.append( "g" )
		// 	.call( d3.axisLeft( windY ) )

		// 			.append( "text" )
		// 			.attr( "fill", "#000" )
		// 			.attr( "transform", "rotate(-90)" )
		// 			.attr( "y", 6 )
		// 			.attr( "dy", "0.71em" )
		// 			.attr( "text-anchor", "end" )
		// 			.text( "Price ($)" )
		// ;

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