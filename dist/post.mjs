// Nabewerking van het beeld: gloed rond alles wat licht geeft, lichtstralen
// vanuit zon of maan, en een zachte kleurgradatie per uur.
// De wereld tekent eerst naar een eigen beeldbuffer; hier wordt die afgewerkt.
// Het alfakanaal van de wereld is het gloedmasker: 0 = geen gloed, 1 = lichtbron.

// Waar staat de zon op het scherm? Geeft uv (0..1) en of ze voor de camera staat.
export function sunOnScreen(viewProjection,eye,sunDir){
  const m=viewProjection,x=eye[0]+sunDir[0]*500,y=eye[1]+sunDir[1]*500,z=eye[2]+sunDir[2]*500;
  const cx=m[0]*x+m[4]*y+m[8]*z+m[12],cy=m[1]*x+m[5]*y+m[9]*z+m[13],cw=m[3]*x+m[7]*y+m[11]*z+m[15];
  if(!(cw>.001))return {uv:[.5,.5],visible:0};
  const u=cx/cw*.5+.5,v=cy/cw*.5+.5;
  // Net buiten beeld mag de zon nog stralen werpen; verder weg dooft het uit.
  const outside=Math.max(0,-u,u-1,-v,v-1);
  return {uv:[u,v],visible:Math.max(0,1-outside/.45)};
}

// Hoe sterk de stralen zijn: het sterkst bij laag, warm licht en in nevel; zwak bij maanlicht.
export function rayStrength({visible=0,warmth=0,night=0,mist=0}={}){
  const day=(.42+.6*warmth)*(1-night),moon=.26*night;
  return Math.max(0,Math.min(1,visible))*(day+moon)*(1+.7*Math.min(1,mist));
}

const VERT=`#version 300 es
precision highp float;out vec2 uv;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const BRIGHT=`#version 300 es
precision highp float;in vec2 uv;uniform sampler2D sceneTex;uniform vec2 texel;out vec4 o;
void main(){vec4 s=texture(sceneTex,uv+texel*vec2(-1.,-1.))+texture(sceneTex,uv+texel*vec2(1.,-1.))+texture(sceneTex,uv+texel*vec2(-1.,1.))+texture(sceneTex,uv+texel*vec2(1.,1.));s*=.25;
float peak=max(s.r,max(s.g,s.b));o=vec4(s.rgb*(s.a*2.6+smoothstep(.82,1.,peak)*.22),1.);}`;
const BLUR=`#version 300 es
precision highp float;in vec2 uv;uniform sampler2D blurTex;uniform vec2 blurStep;out vec4 o;
void main(){vec3 c=texture(blurTex,uv).rgb*.2270;c+=(texture(blurTex,uv+blurStep*1.3846).rgb+texture(blurTex,uv-blurStep*1.3846).rgb)*.3162;c+=(texture(blurTex,uv+blurStep*3.2308).rgb+texture(blurTex,uv-blurStep*3.2308).rgb)*.0703;o=vec4(c,1.);}`;
const RAYS=`#version 300 es
precision highp float;in vec2 uv;uniform sampler2D depthTex;uniform vec2 sunUV;uniform float aspect;out vec4 o;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){const int STEPS=30;vec2 stride=(sunUV-uv)/float(STEPS)*.92;vec2 p=uv+stride*hash(gl_FragCoord.xy);float light=0.,decay=1.;
for(int i=0;i<STEPS;i++){float open=step(.999995,texture(depthTex,p).r);vec2 d=(p-sunUV)*vec2(aspect,1.);float near=1./(1.+dot(d,d)*5.);light+=open*near*decay;decay*=.962;p+=stride;}
vec2 away=(uv-sunUV)*vec2(aspect,1.);o=vec4(vec3(light/float(STEPS))*(1./(1.+dot(away,away)*1.6)),1.);}`;
const COMPOSE=`#version 300 es
precision highp float;in vec2 uv;uniform sampler2D sceneTex;uniform sampler2D bloomTex;uniform sampler2D raysTex;uniform float bloomAmt;uniform float raysAmt;uniform vec3 raysTint;uniform float warmth;uniform float night;uniform float grain;out vec4 o;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec3 c=texture(sceneTex,uv).rgb;vec3 glow=texture(bloomTex,uv).rgb*bloomAmt;c+=glow*(1.-c*.55);
vec3 shaft=raysTint*texture(raysTex,uv).r*raysAmt;c+=shaft*(1.-c*.7);
float l=dot(c,vec3(.2126,.7152,.0722));
c=mix(vec3(l),c,1.+.10*(1.-night)+.07*warmth);
c+=mix(vec3(0.,.008,.016),vec3(.010,.020,.048),night)*(1.-smoothstep(0.,.42,l));
c*=mix(vec3(1.),vec3(1.06,1.,.92),warmth*.55*smoothstep(.28,.9,l));
c=max(c,0.);c=mix(c,c*c*(3.-2.*c),.20*(1.-night*.6));
c=mix(c,pow(c,vec3(.78)),night*.5);
c+=(hash(gl_FragCoord.xy+grain)-.5)/255.;o=vec4(c,1.);}`;

export function createPost(gl){
  const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const link=(fragment,names)=>{const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,VERT));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));const u={};for(const n of names)u[n]=gl.getUniformLocation(p,n);return {p,u};};
  let programs;
  try{programs={bright:link(BRIGHT,['sceneTex','texel']),blur:link(BLUR,['blurTex','blurStep']),rays:link(RAYS,['depthTex','sunUV','aspect']),compose:link(COMPOSE,['sceneTex','bloomTex','raysTex','bloomAmt','raysAmt','raysTint','warmth','night','grain'])};}
  catch(error){console.warn('Elyndra post-processing unavailable',error);return {ready:false,resize(){},begin(){return false;},end(){}};}
  const quad=gl.createVertexArray();
  const texture=(w,h,depth=false)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    if(depth)gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,w,h,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    const f=depth?gl.NEAREST:gl.LINEAR;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;};
  const target=(w,h)=>{const tex=texture(w,h),fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);return {tex,fbo,w,h};};
  const complete=()=>gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  let scene=null,msaa=null,small=[],rays=null,owned=[],width=0,height=0,ready=false,began=false;
  function release(){for(const [kind,o] of owned){if(kind==='t')gl.deleteTexture(o);else if(kind==='f')gl.deleteFramebuffer(o);else gl.deleteRenderbuffer(o);}owned=[];scene=msaa=rays=null;small=[];ready=false;}
  function resize(w,h,samples=0){
    release();width=Math.max(4,w|0);height=Math.max(4,h|0);
    try{
      const color=texture(width,height),depth=texture(width,height,true),fbo=gl.createFramebuffer();owned.push(['t',color],['t',depth],['f',fbo]);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,color,0);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);
      if(!complete())throw Error('scene target incomplete');scene={fbo,color,depth};
      const most=Math.min(samples,gl.getParameter(gl.MAX_SAMPLES)||0);
      if(most>1){
        const mf=gl.createFramebuffer(),rc=gl.createRenderbuffer(),rd=gl.createRenderbuffer();owned.push(['f',mf],['r',rc],['r',rd]);
        gl.bindRenderbuffer(gl.RENDERBUFFER,rc);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,most,gl.RGBA8,width,height);
        gl.bindRenderbuffer(gl.RENDERBUFFER,rd);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,most,gl.DEPTH_COMPONENT24,width,height);
        gl.bindFramebuffer(gl.FRAMEBUFFER,mf);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,rc);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rd);
        if(complete())msaa={fbo:mf};
      }
      const qw=Math.max(2,width>>2),qh=Math.max(2,height>>2);
      small=[target(qw,qh),target(qw,qh)];rays=target(qw,qh);
      for(const t of [...small,rays]){owned.push(['t',t.tex],['f',t.fbo]);gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);if(!complete())throw Error('blur target incomplete');}
      ready=true;
    }catch(error){console.warn('Elyndra post-processing disabled',error);release();}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindTexture(gl.TEXTURE_2D,null);
  }
  // Roep aan vlak voor de wereld getekend wordt. Geeft false als er rechtstreeks getekend wordt.
  function begin(){
    began=ready;if(!ready)return false;
    gl.bindFramebuffer(gl.FRAMEBUFFER,msaa?msaa.fbo:scene.fbo);gl.viewport(0,0,width,height);return true;
  }
  function pass(program,dest,w,h){gl.useProgram(program.p);gl.bindFramebuffer(gl.FRAMEBUFFER,dest);gl.viewport(0,0,w,h);gl.drawArrays(gl.TRIANGLES,0,3);}
  const bind=(unit,tex)=>{gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);};
  // Roep aan nadat alles getekend is. rich: brede gloed en lichtstralen (alleen de mooie stand).
  function end({sun=[.5,.5],rays:rayAmount=0,tint=[1,.9,.7],warmth=0,night=0,rich=true,time=0}={}){
    if(!began)return;began=false;
    if(msaa){gl.bindFramebuffer(gl.READ_FRAMEBUFFER,msaa.fbo);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,scene.fbo);
      gl.blitFramebuffer(0,0,width,height,0,0,width,height,gl.COLOR_BUFFER_BIT,gl.NEAREST);gl.blitFramebuffer(0,0,width,height,0,0,width,height,gl.DEPTH_BUFFER_BIT,gl.NEAREST);}
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.depthMask(false);gl.bindVertexArray(quad);
    const [a,b]=small;
    gl.useProgram(programs.bright.p);bind(0,scene.color);gl.uniform1i(programs.bright.u.sceneTex,0);gl.uniform2f(programs.bright.u.texel,1/width,1/height);pass(programs.bright,a.fbo,a.w,a.h);
    gl.useProgram(programs.blur.p);gl.uniform1i(programs.blur.u.blurTex,0);
    for(const spread of rich?[1.2,3]:[1.6]){
      bind(0,a.tex);gl.uniform2f(programs.blur.u.blurStep,spread/a.w,0);pass(programs.blur,b.fbo,b.w,b.h);
      bind(0,b.tex);gl.uniform2f(programs.blur.u.blurStep,0,spread/a.h);pass(programs.blur,a.fbo,a.w,a.h);
    }
    const shafts=rich&&rayAmount>.004;
    if(shafts){gl.useProgram(programs.rays.p);bind(0,scene.depth);gl.uniform1i(programs.rays.u.depthTex,0);gl.uniform2f(programs.rays.u.sunUV,sun[0],sun[1]);gl.uniform1f(programs.rays.u.aspect,width/height);pass(programs.rays,rays.fbo,rays.w,rays.h);}
    const c=programs.compose;gl.useProgram(c.p);bind(0,scene.color);bind(1,a.tex);bind(2,rays.tex);
    gl.uniform1i(c.u.sceneTex,0);gl.uniform1i(c.u.bloomTex,1);gl.uniform1i(c.u.raysTex,2);
    gl.uniform1f(c.u.bloomAmt,rich?1.5:1.2);gl.uniform1f(c.u.raysAmt,shafts?rayAmount:0);gl.uniform3f(c.u.raysTint,tint[0],tint[1],tint[2]);
    gl.uniform1f(c.u.warmth,warmth);gl.uniform1f(c.u.night,night);gl.uniform1f(c.u.grain,time%61);
    pass(c,null,width,height);
    bind(2,null);bind(1,null);bind(0,null);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);
  }
  return {get ready(){return ready;},resize,begin,end};
}
