// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// Licence: Robert Koch-Institut (RKI), dl-de/by-2-0
//

// -------------
// Configuration
// -------------

// whether a second graph with old data (-7 days) should be draw for comparison
const drawOldData = true;
// whether to shorten big numbers, e. g. 10.256 becomes 10,2k
const shortenBigNumbers = true;

// ---------------------------
// do not edit after this line
// ---------------------------
const DAY_IN_MICROSECONDS = 86400000;
const lineWeight = 2;
const vertLineWeight = .5;
const accentColor1 = new Color( '#33cc33', 1 );
const accentColor2 = Color.lightGray();

const apiUrl = ( location ) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=GEN,cases,deaths,cases7_per_100k,cases7_bl_per_100k,BL,county&geometry=${ location.longitude.toFixed( 3 ) }%2C${ location.latitude.toFixed( 3 ) }&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;
const widgetHeight = 338;
const widgetWidth = 720;
const graphLow = 280;
const graphHeight = 160;
const spaceBetweenDays = 44.5;

const saveIncidenceLatLon = ( location ) => {
	let fm = FileManager.iCloud();
	let path = fm.joinPath( fm.documentsDirectory(), 'covid19latlon.json' );
	fm.writeString( path, JSON.stringify( location ) );
};

const getSavedIncidenceLatLon = () => {
	let fm = FileManager.iCloud();
	let path = fm.joinPath( fm.documentsDirectory(), 'covid19latlon.json' );
	let data = fm.readString( path );
	return JSON.parse( data );
};

let drawContext = new DrawContext();
drawContext.size = new Size( widgetWidth, widgetHeight );
drawContext.opaque = false;

let widget = await createWidget();
widget.setPadding( 0, 0, 0, 0 );
widget.backgroundImage = ( drawContext.getImage() );
await widget.presentMedium();

Script.setWidget( widget );
Script.complete();

async function createWidget( items ) {
	let location;
	
	if ( args.widgetParameter ) {
		console.log( 'get fixed lat/lon' );
		const fixedCoordinates = args.widgetParameter.split( ',' ).map( parseFloat );
		location = {
			latitude: fixedCoordinates[ 0 ],
			longitude: fixedCoordinates[ 1 ]
		};
	}
	else {
		Location.setAccuracyToThreeKilometers();
		try {
			location = await Location.current();
			console.log( 'get current lat/lon' );
			saveIncidenceLatLon( location );
		}
		catch ( e ) {
			console.log( 'using saved lat/lon' );
			location = getSavedIncidenceLatLon();
		}
	}
	
	const locationData = await new Request( apiUrl( location ) ).loadJSON();
	
	if ( ! locationData || ! locationData.features || ! locationData.features.length ) {
		const errorList = new ListWidget();
		errorList.backgroundColor = new Color( '#191a1d', 1 );
		errorList.addText( 'Keine Ergebnisse für den aktuellen Ort gefunden.' );
		return errorList;
	}
	
	const attr = locationData.features[ 0 ].attributes;
	const cityName = attr.GEN;
	const county = attr.county;
	const list = new ListWidget();
	const date = new Date();
	date.setTime( date.getTime() - 23 * DAY_IN_MICROSECONDS );
	const minDate = ( '0' + ( date.getMonth() + 1 ) ).slice( -2 ) + '-' + ( '0' + date.getDate() ).slice( -2 ) + '-' + date.getFullYear();
	const apiUrlData = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/Covid19_RKI_Sums/FeatureServer/0/query?where=Landkreis+LIKE+%27%25${ encodeURIComponent( county ) }%25%27+AND+Meldedatum+%3E+%27${ encodeURIComponent( minDate ) }%27&objectIds=&time=&resultType=none&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=Meldedatum&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=json&token=`;
	date.setTime( ( date.getTime() + 7 * DAY_IN_MICROSECONDS ) );
	
	const cityData = await new Request( apiUrlData ).loadJSON();
	
	if ( ! cityData || ! cityData.features || ! cityData.features.length ) {
		const errorList = new ListWidget();
		errorList.backgroundColor = new Color( '#191a1d', 1 );
		errorList.addText( 'Keine Statistik gefunden.' );
		return errorList;
	}
	
	list.backgroundColor = new Color( '#191a1d', 1 );
	
	drawContext.setTextColor( Color.white() );
	drawContext.setFont( Font.mediumSystemFont( 26 ) );
	drawContext.drawText( '🦠 Statistik'.toUpperCase() + ' ' + cityName, new Point( 25, 25 ) );
	
	drawContext.setTextAlignedCenter();
	
	let data = {};
	let oldData = {};
	
	for ( const dataset of cityData.features ) {
		if ( drawOldData && dataset.attributes.Meldedatum < date.getTime() ) {
			// get old data
			if ( typeof oldData[ dataset.attributes.Meldedatum ] === 'undefined' ) {
				oldData[ dataset.attributes.Meldedatum ] = {
					Meldedatum: dataset.attributes.Meldedatum,
					AnzahlFall: 0,
				};
			}
			
			oldData[ dataset.attributes.Meldedatum ].AnzahlFall += parseInt( dataset.attributes.AnzahlFall );
		}
		else if ( dataset.attributes.Meldedatum >= date.getTime() ) {
			// get old data
			if ( drawOldData && dataset.attributes.Meldedatum < date.getTime() + 8 * DAY_IN_MICROSECONDS ) {
				if ( typeof oldData[ dataset.attributes.Meldedatum ] === 'undefined' ) {
					oldData[ dataset.attributes.Meldedatum ] = {
						Meldedatum: dataset.attributes.Meldedatum,
						AnzahlFall: 0,
					};
				}
				
				oldData[ dataset.attributes.Meldedatum ].AnzahlFall += parseInt( dataset.attributes.AnzahlFall );
			}
			
			// get current data
			if ( typeof data[ dataset.attributes.Meldedatum ] === 'undefined' ) {
				data[ dataset.attributes.Meldedatum ] = {
					Meldedatum: dataset.attributes.Meldedatum,
					AnzahlFall: 0,
				};
			}
			
			data[ dataset.attributes.Meldedatum ].AnzahlFall += parseInt( dataset.attributes.AnzahlFall );
		}
	}
	
	// get minimal value of the current data
	const currentData = Object.values( data );
	let currentMin;
	
	for ( let i = 0; i < currentData.length; i++ ) {
		let aux = currentData[ i ].AnzahlFall;
		
		currentMin = ( aux < currentMin || currentMin == undefined ? aux : currentMin );
	}
	
	let oldMin;
	
	if ( drawOldData ) {
		oldMin = drawChart( Object.values( oldData ), 'old', currentMin );
	}
	
	drawChart( currentData, 'current', oldMin );
	
	return list;
}

function drawChart( dataArray, chartType, min ) {
	let max = 0;
	
	for ( let i = 0; i < dataArray.length; i++ ) {
		let aux = dataArray[ i ].AnzahlFall;
		
		min = ( aux < min || min == undefined ? aux : min );
		max = ( aux > max || max == undefined ? aux : max );
	}
	
	let diff = max - min;
	
	const highestIndex = dataArray.length - 1;
	
	for ( let i = 0, j = highestIndex; i < dataArray.length; i++, j-- ) {
		const day = ( new Date( dataArray[ i ].Meldedatum ) ).getDate();
		const dayOfWeek = ( new Date( dataArray[ i ].Meldedatum ) ).getDay();
		const cases = dataArray[ i ].AnzahlFall;
		const delta = ( cases - min ) / diff;
		
		if ( i < highestIndex ) {
			const nextCases = dataArray[ i + 1 ].AnzahlFall;
			const nextDelta = ( nextCases - min ) / diff;
			const point1 = new Point( spaceBetweenDays * i + 50, graphLow - ( graphHeight * delta ) );
			const point2 = new Point( spaceBetweenDays * ( i + 1 ) + 50, graphLow - ( graphHeight * nextDelta ) );
			
			if ( chartType === 'current' ) {
				drawLine( point1, point2, lineWeight, accentColor1 );
			}
			else {
				drawLine( point1, point2, 1, accentColor2 );
			}
		}
		
		// Vertical Line
		if ( chartType === 'current' ) {
			const point1 = new Point( spaceBetweenDays * i + 50, graphLow - ( graphHeight * delta ) );
			const point2 = new Point( spaceBetweenDays * i + 50, graphLow );
			drawLine( point1, point2, vertLineWeight, accentColor2 );
			
			let dayColor;
			
			if ( dayOfWeek == 0 || dayOfWeek == 6 ) {
				dayColor = accentColor2;
			}
			else {
				dayColor = Color.white();
			}
			
			const casesRect = new Rect( spaceBetweenDays * i, ( graphLow - 40 ) - ( graphHeight * delta ), 100, 23 );
			const dayRect = new Rect( spaceBetweenDays * i + 27, graphLow + 10, 50, 23 );
			
			drawTextR( formatNumber( cases ), casesRect, dayColor, Font.systemFont( 22 ) );
			drawTextR( day, dayRect, dayColor, Font.systemFont( 22 ) );
		}
	}
	
	return min;
}

function drawTextR( text, rect, color, font ) {
	drawContext.setFont( font );
	drawContext.setTextColor( color );
	drawContext.drawTextInRect( new String( text ).toString(), rect );
}

function drawLine( point1, point2, width, color ) {
	const path = new Path();
	path.move( point1 );
	path.addLine( point2 );
	drawContext.addPath( path );
	drawContext.setStrokeColor( color );
	drawContext.setLineWidth( width );
	drawContext.strokePath();
}

function formatNumber( number ) {
	let tooBig = false;
	
	if ( shortenBigNumbers && number > 999 ) {
		tooBig = true;
	}
	
	// replace dot by comma
	number = number.toString().replace( '.', ',' );
	// add thousands separator
	number = number.replace( /\B(?=(\d{3})+(?!\d))/g, '.' );
	
	if ( tooBig ) {
		const thousandsSeparatorPosition = number.indexOf( '.' );
		
		number = number.replace( '.', ',' );
		number = number.substring( 0, thousandsSeparatorPosition + 2 ) + 'k';
	}
	
	return number;
}