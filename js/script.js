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

	// define universal variables
	var strokeWidth = [ 12, 8, 8, 6, 6, 4, 4, 2, 2, 2 ], // stroke width per max position
		chartColors = [ "#7cc110", "#127ea8", "#2c8565", "#63B8FF", "#006400", "#EDB43D" ];

	/* TABLETOP.JS: LOAD DATA */
	// Google sheets ID
	var public_spreadsheet_url = '1lJTxKh2F98tEuCeHnlJsVAl1FgEx5nkEwuvAfUlTUFU'; // summer fuels + disposable income

	// function for initializing tabletop
	function loadSpreadsheet() {
		// STEO + summer fuels data
		Tabletop.init( {
			key: public_spreadsheet_url,
			callback: showInfo,
			wanted: [ "wind_over_hydro_cap", "wind_over_hydro_gen", "all_exports_ng_exports_net_imports", "monthly_fuel_price", "annual_summer_fuel_avg", "monthly_disp_income", "summer_disp_income" ], // specify sheets to load
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

		// create a variable to parse year with D3
		var parseYear = d3.timeParse( "%Y" );

		console.log( "Spreadsheet data is loaded.", today.toJSON() );

		/****
		 LOAD DATA INTO VARIABLES
		****/
		// load individual sheet elements into variables
		var windHydroCapData = data.wind_over_hydro_cap.elements,
			windHydroGenData = data.wind_over_hydro_gen.elements,
			exportImportData = data.all_exports_ng_exports_net_imports.elements;
		// console.table( exportImportData );

		// create universal color scale
		var lineColors = d3.scaleOrdinal()
			.range( chartColors );

		/****
		 CHART #1: Exports vs. NG exports vs. net imports vs. NG vs. crude oil prod
		****/
		// set oldest year to get data from
		var minYr = 1997;

		// set units for Y axis values
		var yUnits = "Quadrillion Btu",
			yUnitsAbbr = "Quad Btu";

		// declare arrays for separate data
		var primaryExports = [], // primary energy exports data
			netImports = [], // primary energy net imports data
			ngProd = [], // NG (dry) production data
			crudeProd = [], // crude oil production data
			allExpImpProd = []; // combined data

		// loop through each row of windHydroCapData
		exportImportData.forEach( function ( d, i ) {
			// parse date to year
			var wDate = new Date( d.year );
			d.year = wDate.getUTCFullYear();

			if ( d.year >= minYr ) {
				primaryExports[ i ] = d[ "Primary Energy Exports" ];
				netImports[ i ] = d[ "Primary Energy Net Imports" ];
				ngProd[ i ] = d[ "Primary Energy Net Imports" ];
				crudeProd[ i ] = d[ "Primary Energy Net Imports" ];
			}
		} );

		// filter out data starting at minYr
		exportImportData = exportImportData.filter( e => e.year >= minYr );

		// concatenate all data into one array
		allExpImpProd = primaryExports.concat( netImports ).concat( ngProd ).concat( crudeProd );
		allMinMax = d3.extent( allExpImpProd );

		// assign chart colors to data
		lineColors.domain( d3.keys( exportImportData[ 0 ] ).filter( function ( key ) {
			// filter through the keys excluding certain columns, e.g. x-axis data
			return key !== "year" && key !== "Natural Gas Exports";
		} ) );

		// get chart container dimensions + set universal margins
		var contWidth = $( "#export-import-prod" ).width(),
			contHeight = $( "#export-import-prod" ).height();

		// select container div + create SVG and main g elements within
		var impExpProd = d3.select( "#export-import-prod" ),
			iepWidth = contWidth * 0.65,
			iepHeight = 0 + ( chartMargins.top + chartMargins.bottom ) * 2,
			// create SVG viewport
			g = impExpProd.append( "svg:svg" )
			.attr( "id", "import-export-prod-chart" )
			.attr( "width", iepWidth )
			.attr( "height", iepHeight )
			// create main g element container for the chart
			.append( "svg:g" )
			.attr( "transform", "translate(" + chartMargins.left + "," + chartMargins.top + ")" );

		// append chart title
		g.append( "svg:text" )
			.attr( "x", chartMargins.left )
			.attr( "y", 0 )
			.attr( "class", "titles_chart-main" )
			.text( "Net energy imports drop 35% since 2016" )

		// X axis: scale + axis function variables
		var iepX = d3.scaleTime()
			.domain( d3.extent( exportImportData, function ( d ) {
				return parseYear( d.year );
			} ) )
			.range( [ 0, iepWidth ] ),
			xAxis = d3.axisBottom( iepX );

		// Y axis: scale + axis function variables
		var iepY = d3.scaleLinear()
			.domain( [ 0, allMinMax[ 1 ] ] )
			.range( [ iepHeight, 0 ] ),
			yAxis = d3.axisRight( iepY )
			.tickSizeInner( iepWidth + chartMargins.left )
			.tickPadding( 6 )
			.tickFormat( function ( d ) {
				return ( d );
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

		// formula to create lines
		var line = d3.line()
			// .curve( d3.curveMonotoneX )
			.x( function ( d ) {
				return iepX( parseYear( d.year ) );
			} )
			.y( function ( d ) {
				return iepY( d.btu );
			} );

		// map data to individual lines
		var sourceLines = lineColors.domain().map( function ( source ) {
			return {
				source: source,
				values: exportImportData.map( function ( s ) {
					return {
						year: s.year,
						btu: +s[ source ]
					};
				} )
			}
		} );
		console.log( sourceLines );

		/* append SVG group elements */
		// append X axis element: calls xAxis function
		g.append( "g" )
			.attr( "id", "iep-x-axis" )
			.attr( "transform", "translate(0, " + iepHeight + ")" )
			.call( xAxis )
			.select( ".domain" ).remove();

		// append Y axis element: calls yAxis function
		g.append( "g" )
			.attr( "id", "iep-y-axis" )
			.call( customYAxis )
			.append( "text" ) // add axis label
			.attr( "transform", "rotate(-90)" )
			.attr( "x", -( iepHeight / 2 ) )
			.attr( "y", -35 )
			.attr( "dy", ".71em" )
			.attr( "class", "titles_axis-y" )
			.text( yUnits );

		// draw/append all data lines
		var sourceLine = g.selectAll( ".source" )
			.data( sourceLines )
			.enter().append( "g" )
			.attr( "class", "source" );

		sourceLine.append( "path" )
			.attr( "class", "line" )
			.attr( "d", function ( d ) {
				return line( d.values );
			} )
			/* .style("stroke-width", function(d) {
			     return strokeWidth[maxPosition[namesByID[d.name]].values - 1];
			 })*/
			.style( "stroke", function ( d ) {
				return lineColors( d.source );
			} )
			.on( "mouseover", mouseover )
		/*
					.on("mouseout", mouseout)*/
		;

		// append a circle for each datapoint
		/*sourceLine.append( "g" )
			.attr( "class", "dots" )
			.append( "circle" ) // Uses the enter().append() method
			.attr( "class", "dot" ) // Assign a class for styling
			.style( "fill", function ( d ) {
				return lineColors( d.source );
			} )
			.attr( "cx", function ( d, i ) {
				return iepX( parseYear( d.values[ i ].year ) )
			} )
			.attr( "cy", function ( d, i ) {
				return iepY( d.values[ i ].btu )
			} )
			.attr( "r", 5 );*/

		// draw/append tooltips
		var popUpTooltips = g.append( "g" )
			.data( sourceLines )
			.attr( "transform", "translate(-100,-100)" )
			.attr( "class", "tooltip" )
			.style( "pointer-events", "none" );

		popUpTooltips.append( "circle" )
			.attr( "class", "tooltip_circle" )
			.attr( "r", 4 );

		popUpTooltips.append( "text" )
			.attr( "class", "tooltip_title" )
			.attr( "y", -15 );

		// add mouseover action for tooltip
		function mouseover( d ) {
			return function ( s, i ) {
				console.log( s[ i ].year );
			}
			// console.log( d3.values(  ) );

			// set x and y location
			/*dotX = iepX( parseYear( d.values[ i ].year ) );
			dotY = iepY( d.values[ i ].btu );*/

			//Change position of circle and text of tooltip
			/*popUpTooltips.attr( "transform", "translate(" + dotX + "," + dotY + ")" )
				.select( ".tooltipCircle" )
				.style( "fill", lineColors( d.source ) )
				.select( "text" )
				.text( d.values.year );*/
		} //mouseover

		/****
		 CHART #2: Wind vs. Hydro Net Summer Capacity
		****/
		// declare arrays for separate data
		var windCap = [], // wind cap data
			hydroCap = [], // hydro cap data
			whCapAll = []; // all cap data

		// loop through each row of windHydroCapData
		windHydroCapData.forEach( function ( d, i ) {
			// add all wind cap data to one array
			windCap[ i ] = d[ "Wind Net Summer Capacity (megawatts)" ]
			// add all wind cap data to one array
			hydroCap[ i ] = d[ "Conventional Hydroelectric Net Summer Capacity (megawatts)" ];

			// parse date to year
			var wDate = new Date( d.year );
			d.year = wDate.getUTCFullYear();
		} );

		// concatenate wind cap + hydro cap data into one array
		whCapAll = windCap.concat( hydroCap );

		// assign chart colors to column name
		lineColors.domain( d3.keys( windHydroCapData[ 0 ] ).filter( function ( key ) {
			return key !== "year";
		} ) );

		// get chart container dimensions + set universal margins
		var contWidth = $( "#wind-over-hydro-cap" ).width(),
			contHeight = $( "#wind-over-hydro-cap" ).height();

		// select container div + create SVG and main g elements within
		var windRecord = d3.select( "#wind-over-hydro-cap" ),
			windWidth = contWidth * 0.65,
			windHeight = 0 + ( chartMargins.top + chartMargins.bottom ) * 2,
			// create SVG viewport
			g = windRecord.append( "svg:svg" )
			.attr( "id", "wind-hydro-cap-chart" )
			.attr( "width", windWidth )
			.attr( "height", windHeight )
			// create main g element container for the chart
			.append( "svg:g" )
			.attr( "transform", "translate(" + chartMargins.left + "," + chartMargins.top + ")" );

		// append chart title
		g.append( "svg:text" )
			.attr( "x", chartMargins.left )
			.attr( "y", 0 )
			.attr( "class", "titles_chart-main" )
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
			.domain( [ d3.min( whCapAll ) / 2, d3.max( whCapAll ) + 10000 ] )
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
				return windX( parseYear( d.year ) );
			} )
			.y( function ( d ) {
				return windY( d[ "Wind Net Summer Capacity (megawatts)" ] );
			} );

		// create hydro capacity line
		var hydroLine = d3.line()
			.x( function ( d ) {
				return windX( parseYear( d.year ) );
			} )
			.y( function ( d ) {
				return windY( d[ "Conventional Hydroelectric Net Summer Capacity (megawatts)" ] );
			} );

		/* append SVG group elements */
		// append X axis element: calls xAxis function
		g.append( "g" )
			.attr( "id", "wind-x-axis" )
			.attr( "transform", "translate(0, " + windHeight + ")" )
			.call( xAxis )
			.select( ".domain" ).remove();

		// append Y axis element: calls yAxis function
		g.append( "g" )
			.attr( "id", "wind-y-axis" )
			.call( customYAxis )
			.append( "text" ) // add axis label
			.attr( "transform", "rotate(-90)" )
			.attr( "x", -( windHeight / 2 ) )
			.attr( "y", -35 )
			.attr( "dy", ".71em" )
			.attr( "class", "titles_axis-y" )
			.text( "Net Summer Capacity (megawatts)" );

		// wind line element
		g.append( "g" )
			.attr( "class", "line" )
			.append( "path" )
			.datum( windHydroCapData )
			.attr( "d", windLine )
			.style( "stroke", function ( d ) {
				return lineColors( "Wind Net Summer Capacity (megawatts)" );
			} );

		// hydro line element
		g.append( "g" )
			.attr( "class", "line" )
			.append( "path" )
			.datum( windHydroCapData )
			.attr( "d", hydroLine )
			.style( "stroke", function ( d ) {
				return lineColors( "Conventional Hydroelectric Net Summer Capacity (megawatts)" );
			} );

		/****
		 CHART #3: Wind vs. Hydro Net Generation
		****/
		// declare arrays for separate data
		var windGen = [], // wind gen data
			hydroGen = [], // hydro gen data
			whGenAll = []; // all gen data

		// loop through each row of windHydroCapData
		windHydroGenData.forEach( function ( d, i ) {
			// add all wind cap data to one array
			windGen[ i ] = d[ "Net wind generation (thousand megawatthours)" ]
			// add all wind cap data to one array
			hydroGen[ i ] = d[ "Net conventional hydroelectric generation (thousand megawatthours)" ];

			// parse date to year
			var wDate = new Date( d.year );
			d.year = wDate.getUTCFullYear();
		} );

		// concatenate wind cap + hydro cap data into one array
		whGenAll = windGen.concat( hydroGen );

		// assign chart colors to column name
		lineColors.domain( d3.keys( windHydroGenData[ 0 ] ).filter( function ( key ) {
			return key !== "year";
		} ) )
		/*		var windGen = [],
					hydroGen = [];

				// loop through array of capacity data
				for ( var w = 0; w < windHydroGenData.length; w++ ) {
					// parse date to year
					var wDate = new Date( windHydroGenData[ w ].year );
					windHydroGenData[ w ].year = wDate.getUTCFullYear();
					// add all hydro gen data to one array
					hydroGen.push( windHydroGenData[ w ][ "Net conventional hydroelectric generation (thousand megawatthours)" ] );
					// add all wind gen data to one array
					windGen.push( windHydroGenData[ w ][ "Net wind generation (thousand megawatthours)" ] )
				}*/

		// assign chart colors to column name
		lineColors.domain( d3.keys( windHydroCapData[ 0 ] ).filter( function ( key ) {
			return key !== "year";
		} ) )

		// get chart container dimensions + set universal margins
		var contWidth = $( "#wind-over-hydro-gen" ).width(),
			contHeight = $( "#wind-over-hydro-gen" ).height();

		// select container div + create SVG and main g elements within
		var windRecord = d3.select( "#wind-over-hydro-gen" ),
			windWidth = contWidth * 0.65,
			windHeight = 0 + ( chartMargins.top + chartMargins.bottom ) * 2,
			// create SVG viewport
			g = windRecord.append( "svg:svg" )
			.attr( "id", "wind-hydro-chart" )
			.attr( "width", windWidth )
			.attr( "height", windHeight )
			// create main g element container for the chart
			.append( "svg:g" )
			.attr( "transform", "translate(" + chartMargins.left + "," + chartMargins.top + ")" );

		// add chart title
		g.append( "svg:text" )
			.attr( "x", chartMargins.left )
			.attr( "y", 0 )
			.attr( "class", "titles_chart-main" )
			.text( "Annual Net Energy Generation from Selected Sources (2001–2017)" )

		// X axis: scale + axis function variables
		var windX = d3.scaleTime()
			.domain( d3.extent( windHydroGenData, function ( d ) {
				return parseYear( d.year );
			} ) )
			.range( [ 0, windWidth ] ),
			xAxis = d3.axisBottom( windX );

		// Y axis: scale + axis function variables
		var windY = d3.scaleLinear()
			.domain( [ 0, d3.max( windGen.concat( hydroGen ) ) + 20000 ] )
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
		// append X axis element: calls xAxis function
		g.append( "g" )
			.attr( "id", "wind-x-axis" )
			.attr( "transform", "translate(0, " + windHeight + ")" )
			.call( xAxis )
			.select( ".domain" ).remove();

		// append Y axis element: calls yAxis function
		g.append( "g" )
			.attr( "id", "wind-y-axis" )
			.call( customYAxis )
			.append( "text" ) // add axis label
			.attr( "transform", "rotate(-90)" )
			.attr( "x", -( windHeight / 2 ) )
			.attr( "y", -35 )
			.attr( "dy", ".71em" )
			.attr( "class", "titles_axis-y" )
			.text( "Net generation (thousand megawatthours)" );

		// wind line element
		g.append( "g" )
			.attr( "class", "line" )
			.append( "path" )
			.datum( windHydroGenData )
			.attr( "d", windLine )
			.attr( "class", "line-green" )
			.style( "stroke", function ( d ) {
				return lineColors( "Wind Net Summer Capacity (megawatts)" );
			} );

		// hydro line element
		g.append( "g" )
			.attr( "class", "line" )
			.append( "path" )
			.datum( windHydroGenData )
			.attr( "d", hydroLine )
			.style( "stroke", function ( d ) {
				return lineColors( "Conventional Hydroelectric Net Summer Capacity (megawatts)" );
			} );

		/* TOOLTIPS */
		// append tooltip elements
		var tooltipValue = g.append( "g" )
			.attr( "transform", "translate(-100,-100)" )
			.attr( "class", "tooltip_value" )
			.style( "pointer-events", "none" );
		tooltipValue.append( "circle" )
			.attr( "class", "tooltip_circle" )
			.attr( "r", 2 );
		tooltipValue.append( "text" )
			.attr( "class", "tooltip_title" )
			.attr( "y", -15 );

		// mouseover and mouseout functions
		// function mouseover(d) {
		//     /*g.selectAll(".line");
		//     d3.selectAll(".focus." + d.name).style("opacity", 0.8);
		//     context.selectAll(".context").selectAll(".line").style("opacity", 0.1);
		//     context.selectAll(".context." + d.name).selectAll(".line")
		//         .style("opacity", 1)
		//         .style("stroke", color(d.name));*/
		//     //Move the tooltip to the front
		//     d3.select(".tooltipValue").moveToFront();
		//     //Change position, size of circle and text of tooltip
		//     tooltipValue.attr("transform", "translate(" + xBrush(d.year) + "," + yBrush(d.position) + ")");
		//     // var circleSize = parseInt(d3.selectAll(".focus." + d.name).selectAll(".line").style("stroke-width"));
		//     tooltipValue.select(".tooltip_circle").style("fill", color(d.name)).attr("r", circleSize);
		//     tooltipValue.select("text").text(d[]);
		// } //mouseover
		// function mouseout(d) {
		//     focus.selectAll(".focus").style("opacity", 0.7);
		//     context.selectAll(".context").selectAll(".line")
		//         .style("opacity", null)
		//         .style("stroke", function(c) {
		//             return "url(#line-gradient-" + gender + "-" + c.name + ")";
		//         });
		//     tooltipValue.attr("transform", "translate(-100,-100)");
		// } //mouseout

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