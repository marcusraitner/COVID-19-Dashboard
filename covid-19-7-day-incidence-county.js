// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// Licence: Robert Koch-Institut (RKI), dl-de/by-2-0
//

const DAY_IN_MICROSECONDS = 86400000;

const widgetHeight = 338;
const widgetWidth = 720;
const graphLow = 0;
const graphHeight = 170;
const spaceBetweenDays = 47;
const bedsLineWidth = 10;
const vertLineWeight = 42;

// colors for incidence highlighting
const colorLow = new Color('#FAD643', 1); // < 50
const colorMed = new Color('#E8B365', 1); // < 100
const colorHigh = new Color('#DD5045', 1); // < 200
const colorUltra = new Color('#8E0000', 1); // >= 200

// other colors
const accentColor2 = Color.lightGray(); // used for weekends

// APIs
const apiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=GEN,EWZ,cases,death_rate,deaths,cases7_per_100k,cases7_bl_per_100k,BL,county&geometry=${ location.longitude.toFixed( 3 ) }%2C${ location.latitude.toFixed( 3 ) }&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

const apiUrlData = (county, minDate) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/Covid19_RKI_Sums/FeatureServer/0/query?where=Landkreis+LIKE+%27%25${ encodeURIComponent( county ) }%25%27+AND+Meldedatum+%3E+%27${ encodeURIComponent( minDate ) }%27&objectIds=&time=&resultType=none&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=Meldedatum&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=json&token=`;

const diviApiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=${ location.longitude.toFixed( 3 ) }%2C${ location.latitude.toFixed( 3 ) }&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

const stateToAbbr = {
  'Baden-Württemberg': 'BW',
  'Bayern': 'BY',
  'Berlin': 'BE',
  'Brandenburg': 'BB',
  'Bremen': 'HB',
  'Hamburg': 'HH',
  'Hessen': 'HE',
  'Mecklenburg-Vorpommern': 'MV',
  'Niedersachsen': 'NI',
  'Nordrhein-Westfalen': 'NRW',
  'Rheinland-Pfalz': 'RP',
  'Saarland': 'SL',
  'Sachsen': 'SN',
  'Sachsen-Anhalt': 'ST',
  'Schleswig-Holstein': 'SH',
  'Thüringen': 'TH'
};

let widget = await createWidget();
await widget.presentMedium();

Script.setWidget(widget);
Script.complete();

async function createWidget(items) {
  let location;
  const list = new ListWidget();

  let gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color("141414"),
    new Color("13233F")
  ];

  // list.backgroundColor = new Color('#191a1d', 1);
  list.backgroundGradient = gradient;
  list.setPadding(10, 10, 10, 10);

  // get current location or use given args
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
    } catch (e) {
      list.addText('Keine Ortsdaten gefunden');
      return list;
    }
  }

  // get data for current location
  const locationData = await new Request(apiUrl(location)).loadJSON();

  if (!locationData || !locationData.features || !locationData.features.length) {
    list.addText('Keine Ergebnisse für den aktuellen Ort gefunden.');
    return list;
  }

  const attr = locationData.features[0].attributes;

  // get data for ICU beds of current location
  const diviLocationData = await new Request(diviApiUrl(location)).loadJSON();

  if (!diviLocationData || !diviLocationData.features || !diviLocationData.features.length) {
    list.addText('Keine DIVI-Ergebnisse für den aktuellen Ort gefunden.');
    return list;
  }

  const diviAttr = diviLocationData.features[0].attributes;

  // extract information needed
  const cityName = attr.GEN; // name of 'Landkreis'
  const ewz = attr.EWZ / 100000; // number of inhabitants
  const county = attr.county; // Landkreis
  const bundesLand = stateToAbbr[attr.BL];
  const incidenceBl = Math.round(attr.cases7_bl_per_100k);
  const freeBeds = diviAttr.betten_frei;
  const beds = diviAttr.betten_gesamt;
  const usedBeds = diviAttr.betten_belegt;
  const cases = diviAttr.faelle_covid_aktuell;

  console.log(incidenceBl);

  // get data for the last 21 days
  const date = new Date();
  date.setTime(date.getTime() - 21 * DAY_IN_MICROSECONDS);
  const minDate = ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + '-' + date.getFullYear();

  const countyData = await new Request(apiUrlData(county, minDate)).loadJSON();

  if (!countyData || !countyData.features || !countyData.features.length) {
    list.addText('Keine Statistik gefunden.');
    return list;
  }

  let incidenceText = list.addText ('🦠 7-Tage-Inzidenz'.toUpperCase() + ' ' + county);
  incidenceText.font = Font.semiboldRoundedSystemFont(11);
  incidenceText.textColor = Color.white();
  list.addSpacer();

  let min, max, diff;

  // calculate incidence in place.
  for (let i = countyData.features.length - 1; i >= 6; i--) {
    let sum = 0;

    for (let j = 0; j < 7; j++) {
      sum += countyData.features[i - j].attributes.AnzahlFall;
    }

    sum /= ewz;
    countyData.features[i].attributes.AnzahlFall = Math.round(sum);
  }

  countyData.features.splice(0, 6);

  for (let i = 0; i < countyData.features.length; i++) {
    let aux = countyData.features[i].attributes.AnzahlFall;

    // min = (aux < min || min == undefined ? aux : min);
    max = (aux > max || max == undefined ? aux : max);
  }

  if (incidenceBl > max) {
    max = incidenceBl;
  }

  min = 0;
  diff = max - min;

  let graphDrawContext = new DrawContext();
  graphDrawContext.size = new Size (widgetWidth, graphHeight);
  graphDrawContext.opaque = false;
  graphDrawContext.setFont(Font.mediumSystemFont(22));
  graphDrawContext.setTextAlignedCenter();

  const graphTop = 23;
  const graphBottom = graphHeight - 23;
  const barHeight = graphBottom - graphTop;

  for (let i = 0; i < countyData.features.length; i++) {
    const day = (new Date(countyData.features[i].attributes.Meldedatum)).getDate();
    const dayOfWeek = (new Date(countyData.features[i].attributes.Meldedatum)).getDay();
    const cases = countyData.features[i].attributes.AnzahlFall;
    const delta = (cases - min) / diff;

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

    let path = new Path();
    let rect = new Rect(spaceBetweenDays * i, graphBottom - (barHeight * delta), vertLineWeight, barHeight * delta);
    path.addRoundedRect(rect, 4, 4);
    graphDrawContext.addPath(path);
    graphDrawContext.setFillColor(drawColor);
    graphDrawContext.fillPath();

    let dayColor;

    if (dayOfWeek == 0 || dayOfWeek == 6) {
      dayColor = accentColor2;
    } else {
      dayColor = Color.white();
    }

    const casesRect = new Rect(spaceBetweenDays * i, graphBottom - (barHeight * delta) - 28, vertLineWeight, 23);
    const dayRect = new Rect(spaceBetweenDays * i, graphBottom + 3, vertLineWeight, 23);

    drawTextR(graphDrawContext, cases, casesRect, dayColor, Font.mediumSystemFont(21));
    drawTextR(graphDrawContext, day, dayRect, dayColor, Font.mediumSystemFont(21));

    if (i == countyData.features.length - 1) {
      const delta = (incidenceBl - min) / diff;
      const y = graphBottom - (barHeight * delta);

      if (incidenceBl < 50) {
        drawColor = colorLow;
      } else if (incidenceBl < 100) {
        drawColor = colorMed;
      } else if (incidenceBl < 200) {
        drawColor = colorHigh;
      } else {
        drawColor = colorUltra;
      }

      let path = new Path();
      let rect = new Rect(spaceBetweenDays * (i + 1) + spaceBetweenDays / 3 + 2, graphBottom - (barHeight * delta), vertLineWeight - 2, barHeight * delta - 2);
      path.addRoundedRect(rect, 4, 4);
      graphDrawContext.addPath(path);
      graphDrawContext.setLineWidth(4);
      graphDrawContext.setStrokeColor(drawColor);
      graphDrawContext.strokePath();

      drawLine(graphDrawContext, new Point(spaceBetweenDays * i + vertLineWeight - 5, y), new Point(widgetWidth, y), 2, Color.white());
      const bundesLandRect = new Rect(spaceBetweenDays * (i + 1) + spaceBetweenDays / 3, y + 3, vertLineWeight, 23);
      drawTextR(graphDrawContext, bundesLand, bundesLandRect, dayColor, Font.mediumSystemFont(21));
      const bundesLandIncidenceRect = new Rect(spaceBetweenDays * (i + 1) + spaceBetweenDays / 3, y - 28, vertLineWeight, 23);
      drawTextR(graphDrawContext, incidenceBl, bundesLandIncidenceRect, dayColor, Font.mediumSystemFont(21));
    }
  }

  let graphImage = graphDrawContext.getImage();
  list.addImage(graphImage);
  list.addSpacer();

  let drawContext = new DrawContext();
  const bedsHeight = 80;
  const bedsWidth = graphImage.size.width;
  drawContext.size = new Size(bedsWidth, bedsHeight);
  drawContext.opaque = false;

  const freeBedsWidth = freeBeds / beds * bedsWidth;
  const covidBedsWidth = cases / beds * bedsWidth;

  // Line representing all beds
  let path = new Path();
  let bedsLineRect = new Rect(0, bedsHeight / 2 - bedsLineWidth / 2, bedsWidth, bedsLineWidth);
  path.addRoundedRect(bedsLineRect, 4, 4);
  drawContext.addPath(path);
  drawContext.setFillColor(new Color('#939598', 1));
  drawContext.fillPath();

  let bedsRect = new Rect(0, bedsHeight / 2 - 40, bedsWidth - freeBedsWidth - 10, 26);
  drawContext.setFont(Font.mediumSystemFont(22));
  drawContext.setTextColor(Color.white());
  drawContext.drawTextInRect('🛏 ' + beds + ' Intensivbetten'.toUpperCase(), bedsRect)

  // Portion representing free beds
  path = new Path();
  bedsLineRect = new Rect(bedsWidth - freeBedsWidth, bedsHeight / 2 - bedsLineWidth / 2, freeBedsWidth, bedsLineWidth);
  path.addRoundedRect(bedsLineRect, 4, 4);
  drawContext.addPath(path);
  drawContext.setFillColor(new Color('#4D8802', 1));
  drawContext.fillPath();

  drawLine(drawContext, new Point(bedsWidth - freeBedsWidth, bedsHeight / 2), new Point(bedsWidth - freeBedsWidth, bedsHeight / 2 - 35), 3, new Color('#4D8802', 1));
  drawContext.setFont(Font.mediumSystemFont(22));
  let freeRect = new Rect(0, bedsHeight / 2 - 35, bedsWidth - freeBedsWidth - 10, 22);
  drawContext.setTextAlignedRight();
  drawContext.drawTextInRect(freeBeds + ' frei', freeRect)

  // Portion representing covid patients
  path = new Path();
  bedsLineRect = new Rect(0, bedsHeight / 2 - bedsLineWidth / 2, covidBedsWidth, bedsLineWidth);
  path.addRoundedRect(bedsLineRect, 4, 4);
  drawContext.addPath(path);
  drawContext.setFillColor(new Color('#F6522E', 1));
  drawContext.fillPath();

  drawLine(drawContext, new Point(covidBedsWidth, bedsHeight / 2), new Point(covidBedsWidth, bedsHeight / 2 + 33), 3, new Color('#F6522E', 1));
  let covidRect = new Rect(covidBedsWidth + 10, bedsHeight / 2 + 10, bedsWidth - covidBedsWidth, 22);
  drawContext.setTextAlignedLeft();
  drawContext.drawTextInRect(cases + ' COVID-19', covidRect);

  list.addImage(drawContext.getImage());

  return list;
}

function drawTextR(drawContext, text, rect, color, font) {
  drawContext.setFont(font);
  drawContext.setTextColor(color);
  drawContext.drawTextInRect(new String(text).toString(), rect);
}

function drawLine(drawContext, point1, point2, width, color) {
  const path = new Path();
  path.move(point1);
  path.addLine(point2);
  drawContext.addPath(path);
  drawContext.setStrokeColor(color);
  drawContext.setLineWidth(width);
  drawContext.strokePath();
}
