( function () {
	/*
	 OverlappingMarkerSpiderfier
	https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet
	Copyright (c) 2011 - 2012 George MacKerron
	Released under the MIT licence: http://opensource.org/licenses/mit-license
	Note: The Leaflet maps API must be included *before* this code

	*****This code makes Leaflet map markers behave in that Google Earth way (minus the animation). Small numbers of markers (yes, up to 8) spiderfy into a circle. Larger numbers fan out into a more space-efficient spiral.*****
	*/
	( function () {
		var n = {}.hasOwnProperty,
			o = [].slice;
		null != this.L && ( this.OverlappingMarkerSpiderfier = function () {
			function l( c, b ) {
				var a, e, g, f, d = this;
				this.map = c;
				null == b && ( b = {} );
				for ( a in b ) n.call( b, a ) && ( e = b[ a ], this[ a ] = e );
				this.initMarkerArrays();
				this.listeners = {};
				f = [ "click", "zoomend" ];
				e = 0;
				for ( g = f.length; e < g; e++ ) a = f[ e ], this.map.addEventListener( a, function () {
					return d.unspiderfy()
				} )
			}
			var d, i;
			d = l.prototype;
			d.VERSION = "0.2.5";
			i = 2 * Math.PI;
			d.keepSpiderfied = !1;
			d.nearbyDistance = 20;
			d.circleSpiralSwitchover = 9;
			d.circleFootSeparation =
				25;
			d.circleStartAngle = i / 12;
			d.spiralFootSeparation = 28;
			d.spiralLengthStart = 11;
			d.spiralLengthFactor = 5;
			d.legWeight = 1.5;
			d.legColors = {
				usual: "#222",
				highlighted: "#f00"
			};
			d.initMarkerArrays = function () {
				this.markers = [];
				return this.markerListeners = []
			};
			d.addMarker = function ( c ) {
				var b, a = this;
				if ( null != c._oms ) return this;
				c._oms = !0;
				b = function () {
					return a.spiderListener( c )
				};
				c.addEventListener( "click", b );
				this.markerListeners.push( b );
				this.markers.push( c );
				return this
			};
			d.getMarkers = function () {
				return this.markers.slice( 0 )
			};
			d.removeMarker = function ( c ) {
				var b, a;
				null != c._omsData && this.unspiderfy();
				b = this.arrIndexOf( this.markers, c );
				if ( 0 > b ) return this;
				a = this.markerListeners.splice( b, 1 )[ 0 ];
				c.removeEventListener( "click", a );
				delete c._oms;
				this.markers.splice( b, 1 );
				return this
			};
			d.clearMarkers = function () {
				var c, b, a, e, g;
				this.unspiderfy();
				g = this.markers;
				c = a = 0;
				for ( e = g.length; a < e; c = ++a ) b = g[ c ], c = this.markerListeners[ c ], b.removeEventListener( "click", c ), delete b._oms;
				this.initMarkerArrays();
				return this
			};
			d.addListener = function ( c, b ) {
				var a,
					e;
				( null != ( e = ( a = this.listeners )[ c ] ) ? e : a[ c ] = [] ).push( b );
				return this
			};
			d.removeListener = function ( c, b ) {
				var a;
				a = this.arrIndexOf( this.listeners[ c ], b );
				0 > a || this.listeners[ c ].splice( a, 1 );
				return this
			};
			d.clearListeners = function ( c ) {
				this.listeners[ c ] = [];
				return this
			};
			d.trigger = function () {
				var c, b, a, e, g, f;
				b = arguments[ 0 ];
				c = 2 <= arguments.length ? o.call( arguments, 1 ) : [];
				b = null != ( a = this.listeners[ b ] ) ? a : [];
				f = [];
				e = 0;
				for ( g = b.length; e < g; e++ ) a = b[ e ], f.push( a.apply( null, c ) );
				return f
			};
			d.generatePtsCircle = function ( c, b ) {
				var a, e,
					g, f, d;
				g = this.circleFootSeparation * ( 2 + c ) / i;
				e = i / c;
				d = [];
				for ( a = f = 0; 0 <= c ? f < c : f > c; a = 0 <= c ? ++f : --f ) a = this.circleStartAngle + a * e, d.push( new L.Point( b.x + g * Math.cos( a ), b.y + g * Math.sin( a ) ) );
				return d
			};
			d.generatePtsSpiral = function ( c, b ) {
				var a, e, g, f, d;
				g = this.spiralLengthStart;
				a = 0;
				d = [];
				for ( e = f = 0; 0 <= c ? f < c : f > c; e = 0 <= c ? ++f : --f ) a += this.spiralFootSeparation / g + 5.0E-4 * e, e = new L.Point( b.x + g * Math.cos( a ), b.y + g * Math.sin( a ) ), g += i * this.spiralLengthFactor / a, d.push( e );
				return d
			};
			d.spiderListener = function ( c ) {
				var b, a, e, g, f, d, h, i, j;
				b =
					null != c._omsData;
				( !b || !this.keepSpiderfied ) && this.unspiderfy();
				if ( b ) return this.trigger( "click", c );
				g = [];
				f = [];
				d = this.nearbyDistance * this.nearbyDistance;
				e = this.map.latLngToLayerPoint( c.getLatLng() );
				j = this.markers;
				h = 0;
				for ( i = j.length; h < i; h++ ) b = j[ h ], a = this.map.latLngToLayerPoint( b.getLatLng() ), this.ptDistanceSq( a, e ) < d ? g.push( {
					marker: b,
					markerPt: a
				} ) : f.push( b );
				return 1 === g.length ? this.trigger( "click", c ) : this.spiderfy( g, f )
			};
			d.makeHighlightListeners = function ( c ) {
				var b = this;
				return {
					highlight: function () {
						return c._omsData.leg.setStyle( {
							color: b.legColors.highlighted
						} )
					},
					unhighlight: function () {
						return c._omsData.leg.setStyle( {
							color: b.legColors.usual
						} )
					}
				}
			};
			d.spiderfy = function ( c, b ) {
				var a, e, g, d, m, h, i, j, l, k;
				this.spiderfying = !0;
				k = c.length;
				a = this.ptAverage( function () {
					var a, b, e;
					e = [];
					a = 0;
					for ( b = c.length; a < b; a++ ) i = c[ a ], e.push( i.markerPt );
					return e
				}() );
				d = k >= this.circleSpiralSwitchover ? this.generatePtsSpiral( k, a ).reverse() : this.generatePtsCircle( k, a );
				a = function () {
					var a, b, i, k = this;
					i = [];
					a = 0;
					for ( b = d.length; a < b; a++ ) g = d[ a ], e = this.map.layerPointToLatLng( g ), l = this.minExtract( c, function ( a ) {
						return k.ptDistanceSq( a.markerPt,
							g )
					} ), h = l.marker, m = new L.Polyline( [ h.getLatLng(), e ], {
						color: this.legColors.usual,
						weight: this.legWeight,
						clickable: !1
					} ), this.map.addLayer( m ), h._omsData = {
						usualPosition: h.getLatLng(),
						leg: m
					}, this.legColors.highlighted !== this.legColors.usual && ( j = this.makeHighlightListeners( h ), h._omsData.highlightListeners = j, h.addEventListener( "mouseover", j.highlight ), h.addEventListener( "mouseout", j.unhighlight ) ), h.setLatLng( e ), h.setZIndexOffset( 1E6 ), i.push( h );
					return i
				}.call( this );
				delete this.spiderfying;
				this.spiderfied = !0;
				return this.trigger( "spiderfy", a, b )
			};
			d.unspiderfy = function ( c ) {
				var b, a, e, d, f, i, h;
				null == c && ( c = null );
				if ( null == this.spiderfied ) return this;
				this.unspiderfying = !0;
				d = [];
				e = [];
				h = this.markers;
				f = 0;
				for ( i = h.length; f < i; f++ ) b = h[ f ], null != b._omsData ? ( this.map.removeLayer( b._omsData.leg ), b !== c && b.setLatLng( b._omsData.usualPosition ), b.setZIndexOffset( 0 ), a = b._omsData.highlightListeners, null != a && ( b.removeEventListener( "mouseover", a.highlight ), b.removeEventListener( "mouseout", a.unhighlight ) ), delete b._omsData, d.push( b ) ) :
					e.push( b );
				delete this.unspiderfying;
				delete this.spiderfied;
				this.trigger( "unspiderfy", d, e );
				return this
			};
			d.ptDistanceSq = function ( c, b ) {
				var a, e;
				a = c.x - b.x;
				e = c.y - b.y;
				return a * a + e * e
			};
			d.ptAverage = function ( c ) {
				var b, a, e, d, f;
				d = a = e = 0;
				for ( f = c.length; d < f; d++ ) b = c[ d ], a += b.x, e += b.y;
				c = c.length;
				return new L.Point( a / c, e / c )
			};
			d.minExtract = function ( c, b ) {
				var a, d, g, f, i, h;
				g = i = 0;
				for ( h = c.length; i < h; g = ++i )
					if ( f = c[ g ], f = b( f ), !( "undefined" !== typeof a && null !== a ) || f < d ) d = f, a = g;
				return c.splice( a, 1 )[ 0 ]
			};
			d.arrIndexOf = function ( c, b ) {
				var a,
					d, g, f;
				if ( null != c.indexOf ) return c.indexOf( b );
				a = g = 0;
				for ( f = c.length; g < f; a = ++g )
					if ( d = c[ a ], d === b ) return a;
				return -1
			};
			return l
		}() )
	} ).call( this );
} ).call( this );
/* Sun 6 May 2012 17:49:10 BST */