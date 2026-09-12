# Elyndra · schoonheid als kompas

Doel: een wereld waarin je blijft verdwalen, en die je blijft verbazen — niet door groter te worden, maar door mooier, levender en gelaagder te worden.

Lokale kopie: `C:\Users\vandr\dev\Elyndra`  
Bron: [ProgramTjan/Elyndra](https://github.com/ProgramTjan/Elyndra)  
Lokaal spelen: `python -m http.server 8000 --directory dist`

---

## Wat er al staat

Elyndra is geen open-wereld-RPG. Het is een **compacte first-person wandeling** in één vallei, waarin natuur en zachtaardige machines samenleven. Geen gevecht, geen score, geen haast.

| Laag | Nu |
|------|----|
| Wereld | Eén vallei (~310 × 415), vijf plekken, paden, rivier, bergen |
| Plekken | Wortelkathedraal, lichtpoort, zwevende tuinen, moswachter, sterrenmeer |
| Geheimen | Beek → sterrengewelf → lichtdrager → slapende tuin → draak die buigt |
| Spel | Vier puzzels (*hartslagen*) ontgrendelen vier fotorealistische visioenen |
| Stem | Drie gesprekken (moswachter, wit hert, eekhoorn) in Nederlands |
| Techniek | Native WebGL2, geen build, geen npm, alles in `dist/` |

De bestaande kunstlijn in `docs/art-direction.md` is precies goed: **kleiner, dichter, natuurlijker**. Die lijn niet verlaten.

De sterkste momenten die er al zijn:

- *Blijf stilstaan* bij de beek. Het woud komt naar je toe.
- De draak neemt afstand als je rent, en buigt als je zacht bent.
- Terugkomen op hetzelfde apparaat: de lichtdrager groet je.
- De visioenen zijn geen skins, maar een tweede, diepere waarheid van dezelfde plek.

Dat is het DNA. Uitbreiden betekent: **meer van dit**, niet een ander genre eroverheen.

---

## Noordster

> Dezelfde vallei. Oneindig meer levend.  
> Schoonheid die terugkomt zonder zich te herhalen.

Verbazing mag niet van *nieuwe vierkante meters* komen. Die raakt leeg. Verbazing moet komen van:

1. **Licht dat een personage is** — ochtendgoud, blauw uur, mist na regen, licht door wortels.
2. **Een wereld die jou herkent** — houding, stilte, terugkeer, kleine gebaren.
3. **Zelfde plek, nieuwe laag** — condities (uur, weer, herinnering) laten iets anders gebeuren.

De visioenen blijven de noordster voor hoe Elyndra *wil* ogen. De realtime wereld hoeft die fotorealiteit niet in één sprong te evenaren. Wel mag de kloof kleiner worden, plek voor plek.

---

## Wat we bewust niet doen

- De kaart groter maken.
- Combat, inventory, XP, timers of checklists van “wonderen”.
- De engine wisselen (Three.js, Unity) voordat er een meetbaar probleem is. De shaders hebben al `night`, schaduw, water, sfeer.
- Vrije AI-chat. De stem van Elyndra is geschreven, kort, Nederlands, zacht.
- Collectibles die het stilstaan vervangen door rapen.
- Een tweede wereld bouwen voordat deze vallei op drie momenten van de dag ademt.

---

## Drie pijlers

### 1. Licht als personage

Dag/nacht is nu een knop. Dat is te weinig voor verbazing bij terugkeer.

Maak tijd tot een glijdende waarde (0–1 of een uurklok). De bestaande `night`-uniform in `world.js` is het haakje. Daarna:

- gouden uur over de rivier
- blauw uur bij de wortelbogen
- maanlicht op sneeuwkappen
- optionele lichte regen die mos donkerder maakt en daarna laat glinsteren
- lichtstralen in de kathedraal als de zon laag staat

Beslist: automatische cyclus (acht minuten per etmaal). De lichtknop springt naar het volgende genoemde uur; daarna ademt de dag door. Weer wordt per bezoek gekozen en is vast te zetten onder *?* (helder, mist, regen). Vliegen blijft altijd vrij.

### 2. De wereld die jou herkent

Dit bestaat al (draak, lichtdrager, moswachter). Verdiepen, niet vermenigvuldigen tot ruis.

Voorbeelden die bij Elyndra horen:

- Het hert leidt je één keer naar een plek die je nog niet kende, en alleen als je eerst met hem hebt gezeten.
- Bloemen in de slapende tuin blijven open na ontdekking, en geuren (geluid) anders bij terugkeer.
- De moswachter herinnert zich of je zacht bij de draak stond.
- Een vierde bewoner uit de visioenen verschijnt zelden in de live wereld — de wortelvos, de zilvervleugel — en alleen onder een conditie.

Herkenning is geen statistiek. Het is een gebaar.

### 3. Stilte-wonderen met condities

De beek is het model. Kopieer het patroon, niet de sterren.

Elk nieuw wonder:

- vraagt **blijven**, niet klikken
- heeft een **conditie** (schemer, regen, na een gesprek, na een visioen)
- mag **terugkomen** in een andere gedaante, zodat het geen eenmalige cutscene is
- leeft in een eigen module, zoals `brook-wonder.mjs`

Eerste kandidaten, zonder de vallei te vergroten:

| Wonder | Conditie | Wat gebeurt |
|--------|----------|-------------|
| Adem van de kathedraal | stilte onder de bogen bij laag zonlicht | **gebouwd** — zaadschrijn ademt; een vergeten vogel klinkt één keer |
| Spiegel van de poort | poort actief + schemer | **gebouwd** — het water in de ring toont even het *andere* bos |
| Dauw van de tuinen | na regen, vliegend tussen eilanden | watervallen worden zichtbaar; zaad-drones kruisen je pad |
| Hart van de wachter | na puzzel 4, nachtelijke stilte | het hartlicht synchroniseert met de vier hartslagen |

---

## Fasen

Houd de bestaande regel: **één gebonden fase, dan samen kijken**. Geen alles-tegelijk-refactor.

### Fase A — Licht ademt — gebouwd

- `dist/atmosphere.mjs`: uurklok, acht minuten per etmaal, genoemde uren, weer per bezoek.
- Shader: `sunDir`, `warmth`, `mistAmt`, `wet` — gouden uur, zwaardere mist, natte grond.
- Lichtknop springt naar het volgende uur; daarna loopt de cyclus door.
- Weer onder *?*: per bezoek, of vast op helder / mist / regen.
- Regen als deeltjes + zacht geluid; een gekozen bui blijft, een bezoekbui kan wegglijden in glinstering.
- Vliegen ongewijzigd.

### Fase B — Architectuur voor wonderen

`world.js` is de god-file (wereld, shaders, loop, input, audio). Splits alleen wat nieuwe wonderen blokkeert:

- `atmosphere.mjs` — dagfase, weer, uniforms
- `wonders.mjs` — register: update, captions, particles
- bestaande encounters blijven zelfstandige modules

Geen grote herschrijving. Alleen deuren openzetten.

### Fase C — Drie nieuwe stilte-wonderen

Kathedraal en poort zijn gebouwd (`cathedral-wonder.mjs`, `gate-wonder.mjs`). Tuinen volgen.  
Geen nieuwe puzzel. Geen nieuwe visioen-afbeelding verplicht.

### Fase D — Visioenen lekken naar de wereld

De zestien bewoners uit `visions.js` zijn al geschreven. Laat er drie *zeldzaam* in de vallei verschijnen, in realtime-stijl, nooit als UI-popup. Wie ze ziet, herkent ze later in het visioen.

### Fase E — De andere oever (pas later)

De lichtpoort belooft een bos dat hier niet groeit. Dat is de enige gerechtvaardigde “nieuwe wereld”: dezelfde schaal, andere lucht, andere flora. Niet eerder beginnen dan wanneer deze vallei op meerdere uren en weersomstandigheden leeft.

---

## Technische houding

- Blijf WebGL2, vanilla, `dist/` als bron.
- Nieuwe schoonheid eerst in **licht, water, geluid, gedrag**. Daarna mesh-detail (dat staat al in art-direction: kathedraal, poort, bewoners).
- Tests blijven de vangrail: puzzels, intro, encounters. Visuele QA in de browser, zoals nu.
- `localStorage` mag sfeer onthouden (`elyndra-last-hour`, gevonden wonderen), met dezelfde fallback als nu.
- Mobiel blijft spaarzamer: minder deeltjes, lagere schaduw.

---

## Eerste stap die ik zou zetten

Niet de kaart. Niet een engine. **Licht.**

De shader kent `night` al. Als die van een schakelaar een ademhaling wordt, verandert elke plek die er al is — beek, kathedraal, poort, tuinen — zonder één nieuwe boom.

Daarna: één nieuw stilte-wonder in de kathedraal, als bewijs dat het register werkt.

---

## Beslissingen die open blijven

Vastgelegd op 11 september 2026:

1. Automatische dagcyclus: ja. Acht minuten per etmaal. De lichtknop springt naar het volgende uur.
2. Weer per bezoek, en instelbaar: ja. Standaard kiest het woud; onder *?* kun je helder, mist of regen vastzetten. Bezoekregen kan later in glinstering overgaan.
3. Vliegen blijft altijd vrij.
