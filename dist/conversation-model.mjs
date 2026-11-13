export const SPEAKERS={fox:{name:'De wortelvos',tag:'Wat het water bewaart'},keeper:{name:'De moswachter',tag:'Onder de jonge boom'},deer:{name:'Het witte hert',tag:'Een rustig ogenblik'},squirrel:{name:'De eekhoorn',tag:'Vanaf de hand van de moswachter'},dragon:{name:'De draak',tag:'Warmte onder oude veren'}};
export function conversationNode(who,node,context={}){
 const monument=!!context.monument;
 const solved=!!context.solved,all=!!context.all,met=!!context.met,roots=!!context.roots,gate=!!context.gate,gardens=!!context.gardens;
 const guest=context.dragonGuestPhase??'idle';
 const trees={
 // De draak spreekt niet in woorden. Wat hij bedoelt, lees je aan hem af.
 dragon:{
  start:{text:guest==='done'?'De draak ligt met zijn kop op zijn voorpoten, één oog op de lantaarn. Zijn flanken gaan langzaam op en neer. Zolang hij hier ligt, wordt de gloed niet koud.':guest==='offering'?'Hij duwt met zijn snuit in de richting van de moswachter en blaast een pluisje van je schouder. Ga maar.':guest==='kindle'?'Hij houdt zijn adem in en kijkt naar je handen. De gloed flakkert nog. Sta stil, lijkt hij te zeggen.':guest==='ember'?'De draak schuift de lantaarn met één klauw een eindje naar je toe en trekt zijn poot dan terug.':'De draak ruikt aan je mouw. Hij ruikt de bron, de noten, de moswachter. Zijn staartpunt tikt één keer op de grond.',choices:context.dragonGuestAvailable?[['Kom je ook naar de samenkomst?','guestInvitation'],['Ik blijf even bij je staan.','end']]:[['Tot zo, oude draak.','end']]},
  guestInvitation:{text:'Hij kijkt lang naar het oosten, waar de moswachter staat. Dan draait hij zijn kop naar iets tussen de wortels: een zaadlantaarn, dof en koud.\n\nGeen hapjes. Geen herinnering. Hij ademt warm over je hand, alsof hij vraagt of je begrijpt wat hij wil meebrengen.',choices:[['Ik help je. Laat maar zien.','dragonGuestStart'],['Straks. Ik kom terug.','end']]}
 },
 fox:{
  start:{text:context.foxPhase==='done'?'“Water geeft niets haast. Misschien moeten we het zaad ook eerst laten luisteren.” De vos vouwt zijn staart om zijn poten.':context.foxPhase==='offering'?'“Vraag hem naar het teken. Zijn handen herinneren zich soms meer dan zijn hoofd.”':context.foxPhase==='carry'||context.foxPhase==='arrival'?'“Jij draagt het fragment. Ik vind de weg. We zien elkaar bij de moswachter.”':context.foxPhase==='wash'||context.foxPhase==='washing'?'“Het bronwater weet hoe je aarde loslaat. Probeer het daar.”':context.foxPhase==='fragment'?'“Daar, naast mijn poot. Neem het maar. Ik denk dat het bij jullie boompje hoort.”':'“Ik hoor water onder de wortels. Maar vandaag houdt het nog iets anders verborgen.”',choices:context.foxAvailable?[['Kom je naar de samenkomst?','invitation'],['Ik luister even mee.','end']]:[['Tot zo, wortelvos.','end']]},
  invitation:{text:'“De eekhoorn brengt eten? Dan breng ik een herinnering.” Hij legt zijn oor tegen de aarde. “Hier ligt iets ouds. Wil je helpen?”',choices:[['Ik help je. Wat heb je gevonden?','foxStart'],['Straks. Ik kom terug.','end']]}
 },
 keeper:{
 start:{text:monument?'Zijn bescheidenheid is indrukwekkend, hè? Sinds jij zijn beeld hebt gezien, noemt hij mijn hand zijn ontvangstzaal. Ik heb besloten daar niet op in te gaan.':solved?(all?'Hoor je het? Vier hartslagen. Voor het eerst in lange tijd klinkt het woud weer als één geheel. Mijn boompje heeft vannacht een nieuw blad gemaakt.':'Daar ben je weer. Sinds jij het ritme herstelde, herken ik iets in het ruisen van de bladeren. Het klinkt… als een groet.'):(roots||gate||gardens)?'Er klinkt iets in de verte. Nog niet mijn ritme, maar het woud probeert al een zin te vormen.':met?'Je bent terug. Dat vind ik prettig. Het boompje ook, denk ik. Het heeft niets gezegd, maar kijk hoe recht het staat.':'Dag, reiziger. Voorzichtig met die kleine varen bij je voet. Hij heeft de hele ochtend aan dat nieuwe blad gewerkt.',choices:[['Wat bescherm je daar?','tree'],[solved?'Wat herinner je je nu?':'Wie heeft je gebouwd?','memory'],['Mag ik even bij je blijven?','sit']]},
 tree:{text:'Een boom. Nog een heel kleine. Mijn handen zijn gemaakt om zware dingen vast te houden. Het duurde lang voordat ik begreep dat ik ze ook voorzichtig kon gebruiken.',choices:[['Waarom is juist dit boompje zo belangrijk?','promise'],['Hij lijkt zich hier thuis te voelen.','home']]},
 promise:{text:'Iemand legde ooit een zaadje in mijn hand en zei: “Bewaar iets dat nog kan groeien.” De stem ben ik kwijt. De belofte niet.',choices:[['Misschien komt die herinnering terug.','memory'],['Dan houden we samen een oogje op hem.','together']]},
 home:{text:'Ja. Hij heeft licht, water en een eekhoorn die ongevraagd tuinadvies geeft. Wat heeft een boom nog meer nodig?',choices:[['Ik blijf nog even.','sit'],['Tot later, moswachter.','end']]},
 memory:{text:solved?'Een hand, veel kleiner dan de mijne. Een lach. En andere stemmen, ver weg tussen de bomen. Ik denk dat de vier hartslagen ons ooit hielpen elkaar te verstaan — één zin, vier letters.':'Mijn eerste herinnering is lawaai. Daarna een lange stilte. Vier hartslagen vormden vroeger één taal. Het ritme in mijn borst is er één letter van, maar ik ben de zin kwijt.',choices:solved?[['Misschien vinden we de andere stemmen terug.','together'],['Vertel nog eens over het zaadje.','promise']]:[['Zal ik helpen het ritme terug te vinden?','help'],['Je hoeft het niet allemaal nu te weten.','sit']]},
 help:{text:'Graag. Mijn lichten kennen nog een stukje van de zin. Kijk rustig, luister met je ogen en geef het terug. Daarna kunnen we samen horen wat er veranderd is.',choices:[['Ik probeer je lichtritme te herstellen.','puzzle'],['Straks. Eerst even samen zitten.','sit']]},
 sit:{text:'Natuurlijk. We hoeven niets op te lossen terwijl we hier zijn. Soms is blijven al een heel vriendelijke daad.\n\nDe moswachter wacht. Hoog boven je ritselt één jong blad.',choices:[['Dit is een fijne plek.','peace'],['Ik ga weer een stukje dwalen.','end']]},
 peace:{text:'Dan bewaren we dit ogenblik. Niet in een machine. Gewoon… hier.',choices:[['Tot de volgende keer.','end']]},
 together:{text:'Samen. Ja, dat woord herken ik nog. Ga maar op ontdekking. Ik zorg dat er hier iets groens op je wacht.',choices:[['Tot snel.','end']]}
 },
 deer:{
 start:{text:met?'Daar ben je weer. Ik heb de schaduw een stukje gevolgd. Hij wist een heerlijk plekje.':'Goedemorgen. Of middag. Ik houd de tijd bij in zonnige plekjes, dus het blijft een beetje gokken.',choices:[['Wat doe je vandaag?','day'],['Heb je een tip voor mij?','tip'],['Zullen we even niets doen?','rest']]},
 day:{text:'Een beetje wandelen. Een beetje luisteren. Misschien straks hetzelfde, maar dan onder een andere boom. Een uitstekend volle dag.',choices:[['Dat klinkt als een goed plan.','rest'],['Wat hoor je in het woud?','hear']]},
 tip:{text:'Je hoeft niet ieder pad af te lopen om ergens aan te komen. Soms ligt het mooiste vlak naast je hoef. Of voet. Dat is bij jou anders geregeld.',choices:[['Ik zal beter kijken.','rest'],['Tot later, wijze wandelaar.','end']]},
 hear:{text:roots?'De grote boom klinkt vandaag minder alleen. Jij bent daar geweest, hè? Ik dacht al dat de bladeren iets vrolijker ruisten.':gate?'Het water bij de poort ruikt naar een bos dat hier niet groeit. Jij hebt daar geluisterd, denk ik.':gardens?'Boven de mist houden de eilanden elkaar weer vast. Vanaf hier is het een zacht wiegen.':'De wind, een vogel, en een eekhoorn met heel veel plannen. Twee van die drie raad ik aan om rustig naar te luisteren.',choices:[['Waar vind ik die eekhoorn?','friend'],['Ik luister even met je mee.','rest']]},
 friend:{text:'Bij de moswachter. Hij heeft daar een hand als uitkijkplek. Volgens hem is het een zeer exclusief boomhuis.',choices:[['Daar ga ik eens kijken.','end']]},
 rest:{text:'Graag. Ik ben daar behoorlijk goed in.\n\nHet hert laat zijn oren ontspannen. Er hoeft even helemaal niets.',choices:[['Dank je voor de fijne pauze.','end']]}
 },
 squirrel:{
 start:{text:monument?'Ah, mijn favoriete kunstkenner! Je hebt vast gezien hoe goed de beeldhouwer mijn bescheiden kant heeft getroffen. De kroon? Op ware grootte, natuurlijk.':met?'Ah, mijn favoriete bezoeker zonder staart! Ik heb nieuws. De noot ligt ergens anders dan ik dacht. Dat biedt mogelijkheden.':'Welkom op mijn uitkijkplek! De moswachter noemt dit zijn hand. We hebben allebei een beetje gelijk.',choices:[['Heb je het hier naar je zin?','home'],['Wat ben je aan het doen?','nut'],['Vertel eens iets vrolijks.','happy']]},
 home:{text:'Zon op mijn oren, een boom naast mijn bed en een huisbaas die nooit haast heeft. Alleen de lift is nogal langzaam.',choices:[['Jullie passen goed bij elkaar.','keeper'],['En die noot van je?','nut']]},
 nut:{text:'Ik zoek een noot die ik heel slim verstopt heb. Zo slim dat ik mezelf heb verrast. Als ik hem niet vind, wordt het misschien een boom. Ook goed.',choices:[['Dat klinkt als tuinieren met een omweg.','garden'],['Ik duim voor je.','happy']]},
 garden:{text:'Precies! Eindelijk iemand die mijn werkwijze begrijpt. Ik noem het: eerst een tussendoortje, later een bos.',choices:[['Ga vooral zo door.','end'],['Wat vindt de moswachter ervan?','keeper']]},
 keeper:{text:solved?'Hij bromt weer een deuntje sinds jij hem geholpen hebt. Niet helemaal zuiver. Wel heel gezellig.':gate?'Hij kijkt soms naar het zuiden. Alsof de poort een woord vasthoudt dat hij niet kan zeggen.':'Hij vraagt iedere ochtend of ik goed geslapen heb. Ik zeg altijd ja. Zelfs als ik de halve nacht over hazelnoten heb nagedacht.',choices:[['Doe hem de groeten van mij.','end'],['Nog iets vrolijks?','happy']]},
 happy:{text:'Er zit een nieuw blad aan het boompje. Niemand heeft eraan getrokken. Het is helemaal zelf gekomen! Ik vind dat knap.\n\nDe eekhoorn knikt tevreden.',choices:[['Ik ook. Tot snel!','end']]}
 }
 };
 if(who==='keeper' && context.dragonKnown){
  const keeper=trees.keeper;
  if(!context.keeperLight){
   keeper.start.text+=' Hij kantelt zijn hoofd. “Zo boog mijn oude vriend ook. Bij jou heeft hij dat gedaan, hè?”';
  }
  keeper.start.choices[2]=[context.keeperLight?'Hoe gaat het met je oude vriend?':'Bedoel je de draak in de tuin?','dragon'];
  keeper.dragon={
   text:context.keeperLight
    ? '“Leg je hand maar hier.” Onder zijn handpalm voelt de wortel warm. “Dat licht vindt zijn weg wel. Vroeger vond hij mij zo ook, zelfs in de mist.”'
    : '“Toen hij klein was, paste zijn kop hier.” De moswachter houdt zijn hand als een kommetje. “Hij boog altijd eerst. Anders prikte zijn hoorn in mijn duim.”',
   choices:context.keeperLight
    ? [['Mag ik even bij je blijven?','sit'],['Tot later.','end']]
    : [['Kun je hem nog groeten?','sendLight'],['Mag ik even bij je blijven?','sit'],['Tot later.','end']]
  };
  keeper.sendLight={
   text:'Hij legt een vinger op een wortel. Een vonkje verdwijnt onder het mos. “De tuin heeft twee lampjes voor jou. Als je straks een derde ziet, weet je van wie die is.”',
   choices:[['Ik ga kijken.','end'],['Ik blijf nog even.','sit']]
  };
 }
 if(context.all){
  const sq=trees.squirrel;
  if(context.gatheringPhase==='idle')trees.keeper.start.text+=' “Nu we elkaar weer verstaan, zouden we eens samen kunnen komen. Vraag de eekhoorn maar of hij iets wil meenemen.”';
  if(context.gatheringPhase==='done'){
   sq.start.text='De eerste hapjes liggen klaar bij de moswachter. “Ik heb ze geteld. Twee keer. Voor de zekerheid ook geproefd. Eén keer.”';
   trees.keeper.start.text+=' “Onze eerste gast heeft de hapjes gebracht. Er is plek voor meer.”';
  }else if(['needNut','escort','arrival'].includes(context.gatheringPhase)){
   sq.start.text=context.gatheringPhase==='needNut'?'“Mijn noot! Op het pad, vlak achter me. Wil jij hem pakken? Dan kunnen we samen naar de moswachter.”':'“Kom, naar de moswachter! Een samenkomst begint met iemand die iets meebrengt.”';
  }else if(context.gatheringAvailable){
   sq.start.choices[2]=['Kom je naar een samenkomst bij de moswachter?','gathering'];
   sq.gathering={text:'“Een samenkomst? Met iedereen?” Zijn staart veert overeind. “Dan neem ik de hapjes mee. Wacht, ik heb een voorraad. Deze keer weet ik wél waar.”',choices:[['Ik help je. Laat maar zien!','gatheringStart'],['Straks. Bewaar wat voor me.','end']]};
  }
 }
 if(context.foxCanDeliver){
  trees.keeper.start.choices[1]=['Ik heb een wortelfragment voor je.','foxClue'];
  trees.keeper.foxClue={text:'De moswachter volgt het teken met één vinger. “Een open zaad… Dit zat om het zaadje dat ik bewaar.”\n\nHij kijkt naar de wortelvos. “Het kende deze bron al voordat het bij mij kwam.”\n\nDe vos gaat bij de hapjes zitten. “Dan weten we waar we straks kunnen luisteren.”',choices:[['Dan bewaren we het bij elkaar.','end']]};
 }else if(context.gatheringPhase==='done'&&context.foxPhase==='idle'){
  trees.keeper.start.text+=' “De wortelvos luistert bij zijn bron. Misschien wil hij ook komen. Je vindt hem via Ontdek plekken.”';
 }
 if(context.dragonCanDeliver){
  trees.keeper.start.choices[1]=['Ik breng warmte van de draak.','dragonWarmth'];
  trees.keeper.dragonWarmth={text:'De moswachter neemt de lantaarn in zijn hand, zoals hij vroeger een kleine draak vasthield. Het licht kruipt tussen zijn vingers door.\n\n“Hij weet het nog.” Zijn stem kraakt. “Het zaad heeft de hele winter in mijn hand gelegen, en mijn handen zijn van steen. Het had het koud.”\n\nAchter hem laat de draak zijn kop zakken. De vos kijkt naar de bron, de eekhoorn naar de hapjes.\n\n“Water, een teken en warmte. Nu hoeven we alleen nog te bedenken waar het mag groeien.”',choices:[['Daar denken we samen over na.','end']]};
 }
 if(guest==='done'){
  trees.keeper.start.text+=' “Drie gasten. Water, een teken en warmte. Het zaad wacht alleen nog op een plek.”';
 }else if(context.foxPhase==='done'){
  trees.keeper.start.text+=' “Twee gasten en een herinnering. Het zaad kende de bron al.”'+(guest==='idle'?' Hij kijkt naar de lucht. “Mijn oude vriend rust vaak niet ver van de wortelkathedraal. Hij komt niet voor hapjes. Vraag hem toch maar.”':'');
 }
 return trees[who]?.[node];
}
export function nearbySpeakers(position,deer,base,squirrel=null,fox=null,dragon=null){const distance=p=>Math.hypot(...p.map((v,i)=>v-position[i]));return [...(dragon?[{id:'dragon',p:[dragon[0],dragon[1]+.6,dragon[2]],r:12}]:[]),...(fox&&fox.fade>.5?[{id:'fox',p:[fox.position[0],fox.position[1]+.7,fox.position[2]],r:8}]:[]),{id:'keeper',p:[86,base+6,36],r:22},{id:'squirrel',p:squirrel?[squirrel[0],squirrel[1]+1,squirrel[2]]:[96,base+16,43],r:squirrel&&Math.hypot(squirrel[0]-96,squirrel[2]-43)>3?9:20},{id:'deer',p:[deer[0],deer[1]+1.8,deer[2]],r:8}].filter(x=>distance(x.p)<x.r).sort((a,b)=>distance(a.p)-distance(b.p)).map(x=>x.id);}
