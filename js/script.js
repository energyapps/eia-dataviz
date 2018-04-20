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

	// set universal chart margins
	var chartMargins = {
		top: 50,
		right: 70,
		bottom: 50,
		left: 70
	}

	/* TABLETOP.JS: LOAD DATA */
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

	// run function to load spreadsheet data
	loadSpreadsheet();

	/* D3 data output to charts */
	function showInfo( data ) {
		// get current date and extract year
		var today = new Date(),
			currYear = today.getFullYear();

		console.log( "Spreadsheet data is loaded.", today.toJSON() );

		/****
		 LOAD DATA INTO VARIABLES
		****/

		// load wind sheet into variable
		var windHydroCapData = data.wind_over_hydro_cap.elements;
		var windHydroGenData = data.wind_over_hydro_gen.elements;
		// console.table( windHydroGenData );

		/****
		 CHART #1: Wind vs. Hydro Net Summer Capacity
		****/
		// loop through array of capacity data
		for ( var w = 0; w < windHydroCapData.length; w++ ) {
			// parse date to year
			var wDate = new Date( windHydroCapData[ w ].year );
			windHydroCapData[ w ].year = wDate.getUTCFullYear();
			// console.log( windHydroCapData[ w ].year );
		}

		// create a variable to parse year with D3
		var parseYear = d3.timeParse( "%Y" );

		// get chart container dimensions + set universal margins
		var contWidth = $( "#wind-over-hydro-cap" ).width(),
			contHeight = $( "#wind-over-hydro-cap" ).height();

		// select container div + create SVG and main g elements within
		var windRecord = d3.select( "#wind-over-hydro-cap" ),
			windWidth = contWidth * 0.65,
			windHeight = 0 + ( chartMargins.top + chartMargins.bottom ) * 2,
			// create SVG viewport
			g = windRecord.append( "svg:svg" )
			.attr( "width", windWidth )
			.attr( "height", windHeight )
			.attr( "id", "wind-hydro-cap-chart" )
			// create main g element container for the chart
			.append( "svg:g" )
			.attr( "transform", "translate(" + chartMargins.left + "," + chartMargins.top + ")" );

		// add chart title
		g.append( "svg:text" )
			.attr( "x", chartMargins.left )
			.attr( "y", 0 )
			.attr( "class", "chart-title" )
			.text( "Annual Net Summer Capacity from Selected Sources (2010–2018)" )

		// X axis: scale + axis function variables
		var windX = d3.scaleTime()
			.domain( d3.extent( windHydroCapData, function ( d ) {
				return parseYear( d.year );
			} ) )
			.range( [ 0, windWidth ] ),
			xAxis = d3.axisBottom( windX );

		// Y axis: scale + axis function variables
		var windY = d3.scaleLinear()
			.domain( [ ( d3.min( windHydroCapData, function ( d ) {
				return d[ "Wind Net Summer Capacity (megawatts)" ];
			} ) / 2 ), ( d3.max( windHydroCapData, function ( d ) {
				return d[ "Wind Net Summer Capacity (megawatts)" ];
			} ) * 1.1 ) ] )
			.range( [ windHeight, 0 ] ),
			yAxis = d3.axisRight( windY )
			.tickSizeInner( windWidth + chartMargins.left )
			.tickPadding( 6 )
			.tickFormat( function ( d ) {
				return ( d / 1000 + "k" );
			} );

		// create custom function for Y axis
		function customYAxis( g ) {
			// move axis to align properly with the bottom left corner including tick values
			g.attr( "transform", "translate(" + ( -chartMargins.left / 2 ) + ", 0)" )
			g.call( yAxis );
			g.select( ".domain" );
			g.attr( "text-anchor", "end" );
			g.selectAll( ".tick:not(:first-of-type) line" ).attr( "stroke", "#777" ).attr( "stroke-dasharray", "2,2" );
			g.selectAll( ".tick text" ).attr( "x", -4 ).attr( "dy", 0 );
		}

		// create wind capacity line
		var windLine = d3.line()
			.x( function ( d ) {
				// console.log( parseYear( d.year ) );
				return windX( parseYear( d.year ) );
			} )
			.y( function ( d ) {
				// console.log( d[ "Wind Net Summer Capacity (megawatts)" ] );
				return windY( d[ "Wind Net Summer Capacity (megawatts)" ] );
			} );

		// create hydro capacity line
		var hydroLine = d3.line()
			.x( function ( d ) {
				// console.log( parseYear( d.year ) );
				return windX( parseYear( d.year ) );
			} )
			.y( function ( d ) {
				// console.log( d[ "Conventional Hydroelectric Net Summer Capacity (megawatts)" ] );
				return windY( d[ "Conventional Hydroelectric Net Summer Capacity (megawatts)" ] );
			} );

		/* append SVG group elements */
		// X axis element: calls xAxis function
		g.append( "g" )
			.attr( "id", "wind-x-axis" )
			.attr( "transform", "translate(0, " + windHeight + ")" )
			.call( xAxis )
			.select( ".domain" ).remove();

		// Y axis element: calls yAxis function
		g.append( "g" )
			.attr( "id", "wind-y-axis" )
			.call( customYAxis );

		// wind line element
		g.append( "path" )
			.datum( windHydroCapData )
			.attr( "d", windLine )
			.attr( "class", "line-green" );

		// hydro line element
		g.append( "path" )
			.datum( windHydroCapData )
			.attr( "d", hydroLine )
			.attr( "class", "line-blue" );

		/****
		 CHART #2: Wind vs. Hydro Net Generation
		****/

		var w = [],
			h = [];

		// loop through array of capacity data
		for ( var w = 0; w < windHydroGenData.length; w++ ) {
			// parse date to year
			var wDate = new Date( windHydroGenData[ w ].year );
			windHydroGenData[ w ].year = wDate.getUTCFullYear();

			w.push( windHydroGenData[ w ][ "Net conventional hydroelectric generation (thousand megawatthours)" ] );

			h.push( windHydroGenData[ w ][ "Net wind generation (thousand megawatthours)" ] )
		}

		// console.table( windHydroGenData );
		// function concatData( d ) {
		// console.table( d );
		console.log( w, h );
		// }

		// concatData( windHydroGenData );

		// create a variable to parse year with D3
		var parseYear = d3.timeParse( "%Y" );

		// get chart container dimensions + set universal margins
		var contWidth = $( "#wind-over-hydro-gen" ).width(),
			contHeight = $( "#wind-over-hydro-gen" ).height();

		// select container div + create SVG and main g elements within
		var windRecord = d3.select( "#wind-over-hydro-gen" ),
			windWidth = contWidth * 0.65,
			windHeight = 0 + ( chartMargins.top + chartMargins.bottom ) * 2,
			// create SVG viewport
			g = windRecord.append( "svg:svg" )
			.attr( "width", windWidth )
			.attr( "height", windHeight )
			.attr( "id", "wind-hydro-chart" )
			// create main g element container for the chart
			.append( "svg:g" )
			.attr( "transform", "translate(" + chartMargins.left + "," + chartMargins.top + ")" );

		// add chart title
		g.append( "svg:text" )
			.attr( "x", chartMargins.left )
			.attr( "y", 0 )
			.attr( "class", "chart-title" )
			.text( "Annual Net Energy Generation from Selected Sources (2010–2018)" )

		// X axis: scale + axis function variables
		var windX = d3.scaleTime()
			.domain( d3.extent( windHydroGenData, function ( d ) {
				return parseYear( d.year );
			} ) )
			.range( [ 0, windWidth ] ),
			xAxis = d3.axisBottom( windX );

		// Y axis: scale + axis function variables
		var windY = d3.scaleLinear()
			.domain( d3.extent( windHydroGenData, function ( d ) {
				return d[ "Net wind generation (thousand megawatthours)" ];
			} ) )
			.range( [ windHeight, 0 ] ),
			yAxis = d3.axisRight( windY )
			.tickSizeInner( windWidth + chartMargins.left )
			.tickPadding( 6 )
			.tickFormat( function ( d ) {
				return ( d / 1000 + "k" );
			} );

		// create custom function for Y axis
		function customYAxis( g ) {
			// move axis to align properly with the bottom left corner including tick values
			g.attr( "transform", "translate(" + ( -chartMargins.left / 2 ) + ", 0)" )
			g.call( yAxis );
			g.select( ".domain" );
			g.attr( "text-anchor", "end" );
			g.selectAll( ".tick:not(:first-of-type) line" ).attr( "stroke", "#777" ).attr( "stroke-dasharray", "2,2" );
			g.selectAll( ".tick text" ).attr( "x", -4 ).attr( "dy", 0 );
		}

		// create wind capacity line
		var windLine = d3.line()
			.x( function ( d ) {
				// console.log( parseYear( d.year ) );
				return windX( parseYear( d.year ) );
			} )
			.y( function ( d ) {
				// console.log( d[ "Net wind generation (thousand megawatthours)" ] );
				return windY( d[ "Net wind generation (thousand megawatthours)" ] );
			} );

		// create hydro capacity line
		var hydroLine = d3.line()
			.x( function ( d ) {
				// console.log( parseYear( d.year ) );
				return windX( parseYear( d.year ) );
			} )
			.y( function ( d ) {
				// console.log( d[ "Net conventional hydroelectric generation (thousand megawatthours)" ] );
				return windY( d[ "Net conventional hydroelectric generation (thousand megawatthours)" ] );
			} );

		/* append SVG group elements */
		// X axis element: calls xAxis function
		g.append( "g" )
			.attr( "id", "wind-x-axis" )
			.attr( "transform", "translate(0, " + windHeight + ")" )
			.call( xAxis )
			.select( ".domain" ).remove();

		// Y axis element: calls yAxis function
		g.append( "g" )
			.attr( "id", "wind-y-axis" )
			.call( customYAxis );

		// wind line element
		g.append( "path" )
			.datum( windHydroGenData )
			.attr( "d", windLine )
			.attr( "class", "line-green" );

		// hydro line element
		g.append( "path" )
			.datum( windHydroGenData )
			.attr( "d", hydroLine )
			.attr( "class", "line-blue" );

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