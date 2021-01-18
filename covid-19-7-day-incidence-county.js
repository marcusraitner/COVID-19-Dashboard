// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// Licence: Robert Koch-Institut (RKI), dl-de/by-2-0
//

// ---------------------------
// do not edit after this line
// ---------------------------
const DAY_IN_MICROSECONDS = 86400000;
const lineWeight = 2;
const vertLineWeight = 36;
const accentColor1 = new Color('#33cc33', 1);
const accentColor2 = Color.lightGray();

// colors for incidence highlighting
const colorLow = new Color('#FAD643', 1); // < 50
const colorMed = new Color('#E8B365', 1); // < 100
const colorHigh = new Color('#DD5045', 1); // < 200
const colorUltra = new Color('#8E0000', 1); // >= 200

const apiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=GEN,EWZ,cases,death_rate,deaths,cases7_per_100k,cases7_bl_per_100k,BL,county&geometry=${ location.longitude.toFixed( 3 ) }%2C${ location.latitude.toFixed( 3 ) }&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

const diviApiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=${ location.longitude.toFixed( 3 ) }%2C${ location.latitude.toFixed( 3 ) }&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

const widgetHeight = 338;
const widgetWidth = 720;
const graphLow = 200;
const graphHeight = 100;
const spaceBetweenDays = 47.5;
const bedsGraphBaseline = 290;
const bedsPaddingLeft = 32;
const bedsPaddingRight = 32;
const bedsLineWidth = 12;


const saveIncidenceLatLon = (location) => {
  let fm = FileManager.iCloud();
  let path = fm.joinPath(fm.documentsDirectory(), 'covid19latlon.json');
  fm.writeString(path, JSON.stringify(location));
};

const getSavedIncidenceLatLon = () => {
  let fm = FileManager.iCloud();
  let path = fm.joinPath(fm.documentsDirectory(), 'covid19latlon.json');
  let data = fm.readString(path);
  return JSON.parse(data);
};

let drawContext = new DrawContext();
drawContext.size = new Size(widgetWidth, widgetHeight);
drawContext.opaque = false;

let widget = await createWidget();
widget.setPadding(0, 0, 0, 0);
widget.backgroundImage = (drawContext.getImage());
await widget.presentMedium();

Script.setWidget(widget);
Script.complete();

async function createWidget(items) {
  let location;

  if (args.widgetParameter) {
    console.log('get fixed lat/lon');
    const fixedCoordinates = args.widgetParameter.split(',').map(parseFloat);
    location = {
      latitude: fixedCoordinates[0],
      longitude: fixedCoordinates[1]
    };
  } else {
    Location.setAccuracyToThreeKilometers();
    try {
      location = await Location.current();
      console.log('get current lat/lon');
      saveIncidenceLatLon(location);
    } catch (e) {
      console.log('using saved lat/lon');
      location = getSavedIncidenceLatLon();
    }
  }

  const locationData = await new Request(apiUrl(location)).loadJSON();

  if (!locationData || !locationData.features || !locationData.features.length) {
    const errorList = new ListWidget();
    errorList.backgroundColor = new Color('#191a1d', 1);
    errorList.addText('Keine Ergebnisse für den aktuellen Ort gefunden.');
    return errorList;
  }

  const diviLocationData = await new Request(diviApiUrl(location)).loadJSON();

  if (!diviLocationData || !diviLocationData.features || !diviLocationData.features.length) {
    const errorList = new ListWidget();
    errorList.backgroundColor = new Color('#191a1d', 1);
    errorList.addText('Keine DIVI-Ergebnisse für den aktuellen Ort gefunden.');
    return errorList;
  }

  const attr = locationData.features[0].attributes;
  const diviAttr = diviLocationData.features[0].attributes;
  const cityName = attr.GEN;
  const ewz = attr.EWZ / 100000;
  const county = attr.county;
  const freeBeds = diviAttr.betten_frei;
  const beds = diviAttr.betten_gesamt;
  const usedBeds = diviAttr.betten_belegt;
  const cases = diviAttr.faelle_covid_aktuell;
  const list = new ListWidget();
  const date = new Date();
  date.setTime(date.getTime() - 21 * DAY_IN_MICROSECONDS);
  const minDate = ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + '-' + date.getFullYear();
  const apiUrlData = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/Covid19_RKI_Sums/FeatureServer/0/query?where=Landkreis+LIKE+%27%25${ encodeURIComponent( county ) }%25%27+AND+Meldedatum+%3E+%27${ encodeURIComponent( minDate ) }%27&objectIds=&time=&resultType=none&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=Meldedatum&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=json&token=`;

  const cityData = await new Request(apiUrlData).loadJSON();

  if (!cityData || !cityData.features || !cityData.features.length) {
    const errorList = new ListWidget();
    errorList.backgroundColor = new Color('#191a1d', 1);
    errorList.addText('Keine Statistik gefunden.');
    return errorList;
  }

  list.backgroundColor = new Color('#191a1d', 1);

  drawContext.setTextColor(Color.white());
  drawContext.setFont(Font.mediumSystemFont(26));
  drawContext.drawText('🦠 7-Tage-Inzidenz'.toUpperCase() + ' ' + cityName, new Point(25, 25));


  //  Draw graph for ICU beds
  const bedsRight = widgetWidth - bedsPaddingRight;
  const freeBedsWidth = (bedsRight / beds) * freeBeds;
  const covidBedsWidth = (bedsRight / beds) * cases;

  // Line representing all beds
  drawLine(new Point(bedsPaddingLeft, bedsGraphBaseline), new Point(bedsRight, bedsGraphBaseline), bedsLineWidth, new Color('#939598', 1));
  let bedsRect = new Rect(bedsPaddingLeft, bedsGraphBaseline - 40, bedsRight - freeBedsWidth - bedsPaddingLeft - 10, 26);
  drawContext.setFont(Font.mediumSystemFont(26));
  drawContext.drawTextInRect('🛏 ' + beds + ' Intensivbetten'.toUpperCase(), bedsRect)

  // Portion representing free beds
  drawLine(new Point(bedsRight - freeBedsWidth, bedsGraphBaseline), new Point(bedsRight, bedsGraphBaseline), bedsLineWidth, new Color('#4D8802', 1));
  drawLine(new Point(bedsRight - freeBedsWidth, bedsGraphBaseline), new Point(bedsRight - freeBedsWidth, bedsGraphBaseline - 2 * bedsLineWidth), 3, new Color('#4D8802', 1));
  drawContext.setFont(Font.mediumSystemFont(22));
  let freeRect = new Rect(bedsPaddingLeft, bedsGraphBaseline - 35, bedsRight - freeBedsWidth - bedsPaddingLeft - 10, 22);
  drawContext.setTextAlignedRight();
  drawContext.drawTextInRect(freeBeds + ' frei', freeRect)

  // Portion representing covid patients
  drawLine(new Point(bedsPaddingLeft, bedsGraphBaseline), new Point(bedsPaddingLeft + covidBedsWidth, bedsGraphBaseline), bedsLineWidth, new Color('#F6522E', 1));
  drawLine(new Point(bedsPaddingLeft + covidBedsWidth, bedsGraphBaseline), new Point(bedsPaddingLeft + covidBedsWidth, bedsGraphBaseline + 2 * bedsLineWidth), 3, new Color('#F6522E', 1));
  let covidRect = new Rect(bedsPaddingLeft + covidBedsWidth + 10, bedsGraphBaseline + 10, bedsRight - covidBedsWidth, 22);
  drawContext.setTextAlignedLeft();
  drawContext.drawTextInRect(cases + ' COVID-19', covidRect);

  // Draw incidence graph
  drawContext.setFont(Font.mediumSystemFont(22));
  drawContext.setTextAlignedCenter();

  let min, max, diff;

  // calculate incidence in place.
  for (let i = cityData.features.length - 1; i >= 6; i--) {
    let sum = 0;

    for (let j = 0; j < 7; j++) {
      sum += cityData.features[i - j].attributes.AnzahlFall;
    }

    sum /= ewz;
    cityData.features[i].attributes.AnzahlFall = Math.round(sum);
  }

  cityData.features.splice(0, 6);


  for (let i = 0; i < cityData.features.length; i++) {
    let aux = cityData.features[i].attributes.AnzahlFall;

    // min = (aux < min || min == undefined ? aux : min);
    max = (aux > max || max == undefined ? aux : max);
  }

  min = 0;
  diff = max - min;

  const highestIndex = cityData.features.length - 1;

  for (let i = 0, j = highestIndex; i < cityData.features.length; i++, j--) {
    const day = (new Date(cityData.features[i].attributes.Meldedatum)).getDate();
    const dayOfWeek = (new Date(cityData.features[i].attributes.Meldedatum)).getDay();
    const cases = cityData.features[i].attributes.AnzahlFall;
    const delta = (cases - min) / diff;

    // Vertical Line

    let drawColor;

    if (cases < 50) {
      drawColor = colorLow;
    } else if (cases < 100) {
      drawColor = colorMed;
    } else if (cases < 200) {
      drawColor = colorHigh;
    } else {
      drawColor = colorUltra;
    }

    const point1 = new Point(spaceBetweenDays * i + 50, graphLow - (graphHeight * delta));
    const point2 = new Point(spaceBetweenDays * i + 50, graphLow + 10);
    drawLine(point1, point2, vertLineWeight, drawColor);

    let dayColor;

    if (dayOfWeek == 0 || dayOfWeek == 6) {
      dayColor = accentColor2;
    } else {
      dayColor = Color.white();
    }

    const casesRect = new Rect(spaceBetweenDays * i + 20, (graphLow - 40) - (graphHeight * delta), 60, 23);
    const dayRect = new Rect(spaceBetweenDays * i + 27, graphLow + 15, 50, 23);

    drawTextR(cases, casesRect, dayColor, Font.systemFont(21));
    drawTextR(day, dayRect, dayColor, Font.systemFont(21));
  }

  return list;
}

function drawTextR(text, rect, color, font) {
  drawContext.setFont(font);
  drawContext.setTextColor(color);
  drawContext.drawTextInRect(new String(text).toString(), rect);
}

function drawLine(point1, point2, width, color) {
  const path = new Path();
  path.move(point1);
  path.addLine(point2);
  drawContext.addPath(path);
  drawContext.setStrokeColor(color);
  drawContext.setLineWidth(width);
  drawContext.strokePath();
}
