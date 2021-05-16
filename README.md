# COVID-19-Dashboard

Dieses [Scriptable](https://scriptable.app)-Skript erzeugt ein Widget, das den Verlauf der 7-Tage-Inzidenz und die Auslastung der Intensivbetten am aktuellen Standort anzeigt. Zusätzlich angezeigt wird der aktuelle Wert der 7-Tage-Inzidenz des zugehörigen Bundeslandes und der Impfstatus des Bundeslandes. Hier ein Beispiel für den Landkreis Ebersberg:

![IMG_0986](https://user-images.githubusercontent.com/65543240/118359626-a0062580-b584-11eb-8c7e-dcb6c6070fe2.jpeg)

## Parameter

Das Widget erlaubt folgende Parameter in beliebiger Reihenfolge mit Semikolon (";") getrennt, also z.B. `loc=48.34,10.78;de=y;rval=y;vac=n;beds=y`

* `loc=<latitude,longitude>`: z.B. `loc=48.34,10.78` (aus Gründen der Kompatibilität kann "loc=" auch entfallen.
* `de=(y|n)`: bestimmt, ob die Inzidenz für Deutschland angezeigt werden soll (y) oder nicht (n)
* `rval=(y|n)`: bestimmt, ob bei der Inzidenz für Deutschland auch der R-Wert angezeigt werden soll (y) oder nicht (n)
* `vac=(y|n)`: bestimmt, ob der aktuelle Impfstatus für den ausgewählten Landkreis angezeigt werden soll (y) oder nicht (n)
* `beds=(y|n)`: bestimmt, ob die aktuelle Auslastung der Intensivbetten angezeigt werden soll (y) oder nicht (n)
* `rki=(y|n)`: bestimmt, ob die 7-Tages-Inzidenz dem jeweils aktuellsten Tag der zugrundeliegenden Summe zugeordnet werden (n) oder wie beim Excel des RKI dem jeweils nächsten Tag.

## Datenquellen

* **RKI Landkreisdaten:** Werte je Landkreis ermittelt aus den Koordinaten ([Quelle](https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer))
* **RKI Tagessummen:** Fallzahlen je Tag ([Quelle](https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/Covid19_RKI_Sums/FeatureServer))
* **RKI Intensivregister:** Daten zu den Intensivbetten des Landkreises ([Quelle](https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer))
* **Impfstatus:** Daten des RKI via https://api.corona-zahlen.org/
* **Deutschland:** Daten des RKI via https://api.corona-zahlen.org/

## Berechnung

Mit den Koordinaten des aktuellen Standorts (oder den mit `loc=` übergebenen Koordinaten) wird der aktuelle Landkreis ermittelt und dann zu diesem die Tagessummen und wenn nötig die Daten des Intensivregisters und der Impfstatus ermittelt. Aus den Tagesummen wird dann die 7-Tages-Inzidenz wie folgt berechnet: Inzidenz am Tag X = Summe (Tagessumme Tag X, Tagessumme Tag X-1, … Tagessumme Tag X - 6) / Einwohnerzahl. 
Das RKI ordnet in ihrem offiziellen [Excel](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Fallzahlen_Kum_Tab.html) den Inzidenzwert allerdings nicht dem aktuellsten Tag der Summe zu (Tag X) sondern dem nächsten (Tag X + 1). Dieses Verhalten kann mit dem Paramter `rki=y`konfiguriert werden.
