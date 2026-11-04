# Stap 1 · controle van de speelervaring

Datum: 2 november 2026. Onderzocht uitgangspunt: `697b6e5e4a44801cc32d181b19b72791fb879ce3`.

Status: codecontrole en gerichte reparaties uitgevoerd; visuele spelcontrole en prestatienulmeting op echte apparaten staan open. Deze stap is daarom nog niet volledig visueel geaccepteerd.

## Bevindingen en reparaties

| Bevinding | Gevolg | Reparatie |
|---|---|---|
| De wereld onderschepte pijltjes en spatie terwijl instellingen openstonden; ingedrukte beweging bleef actief bij openen van een menu. | Keuzelijsten reageerden niet normaal en de bezoeker liep achter het menu door. In de testreproductie verplaatste ArrowUp op een select de bezoeker 6,5 wereldeenheden. | Menu openen wist bewegingsinvoer; spelinvoer respecteert menu's, invoervelden, normale knopactivatie en browsercombinaties. Touchbediening volgt dezelfde voorwaarden. |
| V controleerde alleen het puzzelvenster; T hield geen rekening met menu's en browsercombinaties. | Een puzzel kon over de intro, uitleg of een gesprek openen; praten kon instellingen onderbreken. | V en T respecteren vrij spel, geopende schermen, invoervelden en browsercombinaties. |
| De drakenknop kon zichtbaar zijn terwijl een eekhoornontmoeting haar actie blokkeerde. | Een uitnodiging leek beschikbaar maar reageerde niet. | De zichtbaarheid gebruikt nu ook de bestaande uitsluiting tijdens de eekhoornontmoeting. |
| Reismenu gebruikte tussen 601 en 700 pixels breed verschillende hoogte- en onderkantregels. | Bij veel bestemmingen kon de bovenkant buiten beeld vallen. | De bestaande passende viewportregel geldt nu tot 700 pixels breed. |

De scripts en stylesheet krijgen nieuwe cacheversies. Een afzonderlijke pull-request-workflow draait de bestaande gedragscontroles vóór samenvoegen. De publicatieworkflow op `main` blijft bestaan.

## Uitgevoerde controles

- Bij de eerste controle op 2 november slaagden 23 tests. Op 4 november slagen alle 25 tests op de gecombineerde branch, inclusief dauw en zeldzame bewoners. De integratietest is uitgebreid met regressiecontroles voor menu-invoer, native select/knopbediening, touch-rondkijken, normaal lopen na knopfocus V tijdens intro, uitleg, gesprekken en instellingen, T tijdens geblokkeerde interactie en de drakenknop tijdens de eekhoornontmoeting.
- Tests controleren onder andere de vier puzzels, opgeslagen puzzeltoestand, intro en overslaan, licht en weer, de beek, tuin, drakengroet en wandeling, eekhoornroute en spiegelhert. DOM en WebGL zijn hierbij gesimuleerd; dit is geen bewijs van werkelijke rendering of framerate.
- De live GitHub Pages-site is geopend in de beschikbare cloudbrowser. De wereld kon daar niet starten: `WebGL2 unavailable`. De begrijpelijke foutmelding en herlaadknop waren zichtbaar. Dit is een beperking van die testomgeving; er is geen conclusie getrokken dat Elyndra op normale apparaten niet werkt.
- CSS-analyse: bij 667×375 en 640×800 begint een reismenu op maximale hoogte na de wijziging op y=55, voorheen y=−65. Bij 390×844 blijft de bestaande regel behouden. Dit is een berekening uit de CSS, geen gemeten browserlayout.

## Open visuele acceptatie

Voer deze controles uit op een browser met werkende WebGL 2. Gebruik een aparte testopslag of een nieuw browserprofiel om bestaande ontdekkingen te behouden.

| Controle | Scenario | Verwacht |
|---|---|---|
| Start | Verse sessie, intro, overslaan, direct beginnen, opnieuw bekijken | Geen vastlopers; begrijpelijke laadstatus; camera hersteld na herhaling |
| Desktop | Lopen, slepen, vliegen, instellingen openen tijdens bewegen; pijltjes in keuzelijst; sluiten en verderlopen | Menu heeft de invoer; beweging hervat pas door nieuwe invoer |
| Mobiel | Staand circa 390×844 en liggend 667×375; joystick plus rondkijken; reizen met alle bestemmingen zichtbaar | Bediening bruikbaar; menutitel, sluitknop en alle bestemmingen bereikbaar |
| Ontmoetingen | Beek → tuin → draak; drakenwandeling verlaten en hervatten; eekhoorn volgen/achterblijven; spiegelhert verlaten en terugkeren | Aanwijzingen leesbaar, geen verdwijnende of vastgelopen bewoner, camera blijft vrij |
| Puzzels en gesprekken | Alle vier puzzels, hints, gesprek naar puzzel, visioen en terug; V/T tijdens andere schermen | Eén bedoelde interactie tegelijk, normale focus en terugkeer |
| Opslag | Terugkeer met bestaande voortgang; browseropslag niet beschikbaar | Ontdekkingen blijven waar opslag werkt; sessie blijft speelbaar zonder opslag |
| Toegankelijkheid | Minder beweging en geluid uit | Alle essentiële handelingen en onthullingen blijven bereikbaar |
| Beeld/prestaties | Zelfde route met Auto, Soepel en Mooi op laptop en telefoon | Laadtijd en framerate vastleggen; geen prestaties claimen vóór meting |

## Beslismoment

Beoordeel de pull request en bovenstaande open controles vóór visuele acceptatie van stap 1. Op 4 november zijn ook de dauwervaring en de drie nieuwe visioenbewoners uit main opgenomen in de testbranch. Neem die mee in de visuele speeltest. Samenvoegen naar `main` publiceert de wijzigingen en wordt apart afgestemd.
