/***********
	Do not remove below!
***********/

// initates pym! DO NOT REMOVE
var pymChild = new pym.Child();

/***********
	Do not remove above!
***********/

$( document ).ready( function() {
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
	var strokeWidths = [ 6, 6, 2, 2, 1, 1 ], // stroke width per max position
		fontWeights = [ 700, 700, 500, 500, 300, 300 ], // font weight per max position
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
			postProcess: function( element ) {
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
		exportImportData.forEach( function( d, i ) {
			// parse date to year
			var wDate = new Date( d.year );
			d.year = wDate.getUTCFullYear();

			if ( d.year >= minYr ) {
				primaryExports[ i ] = d[ "Total Energy Exports" ];
				netImports[ i ] = d[ "Net Energy Imports" ];
				ngProd[ i ] = d[ "Total Energy Net Imports" ];
				crudeProd[ i ] = d[ "Net Energy Imports" ];
			}
		} );

		// filter out data starting at minYr
		exportImportData = exportImportData.filter( e => e.year >= minYr );

		// concatenate all data into one array
		allExpImpProd = primaryExports.concat( netImports ).concat( ngProd ).concat( crudeProd );
		allMinMax = d3.extent( allExpImpProd );

		// assign chart colors to data
		lineColors.domain( d3.keys( exportImportData[ 0 ] ).filter( function( key ) {
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
			.attr( "height", iepHeight );

		// append definitions
		g.append( "defs" )
			.append( "clipPath" )
			.attr( "id", "lines-clip" )
			.append( "rect" )
			.attr( "width", iepWidth + chartMargins.left )
			.attr( "height", iepHeight + chartMargins.top )
			.attr( "x", -chartMargins.left / 2 )
			.attr( "y", -chartMargins.top / 2 );

		// append chart title
		g.append( "svg:text" )
			.attr( "x", chartMargins.left / 3 )
			.attr( "y", chartMargins.top / 2 )
			.attr( "class", "titles_chart-main" )
			.text( "Net energy imports drop 35% since 2016" );

		// create main g element container for the chart
		var chart = g.append( "g" )
			.attr( "transform", "translate(" + chartMargins.left + "," + chartMargins.top + ")" )
			.attr( "class", "chart-wrapper" );

		// X axis: scale + axis function variables
		var iepX = d3.scaleTime()
			.domain( d3.extent( exportImportData, function( d ) {
				return parseYear( d.year );
			} ) )
			.range( [ -chartMargins.left / 2, iepWidth + ( chartMargins.right / 2 ) ] );

		xAxis = d3.axisBottom( iepX )
			.ticks( exportImportData.length ); // include one tick for each year
		// .tickPadding( 30 )
		// .tickSizeInner( -iepHeight );

		// Y axis: scale + axis function variables
		var iepY = d3.scaleLinear()
			.domain( [ 0, allMinMax[ 1 ] ] )
			.range( [ iepHeight, 0 ] ),
			yAxis = d3.axisRight( iepY )
			.ticks( 5 ) // specify the scale of the axis
			.tickSizeInner( iepWidth + chartMargins.left )
			.tickPadding( 6 )
			.tickFormat( function( d ) {
				return ( d );
			} );

		// create custom function for Y axis
		function customYAxis( g ) {
			// move axis to align properly with the bottom left corner including tick values
			chart.attr( "transform", "translate(" + ( -chartMargins.left / 2 ) + ", 0)" )
			chart.call( yAxis );
			chart.select( ".domain" );
			chart.attr( "text-anchor", "end" );
			chart.selectAll( ".tick:not(:first-of-type) line" ).attr( "stroke", "#777" ).attr( "stroke-dasharray", "2,2" );
			chart.selectAll( ".tick text" ).attr( "x", -4 ).attr( "dy", 0 );
		}

		// formula to create lines
		var line = d3.line()
			.x( function( d ) {
				return iepX( parseYear( d.year ) );
			} )
			.y( function( d ) {
				return iepY( d.btu );
			} );

		// map data to individual lines
		var sourceLines = lineColors.domain().map( function( source ) {
			return {
				source: source,
				values: exportImportData.map( function( s ) {
					return {
						year: s.year,
						btu: +s[ source ]
					};
				} )
			}
		} );

		var allSources = [],
			sourceById = [];
		// loop through source data to parse sources and IDs (keys) for each source
		sourceLines.forEach( function( d, i ) {
			allSources[ i ] = d.source;
			sourceById[ d.source ] = i;
		} );

		/* append SVG elements */
		// append X axis element: calls xAxis function
		chart.append( "g" )
			.attr( "id", "iep-x-axis" )
			.attr( "transform", "translate(0, " + iepHeight + ")" )
			.call( xAxis )
			.select( ".domain" ).remove();

		// append Y axis element: calls yAxis function
		chart.append( "g" )
			.attr( "id", "iep-y-axis" )
			.call( customYAxis )
			.append( "text" ) // add axis label
			.attr( "transform", "rotate(-90)" )
			.attr( "x", -( iepHeight / 2 ) )
			.attr( "y", -35 )
			.attr( "dy", ".71em" )
			.attr( "class", "titles_axis-y" )
			.text( yUnits );

		// add containers for lines and markers
		chart.append( "g" )
			.attr( "id", "lines" )
			.attr( "clip-path", "url(#lines-clip)" );

		// draw/append all data lines
		var sourceLine = chart.select( "#lines" )
			.selectAll( ".source" )
			.data( sourceLines )
			.enter().append( "g" )
			.attr( "class", "source" );

		// add lines for each source group
		var linePath = chart.selectAll( ".source" )
			.append( "path" )
			.attr( "class", "line" )
			.attr( "d", function( d ) {
				return line( d.values );
			} )
			.style( "stroke-width", function( d ) {
				// assign stroke width based on source value
				return strokeWidths[ sourceById[ d.source ] ];
			} )
			.style( "stroke", function( d ) {
				return lineColors( d.source );
			} );

		chart.selectAll( ".line" )
			.attr( "id", function( d ) {
				return d.source;
			} )
			.call( transition ); // call function to animate lines

		// declare function to animate the lines
		function transition( path ) {
			path.attr( "stroke-dashoffset", pathLength ) // set full length first for ltr anim
				.transition()
				.duration( 3000 )
				.attrTween( "stroke-dasharray", dashArray )
				.attr( "stroke-dashoffset", 0 );
		}

		// declare function to calculate stroke dash array
		function dashArray() {
			var l = this.getTotalLength(),
				i = d3.interpolateString( "0," + l, l + "," + l );
			return function( t ) {
				return i( t );
			};
		}

		// declare function to calculate full length of path
		function pathLength() {
			var l = this.getTotalLength();
			return -l;
		}

		// add line labels group
		chart.append( "g" )
			.attr( "id", "line-labels" );

		// draw/append labels for every line
		var lineLabels = chart.select( "#line-labels" )
			.selectAll( ".line-label" )
			.data( sourceLines )
			.enter().append( "text" )
			.attr( "class", "line-label" )
			.datum( function( d ) {
				return {
					source: d.source,
					value: d.values[ 0 ]
				};
			} )
			.text( function( d ) {
				return d.source;
			} )
			.attr( "transform", function( d ) {
				return "translate(" + ( iepX( parseYear( d.value.year ) ) + 5 ) + "," + ( iepY( d.value.btu ) + 3 ) + ")";
			} )
			.style( "fill", function( d ) {
				return lineColors( d.source );
			} )
			.style( "font-weight", function( d ) {
				// assign font weight based on source value
				return fontWeights[ sourceById[ d.source ] ];
			} )
			.call( wrap, 115, .05 );

		// add markers group
		chart.append( "g" )
			.attr( "id", "markers" );

		// draw/append all data point markers
		var sourceMarkers = chart.select( "#markers" )
			.selectAll( ".dots" )
			.data( sourceLines )
			.enter().append( "g" )
			.attr( "class", "dots" );

		// add circle markers for each data point
		sourceMarkers.style( "fill", function( d ) {
				return lineColors( d.source );
			} )
			.selectAll( ".dots" )
			.data( function( d ) {
				return d.values; // use only each source’s set of values as data
			} )
			.enter().append( "circle" )
			.attr( "class", "dot" )
			.attr( "cx", function( d, i ) {
				return iepX( parseYear( d.year ) );
			} )
			.attr( "cy", function( d, i ) {
				return iepY( d.btu );
			} )
			.attr( "r", 6 )
			.on( "mouseover", function( d ) {
				console.log( this );
				this.style( "visibility", "visible" )
			} );

		// draw/append tooltip container
		/*var popUpTooltips = g.append( "g" )
			.attr( "transform", "translate(-100,-100)" )
			.attr( "class", "tooltip" )
			.style( "pointer-events", "none" );

		popUpTooltips.append( "circle" )
			.attr( "class", "tooltip_circle" )
			.attr( "r", 6 );

		popUpTooltips.append( "text" )
			.attr( "class", "tooltip_text" )
			.attr( "y", -25 )
			.append( "tspan" )
			.attr( "class", "tooltip_title" )
			.attr( "dy", -15 );

		popUpTooltips.select( "text" )
			.append( "tspan" )
			.attr( "class", "tooltip_data" );*/

		var tooltip = d3.select( "#export-import-prod" )
			.append( "div" )
			// .attr( "transform", "translate(-100,-100)" )
			.attr( "class", "tooltip" )
			.style( "pointer-events", "none" );

		tooltip.append( "p" )
			.attr( "class", "tooltip_title" );

		tooltip.append( "p" )
			.attr( "class", "tooltip_data" );

		/* VORONOI for rollover effects */
		// create array variable for flattened data
		var flatData = [];
		// flatten all data into one array
		for ( k in sourceLines ) {
			var k_data = sourceLines[ k ];
			k_data.values.forEach( function( d ) {
				if ( d.year >= minYr ) flatData.push( {
					name: k_data.source,
					year: d.year,
					value: d.btu
				} );
			} );
		} // for k
		// console.log( "FLAT DATA", flatData );

		// nest flattened data for voronoi
		var voronoiData = d3.nest()
			.key( function( d ) {
				return iepX( parseYear( d.year ) ) + "," + iepY( d.value );
			} )
			.rollup( function( v ) {
				return v[ 0 ];
			} )
			.entries( flatData )
			.map( function( d ) {
				return d.value;
			} );
		// console.log( "VORONOI DATA", voronoiData );

		// initiate the voronoi function
		var voronoi = d3.voronoi()
			.x( function( d ) {
				return iepX( parseYear( d.year ) );
			} )
			.y( function( d ) {
				return iepY( d.value );
			} )
			.extent( [ [ -chartMargins.left / 2, -chartMargins.top / 2 ], [ iepWidth + chartMargins.left, iepHeight + chartMargins.top ]
			] );
		var voronoiOutput = voronoi( voronoiData );
		// console.log( "VORONOI OUTPUT", voronoiOutput );

		// append the voronoi group element and map to points
		var voronoiGroup = chart.append( "g" )
			.attr( "class", "voronoi" )
			.selectAll( "path" )
			.data( voronoiOutput.polygons() )
			.enter().append( "path" )
			.attr( "class", "voronoi_cells" )
			.attr( "d", function( d ) {
				return d ? "M" + d.join( "L" ) + "Z" : null;
			} )
			.on( "mouseover", mouseover );

		// add mouseover action for tooltip
		function mouseover( d ) {
			// set x and y location
			var dotX = iepX( parseYear( d.data.year ) ),
				dotY = iepY( d.data.value ),
				dotBtu = d3.format( ".2f" )( d.data.value ),
				dotYear = d.data.year,
				dotSource = d.data.name;

			console.log( dotSource );

			// change background color based on line
			/*tooltip.style( "background-color", function() {
				return lineColors( dotSource );
			} );*/

			// add content to tooltip text element
			tooltip.select( ".tooltip_title" )
				.text( dotYear )
			/*.style( "color", lineColors( dotSource ) )*/
			;

			tooltip.select( ".tooltip_data" )
				.text( dotBtu + " " + yUnitsAbbr );

			//Change position of circle and text of tooltip
			tooltip.style( "visibility", "visible" )
				.style( "left", dotX + ( chartMargins.left / 2 ) + "px" )
				.style( "top", dotY + chartMargins.top + "px" );

			// popUpTooltips.attr( "transform", "translate(" + ( dotX + chartMargins.left ) + "," + ( dotY + chartMargins.top ) + ")" )
			// .select( ".tooltipCircle" )
			// 	.data( sourceLines )
			// 	.style( "fill", lineColors( d.source ) );

			// .attr( "transform", "translate(" + ( dotX + chartMargins.left ) + "," + ( dotY + chartMargins.top ) + ")" )
			// .text( dotSource + "<br/>" + dotYear + "<br/>" + d3.format( ".1f" )( dotBtu ) );
		} //mouseover

		/****
		 CHART #2: Wind vs. Hydro Net Summer Capacity
		****/
		// declare arrays for separate data
		var windCap = [], // wind cap data
			hydroCap = [], // hydro cap data
			whCapAll = []; // all cap data

		// loop through each row of windHydroCapData
		windHydroCapData.forEach( function( d, i ) {
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
		lineColors.domain( d3.keys( windHydroCapData[ 0 ] ).filter( function( key ) {
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
			.domain( d3.extent( windHydroCapData, function( d ) {
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
			.tickFormat( function( d ) {
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
			.x( function( d ) {
				return windX( parseYear( d.year ) );
			} )
			.y( function( d ) {
				return windY( d[ "Wind Net Summer Capacity (megawatts)" ] );
			} );

		// create hydro capacity line
		var hydroLine = d3.line()
			.x( function( d ) {
				return windX( parseYear( d.year ) );
			} )
			.y( function( d ) {
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
			.style( "stroke", function( d ) {
				return lineColors( "Wind Net Summer Capacity (megawatts)" );
			} );

		// hydro line element
		g.append( "g" )
			.attr( "class", "line" )
			.append( "path" )
			.datum( windHydroCapData )
			.attr( "d", hydroLine )
			.style( "stroke", function( d ) {
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
		windHydroGenData.forEach( function( d, i ) {
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
		lineColors.domain( d3.keys( windHydroGenData[ 0 ] ).filter( function( key ) {
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
		lineColors.domain( d3.keys( windHydroCapData[ 0 ] ).filter( function( key ) {
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
			.domain( d3.extent( windHydroGenData, function( d ) {
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
			.tickFormat( function( d ) {
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
			.x( function( d ) {
				// console.log( parseYear( d.year ) );
				return windX( parseYear( d.year ) );
			} )
			.y( function( d ) {
				// console.log( d[ "Net wind generation (thousand megawatthours)" ] );
				return windY( d[ "Net wind generation (thousand megawatthours)" ] );
			} );

		// create hydro capacity line
		var hydroLine = d3.line()
			.x( function( d ) {
				// console.log( parseYear( d.year ) );
				return windX( parseYear( d.year ) );
			} )
			.y( function( d ) {
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
			.style( "stroke", function( d ) {
				return lineColors( "Wind Net Summer Capacity (megawatts)" );
			} );

		// hydro line element
		g.append( "g" )
			.attr( "class", "line" )
			.append( "path" )
			.datum( windHydroGenData )
			.attr( "d", hydroLine )
			.style( "stroke", function( d ) {
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

	// function for wrapping long SVG text
	function wrap( text, width, yheight ) {
		text.each( function() {
			var text = d3.select( this ),
				words = text.text().split( /\s+/ ).reverse(),
				word,
				line = [],
				lineNumber = 0,
				lineHeight = 1.1, // ems
				y = 0 /*text.attr( "y" )*/ ,
				dy = parseFloat( yheight ),
				tspan = text.text( null ).append( "tspan" ).attr( "x", 0 ).attr( "y", y ).attr( "dy", dy + "em" );
			while ( word = words.pop() ) {
				line.push( word );

				// console.log( "wrap", line, y, yheight );
				tspan.text( line.join( " " ) );
				// console.log( line, "comp text length", tspan.node().getComputedTextLength(), width );
				//console.log( y );
				if ( tspan.node().getComputedTextLength() > width ) {
					line.pop();
					tspan.text( line.join( " " ) );
					line = [ word ];
					tspan = text.append( "tspan" ).attr( "x", 0 ).attr( "y", y ).attr( "dy", dy + ( lineHeight * ++lineNumber ) + "em" ).text( word );
					// console.log( dy + ( lineHeight * lineNumber ) );
					console.log( tspan );
				}
			}
		} );
	}

} );