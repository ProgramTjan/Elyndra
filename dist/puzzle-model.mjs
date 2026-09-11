export const TITLES=['De wortelstromen','De taal van de poort','De zwevende balans','Het geheugen van de moswachter'];
export const PLACES=['De wortelkathedraal','De lichtpoort','De zwevende tuinen','De moswachter'];
export const RUNES=['Maan','Zaad','Wortel','Ster','Water','Blad'];
export const SYMBOLS=['☾','✧','⌘','✦','≈','❧'];
export const STONES=[[4,1,0],[0,3,2],[2,0,4],[1,4,1],[3,2,2],[2,2,3]];
export const TARGET=[7,5,5];
export const rotate=m=>((m<<1)&15)|(m>>3);
export function rootSolution(){const masks=Array(16).fill(0);let route=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++)route.push(r*4+(r%2?3-c:c));for(let i=1;i<route.length;i++){let a=route[i-1],b=route[i],d=b-a,bit=d===1?2:d===-1?8:d===4?4:1;masks[a]|=bit;masks[b]|=rotate(rotate(bit));}masks[0]|=8;masks[12]|=8;masks[7]|=2;return masks}
export const ROOT_SOLUTION=rootSolution();
export function rootStatus(masks){let powered=new Set(),queue=[];if(masks[0]&8){queue.push(0);powered.add(0)}const dirs=[[-4,1,4],[1,2,8],[4,4,1],[-1,8,2]];let leaks=0;while(queue.length){let i=queue.shift();for(let [delta,bit,opposite]of dirs){if(!(masks[i]&bit))continue;let j=i+delta,valid=j>=0&&j<16&&!(delta===1&&i%4===3)&&!(delta===-1&&i%4===0);if(!valid){if(!((i===0&&bit===8)||(i===12&&bit===8)||(i===7&&bit===2)))leaks++;continue;}if(!(masks[j]&opposite)){leaks++;continue;}if(!powered.has(j)){powered.add(j);queue.push(j)}}}return{powered,leaks,solved:powered.size===16&&leaks===0&&!!(masks[12]&8)&&!!(masks[7]&2)}}
export function runeClues(slots){const pos=x=>slots.indexOf(x);return[pos(3)===3,pos(1)>=0&&pos(2)===pos(1)+1,pos(2)>=0&&pos(4)>pos(2),pos(0)>=0&&pos(1)>pos(0),pos(4)>=0&&pos(5)===pos(4)+1]}
export function runesSolved(slots){return slots.length===6&&new Set(slots).size===6&&slots.every(x=>Number.isInteger(x)&&x>=0&&x<6)&&runeClues(slots).every(Boolean)}
export function totals(active){return TARGET.map((_,j)=>STONES.reduce((sum,s,i)=>sum+(active[i]?s[j]:0),0))}
export function balanceSolved(active){return active.filter(Boolean).length===3&&totals(active).every((x,j)=>x===TARGET[j])}
export function freshState(){return{version:1,solved:[false,false,false,false],hints:[0,0,0,0],pipes:ROOT_SOLUTION.map((m,i)=>{for(let k=0;k<(i*7+1)%4;k++)m=rotate(m);return m}),runes:Array(6).fill(null),stones:Array(6).fill(false),round:0,sequence:[1,3,0,2,1,0,3]}}
export function restoreState(raw){let s=freshState();try{const p=JSON.parse(raw);if(p?.version!==1)return s;for(let i=0;i<4;i++){s.solved[i]=p.solved?.[i]===true;s.hints[i]=Math.max(0,Math.min(3,Number(p.hints?.[i])||0))}if(Array.isArray(p.pipes)&&p.pipes.length===16&&p.pipes.every((v,i)=>{let x=ROOT_SOLUTION[i];for(let j=0;j<4;j++){if(v===x)return true;x=rotate(x)}return false}))s.pipes=p.pipes;if(Array.isArray(p.runes)&&p.runes.length===6&&p.runes.every(x=>x===null||Number.isInteger(x)&&x>=0&&x<6)&&new Set(p.runes.filter(x=>x!==null)).size===p.runes.filter(x=>x!==null).length)s.runes=p.runes;if(Array.isArray(p.stones)&&p.stones.length===6&&p.stones.every(x=>typeof x==='boolean'))s.stones=p.stones;s.round=Number.isInteger(p.round)?Math.max(0,Math.min(2,p.round)):0;}catch{}return s}
