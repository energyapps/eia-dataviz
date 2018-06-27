/* DEFINE PYM VARIABLE */
// declare pym content variable for later use
// var pymChild = null;

/* DEFINE DATA SOURCES */
// Google sheets ID – for loading with Tabletop.JS
var public_spreadsheet_url = '1lJTxKh2F98tEuCeHnlJsVAl1FgEx5nkEwuvAfUlTUFU',
	sheet_names = [ "all_exports_ng_exports_net_imports", "wind_over_hydro_cap", "wind_over_hydro_gen" /*, "monthly_fuel_price", "annual_summer_fuel_avg", "monthly_disp_income", "summer_disp_income"*/ ]; // specify sheets to load

/* DEFINE UNIVERSAL VARIABLES */
// alternate source of static data
// var graphic_data_url = 'data.csv';
// create variable for holding data
// var graphic_data;

// chart container div ID
var chart_container = $( "#export-import-prod" );

// chart introduction
var chart_title = "U.S. energy exports on the rise while energy imports fall";
var chart_intro = "Net energy imports to the United States fell 35% while the gross energy exports improved by 27% since 2016.";

// aspect ratio dimensions of chart
var graphic_aspect_width = 16,
	graphic_aspect_height = 9,
	mobile_threshold = 500,
	tablet_threshold = 700,
	large_threshold = 1200;

// chart margins
var chart_margins = {
	top: 50,
	right: 70,
	bottom: 80,
	left: 70
}

// chart element variations
var stroke_widths = [ 6, 6, 2, 2, 1, 1 ], // stroke width per max position
	font_weights = [ 700, 700, 500, 500, 300, 300 ], // font weight per max position
	chart_colors = [ "#7cc110", "#127ea8", "#2c8565", "#63B8FF", "#006400", "#EDB43D" ];

// $( document ).ready( function () {
// console.log( "Page loaded. Jquery is running. Now, do stuff." );

// get current date and extract year
var today = new Date(),
	curr_year = today.getFullYear(),
	curr_month = today.getMonth(),
	summer = false;

// set summer months
if ( 2 < curr_month < 9 ) {
	summer = true;
	console.log( "It’s summer:", curr_month + 1, "/", curr_year );
}

/* PROCESS DATA AND DRAW CHART */
function showInfo( data ) {
	// get current date and extract year
	var today = new Date(),
		curr_year = today.getFullYear();

	// create a variable to parse year with D3
	var parseYear = d3.timeParse( "%Y" );
	console.log( "Spreadsheet data loaded on", today.toJSON() );

	/****
	 LOAD DATA INTO VARIABLES
	****/
	// load individual sheet elements into variables
	var exportImportData = data.all_exports_ng_exports_net_imports.elements;
	/*windHydroCapData = data.wind_over_hydro_cap.elements,
	windHydroGenData = data.wind_over_hydro_gen.elements,*/
	// console.table( exportImportData );

	// create universal color scale
	var lineColors = d3.scaleOrdinal()
		.range( chart_colors );

	/****
	 DRAW CHART #1: Exports vs. NG exports vs. net imports vs. NG vs. crude oil prod
	****/
	// set oldest year to get data from
	var minYr = 1997;

	// set units for Y axis values
	var yUnits = "Quadrillion Btu",
		yUnitsAbbr = "quads";

	// declare arrays for separate data
	var primaryExports = [], // primary energy exports data
		netImports = [], // primary energy net imports data
		ngProd = [], // NG (dry) production data
		crudeProd = [], // crude oil production data
		allExpImpProd = []; // combined data

	/* CONTAINER DIV + CHART DIMENSIONS*/
	// get chart container width
	var contWidth = chart_container.width();

	// set default container width as fallback
	if ( contWidth == undefined || isNaN( contWidth ) ) {
		contWidth = 600;
	}

	var iepWidth = contWidth - chart_margins.left - chart_margins.right;

	// adjust chart width based on device width
	if ( contWidth < mobile_threshold ) {
		iepWidth = iepWidth * 0.70;
	} else if ( contWidth < tablet_threshold ) {
		iepWidth = iepWidth * 0.75;
	} else if ( contWidth < large_threshold ) {
		iepWidth = iepWidth * 0.85;
	}

	// calculate heights in proportion to the width
	var contHeight = Math.ceil( ( contWidth * graphic_aspect_height ) / graphic_aspect_width ),
		iepHeight = Math.ceil( ( iepWidth * graphic_aspect_height ) / graphic_aspect_width );

	// reset container height
	chart_container.height( contHeight );

	/* ACCESS DATA AND POPULATE VARIABLES */
	// loop through each row of data
	exportImportData.forEach( function ( d, i ) {
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
	lineColors.domain( d3.keys( exportImportData[ 0 ] ).filter( function ( key ) {
		// filter through the keys excluding certain columns, e.g. x-axis data
		return key !== "year" && key !== "Natural Gas Exports";
	} ) );

	/* NUMBER OF TICKS */
	// set number of ticks on x-axis based on data
	var num_x_ticks = exportImportData.length; // include one tick for each year

	// set constant number of ticks for smaller devices
	if ( contWidth < mobile_threshold ) {
		num_x_ticks = 5;
	} else if ( contWidth < tablet_threshold ) {
		num_x_ticks = 7;
	}

	// clear out existing chart (important for redraw)
	chart_container.empty();

	// select container div by ID + create SVG and main g elements within
	var impExpProd = d3.select( "#export-import-prod" ),
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
		.attr( "width", iepWidth + chart_margins.left )
		.attr( "height", iepHeight + ( chart_margins.bottom * 4 ) )
		.attr( "x", -chart_margins.left / 2 )
		.attr( "y", -chart_margins.top / 2 );

	// append g element container for intro text
	var chartIntro = g.append( "svg:g" )
		.attr( "class", "chart-intro" );

	// append chart title to intro group
	chartIntro.append( "svg:text" )
		.attr( "y", chart_margins.top / 2 )
		.attr( "class", "titles_chart-main" )
		.text( chart_title );

	// append chart summary to intro group
	chartIntro.append( "svg:text" )
		.attr( "class", "titles_chart-summary" )
		.text( chart_intro )
		.call( wrap, iepWidth, 4, 1.5 );

	// append main g element container for the chart
	var chart = g.append( "svg:g" )
		.attr( "transform", "translate(" + chart_margins.left + "," + ( chart_margins.top * 2 ) + ")" )
		.attr( "class", "chart-wrapper" );

	// X axis: scale + axis function variables
	var iepX = d3.scaleTime()
		.domain( d3.extent( exportImportData, function ( d ) {
			return parseYear( d.year );
		} ) )
		.range( [ -chart_margins.left / 2, iepWidth + ( chart_margins.right / 2 ) ] );

	xAxis = d3.axisBottom( iepX )
		.ticks( num_x_ticks );

	// Y axis: scale + axis function variables
	var iepY = d3.scaleLinear()
		.domain( [ 0, allMinMax[ 1 ] ] )
		.range( [ iepHeight, 0 ] ),
		yAxis = d3.axisRight( iepY )
		.ticks( 5 ) // specify the scale of the axis
		.tickSizeInner( iepWidth + chart_margins.left ) // scale ticks across chart width
		.tickPadding( 6 )
		.tickFormat( function ( d ) {
			return ( d );
		} );

	// create custom function for Y axis
	function customYAxis( g ) {
		// move axis to align properly with the bottom left corner including tick values
		chart.attr( "transform", "translate(" + ( -chart_margins.left / 2 ) + ", 0)" )
		chart.call( yAxis );
		chart.select( ".domain" );
		chart.attr( "text-anchor", "end" );
		chart.selectAll( ".tick:not(:first-of-type) line" ).attr( "stroke", "#777" ).attr( "stroke-dasharray", "2,2" );
		chart.selectAll( ".tick text" ).attr( "x", -4 ).attr( "dy", 0 );
	} // appends y-axis to chart group

	// formula to create lines
	var line = d3.line()
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

	var allSources = [],
		sourceById = [];
	// loop through source data to parse sources and IDs (keys) for each source
	sourceLines.forEach( function ( d, i ) {
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
		.attr( "transform", "rotate(-90)" ) // rotate level 90º counterclockwise
		.attr( "x", -( iepHeight / 2 ) ) // center label vertically
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
		.attr( "d", function ( d ) {
			return line( d.values );
		} )
		.style( "stroke-width", function ( d ) {
			// assign stroke width based on source value
			return stroke_widths[ sourceById[ d.source ] ];
		} )
		.style( "stroke", function ( d ) {
			return lineColors( d.source );
		} );

	chart.selectAll( ".line" )
		.attr( "id", function ( d ) {
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
		return function ( t ) {
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
		.datum( function ( d ) {
			return {
				source: d.source,
				value: d.values[ 0 ]
			};
		} )
		.text( function ( d ) {
			return d.source;
		} )
		.attr( "transform", function ( d ) {
			return "translate(" + ( iepX( parseYear( d.value.year ) ) + 5 ) + "," + ( iepY( d.value.btu ) + 3 ) + ")";
		} )
		.style( "fill", function ( d ) {
			return lineColors( d.source );
		} )
		.style( "font-weight", function ( d ) {
			// assign font weight based on source value
			return font_weights[ sourceById[ d.source ] ];
		} )
		.call( wrap, 115, .05, 1.1 );

	// create custom function for Y axis
	function customYAxis( g ) {
		// move axis to align properly with the bottom left corner including tick values
		g.attr( "transform", "translate(" + ( -chart_margins.left / 2 ) + ", 0)" )
		g.call( yAxis );
		g.select( ".domain" );
		g.attr( "text-anchor", "end" );
		g.selectAll( ".tick:not(:first-of-type) line" ).attr( "stroke", "#777" ).attr( "stroke-dasharray", "2,2" );
		g.selectAll( ".tick text" ).attr( "x", -4 ).attr( "dy", 0 );
	}

	// draw/append tooltip container
	var tooltip = d3.select( "#export-import-prod" )
		.append( "div" )
		// .attr( "transform", "translate(-100,-100)" )
		.attr( "class", "tooltip" )
		.style( "pointer-events", "none" );

	// append container div for text
	var tooltip_text = tooltip.append( "div" )
		.attr( "class", "tooltip_text" );

	// append paragraph for year
	tooltip_text.append( "p" )
		.attr( "class", "tooltip_title" );

	// append paragraph for point value
	tooltip_text.append( "p" )
		.attr( "class", "tooltip_data" );

	// append div for pointer/marker
	tooltip.append( "div" )
		.attr( "class", "tooltip_marker" );

	/* VORONOI for rollover effects */
	// create array variable for flattened data
	var flatData = [];
	// flatten all data into one array
	for ( k in sourceLines ) {
		var k_data = sourceLines[ k ];
		k_data.values.forEach( function ( d ) {
			if ( d.year >= minYr ) flatData.push( {
				name: k_data.source,
				year: d.year,
				value: d.btu
			} );
		} );
	} // END for k loop
	// console.log( "FLAT DATA", flatData );

	// nest flattened data for voronoi
	var voronoiData = d3.nest()
		.key( function ( d ) {
			return iepX( parseYear( d.year ) ) + "," + iepY( d.value );
		} )
		.rollup( function ( v ) {
			return v[ 0 ];
		} )
		.entries( flatData )
		.map( function ( d ) {
			return d.value;
		} );
	// console.log( "VORONOI DATA", voronoiData );

	// initiate the voronoi function
	var voronoi = d3.voronoi()
		.x( function ( d ) {
			return iepX( parseYear( d.year ) );
		} )
		.y( function ( d ) {
			return iepY( d.value );
		} )
		.extent( [ [ -chart_margins.left / 2, -chart_margins.top / 2 ], [ iepWidth + chart_margins.left, iepHeight + chart_margins.top ]
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
		.attr( "d", function ( d ) {
			return d ? "M" + d.join( "L" ) + "Z" : null;
		} )
		.on( "mouseover", mouseover )
		.on( "mouseout", mouseout );

	// add mouseover action for tooltip
	function mouseover( d ) {
		// set x and y location
		var dotX = iepX( parseYear( d.data.year ) ),
			dotY = iepY( d.data.value ),
			dotBtu = d3.format( ".2f" )( d.data.value ),
			dotYear = d.data.year,
			dotSource = d.data.name;

		// console.log( "SOURCE:", dotSource, index( lineColors( dotSource ) ) );

		// add content to tooltip text element
		/*tooltip.select( ".tooltip_text" )
			.style( "border-color", lineColors( [ dotSource ] - 2 ) );*/

		tooltip.select( ".tooltip_title" )
			.text( dotYear )
		/*.style( "color", lineColors( dotSource ) )*/
		;

		tooltip.select( ".tooltip_data" )
			.text( dotBtu + " " + yUnitsAbbr );

		tooltip.select( ".tooltip_marker" )
			.text( "▼" )
		/*.style( "color", lineColors( dotSource ) )*/
		;

		//Change position of tooltip and text of tooltip
		tooltip.style( "visibility", "visible" )
			.style( "left", dotX + ( chart_margins.left / 2 ) + "px" )
			.style( "top", dotY + ( chart_margins.top / 2 ) + "px" );
	} //mouseover

	function mouseout() {
		tooltip.style( "visibility", "hidden" );
	}

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

	/* DATA SOURCE SECTION */
	// draw/append tooltip container
	var sources = d3.select( "#chart-sources" );

	sources.append( "h5" )
		.text( "SOURCE: " );

	sources.append( "p" )
		.attr( "class", "source-content" );

	sources.select( ".source-content" )
		.text( "U.S. Energy Information Administration (EIA), " )
		.append( "a" )
		.attr( "href", "http://www.eia.gov/totalenergy/data/monthly/" )
		.text( "Monthly Energy Review, tables 1.4a & 1.4b" );
}

// function for wrapping long SVG text
function wrap( text, width, yheight, lineheight ) {
	text.each( function () {
		var text = d3.select( this ),
			words = text.text().split( /\s+/ ).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = /*1.1*/ lineheight, // ems
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
				// console.log( tspan );
			}
		}
	} );

	// This is calling an updated height.
	/*if ( pymChild ) {
		pymChild.sendHeight();
		pymChild.sendWidth();
	}*/
}

// } );

/* TABLETOP.JS: LOAD DATA */
// function for initializing tabletop
function loadSpreadsheet() {
	// load data
	Tabletop.init( {
		key: public_spreadsheet_url, // access specified spreadsheet url
		callback: showInfo, // function to run once data is loaded
		wanted: sheet_names,
		parseNumbers: true,
		orderby: "year",
		reverse: true,
		postProcess: function ( element ) {
			// format date string
			element[ "year" ] = Date.parse( element[ "year" ] );
		}
		// , debug: true
	} );
	console.log( "Tabletop has run!" );
}

$( window ).on( "load", function () {
	// check for SVG support in browser
	if ( Modernizr.svg ) { // if svg is supported, draw dynamic chart
		console.log( "This browser supports SVG" );
		// run function to load spreadsheet data
		loadSpreadsheet();

		// Instantiate the child message with a callback but AFTER the D3 charts are drawn.
		/*pymChild = new pym.Child( {
			renderCallback: showInfo
		} );*/
		/*d3.csv( graphic_data_url, function ( error, data ) {
			graphic_data = data;
			graphic_data.forEach( function ( d ) {
				d.date = d3.time.format( '%Y-%m' ).parse( d.date );
				d.jobs = d.jobs / 1000;
			} );*/
	} else { // If not, rely on static fallback image. No callback needed.
		// pymChild = new pym.Child( {} );
		console.log( "This browser doesn't support SVG" );
	}
} );