# Elyndra · ontwikkelplan

Afgestemd op 2 november 2026. Basis: commit `697b6e5e4a44801cc32d181b19b72791fb879ce3`.

## Koers en werkwijze

Een compacte vallei waarin natuur en vriendelijke machines samenleven. Verdieping door schoonheid, ontdekking en herkenning. Vrij wandelen en vliegen, de vier visioenen, Nederlandstalige gesprekken en rustig spelen blijven uitgangspunten.

De oorspronkelijke stappen 1 t/m 5 komen eerst. **Daarna** volgt het vergezicht: meer avontuur en verhaal, vervolgens mooiere beelden, vervolgens levendigere bewoners. Deze volgorde volgt de verduidelijking van AJ op 2 november. De eerdere ideeën over verhaal en bewoners binnen stappen 3–5 blijven dus onderdeel van de eerste reeks.

Elke stap levert een afzonderlijk beoordeelbare versie op. Eerst implementatie, passende tests en visuele beoordeling, dan samen kijken. Een branch en pull request maken de wijzigingen reviewbaar; samenvoegen naar `main` publiceert automatisch via GitHub Pages en wordt apart afgestemd. Stand op 6 november 2026: stappen 1–4 zijn gepubliceerd. Stap 5 is uitgewerkt op `codex/elyndra-step-5`. Na de vier letters brengt een vrijwillig bezoek aan de moswachter hun antwoorden samen. Een blad in zijn hand en vier lichten in de vallei bewaren het slot. De volgende ontwikkelronde na beoordeling en publicatie is stap 6, avontuur en verhaal.

## Eerste reeks

| Stap | Resultaat | Afbakening en gereedcriterium | Afhankelijkheid |
|---|---|---|---|
| 1 · Beleving controleren | Betrouwbare basis voor doorontwikkeling | Laden, intro, menus, toetsenbord/touch, opslag en bestaande ontmoetingen controleren. Reproduceerbare fouten gericht herstellen. Tests groen; browser- en apparaatbeperkingen expliciet vastleggen. | Huidige versie |
| 2 · De tuinen na de regen | Eén nieuw volledig natuurmoment | Na regen verschijnen druppels, kleine watervallen en zaaddrones rond de bestaande eilanden. Zelf blijven vliegen en kijken; vertrek en terugkeer veilig; sober mobiel en minder beweging ondersteund. Weerconditie moet testbaar zijn. | Stap 1 beoordeeld |
| 3 · Het woud herinnert zich jou | Bestaande ontmoetingen hangen samen | Begin met twee herkenbare reacties: bijvoorbeeld moswachter na drakengroet en tuin bij terugkeer. Op hetzelfde apparaat bewaard; zonder opslag binnen de sessie bruikbaar. Geen verborgen blokkade voor vrij verkennen. | Stap 2 en afgesproken herinneringen |
| 4 · Visioenen worden werkelijkheid | Eén visioenbewoner verschijnt in de vallei | Wortelvos: vanuit zijn visioen naar dageraad, rustig kijken tot hij een bron blootlegt, bron bewaren en veilig terugkeren. Bestaande spontane ontmoetingen blijven mogelijk; eerst deze ontmoeting beoordelen. | Stap 3 beoordeeld |
| 5 · Vier hartslagen samen | Een voelbaar slot van de bestaande puzzelreis | Na vier puzzels reageren licht en bewoners als geheel. Ook bij laden van bestaande voltooide voortgang bereikbaar. Geluid optioneel, minder beweging ondersteund, daarna vrij verkennen. | Stappen 1–4 en gekozen slotontwerp |

## Vergezicht na stap 5

Dit is een volgorde van ontwikkelrondes, geen kalenderbelofte. Omvang en tempo worden per ronde vastgesteld na beoordeling van de vorige. De concrete verhaalscènes hieronder zijn voorstellen om later samen uit te werken.

### 6 · Meer avontuur en verhaal

Doel: een samenhangende nieuwe reis met nieuwsgierigheid, betekenisvolle handelingen en een afronding.

1. **Verhaalontwerp:** bepaal met AJ de centrale vraag, de rol van de speler en de verbinding met de vier hartslagen. Mogelijke richting: waarom bewaakt de moswachter het zaad, en wat laat het andere bos in de lichtpoort zien? Leg de hoofdlijn en twee of drie ontmoetingen vast voordat we bouwen.
2. **Eerste speelbare hoofdstuk:** bouw één begin–ontdekking–keuze–gevolg in de bestaande vallei. Aanwijzingen via plekken, gedrag en korte gesprekken. De speler kan onderbreken en verdergaan; bestaande opgeslagen voortgang blijft bruikbaar.
3. **Vervolg en afronding:** breid alleen na beoordeling uit. Geef een keuze een zichtbaar gevolg in de omgeving of een ontmoeting. Een gebied achter de poort blijft een afzonderlijke ontwerpbeslissing; het is geen voorwaarde voor een goed verhaal.

Gereed wanneer een nieuwe speler de verhaallijn zonder externe uitleg kan volgen, de belangrijkste keuze begrijpt en de afloop in de wereld herkent. Vrij verkennen blijft mogelijk.

### 7 · Mooiere beelden

Doel: de gekozen verhaalplekken overtuigender laten ogen, met aantoonbaar bruikbare prestaties.

1. Maak vaste vergelijkingsbeelden en meet de huidige prestaties op een afgesproken laptop en telefoon.
2. Werk één beeldbepalende plek uit: licht, materialen, water, compositie en detail. Vergelijk op dezelfde camerapositie, tijd en kwaliteitsinstelling.
3. Trek de geslaagde aanpak door naar de overige verhaalplekken. Bepaal een prestatiebudget op basis van de nulmeting; optimaliseer wat gemeten knelpunten veroorzaakt.

Gereed wanneer voor/na-beelden een duidelijke verbetering laten zien en het afgesproken apparaatbudget gehaald wordt. De visioenen zijn artistieke referenties; fotorealisme in realtime wordt niet vooraf beloofd. Een enginewissel vraagt een onderbouwde afzonderlijke beslissing.

### 8 · Levendigere bewoners

Doel: bewoners laten voelen alsof zij ook zonder de speler een leven hebben.

1. Begin met één bestaande bewoner: een korte dagelijkse routine met rust, verplaatsing en een reactie op weer en nabijheid.
2. Voeg één relatie tussen bewoners toe, bijvoorbeeld een ontmoeting bij de beek. Bestaande begeleidingsroutes en puzzels behouden voorrang waar dat nodig is.
3. Breid herkenning bij terugkeer en geschreven dialogen uit. Bewoners kunnen een activiteit hervatten na een gesprek of onderbreking.

Gereed wanneer gedrag leesbaar en gevarieerd is, routes niet vastlopen en bewoners consequent reageren op de speler, elkaar en de omgeving. Begin met geschreven gedrag en dialoog; vrije AI-chat is geen vereiste.

## Eerstvolgende beoordelmoment

Stap 5: kies na de vierde letter of vanuit **Avontuur** voor **Beluister de vier hartslagen bij de moswachter**. Bekijk de vier reacties in de vallei en keer later terug naar het jonge blad. Een bestaande volledige puzzelvoortgang geeft dezelfde toegang. Beoordeel vooral of het samenkomen van de vier plekken leesbaar is en het slot voldoende tijd krijgt.
