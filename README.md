# COVID-19-Dashboard

Dieses [Scriptable](https://scriptable.app)-Skript erzeugt ein Widget, das den Verlauf der 7-Tage-Inzidenz und die Auslastung der Intensivbetten am aktuellen Standort anzeigt. Zusätzlich angezeigt wird der aktuelle Wert der 7-Tage-Inzidenz des zugehörigen Bundeslandes und der Impfstatus des Bundeslandes. Hier ein Beispiel für den Landkreis Ebersberg:

![IMG_0986](https://user-images.githubusercontent.com/65543240/118359626-a0062580-b584-11eb-8c7e-dcb6c6070fe2.jpeg)

## Kontakt und Support

* **Homepage:** https://github.com/marcusraitner/COVID-19-Dashboard
* **Autor:** [Dr. Marcus Raitner](https://fuehrung-erfahren.de)

Für Ideen und Fehlermeldungen bitte ein [Issue erstellen](https://github.com/marcusraitner/COVID-19-Dashboard/issues).

## Erläuterung

### Balkendiagramm

Stellt den Verlauf der 7-Tage-Inzidenz dar. Die Zuordnung zu den Tagen erfolgt entweder logisch richtig (`rki=n`), d.h. am Tag X wird die 7-Tage-Inzidenz der sieben letzten Tage inklusive des Tag X oder so wie das RKI die Zuordnung vornimmt (`rki=y`), d.h. am Tag X wird die 7-Tage-Inzidenz der _vergangenen_ sieben Tage _ohne den Tag X_ angezeigt (vgl. Abschnitt Berechnung).

Der hellere Anteil in jedem Balken stellt den Beitrag dieses Tages (bzw. in RKI Logik des vorigen Tages) zur Inzidenz dar.

### Intensivbetten

Der gesamte Balken repräsentiert _alle_ verfügbaren Betten. Der rechte grüne Anteil sind die _freien_ Betten. Der linke rote Anteil die mit COVID-19 Patienten belegten Betten. Der dunkelrote Anteil sind davon die COVID-19 Patienten mit Beatmung. Der graue Teil des Balkens repräsentiert die mit anderen Patienten belegten Betten.

### Impfstatus

Beim Impfstatus werden zwei Werte angezeigt (für das Bundesland; auf Landkreisebene gibt es die Daten nicht): Der Anteil der einmalig geimpften und der Anteil der zweimalig geimpften Personen.

## Parameter

Das Widget erlaubt folgende Parameter in beliebiger Reihenfolge mit Semikolon (";") getrennt, also z.B. `loc=48.34,10.78;de=y;rval=y;vac=n;daily=y;beds=y;rki=n`

* `loc=<latitude,longitude>`: z.B. `loc=48.34,10.78` (aus Gründen der Kompatibilität kann "loc=" auch entfallen. Default: aktueller Ort.
* `de=(y|n)`: bestimmt, ob die Inzidenz für Deutschland angezeigt werden soll (y) oder nicht (n). Default: `de=n`
* `rval=(y|n)`: bestimmt, ob bei der Inzidenz für Deutschland auch der R-Wert angezeigt werden soll (y) oder nicht (n). Default: `rval=y`
* `vac=(y|n)`: bestimmt, ob der aktuelle Impfstatus für den ausgewählten Landkreis angezeigt werden soll (y) oder nicht (n). Default: `vac=y`
* `beds=(y|n)`: bestimmt, ob die aktuelle Auslastung der Intensivbetten angezeigt werden soll (y) oder nicht (n). Default: `beds=y`
* `rki=(y|n)`: bestimmt, ob die 7-Tages-Inzidenz dem jeweils aktuellsten Tag der zugrundeliegenden Summe zugeordnet werden (n) oder wie beim Excel des RKI dem jeweils nächsten Tag. Default: `rki=n.`
* `daily=(y|n)`: bestimmt, ob der Beitrag des Tages zur 7-Tages-Inzidenz angezeigt werden soll. Default: `daily=y`

## Datenquellen

* **RKI Landkreisdaten:** Werte je Landkreis ermittelt aus den Koordinaten ([Quelle](https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer))
* **RKI Tagessummen:** Fallzahlen je Tag ([Quelle](https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/Covid19_RKI_Sums/FeatureServer))
* **RKI Intensivregister:** Daten zu den Intensivbetten des Landkreises ([Quelle](https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer))
* **Impfstatus:** Daten des RKI via https://api.corona-zahlen.org/
* **Deutschland:** Daten des RKI via https://api.corona-zahlen.org/

## Berechnung

Mit den Koordinaten des aktuellen Standorts (oder den mit `loc=` übergebenen Koordinaten) wird der aktuelle Landkreis ermittelt und dann zu diesem die Tagessummen und wenn nötig die Daten des Intensivregisters und der Impfstatus ermittelt. 

Aus den Tagesummen wird dann die 7-Tages-Inzidenz wie folgt berechnet: Inzidenz am Tag X = Summe (Tagessumme Tag X, Tagessumme Tag X-1, … Tagessumme Tag X - 6) / Einwohnerzahl. 

Das RKI ordnet in ihrem offiziellen [Excel](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Fallzahlen_Kum_Tab.html) den Inzidenzwert allerdings nicht dem aktuellsten Tag der Summe zu (Tag X) sondern dem nächsten (Tag X + 1). Falls gewünscht, kann dieses Verhalten  mit dem Paramter `rki=y`konfiguriert werden.
