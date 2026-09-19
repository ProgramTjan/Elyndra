# Elyndra · Het levende woud

Een vrij te verkennen 3D-fantasiewereld waarin natuur en robotica samenleven, met gesprekken, vier puzzels, visioenen en een filmische introductie.

[Speel Elyndra](https://programtjan.github.io/Elyndra/)

## Lokaal starten

De website staat in `dist/`. Deze map bevat de bewerkbare JavaScript-, HTML- en CSS-bronbestanden en afbeeldingen. Er is geen buildstap nodig.

Met Python 3, vanuit de hoofdmap van deze repository:

```sh
python -m http.server 8000 --directory dist
```

Open vervolgens http://localhost:8000 in een moderne browser met WebGL-ondersteuning.

## Tests

Met Node.js:

```sh
node --test tests/*.test.mjs
```

## Bestanden

- `dist/`: website, wereld, interacties en beelden.
- `tests/`: controles voor gesprekken, puzzels, introductie en bewegingen.
- `docs/art-direction.md`: visuele ontwerpkeuzes.
- `.openai/hosting.json`: configuratie van een eerdere ChatGPT Site.

## De adem van Elyndra

Kies **Ontdek plekken → De adem van Elyndra · aan de beek**. Blijf ongeveer zes seconden rustig staan bij de lichtjes. Rondkijken mag: boven de beek vormt zich langzaam een sterrengewelf. Even later maakt de draak een omweg over de wortelbogen. Geluid zet je zelf aan. Met minder beweging blijven de lichtjes op hun plek en verschijnt het gewelf door geleidelijk oplichten.

De ervaring werkt ook als je de beek vanuit de wereld te voet bereikt.

## De lichtdrager en de slapende tuin

Na het sterrengewelf en de komst van de draak kijkt het beekwezen naar je om. Kom dichterbij om mee te gaan. Het zwemt rustig stroomopwaarts en wacht wanneer je achterblijft. Volg zijn gouden licht; aan het eind van de tocht openen de bloemen van een verborgen tuin zich.

Je kunt de tuin ook zelf ontdekken. Je apparaat onthoudt de ontdekking; daarna verschijnt **De slapende tuin** bij **Ontdek plekken**. Wanneer browseropslag niet beschikbaar is, blijft de ervaring tijdens het bezoek werken.

## Het woud herkent je

Na je ontdekking van de tuin komt de draak landen op de open plek. Zijn vleugels vouwen zich en zijn kop volgt je. Blijf rustig op enkele meters voor hem staan: hij buigt naar je toe. Rennen of te dichtbij komen laat hem weer ruimte nemen. Je kunt vrij blijven kijken en bewegen.

De draak en de lichtdrager herkennen een volgend bezoek op hetzelfde apparaat. De lichtdrager begroet je en zwemt even mee voordat hij zijn eigen ritme hervat. Zonder browseropslag blijven de ontmoetingen gewoon werken tijdens je bezoek.

## De uitnodiging van de draak

Begroet de draak in de slapende tuin. Wanneer hij je vertrouwt en zijn kop buigt, verschijnt **Ga je mee?** (toets **R** op de computer). Hij vliegt laag naar een beschutte open plek, kijkt om en wacht als je achterblijft. Volg hem te voet.

Wandel op de open plek tussen de lichtjes. Zijn adem volgt je stappen: bloemen openen en lichtlijnen verbinden ze tot jullie eigen sterrenbeeld. Met **Laat het licht rusten** (of **R**) neem je afscheid. Eén lichtje gaat even met je mee. Je kunt ook gewoon weglopen; later kun je hem opnieuw uitnodigen.

Geluid is optioneel. Met minder beweging blijven de lichtdeeltjes rustig en cirkelt de wachtende draak niet. Je blijft zelf bewegen en rondkijken. De tijdelijke bloemen worden niet opgeslagen.

## Herkomst

Overgenomen uit Elyndra versie 19, broncommit `6a03ab841a28cb15f2716f9b0befafde8538c1ef`. De live site is GitHub Pages op `dist/`; een push naar `main` werkt de website bij.
