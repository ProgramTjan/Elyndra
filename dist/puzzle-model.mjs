// De vier ritmes van de vallei. De oude puzzels zijn vervangen door spellen in de wereld zelf;
// hier blijft alleen wat de kroniek nodig heeft: namen, plekken en de opgeslagen voortgang.
export const TITLES=['Het water','Het licht','De adem','De stem'];
export const PLACES=['De wortelkathedraal','De lichtpoort','De zwevende tuinen','De moswachter'];
export const GAMES=['De waterloop','Het lichtspoor','De vlucht','Het luisterspel'];
// `hints` blijft in de opslag staan zodat oudere versies van het spel de save nog lezen.
export function freshState(){return{version:1,solved:[false,false,false,false],hints:[0,0,0,0]}}
// Oude saves bevatten ook pipes/runes/stones/round/sequence; die laten we bewust liggen.
export function restoreState(raw){const s=freshState();try{const p=JSON.parse(raw);if(p?.version!==1)return s;for(let i=0;i<4;i++)s.solved[i]=p.solved?.[i]===true}catch{}return s}
