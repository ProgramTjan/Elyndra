# Stap 6 · de draak als derde gast

Ronde van 13 november 2026, aansluitend op de wortelvos. AJ heeft bouwen en direct publiceren geautoriseerd. De invulling van het geschenk (warmte) is in deze ronde gekozen en ligt ter beoordeling voor.

## Het idee

De eekhoorn brengt hapjes, de vos een herinnering. De draak brengt **warmte**: het zaad heeft de hele winter in de stenen hand van de moswachter gelegen en had het koud. Dat sluit aan op wat de moswachter al over hem vertelt (zijn oude vriend, die als jong in zijn hand paste) en op wat de draak in de slapende tuin al doet: met zijn adem iets tot leven wekken. De draak spreekt niet in woorden; het gesprek beschrijft zijn gebaren.

Na deze ronde weet de speler: het zaad kende de bron (water), droeg een teken (het wortelfragment) en heeft warmte nodig. Dat zijn de drie gegevens voor de keuze waar het mag groeien.

## Speelroute

1. Rond de uitnodiging van de wortelvos af. In **Ontdek plekken** verschijnt **Draak uitnodigen · bij zijn rustplek**.
2. Die knop brengt je naar zijn rustplek tussen de wortelkathedraal en de beek. Wacht daar rustig: de draak komt uit zichzelf landen, ook als je de slapende tuin nog niet kent.
3. Spreek hem aan en vraag of hij ook komt. Alleen **Ik help je. Laat maar zien.** start de scène. Hij buigt zich over een koude zaadlantaarn en ademt haar aan; de scène duurt circa negen seconden, is over te slaan en gebruikt een vaste camera bij minder beweging.
4. Neem de gloedlantaarn met E of de actieknop. Dezelfde reisknop zet je er desgewenst direct naast.
5. **Blijf ongeveer vier seconden stilstaan.** De gloed went alleen aan wie stilstaat; lopen laat haar weer flakkeren. Rondkijken mag.
6. Draag de lantaarn naar de moswachter. Ze hangt rechts onder in beeld en geeft licht. Wandelen en vliegen blijven vrij; de reisknop brengt je ook. De draak stijgt op, steekt de vallei over en cirkelt hoog boven de moswachter tot je er bent. Dan landt hij naast de anderen.
7. Spreek de moswachter aan en kies **Ik breng warmte van de draak.** De lantaarn komt bij de hapjes te staan en de draak blijft als derde gast.

## Gedrag en opslag

Er is één draak. Tot de uitnodiging blijft zijn bestaande gedrag intact: de groet, de buiging en **Ga je mee?** naar de open plek. Vanaf de scène volgt hij zijn route als gast; na afloop blijft hij bij de samenkomst, zoals de vos. De oude vlucht naar de open plek is daarna niet meer beschikbaar. Dat is een bewuste vereenvoudiging en kan in de samenkomst-ronde worden herzien.

Voortgang staat onder `elyndra-gathering-dragon-v1`. Na herladen hervat je bij de lantaarn, het wennen, het dragen of de afgeronde samenkomst; het wennen begint dan opnieuw. Zonder opslag blijft alles binnen de sessie bruikbaar. Menu's, gesprekken en verborgen tabs pauzeren de voortgang. Andere uitnodigingen (eekhoorn, vos, hert, finale) wachten zolang deze loopt.

## Verificatie

- `node --test tests/*.test.mjs`: 75 tests, alle geslaagd.
- `tests/dragon-guest.test.mjs` controleert uitnodigen, film en overslaan, stilstaan tegenover lopen, een vlucht zonder sprongen, landen, afgeven, alle opgeslagen tussenstanden, ontbrekende opslag, pauze en de gesprekken.
- `tests/intro-start.test.mjs` speelt het hoofdstuk in de wereld door: zelf landen, weigeren, accepteren, vaste camera, pauze, overslaan, lantaarn binnen bereik, stilstaan, vlucht, landing en overdracht. Deze test vond een fout in de eerste versie: de gast-houding werd overschreven door de oude ontmoeting, waardoor de draak bleef liggen.
- Headless Chromium met softwarerendering: de lantaarn bij de draak en de samenkomst met vos, lantaarn en draak zijn als beeld bekeken. Na dat beeld is de landingsplek nog enkele meters dichter bij de groep gelegd.

## Niet gecontroleerd

- De filmscène zelf is niet als beeld bekeken; de camera staat op het vrijgehouden pad en is alleen op positie beredeneerd.
- De vlucht en de landing in beweging, en de gedragen lantaarn in beeld.
- Framerate op een fysiek apparaat.

## Volgende ronde

De gezamenlijke ontmoeting en de keuze waar het zaad mag groeien. Een aankomst van de uil kan het grotere verhaal verbinden.
