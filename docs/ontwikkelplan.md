# Elyndra · ontwikkelplan

Afgestemd op 2 november 2026. Basis: commit `697b6e5e4a44801cc32d181b19b72791fb879ce3`.

## Koers en werkwijze

Een compacte vallei waarin natuur en vriendelijke machines samenleven. Verdieping door schoonheid, ontdekking en herkenning. Vrij wandelen en vliegen, de vier visioenen, Nederlandstalige gesprekken en rustig spelen blijven uitgangspunten.

De oorspronkelijke stappen 1 t/m 5 komen eerst. **Daarna** volgt het vergezicht: meer avontuur en verhaal, vervolgens mooiere beelden, vervolgens levendigere bewoners. Deze volgorde volgt de verduidelijking van AJ op 2 november. De eerdere ideeën over verhaal en bewoners binnen stappen 3–5 blijven dus onderdeel van de eerste reeks.

Elke stap levert een afzonderlijk beoordeelbare versie op. Eerst implementatie, passende tests en visuele beoordeling, dan samen kijken. Een branch en pull request maken de wijzigingen reviewbaar; samenvoegen naar `main` publiceert automatisch via GitHub Pages en wordt apart afgestemd. Stand op 7 november 2026: stappen 1–5 zijn gepubliceerd. Stap 6 begint met de eerste uitnodiging voor een samenkomst van bosbewoners. De eekhoorn krijgt één volledige speelbare ontmoeting, inclusief een korte scène in de spelwereld. Deze versie wordt apart beoordeeld vóór publicatie.

## Eerste reeks

| Stap | Resultaat | Afbakening en gereedcriterium | Afhankelijkheid |
|---|---|---|---|
| 1 · Beleving controleren | Betrouwbare basis voor doorontwikkeling | Laden, intro, menus, toetsenbord/touch, opslag en bestaande ontmoetingen controleren. Reproduceerbare fouten gericht herstellen. Tests groen; browser- en apparaatbeperkingen expliciet vastleggen. | Huidige versie |
| 2 · De tuinen na de regen | Eén nieuw volledig natuurmoment | Na regen verschijnen druppels, kleine watervallen en zaaddrones rond de bestaande eilanden. Zelf blijven vliegen en kijken; vertrek en terugkeer veilig; sober mobiel en minder beweging ondersteund. Weerconditie moet testbaar zijn. | Stap 1 beoordeeld |
| 3 · Het woud herinnert zich jou | Bestaande ontmoetingen hangen samen | Begin met twee herkenbare reacties: bijvoorbeeld moswachter na drakengroet en tuin bij terugkeer. Op hetzelfde apparaat bewaard; zonder opslag binnen de sessie bruikbaar. Geen verborgen blokkade voor vrij verkennen. | Stap 2 en afgesproken herinneringen |
| 4 · Visioenen worden werkelijkheid | Eén visioenbewoner verschijnt in de vallei | Wortelvos: vanuit zijn visioen naar dageraad, rustig kijken tot hij een bron blootlegt, bron bewaren en veilig terugkeren. Bestaande spontane ontmoetingen blijven mogelijk; eerst deze ontmoeting beoordelen. | Stap 3 beoordeeld |
| 5 · Vier hartslagen samen | Een voelbaar slot van de bestaande puzzelreis | Na vier puzzels reageren licht en bewoners als geheel. Ook bij laden van bestaande voltooide voortgang bereikbaar. Geluid optioneel, minder beweging ondersteund, daarna vrij verkennen. | Stappen 1–4 en gekozen slotontwerp |

## Vergezicht na stap 5

Dit is een volgorde van ontwikkelrondes, geen kalenderbelofte. Omvang en tempo worden per ronde vastgesteld na beoordeling van de vorige. De samenkomst en korte scènes in de spelwereld zijn met AJ als richting gekozen. De vervolgbewoners en de uiteindelijke keuze worden na de eerste ontmoeting verder afgestemd.

### 6 · Meer avontuur en verhaal

Doel: een samenhangende nieuwe reis met nieuwsgierigheid, betekenisvolle handelingen en een afronding.

1. **Nu · de eerste uitnodiging:** na vier hartslagen vraag je de eekhoorn naar de samenkomst. Een scène van tien seconden laat hem afdalen en noten verzamelen. Eén noot rolt weg. De speler pakt hem op en loopt samen met hem naar de moswachter. Geen tijdslimiet; scène overslaan behoudt de opdracht; minder beweging begint direct bij de voorraad met een vaste detailcamera. Voortgang blijft bewaard en de oude monumentontmoeting blijft bestaan.
2. **Daarna · meer gasten en een aanleiding:** werk de uitnodigingen van de wortelvos en de draak uit. Iedere bewoner brengt iets mee vanuit zijn eigen activiteit. Verbind dit aan het zaad van de moswachter; een aankomst van de uil kan de aanleiding vormen. Dit zijn vervolgrichtingen, nog geen gebouwde scènes.
3. **Samenkomst en keuze:** laat de genodigden echt samenkomen. Bespreek waar het zaad mag groeien, bijvoorbeeld bij de bron of in de slapende tuin, en maak het gevolg zichtbaar. Een antwoord vanuit het andere bos kan het volgende hoofdstuk openen. Een nieuw gebied achter de poort blijft een afzonderlijke ontwerpbeslissing.

De eerste ronde bouwt uitsluitend de eekhoornontmoeting. Korte filmische momenten tonen activiteiten in dezelfde 3D-wereld en geven daarna de besturing terug; ze vervangen de handelingen van de speler niet.

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

Stap 6, eerste ontmoeting: herstel de vier hartslagen, reis naar de moswachter en spreek de eekhoorn te voet aan. Kies **Kom je naar een samenkomst bij de moswachter?** en vervolgens **Ik help je. Laat maar zien!** Bekijk of het verzamelen en wegrollen leesbaar zijn. Pak de noot op via de knop of E en volg hem naar de moswachter. Via **Ontdek plekken → De samenkomst** kun je terugkeren na vertrek. Beoordeel ook de vaste camera bij minder beweging, overslaan en de hervatting na herladen.
