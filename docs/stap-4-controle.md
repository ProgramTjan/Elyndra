# Stap 4 · Visioenen worden werkelijkheid

Basis `1034ddda9e1c73b098079bfabfef9e938099f1c3`. Datum 5 november 2026.

## Wat verandert

De bestaande wortelvos krijgt een bereikbare ontmoeting via zijn lichtpunt in het wortelvisioen. De knop brengt de speler te voet bij dageraad naar een vast kijkpunt. De vos verschijnt, luistert, graaft en vertrekt. De speler houdt controle. Na het voltooide graven blijft een kleine bron bestaan; het reismenu krijgt een terugkeerplek die het huidige tijdstip bewaart. Een geschrokken vos kan via het visioen opnieuw bezocht worden.

De bron gebruikt een eigen optionele opslagwaarde `elyndra-fox-spring-v1`. Bestaande puzzel- en ontmoetingsgegevens veranderen niet. Zonder werkende opslag blijft de bron beschikbaar tijdens de sessie. Eerder de vos gezien hebben geeft geen bron cadeau.

Ook hersteld: een vos die vóór het graven vluchtte kon alsnog waterglinsters oproepen zodra zijn vertrektijd voorbij elf seconden liep.

## Gecontroleerd

- De echte visioenknop sluit het dialoog, hervat het spel en brengt je te voet naar het kijkpunt.
- De aankomstcamera ziet de vos; het kijkpunt wordt niet door boomcollisies verplaatst.
- Rustig kijken voltooit het graven, opent de terugkeerplek en laat normaal bewegen beschikbaar.
- Te vroeg schrikken geeft geen bron of late waterglinsters; opnieuw proberen werkt.
- Een dialoogpauze kan de ontdekking niet voltooien.
- De bron overleeft vertrek en wordt uit opgeslagen voortgang hersteld; ontbrekende, beschadigde of geblokkeerde opslag veroorzaakt geen fout.
- De bron voegt één kleine mesh en maximaal één extra draw call dichtbij de plek toe, in beide kwaliteitsstanden. Bestaande minder-bewegingposes blijven ondersteund.

`node --test tests/*.test.mjs`: alle 25 tests slagen. De interactietests gebruiken een gesimuleerde DOM en WebGL-context en bewijzen geen beeldkwaliteit of snelheid op echte apparaten.

## Nog visueel beoordelen

Het browserpakket is aanwezig, maar de lokale browser ontbreekt; de download leverde geen bruikbaar archief op. Er is daarom geen nieuwe visuele browsercontrole uitgevoerd.

Controleer op laptop en telefoon: zicht op de vos en bron, bereikbaarheid van de visioenknop bij smalle schermen, bron na herladen en vrij kunnen vertrekken. Ook lage kwaliteit en minder beweging meenemen. Publicatie via main blijft een afzonderlijke stap.
