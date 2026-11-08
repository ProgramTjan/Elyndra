# Stap 6 · de wortelvos als tweede gast

Ronde van 8 november 2026, aansluitend op de gepubliceerde eekhoornontmoeting. AJ heeft bouwen én direct publiceren geautoriseerd.

## Speelroute

1. Rond de uitnodiging van de eekhoorn af. In **Ontdek plekken** verschijnt **Wortelvos uitnodigen · bij de bron**.
2. Is de bron nog onbekend, dan brengt die knop je naar de bestaande ontmoeting bij dageraad. Blijf rustig kijken tot de vos het water blootlegt. Daarna wacht hij bij zijn bron, ook buiten de dageraad.
3. Spreek hem aan en nodig hem uit. Alleen **Ik help je. Wat heb je gevonden?** start de scène. Hij graaft een oud wortelfragment op; de scène duurt circa negen seconden, is over te slaan en gebruikt een vaste camera bij minder beweging.
4. Neem het fragment op met E of de actieknop. Spoel het in de bron en blijf even bij het water. Een licht teken verschijnt in het hout.
5. Breng het naar de moswachter. Wandelen en vliegen blijven vrij; dezelfde reisknop brengt je desgewenst direct terug. De vos neemt zijn eigen pad en komt zichtbaar tussen de varens aan.
6. Spreek de moswachter aan en kies **Ik heb een wortelfragment voor je.** Hij herkent het teken van zijn zaad. De vos blijft bij de samenkomst en het fragment ligt bij de hapjes.

## Gedrag en opslag

De bestaande vos krijgt een nieuwe rol; er wordt geen tweede vos bij de bron gespawned. De oorspronkelijke bronontmoeting blijft intact vóór deze uitnodiging. Eekhoorn, monument, drakengroet, vier hartslagen en andere opgeslagen voortgang blijven bewaard.

Film overslaan en natuurlijke afloop geven dezelfde speelbare opdracht. Na herladen hervat je bij het fragment, het wassen, het brengen of de afgeronde samenkomst. Na herladen tijdens het wassen begin je die wasbeurt opnieuw; elders staan kan het fragment niet schoonmaken. Zonder opslag blijft alles binnen de sessie bruikbaar. Menu's, gesprekken en verborgen tabs pauzeren de voortgang. De speler rondt de aflevering bewust af in het gesprek met de moswachter.

## Verificatie

- `node --test tests/*.test.mjs`: 35 tests, alle geslaagd.
- De wereldintegratie speelt uitnodigen, weigeren, accepteren, camera, overslaan, lopen naar het fragment, E, mobiele wasknop, pauze, aankomst en gespreksoverdracht door.
- Modeltests controleren opgeslagen tussenstanden, onbeschikbare opslag, afstand en hoogte, natuurlijke filmafloop, vaste camera en uitsluiting van de oude vosroutine.
- Browsercontrole met Chromium/WebGL2 bij 440 × 740, inclusief de native gespreksafsluiting en mobiele knoppen. Compositie wordt in de testfixture op een vast scènemoment bekeken; wachttijden voor wassen en aankomst worden daar versneld. Deze fixture verandert de spelcode niet.
- Softwarematige browserrendering is geen prestatiemeting op een fysieke telefoon.

## Volgende ronde

De draak als derde gast. Daarna de gezamenlijke ontmoeting en een zichtbare keuze rond het zaad. De bron en het wortelfragment geven daarvoor de eerste aanwijzing.
