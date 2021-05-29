// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// Licence: GNU GENERAL PUBLIC LICENSE, Version 3, 29 June 2007
// Author: Marcus Raitner (https://fuehrung-erfahren.de)
// Source: https://github.com/marcusraitner/COVID-19-Dashboard
// Version: 1.8.0b
// ## Changelog
// * 1.0.1: Correction of layout of label for covid-beds
// * 1.0.2: Bug-Fix for Saar-Pfalz-Kreis (using GEN instead of county for join)
// * 1.0.3: Bug-Fix for Landsberg a. Lech (now using both GEN and county)
// * 1.0.4: Bug-Fix. Now using AGS for join (county and GEN only as backup)
// * 1.1.0: New API for vaccinations
// * 1.2.0: New colors and a new step for incidence 165
// * 1.3.0: New feature: Show also incidence for Germany with "showGermanyValue = true"
// * 1.4.0: New feature: R-Value for Germany. Bugfix for date of incidence
// * 1.5.0: Handling of parameters enhanced; see README for full reference
// * 1.6.0: New feature: Use frozen values of RKI
// * 1.7.0: New feature: Show one decimal (optional); improved rounding; minor visual improvements.

const version = "1.8.0b"

//------------------------------------------------------------------------------
// General Options Section
//------------------------------------------------------------------------------

// Set to true for debugging information in the console
const debug = false;

// Set to true for an image background, false for no image.
const imageBackground = false;

// Set to true to reset the widget's background image.
const forceImageUpdate = false;

// Show also the incidence for Germany in total
var showGermanyValue = false;

// Show also the R-Value (only if showGermanyValue == true)
var showRValue = true;

// Toggle showing of vaccination status
var showVaccination = true;

// Toggle showing of ICU beds
var showIcu = true;

// use rki calculation scheme
var rki = false;

// show daily portion of incidence
var showDaily = true;

// Show frozen value for incidence instead of calculating it.
var useFrozen = false;

// Show one decimal place
var showDecimal = false;

// palette found here: https://coolors.co/03071e-370617-6a040f-9d0208-d00000-dc2f02-e85d04-f48c06-faa307-ffba08
const incidenceColors = [{
    lower: 0,
    color: new Color('#cccccf', 1)
  },
  {
    lower: 35,
    color: new Color('#FFBA08', 1)
  },
  {
    lower: 50,
    color: new Color('#F48C06', 1)
  },
  {
    lower: 100,
    color: new Color('#E85D04', 1)
  },
  {
    lower: 165,
    color: new Color('#DC2F02', 1)
  },
  {
    lower: 200,
    color: new Color('#9D0208', 1)
  }
];

// colors for covid beds highlighting
const colorCovidBed = new Color('#DC2F02', 1);
const colorCovidBedVentilation = new Color('#9D0208', 1);
const bedsLineColor = new Color('#939598', 1);
const bedsLineFreeColor = new Color('#4D8802', 1);

// other colors
const accentColor2 = Color.lightGray(); // used for weekends
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
const bedsLineWidth = 12;
const tickWidth = 4;
const vaccinationWidth = 65;
var spaceBetweenDays = 50;
var vertLineWeight = 45;

// APIs
const apiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=GEN,AGS,EWZ,EWZ_BL,cases,death_rate,deaths,cases7_per_100k,cases7_bl_per_100k,BL,county&geometry=${ location.longitude.toFixed( 3 ) }%2C${ location.latitude.toFixed( 3 ) }&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

const apiUrlData = (county, minDate) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/Covid19_RKI_Sums/FeatureServer/0/query?where=Landkreis+LIKE+%27%25${ encodeURIComponent( county ) }%25%27+AND+Meldedatum+%3E+%27${ encodeURIComponent( minDate ) }%27&objectIds=&time=&resultType=none&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=Meldedatum&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=json&token=`;

const apiUrlData2 = (ags, minDate) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/Covid19_RKI_Sums/FeatureServer/0/query?where=idLandkreis%3D+${ encodeURIComponent( ags ) }+AND+Meldedatum+%3E+%27${ encodeURIComponent( minDate ) }%27&objectIds=&time=&resultType=none&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=Meldedatum&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=json&token=`;

const diviApiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=${ location.longitude.toFixed( 3 ) }%2C${ location.latitude.toFixed( 3 ) }&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

const vaccUrl = `https://api.corona-zahlen.org/vaccinations`;

const germanyUrl = `https://api.corona-zahlen.org/germany`;

const apiUrlDistricts = `https://api.corona-zahlen.org/districts/`;

const apiUrlDataFrozen = (ags, days) => `https://api.corona-zahlen.org/districts/${ encodeURIComponent( ags ) }/history/frozen-incidence/${ encodeURIComponent( days ) }`;

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
  'Nordrhein-Westfalen': 'NW',
  'Rheinland-Pfalz': 'RP',
  'Saarland': 'SL',
  'Sachsen': 'SN',
  'Sachsen-Anhalt': 'ST',
  'Schleswig-Holstein': 'SH',
  'Thüringen': 'TH'
};

const rulesUrl = {
  'Baden-Württemberg': 'https://www.baden-wuerttemberg.de/de/service/aktuelle-infos-zu-corona/',
  'Bayern': 'https://www.bayern.de/coronavirus-in-bayern-informationen-auf-einen-blick/',
  'Berlin': 'https://www.berlin.de/corona/',
  'Brandenburg': 'https://kkm.brandenburg.de/kkm/de/',
  'Bremen': 'https://www.bremen.de/corona',
  'Hamburg': 'https://www.hamburg.de/coronavirus/',
  'Hessen': 'https://www.hessen.de/fuer-buerger/aktuelle-informationen-zu-corona-hessen',
  'Mecklenburg-Vorpommern': 'https://www.regierung-mv.de/corona/',
  'Niedersachsen': 'https://www.niedersachsen.de/Coronavirus',
  'Nordrhein-Westfalen': 'https://www.land.nrw/corona',
  'Rheinland-Pfalz': 'https://corona.rlp.de/de/startseite/',
  'Saarland': 'https://corona.saarland.de/DE/home/home_node.html',
  'Sachsen': 'https://www.coronavirus.sachsen.de/index.html',
  'Sachsen-Anhalt': 'https://coronavirus.sachsen-anhalt.de/',
  'Schleswig-Holstein': 'https://www.schleswig-holstein.de/DE/Schwerpunkte/Coronavirus/coronavirus_node.html;jsessionid=8651006488D177B24833E4A56502FC06.delivery1-master',
  'Thüringen': 'https://corona.thueringen.de/'
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

  // Parse parameters
  if (args.widgetParameter) {
    const params = args.widgetParameter.split(';');

    for (var i = 0; i < params.length; i++) {
      const p = params[i].split('=');
      if (p[0].trim().toLowerCase() == "loc") {
        const fixedCoordinates = p[1].split(',').map(parseFloat);
        location = {
          latitude: fixedCoordinates[0],
          longitude: fixedCoordinates[1]
        };
      } else if (p[0].trim().toLowerCase() == "de") {
        if (p[1].trim().toLowerCase() == "y") {
          showGermanyValue = true;
        } else {
          showGermanyValue = false;
        }
      } else if (p[0].trim().toLowerCase() == "rval") {
        if (p[1].trim().toLowerCase() == "y") {
          showRValue = true;
        } else {
          showRValue = false;
        }
      } else if (p[0].trim().toLowerCase() == "vac") {
        if (p[1].trim().toLowerCase() == "y") {
          showVaccination = true;
        } else {
          showVaccination = false;
        }
      } else if (p[0].trim().toLowerCase() == "beds") {
        if (p[1].trim().toLowerCase() == "y") {
          showIcu = true;
        } else {
          showIcu = false;
        }
      } else if (p[0].trim().toLowerCase() == "rki") {
        if (p[1].trim().toLowerCase() == "y") {
          rki = true;
        } else {
          rki = false;
        }
      } else if (p[0].trim().toLowerCase() == "daily") {
        if (p[1].trim().toLowerCase() == "y") {
          showDaily = true;
        } else {
          showDaily = false;
        }
      } else if (p[0].trim().toLowerCase() == "frozen") {
        if (p[1].trim().toLowerCase() == "y") {
          useFrozen = true;
        } else {
          useFrozen = false;
        }
      } else if (p[0].trim().toLowerCase() == "decimal") {
        if (p[1].trim().toLowerCase() == "y") {
          showDecimal = true;
        } else {
          showDecimal = false;
        }
      } else if (p.length == 1) {
        // for compatability with old syntax
        const fixedCoordinates = p[0].split(',').map(parseFloat);
        location = {
          latitude: fixedCoordinates[0],
          longitude: fixedCoordinates[1]
        };
      }
    }
  }

  if (!location) {
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

  var germanyData = null;

  if (showGermanyValue) {
    if (debug) {
      console.log("Getting data for Germany: " + germanyUrl);
    }

    germanyData = await new Request(germanyUrl).loadJSON();

    if (debug) {
      console.log(germanyData);
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

  // extract information needed
  const cityName = attr.GEN; // name of 'Landkreis'
  const ewz = attr.EWZ / 100000; // number of inhabitants
  const ewzBL = attr.EWZ_BL
  const county = attr.county; // Landkreis
  const gen = attr.GEN;
  var ags = attr.AGS;
  const bundesLand = stateToAbbr[attr.BL];
  const bl = attr.BL;
  const incidenceBl = roundIncidence(attr.cases7_bl_per_100k);
  const latestIncidence = attr.cases7_per_100k;

  // Adjust width of bars for a decimal place
  if (showDecimal) {
    spaceBetweenDays += 13;
    vertLineWeight += 13;
  }

  // get data for the last days
  var days = 20;

  if (showGermanyValue) {
    days -= 1;
  }

  // Adjust number of days for showing decimal
  if (showDecimal) {
    days -= 3;
  }

  const date = new Date();
  date.setTime(date.getTime() - days * DAY_IN_MICROSECONDS);
  const minDate = ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + '-' + date.getFullYear();

  let countyData;
  let updated;

  if (useFrozen) {
    if (!ags) {
      if (debug) {
        console.log("ags not set,looking it up with: " + apiUrlDistricts);
      }

      const districts = await new Request(apiUrlDistricts).loadJSON();

      if (debug) {
        console.log(districts);
      }

      for (var district in districts.data) {
        if (districts.data[district].county == county) {
          ags = districts.data[district].ags;
          if (debug) {
            console.log("Found ags: " + ags);
          }
          break;
        }
      }
    }

    if (debug) {
      console.log("Getting frozen data for ags: " + apiUrlDataFrozen(ags, days));
    }

    countyData = await new Request(apiUrlDataFrozen(ags, days - 7)).loadJSON();

    if (debug) {
      console.log(countyData);
    }

    if (!countyData || !countyData.data || !countyData.data[ags].history || !countyData.data[ags].history.length) {
      list.addText('Keine Statistik gefunden.');
      return list;
    }

    updated = new Date(countyData.meta.lastUpdate);

  } else {
    if (ags) {
      if (debug) {
        console.log("Getting data for ags: " + apiUrlData2(ags, minDate));
      }

      countyData = await new Request(apiUrlData2(ags, minDate)).loadJSON();

      if (debug) {
        console.log(countyData);
      }

    } else {
      if (debug) {
        console.log("Getting data for county: " + apiUrlData(gen, minDate));
      }

      countyData = await new Request(apiUrlData(gen, minDate)).loadJSON();

      if (debug) {
        console.log(countyData);
      }

      if (!countyData || !countyData.features || !countyData.features.length) {

        if (debug) {
          console.log("Getting data for county: " + apiUrlData(county, minDate));
        }

        countyData = await new Request(apiUrlData(county, minDate)).loadJSON();

        if (debug) {
          console.log(countyData);
        }
      }
    }

    if (!countyData || !countyData.features || !countyData.features.length) {
      list.addText('Keine Statistik gefunden.');
      return list;
    }

    tmp = countyData.features[0].attributes.Datenstand.replace(" Uhr", "").split(",");
    tmpDate = tmp[0].split(".");
    tmpTime = tmp[1].split(":");

    updated = new Date(tmpDate[2], tmpDate[1] - 1, tmpDate[0], tmpTime[0], tmpTime[1]);
  }

  let stack = list.addStack();
  stack.layoutHorizontally();
  stack.setPadding(0, 0, 0, 0);

  let leftStack = stack.addStack();
  leftStack.layoutVertically();

  let incidenceText = leftStack.addText('🦠 7-Tage-Inzidenz'.toUpperCase() + ' – ' + county);
  incidenceText.font = Font.semiboldRoundedSystemFont(11);
  incidenceText.textColor = Color.white();
  incidenceText.url = rulesUrl[attr.BL];

  leftStack.addSpacer();

  if (showVaccination) {
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

    let quoteInitial = Math.round(vaccData.data.states[bundesLand].quote * 100);
    let quoteBooster = Math.round(vaccData.data.states[bundesLand].secondVaccination.quote * 100);

    leftStack.setPadding(7, 7, 2, 0);
    stack.addSpacer(10);

    let rightStack = stack.addStack();
    rightStack.setPadding(0, 0, 0, 0);
    rightStack.backgroundGradient = vaccinationGradient;
    rightStack.cornerRadius = 4;

    // Add vaccination status
    const vaccinationHeight = widgetHeight - 10;
    const vaccinationBottom = vaccinationHeight;
    const vaccinationBarWidth = 20;

    let drawContext = new DrawContext();
    drawContext.size = new Size(vaccinationWidth, vaccinationHeight);
    drawContext.opaque = false;

    let vaccinationTextRect = new Rect(10, 15, vaccinationWidth - 10, 55);
    drawTextR(drawContext, '💉', vaccinationTextRect, Color.white(), Font.mediumSystemFont(40));

    vaccinationTextRect = new Rect(6, 5, vaccinationWidth - 10, 25);
    drawTextR(drawContext, bundesLand, vaccinationTextRect, Color.white(), Font.mediumSystemFont(22));
    let vaccinationRect = new Rect(0, (1 - quoteInitial / 100) * vaccinationBottom, vaccinationWidth, vaccinationBottom * quoteInitial / 100);
    drawRoundedRect(drawContext, vaccinationRect, vaccinationColor, 4);

    vaccinationTextRect = new Rect(10, (1 - quoteInitial / 100) * vaccinationBottom - 26, vaccinationWidth, 22);
    drawTextR(drawContext, quoteInitial + ' %', vaccinationTextRect, Color.white(), Font.regularSystemFont(22));

    let vaccinationBoosterRect = new Rect(0, (1 - quoteBooster / 100) * vaccinationBottom, vaccinationWidth, vaccinationBottom * quoteBooster / 100);
    drawRoundedRect(drawContext, vaccinationBoosterRect, vaccinationBoosterColor, 4);
    vaccinationTextRect = new Rect(10, (1 - quoteBooster / 100) * vaccinationBottom - 26, vaccinationWidth, 22);
    drawTextR(drawContext, quoteBooster + ' %', vaccinationTextRect, Color.white(), Font.regularSystemFont(22));

    drawLine(drawContext, new Point(1, 0), new Point(1, vaccinationHeight), 2, Color.lightGray());

    rightStack.addImage(drawContext.getImage());
  } else {
    leftStack.setPadding(7, 7, 7, 7);
  }

  let min, max, diff;

  let dailyValues = new Array();
  let history = new Array();

  if (useFrozen) {
    history = countyData.data[ags].history;

    // add the latest incidence in case if we miss the value for today
    if (!isToday(new Date(history[history.length - 1].date))) {
      const today = {
        weekIncidence: latestIncidence,
        date: new Date()
      };

      history.push(today);
    }
  } else {
    for (let i = countyData.features.length - 1; i >= 6; i--) {
      dailyValues[i - 6] = countyData.features[i].attributes.AnzahlFall / ewz;

      let sum = 0;

      for (let j = 0; j < 7; j++) {
        sum += countyData.features[i - j].attributes.AnzahlFall;
      }

      sum /= ewz;

      history[i - 6] = {
        weekIncidence: sum,
        date: countyData.features[i].attributes.Meldedatum
      };
    }
  }

  for (let i = 0; i < history.length; i++) {
    history[i].weekIncidence = roundIncidence(history[i].weekIncidence);
    let aux = history[i].weekIncidence;
    max = (aux > max || max == undefined ? aux : max);
  }

  if (incidenceBl > max) {
    max = incidenceBl;
  }

  if (showGermanyValue && germanyData.weekIncidence > max) {
    max = germanyData.weekIncidence;
  }

  min = 0;
  diff = max - min;

  let graphDrawContext = new DrawContext();
  graphDrawContext.size = new Size(widgetWidth, graphHeight);
  graphDrawContext.opaque = false;
  graphDrawContext.setFont(Font.mediumSystemFont(22));
  graphDrawContext.setTextAlignedCenter();

  const graphTop = 23;
  const graphBottom = graphHeight - 23;
  const barHeight = graphBottom - graphTop;

  for (let i = 0; i < history.length; i++) {
    let date = new Date(history[i].date);
    if (rki && !useFrozen) {
      date.setDate(date.getDate() + 1);
    }

    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const cases = history[i].weekIncidence;
    const delta = (cases - min) / diff;

    let drawColor;
    let dayColor;

    if (dayOfWeek == 0 || dayOfWeek == 6) {
      dayColor = accentColor2;
    } else {
      dayColor = Color.white();
    }

    if (i == history.length - 1) {
      if (showGermanyValue) {
        germanyData.weekIncidence = roundIncidence(germanyData.weekIncidence);
        const delta = (germanyData.weekIncidence - min) / diff;
        const y = graphBottom - (barHeight * delta);
        const x = widgetWidth - vertLineWeight;

        // draw rect in grey
        let rect = new Rect(x, y, vertLineWeight, barHeight * delta);
        drawRoundedRect(graphDrawContext, rect, new Color("#6c757d", 1), 4);

        // draw border in color of incidence
        drawColor = getColor(germanyData.weekIncidence);
        rect = new Rect(x + 2, y + 2, vertLineWeight - 4, barHeight * delta - 4);
        let path = new Path();
        path.addRoundedRect(rect, 4, 4);
        graphDrawContext.addPath(path);
        graphDrawContext.setLineWidth(4);
        graphDrawContext.setStrokeColor(drawColor);
        graphDrawContext.strokePath();

        // draw labels
        const bundesLandRect = new Rect(x, y + 4, vertLineWeight, 23);
        drawTextR(graphDrawContext, "DE", bundesLandRect, dayColor, Font.mediumSystemFont(21));
        const bundesLandIncidenceRect = new Rect(x, y - 28, vertLineWeight, 23);
        drawTextR(graphDrawContext, formatIncidence(germanyData.weekIncidence), bundesLandIncidenceRect, dayColor, Font.mediumSystemFont(21));

        // draw R-value (if set)
        if (showRValue) {
          let rRect = new Rect(x - 20, graphBottom + 1, vertLineWeight + 20, 23);
          drawTextR(graphDrawContext, "R:" + Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(germanyData.r.value), rRect, dayColor, Font.mediumSystemFont(21));
          // rRect = new Rect(x - 20, graphBottom - 28, vertLineWeight, 23);
          // drawTextR(graphDrawContext, "R", rRect, dayColor, Font.mediumSystemFont(21));
        }
      }

      // Now draw the bar for the Bundesland
      const delta = (incidenceBl - min) / diff;
      const y = graphBottom - (barHeight * delta);
      const x1 = spaceBetweenDays * (i + 1) + spaceBetweenDays / 3;
      const x = (showGermanyValue ? widgetWidth - vertLineWeight - spaceBetweenDays : widgetWidth - vertLineWeight);

      // draw bar in grey
      let rect = new Rect(x, y, vertLineWeight, barHeight * delta);
      drawRoundedRect(graphDrawContext, rect, new Color("#343a40", 1), 4);

      // draw border in color of incidence
      drawColor = getColor(incidenceBl);
      rect = new Rect(x + 2, y + 2, vertLineWeight - 4, barHeight * delta - 4);
      path = new Path();
      path.addRoundedRect(rect, 4, 4);
      graphDrawContext.addPath(path);
      graphDrawContext.setLineWidth(4);
      graphDrawContext.setStrokeColor(drawColor);
      graphDrawContext.strokePath();

      // Draw labels
      const bundesLandRect = new Rect(x, y + 4, vertLineWeight, 23);
      drawTextR(graphDrawContext, bundesLand, bundesLandRect, dayColor, Font.mediumSystemFont(21));
      const bundesLandIncidenceRect = new Rect(x, y - 28, vertLineWeight, 23);
      drawTextR(graphDrawContext, formatIncidence(incidenceBl), bundesLandIncidenceRect, dayColor, Font.mediumSystemFont(21));
    }

    // Draw bar
    drawColor = getColor(cases);
    let rect = new Rect(spaceBetweenDays * i, graphBottom - (barHeight * delta), vertLineWeight, barHeight * delta);
    drawRoundedRect(graphDrawContext, rect, drawColor, 4);

    // draw daily cases (if set)
    if (showDaily && !useFrozen) {
      const dailyDelta = (dailyValues[i] - min) / diff;
      rect = new Rect(spaceBetweenDays * i, graphBottom - (barHeight * dailyDelta), vertLineWeight, barHeight * dailyDelta);
      drawRoundedRect(graphDrawContext, rect, new Color("#FFFFFF", .4), 4);
    }

    // Draw labels
    const casesRect = new Rect(spaceBetweenDays * i, graphBottom - (barHeight * delta) - 28, vertLineWeight, 23);
    drawTextR(graphDrawContext, formatIncidence(cases), casesRect, dayColor, Font.mediumSystemFont(21));
    const dayRect = new Rect(spaceBetweenDays * i, graphBottom + 1, vertLineWeight, 23);
    drawTextR(graphDrawContext, day, dayRect, dayColor, Font.mediumSystemFont(21));

  }

  let graphImage = graphDrawContext.getImage();
  leftStack.addImage(graphImage);
  leftStack.addSpacer();

  if (showIcu) {
    // Get data for icu beds

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

    // extract data needed
    const freeBeds = (!diviAttr.betten_frei ? 0 : diviAttr.betten_frei);
    const beds = (!diviAttr.betten_gesamt ? 0 : diviAttr.betten_gesamt);
    const usedBeds = (!diviAttr.betten_belegt ? 0 : diviAttr.betten_belegt);
    const cases = (!diviAttr.faelle_covid_aktuell ? 0 : diviAttr.faelle_covid_aktuell);
    const casesBeatmet = (!diviAttr.faelle_covid_aktuell_beatmet ? 0 : diviAttr.faelle_covid_aktuell_beatmet);

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

    if (freeBedsWidth > bedsWidth / 2) {
      freeRect = new Rect(bedsWidth - freeBedsWidth + 10, bedsHeight / 2 - 35, freeBedsWidth - 10, 22);
      drawContext.setTextAlignedLeft();
    }

    drawContext.drawTextInRect('frei'.toUpperCase() + ': ' + freeBeds, freeRect)

    // Portion representing covid patients
    bedsLineRect = new Rect(0, bedsHeight / 2 - bedsLineWidth / 2, covidBedsWidth, bedsLineWidth);
    drawRoundedRect(drawContext, bedsLineRect, colorCovidBed, 2);

    drawLine(drawContext, new Point(covidBedsWidth, bedsHeight / 2 - bedsLineWidth / 2 - 5), new Point(covidBedsWidth, bedsHeight / 2 + 38), tickWidth, colorCovidBed);

    // Portion representing cases beatmet
    bedsLineRect = new Rect(0, bedsHeight / 2 - bedsLineWidth / 2, beatmetBedsWidth, bedsLineWidth);
    drawRoundedRect(drawContext, bedsLineRect, colorCovidBedVentilation, 2);

    drawLine(drawContext, new Point(beatmetBedsWidth, bedsHeight / 2 - bedsLineWidth / 2 - 5), new Point(beatmetBedsWidth, bedsHeight / 2 + 20), tickWidth, colorCovidBedVentilation);

    let covidRect = new Rect(covidBedsWidth + 10, bedsHeight / 2 + 10, bedsWidth - covidBedsWidth - 10, 22);

    drawContext.setTextAlignedLeft();

    if (covidBedsWidth > bedsWidth / 2) {
      covidRect = new Rect(0, bedsHeight / 2 + 10, covidBedsWidth - 10, 22);
      drawContext.setTextAlignedRight();
    }

    let c19Label = '🦠C19: ' + cases;

    if (cases > 0) {
      c19Label = c19Label + ' (davon ' + casesBeatmet + ' beatmet)'
    }

    drawContext.drawTextInRect(c19Label, covidRect);
    leftStack.addImage(drawContext.getImage());
  }

  let statusStack = leftStack.addStack();
  statusStack.layoutHorizontally();
  statusStack.setPadding(0,0,0,0);
  statusStack.addSpacer();
  let statusText = statusStack.addText("Datenstand: " + new Intl.DateTimeFormat('de-DE', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(updated) + " // Version: " + version);
  statusText.font = Font.lightSystemFont(8);
  statusText.textColor = Color.grey();

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

function getColor(value) {
  let col = incidenceColors[0].color;

  for (i = 1; i < incidenceColors.length; i++) {
    if (value >= incidenceColors[i].lower) {
      col = incidenceColors[i].color;
    } else {
      break
    }
  }

  return col;
}

function roundIncidence (incidence) {
  incidence = Math.round(incidence * 10) / 10
  return (showDecimal ? incidence : Math.floor(incidence))
}

function formatIncidence (incidence) {
  const minDigits = (showDecimal ? 1 : 0);
  return Intl.NumberFormat('de-DE', { minimumFractionDigits: minDigits }).format(incidence);
}

function isToday (date) {
    const today = new Date()
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};
