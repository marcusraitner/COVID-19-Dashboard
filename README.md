# COVID-19-Dashboard

Dieses [Scriptable](https://scriptable.app)-Skript erzeugt ein Widget, das den Verlauf der 7-Tage-Inzidenz und die Auslastung der Intensivbetten am aktuellen Standort innerhalb Deutschlands anzeigt. Zusätzlich angezeigt wird der aktuelle Wert der 7-Tage-Inzidenz des zugehörigen Bundeslandes und der Impfstatus des Bundeslandes. Optional (Paramter `de=y`) kann auch der Inzidenzwert von Deutschland und der R-Wert für Deutschland angezeigt werden. Hier ein Beispiel für den Landkreis Ebersberg im neuen RKI-Theme (`theme=rki`):

![IMG_0356](https://user-images.githubusercontent.com/65543240/146950475-c26beccc-c81a-49f4-912c-5bcc13b53b1a.jpeg)

Derzeit gibt es das Widget nur in diesem mittelgroßen Format.

## Kontakt und Support

* **Homepage:** https://github.com/marcusraitner/COVID-19-Dashboard
* **Autor:** [Dr. Marcus Raitner](https://fuehrung-erfahren.de)

Für Ideen und Fehlermeldungen bitte ein [Issue erstellen](https://github.com/marcusraitner/COVID-19-Dashboard/issues).

☕️ Einen Kaffee ausgeben: https://ko-fi.com/marcusraitner

## Changelog

### v1.10.1
* Hospitalisierungswerte können mittels Parameter `hosp=(y|n)` ein- bzw. ausgeblendet werden (nur zusammen mit `vacc=y` möglich)

### v1.10.0
* Hospitalisierungswerte: Zusätzlich zur Impfquote werden im rechten unteren Eck des Widgets nun die 7-Tages-Hospitalisierungsinzidenz und der Absolutwert der hospitalisierten Fälle der letzten sieben Tage des aktuellen Bundeslandes angezeigt.

### v1.9.0
* Themes: Mit dem Parameter `theme=(original|rki)` lässt sich nun ein neues Theme wählen (`theme=rki`) das Farben und Schwellwerte des des RKI-Dashboards verwendet. ([#49](https://github.com/marcusraitner/COVID-19-Dashboard/issues/49))
* Über den Parameter `bl=(y|n)` kann nun auch das Bundesland ausgeblendet werden; sinnvoll z.B. für Hamburg. ([#61](https://github.com/marcusraitner/COVID-19-Dashboard/issues/61))
* Bugfix für R-Wert aufgrund Änderung der API. Verwendet wird nun auch der aussagekräftigere 7-Tages-Schätzer. ([#75](https://github.com/marcusraitner/COVID-19-Dashboard/issues/75))

### v1.8.0
* Die Darstellung der Inzidenzwerte wurde komplett überarbeitet und bietet jetzt detaillierte Informationen für die letzten Tage (konfigurierbar über den Parameter `days`) und darüberhinaus den Verlauf der Inzidenz mit schmalen Balken ([#48](https://github.com/marcusraitner/COVID-19-Dashboard/issues/48)).
* Die Darstellung der Inzidenzwerte wurde optimiert, dass der zur Verfügung stehende Platz (insbes. mit `icu=n` oder `vac=n`) besser genutzt wird ([#55](https://github.com/marcusraitner/COVID-19-Dashboard/issues/55)).  
* In der Statuszeile ganz unten wird die Aktualität des Datenstands (der Inzidenzwerte) und die Version des Skripts angezeigt ([#54](https://github.com/marcusraitner/COVID-19-Dashboard/issues/54) und [#37](https://github.com/marcusraitner/COVID-19-Dashboard/issues/37)).
* Für den Fall, dass morgens der Wert des aktuellen Tages (bei `frozen=y`) fehlt, wird er aus der RKI-Schnittstelle ergänzt ([#45](https://github.com/marcusraitner/COVID-19-Dashboard/issues/45)).
* Die Paramter `rki=y` und `decimal=y` sind entfallen ([#51](https://github.com/marcusraitner/COVID-19-Dashboard/issues/51)).
* Die absolute Anzahl der Neuinfektionen wird mit `daily=y` angezeigt [#46](https://github.com/marcusraitner/COVID-19-Dashboard/issues/46).


### v1.7.0
* Link zu den aktuellen Coronaregeln des jeweiligen Bundeslandes integriert ([#17](https://github.com/marcusraitner/COVID-19-Dashboard/issues/17))
* Rundung der Inzidenzwerte angepasst; s. Kapitel _Berechnung_ ([#39](https://github.com/marcusraitner/COVID-19-Dashboard/issues/39))
* Neuer Paramter `decimal=(y|n)` zur Anzeige der Inzidenz wahlweise mit einer Kommastelle ([#24](https://github.com/marcusraitner/COVID-19-Dashboard/issues/24))
* Kleinere visuelle Anpassungen bei der Inzidenz von Bundesland und Deutschland und dem R-Wert ([#21](https://github.com/marcusraitner/COVID-19-Dashboard/issues/21), [#22](https://github.com/marcusraitner/COVID-19-Dashboard/issues/22), [#35](https://github.com/marcusraitner/COVID-19-Dashboard/issues/35))

## Erläuterung

### Balkendiagramm

Stellt den Verlauf der 7-Tage-Inzidenz dar. Der hellere Anteil in jedem Balken stellt den Zuwachs an Fällen dar (s. Berechnung). Die durch den Paramter `days` festgelegten letzten Tage werden detailliert dargestellt, also mit den konkreten Inzidenzwerten. Die Tage davor werden komprimiert dargestellt. Die Farben entsprechen den Grenzwerten 50 (gelb), 100 (hellorange), 165 (orange), 200 (rot).

### Intensivbetten

Der gesamte Balken repräsentiert _alle_ verfügbaren Betten. Der rechte grüne Anteil sind die _freien_ Betten. Der linke rote Anteil die mit COVID-19 Patienten belegten Betten. Der dunkelrote Anteil sind davon die COVID-19 Patienten mit Beatmung. Der graue Teil des Balkens repräsentiert die mit anderen Patienten belegten Betten.

### Impfstatus

Beim Impfstatus werden zwei Werte angezeigt (für das Bundesland; auf Landkreisebene gibt es die Daten nicht): Der Anteil der einmalig geimpften und der Anteil der zweimalig geimpften Personen.

### Hospitalisierung
Rechts neben den Balken der Intensivbetten wird die 7-Tages-Hospitalisierungsinzidenz und der Absolutwert der hospitalisierten Fälle der letzten sieben Tage des aktuellen Bundeslandes angezeigt.

![IMG_0356](https://user-images.githubusercontent.com/65543240/146950475-c26beccc-c81a-49f4-912c-5bcc13b53b1a.jpeg)

### Links zu Coronaregeln

Ein Klick auf die Überschrift bzw. den Landkreis öffnet die Coronaregeln des jeweiligen Bundeslandes (Quelle der Links: [Übersichtsseite der Bundesregierung](https://www.bundesregierung.de/breg-de/themen/coronavirus/corona-bundeslaender-1745198))

## Parameter

Das Widget erlaubt folgende Parameter in beliebiger Reihenfolge mit Semikolon (";") getrennt, also z.B. `loc=48.34,10.78;de=y;rval=y;vac=n;daily=y;beds=y;frozen=n;days=5`

* `loc=<latitude,longitude>`: z.B. `loc=48.34,10.78` (aus Gründen der Kompatibilität kann "loc=" auch entfallen. Default: aktueller Ort.
* `de=(y|n)`: bestimmt, ob die Inzidenz für Deutschland angezeigt werden soll (y) oder nicht (n). Default: `de=n`
* `bl=(y|n)`: bestimmt, ob die Inzidenz für das Bundesland angezeigt wird. Default `bl=y`
* `rval=(y|n)`: bestimmt, ob bei der Inzidenz für Deutschland auch der R-Wert angezeigt werden soll (y) oder nicht (n). Default: `rval=y`
* `vac=(y|n)`: bestimmt, ob der aktuelle Impfstatus für den ausgewählten Landkreis angezeigt werden soll (y) oder nicht (n). Default: `vac=y`
* `beds=(y|n)`: bestimmt, ob die aktuelle Auslastung der Intensivbetten angezeigt werden soll (y) oder nicht (n). Default: `beds=y`
* `daily=(y|n)`: bestimmt, ob der Beitrag des Tages zur 7-Tages-Inzidenz angezeigt werden soll. Default: `daily=y`
* `frozen=(y|n)`: bestimmt, ob die "eingefrorenen" Werte des RKI verwendet werden sollen (s. Berechnung). Default: `frozen=n`
* `days=[0…10]`: legt fest, wie viele Tage detailliert angezeigt werden sollen. Die Anzahl der maximal möglichen Tage wird ggf. automatisch beschränkt, falls `de=y` oder `vac=y`. Default: `days=5`
* `theme=(original|rki)`: Legt die Farben für die Inzidenzwerte fest. Default: `theme=original`

## Datenquellen

* **RKI Landkreisdaten:** Werte je Landkreis ermittelt aus den Koordinaten ([Quelle](https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer))
* **RKI Tagessummen:** Fallzahlen je Tag ([Quelle](https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/Covid19_RKI_Sums/FeatureServer))
* **RKI Intensivregister:** Daten zu den Intensivbetten des Landkreises ([Quelle](https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer))
* **Impfstatus:** Daten des RKI via https://api.corona-zahlen.org/
* **Deutschland:** Daten des RKI via https://api.corona-zahlen.org/
* **"Frozen"-Werte:** Daten des RKI via https://api.corona-zahlen.org/
* **Hospitalisierung:** Daten des [RKI](https://github.com/robert-koch-institut/COVID-19-Hospitalisierungen_in_Deutschland) via https://api.corona-zahlen.org/

## Berechnung

Mit den Koordinaten des aktuellen Standorts (oder den mit `loc=` übergebenen Koordinaten) wird der aktuelle Landkreis ermittelt und dann zu diesem die Tagessummen und wenn nötig die Daten des Intensivregisters und der Impfstatus ermittelt.

Aus den Tagesummen wird dann die 7-Tages-Inzidenz wie folgt berechnet: Inzidenz am Tag X + 1 = Summe (Tagessumme Tag X, Tagessumme Tag X-1, … Tagessumme Tag X - 6) / Einwohnerzahl. Die Inzidenzwerte werden auf eine Nachkommastelle gerundet. In diesem Beispiel vom 5.6.2021 berechnet sich der Inzidenzwert von `24,4` für den 4.6.2021 aus den Meldungen der sieben Tage davor (also bis einschließlich 3.6.2021). Zusätzlich angezeigt wird je Tag in der Vergangenheit (also nicht für den heutigen Tag, weil diese Zahlen noch nicht vorliegen) der Zuwachs an Fällen einerseits durch den hellen Balken (neue Fälle dieses Tages je 100.000 Einwohner) plus die absolute Anzahl, in diesem Fall waren das am 4.6.2021 hier in Ebersberg ein neuer Fall.

![IMG_1187](https://user-images.githubusercontent.com/65543240/120902717-3688ac80-c642-11eb-87bd-59452f442619.jpeg)

Für diese Berechnung werden die Werte immer aktuell geholt, d.h. dass sich aufgrund Nachmeldungen die Werte in der Vergangenheit gegenüber einem Snapshot von gestern auch ändern können. Das ist so gewollt und aus meiner Sicht auch logisch. Im offiziellen [Excel](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Fallzahlen_Kum_Tab.html) des RKI, von dessen Werten die Maßnahmen abhängig sind, wird das aber anders gehandhabt. Dort wird der Wert jeden Tag eingefroren und nicht mehr aufgrund von Nachmeldungen verändert. Diese Logik kann über den Paramter `frozen=y` explizit gesetzt werden.
