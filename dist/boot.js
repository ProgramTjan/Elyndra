const status=document.getElementById('start-status');
try {
  await import('./quests.js?v=garden21');
  await import('./world.js?v=garden21');
  await import('./visions.js?v=garden21');
  await import('./conversations.js?v=garden21');
  const enter=document.getElementById('enter'),direct=document.getElementById('start-direct');
  enter.disabled=false;direct.disabled=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  enter.textContent=reduced?'Bekijk intro met camerabeweging':'Bekijk introductie · 22 sec';
  status.textContent=reduced?'Liever geen camerabeweging? Kies Speluitleg & beginnen.':'Vier hoofdstukken in 22 seconden. Je kunt de film altijd overslaan.';
} catch(error) {
  console.error('Elyndra could not start',error);
  const welcome=document.getElementById('welcome');
  if(status?.isConnected) status.textContent='Het woud kon niet starten. Herlaad de pagina en probeer het opnieuw.';
  const retry=document.createElement('button');retry.textContent='Pagina opnieuw laden';retry.className='primary';retry.onclick=()=>location.reload();welcome.appendChild(retry);
}
