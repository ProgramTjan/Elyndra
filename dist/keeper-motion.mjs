export function keeperPose(time,age,position,base,reduced=false){
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
 const greeting=age<0?0:smooth(age/2)*(1-smooth((age-5)/3));
 const dx=position[0]-86,dz=position[2]-36,dy=base+21-position[1];
 const yaw=Math.max(-.8,Math.min(.8,Math.atan2(dx,dz))),pitch=Math.max(-.25,Math.min(.65,Math.atan2(dy,Math.hypot(dx,dz))));
 return [reduced?0:Math.sin(time*.8)*.065,.65+(yaw-.65)*greeting,.35+(pitch-.35)*greeting,reduced?0:(.5+.5*Math.sin(time*.55))*.035];
}
