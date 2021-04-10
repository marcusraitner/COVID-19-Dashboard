// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// Licence: Robert Koch-Institut (RKI), dl-de/by-2-0
// Author: Marcus Raitner (https://fuehrung-erfahren.de)
// Source: https://gist.github.com/marcusraitner/a1b633625d1016498eaaab712461dfc4

//------------------------------------------------------------------------------
// General Options Section
//------------------------------------------------------------------------------

// Set to true for debugging information in the console
const debug = false;

// Set to true for an image background, false for no image.
const imageBackground = false;

// Set to true to reset the widget's background image.
const forceImageUpdate = false;

// colors for incidence highlighting
const colorNorm = new Color('#cccccf', 1) // < 35
const colorLow = new Color('#dea657', 1); // < 50//
const colorMed = new Color('#c9533c', 1); // < 100
const colorHigh = new Color('#b02c30', 1); // < 200
const colorUltra = new Color('#6d1d21', 1); // >= 200

// other colors
const accentColor2 = Color.lightGray(); // used for weekends
const bedsLineColor = new Color('#939598', 1);
const bedsLineFreeColor = new Color('#4D8802', 1);
const vaccinationColor = new Color('#00848C', 1);
const vaccinationBoosterColor = new Color('#004156', 1);

// Gradients
let vaccinationGradient = new LinearGradient();
vaccinationGradient.locations = [0, 0.2, 0.8, 1];
vaccinationGradient.colors = [
  new Color('#8C8C8C', 1),
  new Color('#535353', 1),
  new Color('#535353', 1),
  new Color('#8C8C8C', 1)

];

let backgroundGradient = new LinearGradient();
backgroundGradient.locations = [0, 0.2, 0.8, 1];
backgroundGradient.colors = [
  new Color("#28416F"),
  new Color("#141E30"),
  new Color("#141E30"),
  new Color("#28416F")
];
//------------------------------------------------------------------------------

const DAY_IN_MICROSECONDS = 86400000;

const widgetHeight = 338;
const widgetWidth = 720;
const graphLow = 0;
const graphHeight = 170;
const spaceBetweenDays = 47;
const bedsLineWidth = 12;
const vertLineWeight = 42;
const tickWidth = 4;

// APIs
const apiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=AGS,GEN,EWZ,EWZ_BL,cases,death_rate,deaths,cases7_per_100k,cases7_bl_per_100k,BL,county&geometry=${ location.longitude.toFixed( 3 ) }%2C${ location.latitude.toFixed( 3 ) }&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

const apiUrlData2 = (ags) => `https://api.corona-zahlen.org/districts/${ encodeURIComponent( ags ) }/history/cases/19`;

const apiUrlDistricts = `https://api.corona-zahlen.org/districts/`;

const diviApiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=${ location.longitude.toFixed( 3 ) }%2C${ location.latitude.toFixed( 3 ) }&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

const vaccUrl = `https://interaktiv.morgenpost.de/data/corona/rki-vaccination.json`;

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

  // If it's an image background, display it.
  if (imageBackground) {

    // Determine if our image exists and when it was saved.
    const files = FileManager.local()
    const path = files.joinPath(files.documentsDirectory(), "covid19-background-image")
    const exists = files.fileExists(path)

    // If it exists and an update isn't forced, use the cache.
    if (exists && (config.runsInWidget || !forceImageUpdate)) {
      list.backgroundImage = files.readImage(path)

      // If it's missing when running in the widget, use a gray background.
    } else if (!exists && config.runsInWidget) {
      list.backgroundGradient = backgroundGradient;

      // But if we're running in app, prompt the user for the image.
    } else {
      const img = await Photos.fromLibrary()
      list.backgroundImage = img
      files.writeImage(path, img)
    }

    // If it's not an image background, show the gradient.
  } else {
    list.backgroundGradient = backgroundGradient;
  }

  list.setPadding(0, 0, 0, 0);

  // get current location or use given args
  if (args.widgetParameter) {
    if (debug) {
      console.log('get fixed lat/lon');
    }

    const fixedCoordinates = args.widgetParameter.split(',').map(parseFloat);
    location = {
      latitude: fixedCoordinates[0],
      longitude: fixedCoordinates[1]
    };
  } else {
    Location.setAccuracyToThreeKilometers();
    try {
      location = await Location.current();

      if (debug) {
        console.log('get current lat/lon');
      }
    } catch (e) {
      errorText = list.addText('Keine Ortsdaten gefunden');
      errorText.textColor = Color.white();
      return list;
    }
  }

  if (debug) {
    console.log("Getting info for location: " + apiUrl(location));
  }

  // get data for current location
  const locationData = await new Request(apiUrl(location)).loadJSON();

  if (debug) {
    console.log(locationData);
  }

  if (!locationData || !locationData.features || !locationData.features.length) {
    errorText = list.addText('Keine Ergebnisse für den aktuellen Ort gefunden.');
    errorText.textColor = Color.white();
    console.log(locationData)
    return list;
  }

  const attr = locationData.features[0].attributes;

  if (debug) {
    console.log("Getting DIVI info for location: " + diviApiUrl(location));
  }

  // get data for ICU beds of current location
  const diviLocationData = await new Request(diviApiUrl(location)).loadJSON();

  if (debug) {
    console.log(diviLocationData);
  }

  if (!diviLocationData || !diviLocationData.features || !diviLocationData.features.length) {
    errorText = list.addText('Keine DIVI-Ergebnisse für den aktuellen Ort gefunden.');
    errorText.textColor = Color.white();
    console.log(diviLocationData);
    return list;
  }

  const diviAttr = diviLocationData.features[0].attributes;

  // extract information needed
  const cityName = attr.GEN; // name of 'Landkreis'
  let ags = attr.AGS; // Allgemeiner Gemeindeschlüssel
  const ewz = attr.EWZ / 100000; // number of inhabitants
  const ewzBL = attr.EWZ_BL
  const county = attr.county; // Landkreis
  const bundesLand = stateToAbbr[attr.BL];
  const bl = attr.BL;
  const incidenceBl = Math.round(attr.cases7_bl_per_100k);

  const freeBeds = (!diviAttr.betten_frei ? 0 : diviAttr.betten_frei);
  const beds = (!diviAttr.betten_gesamt ? 0 : diviAttr.betten_gesamt);
  const usedBeds = (!diviAttr.betten_belegt ? 0 : diviAttr.betten_belegt);
  const cases = (!diviAttr.faelle_covid_aktuell ? 0 : diviAttr.faelle_covid_aktuell);
  const casesBeatmet = (!diviAttr.faelle_covid_aktuell_beatmet ? 0 : diviAttr.faelle_covid_aktuell_beatmet);

  if (!ags) {
    const districtsData = await new Request(apiUrlDistricts).loadJSON();

    for (var index in districtsData.data) {
      if (county == districtsData.data[index].county) {
        ags = districtsData.data[index].ags;
      }
    }
  }

  if (debug) {
    console.log("Getting data for AGS: " + apiUrlData2(ags));
  }

  const countyData = await new Request(apiUrlData2(ags)).loadJSON();

  if (debug) {
    console.log(countyData);
  }

  if (!countyData || !countyData.data || !countyData.data[ags] || !countyData.data[ags].history.length) {
    list.addText('Keine Statistik gefunden.');
    return list;
  }

  let history = countyData.data[ags].history

  if (debug) {
    console.log("Getting vaccination data: " + vaccUrl);
  }

  const vaccData = await new Request(vaccUrl).loadJSON();

  if (debug) {
    console.log(vaccData);
  }

  if (!vaccData) {
    list.addText('Kein Impfstatus gefunden.');
    return list;
  }

  let quoteInitial = 0;
  let quoteBooster = 0;

  for (i = 0; i < vaccData.length; i++) {
    if (vaccData[i].name == bl) {
      quoteBooster = vaccData[i].cumsum2_latest;
      quoteInitial = vaccData[i].cumsum_latest - quoteBooster;
      quoteBooster = Math.round(quoteBooster * 1000 / ewzBL) / 10;
      quoteInitial = Math.round(quoteInitial * 1000 / ewzBL) / 10;
      break;
    }
  }

  let stack = list.addStack();
  stack.layoutHorizontally();
  stack.setPadding(0, 0, 0, 0);

  let leftStack = stack.addStack();
  leftStack.layoutVertically();
  leftStack.setPadding(7, 7, 7, 0);

  stack.addSpacer(10);

  let rightStack = stack.addStack();
  rightStack.setPadding(0, 0, 0, 0);
  rightStack.backgroundGradient = vaccinationGradient;
  rightStack.cornerRadius = 4;

  let incidenceText = leftStack.addText('🦠 7-Tage-Inzidenz'.toUpperCase() + ' – ' + county);
  incidenceText.font = Font.semiboldRoundedSystemFont(11);
  incidenceText.textColor = Color.white();
  leftStack.addSpacer();

  // Add vaccination status
  const vaccinationHeight = widgetHeight - 10;
  const vaccinationBottom = vaccinationHeight;
  const vaccinationWidth = 90;
  const vaccinationBarWidth = 20;

  let drawContext = new DrawContext();
  drawContext.size = new Size(vaccinationWidth, vaccinationHeight);
  drawContext.opaque = false;

  let vaccinationTextRect = new Rect(15, 10, vaccinationWidth - 10, 55);
  drawTextR(drawContext, '💉', vaccinationTextRect, Color.white(), Font.mediumSystemFont(50));

  vaccinationTextRect = new Rect(6, 5, vaccinationWidth - 10, 25);
  drawTextR(drawContext, bundesLand, vaccinationTextRect, Color.white(), Font.mediumSystemFont(22));

  let vaccinationRect = new Rect(0, (1 - quoteInitial / 100) * vaccinationBottom, vaccinationWidth, vaccinationBottom * quoteInitial / 100);
  drawRoundedRect(drawContext, vaccinationRect, vaccinationColor, 4);

  vaccinationTextRect = new Rect(10, (1 - quoteInitial / 100) * vaccinationBottom - 26, vaccinationWidth, 22);
  drawTextR(drawContext, quoteInitial + ' %', vaccinationTextRect, Color.white(), Font.regularSystemFont(22));

  let vaccinationBoosterRect = new Rect(0, (1 - quoteBooster / 100) * vaccinationBottom, vaccinationWidth, vaccinationBottom * quoteBooster / 100);
  drawRoundedRect(drawContext, vaccinationBoosterRect, vaccinationBoosterColor, 4);
  vaccinationTextRect = new Rect(10, (1 - quoteBooster / 100) * vaccinationBottom - 21, vaccinationWidth, 22);
  drawTextR(drawContext, quoteBooster + ' %', vaccinationTextRect, Color.white(), Font.regularSystemFont(22));

  drawLine(drawContext, new Point(1, 0), new Point(1, vaccinationHeight), 2, Color.lightGray());

  rightStack.addImage(drawContext.getImage());

  let min, max, diff;

  let dailyValues = new Array();

  for (let i = history.length - 1; i >= 6; i--) {
    dailyValues[i] = history[i].cases / ewz;

    let sum = 0;

    for (let j = 0; j < 7; j++) {
      sum += history[i - j].cases;
    }

    sum /= ewz;
    history[i].cases = Math.round(sum);
  }

  history.splice(0, 6);
  dailyValues.splice(0, 6);


  for (let i = 0; i < history.length; i++) {
    let aux = history[i].cases;

    max = (aux > max || max == undefined ? aux : max);
  }

  if (incidenceBl > max) {
    max = incidenceBl;
  }

  min = 0;
  diff = max - min;

  let graphDrawContext = new DrawContext();
  graphDrawContext.size = new Size(widgetWidth - spaceBetweenDays, graphHeight);
  graphDrawContext.opaque = false;
  graphDrawContext.setFont(Font.mediumSystemFont(22));
  graphDrawContext.setTextAlignedCenter();

  const graphTop = 23;
  const graphBottom = graphHeight - 23;
  const barHeight = graphBottom - graphTop;

  for (let i = 0; i < history.length; i++) {
    const day = (new Date(history[i].date)).getDate();
    const dayOfWeek = (new Date(history[i].date)).getDay();
    const cases = history[i].cases;
    const delta = (cases - min) / diff;

    let drawColor;

    const casesRect = new Rect(spaceBetweenDays * i, graphBottom - (barHeight * delta) - 28, vertLineWeight, 23);
    const dayRect = new Rect(spaceBetweenDays * i, graphBottom + 3, vertLineWeight, 23);

    let dayColor;

    if (dayOfWeek == 0 || dayOfWeek == 6) {
      dayColor = accentColor2;
    } else {
      dayColor = Color.white();
    }

    if (i == history.length - 1) {

      const delta = (incidenceBl - min) / diff;
      const y = graphBottom - (barHeight * delta);
      const x1 = spaceBetweenDays * (i + 1) + spaceBetweenDays / 3;

      let x0;

      if (y >= casesRect.origin.y - 5 && y <= casesRect.origin.y + casesRect.height + 5) {
        x0 = spaceBetweenDays * i + vertLineWeight;
      } else {
        x0 = spaceBetweenDays * i
      }

      if (incidenceBl < 50) {
        drawColor = colorLow;
      } else if (incidenceBl < 100) {
        drawColor = colorMed;
      } else if (incidenceBl < 200) {
        drawColor = colorHigh;
      } else {
        drawColor = colorUltra;
      }

      let rect = new Rect(spaceBetweenDays * i + 2, graphBottom - (barHeight * delta), widgetWidth - spaceBetweenDays * (i + 1) - 4, barHeight * delta - 2);

      drawRoundedRect(graphDrawContext, rect, new Color("#000000", .4), 4);
      let path = new Path();

      path.addRoundedRect(rect, 4, 4);
      graphDrawContext.addPath(path);
      graphDrawContext.setLineWidth(4);
      graphDrawContext.setStrokeColor(drawColor);
      graphDrawContext.strokePath();

      const bundesLandRect = new Rect(x1, y + 3, vertLineWeight, 23);
      drawTextR(graphDrawContext, bundesLand, bundesLandRect, dayColor, Font.mediumSystemFont(21));
      const bundesLandIncidenceRect = new Rect(x1, y - 28, vertLineWeight, 23);
      drawTextR(graphDrawContext, incidenceBl, bundesLandIncidenceRect, dayColor, Font.mediumSystemFont(21));
    }

    if (cases < 35) {
      drawColor = colorNorm;
    } else if (cases < 50) {
      drawColor = colorLow;
    } else if (cases < 100) {
      drawColor = colorMed;
    } else if (cases < 200) {
      drawColor = colorHigh;
    } else {
      drawColor = colorUltra;
    }


    let rect = new Rect(spaceBetweenDays * i, graphBottom - (barHeight * delta), vertLineWeight, barHeight * delta);
    drawRoundedRect(graphDrawContext, rect, drawColor, 4);

    const dailyDelta = (dailyValues[i] - min) / diff;
    rect = new Rect(spaceBetweenDays * i, graphBottom - (barHeight * dailyDelta), vertLineWeight, barHeight * dailyDelta);

    drawRoundedRect(graphDrawContext, rect, new Color("#FFFFFF", .4), 4);

    drawTextR(graphDrawContext, cases, casesRect, dayColor, Font.mediumSystemFont(21));
    drawTextR(graphDrawContext, day, dayRect, dayColor, Font.mediumSystemFont(21));

  }

  let graphImage = graphDrawContext.getImage();
  leftStack.addImage(graphImage);
  leftStack.addSpacer();

  drawContext = new DrawContext();
  const bedsHeight = 80;
  const bedsWidth = graphImage.size.width - 30;
  drawContext.size = new Size(bedsWidth, bedsHeight);
  drawContext.opaque = false;

  let freeBedsWidth = freeBeds / beds * bedsWidth;
  let covidBedsWidth = cases / beds * bedsWidth;
  let beatmetBedsWidth = casesBeatmet / beds * bedsWidth;

  freeBedsWidth = (!freeBedsWidth ? tickWidth / 2 : freeBedsWidth);
  covidBedsWidth = (!covidBedsWidth ? tickWidth / 2 : covidBedsWidth);
  beatmetBedsWidth = (!beatmetBedsWidth ? tickWidth / 2 : beatmetBedsWidth);

  // Line representing all beds
  let bedsLineRect = new Rect(0, bedsHeight / 2 - bedsLineWidth / 2, bedsWidth, bedsLineWidth);
  drawRoundedRect(drawContext, bedsLineRect, bedsLineColor, 2)

  let bedsRect = new Rect(0, bedsHeight / 2 - 40, bedsWidth - freeBedsWidth - 10, 26);
  drawContext.setFont(Font.mediumSystemFont(22));
  drawContext.setTextColor(Color.white());
  drawContext.drawTextInRect('🛏' + 'Intensivbetten'.toUpperCase() + ': ' + beds, bedsRect)

  // Portion representing free beds
  bedsLineRect = new Rect(bedsWidth - freeBedsWidth, bedsHeight / 2 - bedsLineWidth / 2, freeBedsWidth, bedsLineWidth);

  drawRoundedRect(drawContext, bedsLineRect, bedsLineFreeColor, 2);

  drawLine(drawContext, new Point(bedsWidth - freeBedsWidth, bedsHeight / 2 + bedsLineWidth / 2 + 5), new Point(bedsWidth - freeBedsWidth, bedsHeight / 2 - 40), tickWidth, new Color('#4D8802', 1));
  drawContext.setFont(Font.mediumSystemFont(22));
  let freeRect = new Rect(0, bedsHeight / 2 - 35, bedsWidth - freeBedsWidth - 10, 22);
  drawContext.setTextAlignedRight();
  drawContext.drawTextInRect('frei'.toUpperCase() + ': ' + freeBeds, freeRect)

  // Portion representing covid patients
  bedsLineRect = new Rect(0, bedsHeight / 2 - bedsLineWidth / 2, covidBedsWidth, bedsLineWidth);
  drawRoundedRect(drawContext, bedsLineRect, colorHigh, 2);

  drawLine(drawContext, new Point(covidBedsWidth, bedsHeight / 2 - bedsLineWidth / 2 - 5), new Point(covidBedsWidth, bedsHeight / 2 + 38), tickWidth, colorHigh);

  // Portion representing cases beatmet
  bedsLineRect = new Rect(0, bedsHeight / 2 - bedsLineWidth / 2, beatmetBedsWidth, bedsLineWidth);
  drawRoundedRect(drawContext, bedsLineRect, colorUltra, 2);

  drawLine(drawContext, new Point(beatmetBedsWidth, bedsHeight / 2 - bedsLineWidth / 2 - 5), new Point(beatmetBedsWidth, bedsHeight / 2 + 20), tickWidth, colorUltra);

  let covidRect = new Rect(covidBedsWidth + 10, bedsHeight / 2 + 10, bedsWidth - covidBedsWidth, 22);
  drawContext.setTextAlignedLeft();
  drawContext.drawTextInRect('🦠COVID-19: ' + cases + ' (davon ' + casesBeatmet + ' beatmet)', covidRect);

  leftStack.addImage(drawContext.getImage());
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

function drawRoundedRect(drawContext, rect, color, radius) {
  const path = new Path();
  path.addRoundedRect(rect, radius, radius);
  drawContext.addPath(path);
  drawContext.setFillColor(color);
  drawContext.fillPath();
}
