# Stap 6 · de eerste uitnodiging

Beoordeelbare ronde van 7 november 2026. Basis: gepubliceerd slot van stap 5 (`9a5b13e5`).

## Speelbare verandering

Na vier herstelde hartslagen stelt de moswachter een samenkomst voor. Spreek de eekhoorn te voet aan en vraag of hij komt. Alleen na **Ik help je. Laat maar zien!** begint zijn scène.

Hij daalt af, verzamelt drie noten en laat er één wegrollen. De scène duurt circa tien seconden. De besturing keert terug op de oorspronkelijke positie; **Scène overslaan** en Escape geven dezelfde opdracht. Bij minder beweging begint de scène direct bij de voorraad en blijft de detailcamera vast.

Pak de glanzende noot op met E of de mobiele knop. De eekhoorn wacht als je achterblijft. Loop samen terug naar de moswachter; daar legt hij de hapjes neer. De eerste gast wordt onthouden. Daarna keert dezelfde eekhoorn terug naar zijn gewone rol, inclusief zijn bestaande monumentavontuur.

## Onderbreken en terugkomen

- Gesprekken, menu's en een verborgen tab pauzeren de relevante activiteit.
- Na herladen tijdens de film wacht de noot op je. Na ophalen hervat de begeleiding vanaf de voorraad. Een afgeronde uitnodiging blijft afgerond.
- **Ontdek plekken → De samenkomst** brengt je terug naar de huidige taak of de hapjes bij de moswachter.
- Bestaande puzzel- en monumentgegevens blijven intact. Zonder beschikbare opslag werkt de ontmoeting binnen de sessie.
- Dezelfde eekhoorn kan niet tegelijk zijn monumenttocht en deze uitnodiging uitvoeren.

## Verificatie

`node --test tests/*.test.mjs`: **30 tests geslaagd**.

De wereldintegratie speelt het gesprek, de overdracht naar de scène, camera/input, overslaan, de bereikbare route naar de noot, mobiele pickup, begeleiding en terugkeer daadwerkelijk door. Modeltests controleren natuurlijke afloop versus overslaan, opgeslagen tussenstanden, geblokkeerde opslag, afstand/hoogte bij oppakken en de vaste camera. Alle bestaande ontmoetings- en puzzeltests blijven groen. `git diff --check` slaagt.

Daarnaast is Chromium/WebGL2 met een mobiel viewport van 440 × 740 gecontroleerd: native gespreksafsluiting, scène, automatische teruggave van besturing, overslaan, terugkeer via het reismenu en pickup. Voor de compositiecontrole is de scènetijd in de browserfixture vastgezet op het verzamelen; zowel normale als verminderde beweging zijn bekeken. Die fixture en de browserafhankelijkheden maken geen deel uit van de spelcode. Takken voor de eerste vaste camera en overlap van het opdrachtkaartje met de knoppen zijn daarbij gecorrigeerd.

De browser draaide met softwarematige GPU-rendering. Dit is geen prestatienulmeting of controle op fysieke telefoons; die blijft onderdeel van de gezamenlijke speelbeoordeling.

## Vervolg

Deze ronde bouwt de eerste uitnodiging. Vos, draak, uil, de volledige samenkomst en het planten van het zaad volgen na beoordeling; zie het ontwikkelplan. Samenvoegen naar `main` publiceert via GitHub Pages en wordt afzonderlijk afgestemd.
