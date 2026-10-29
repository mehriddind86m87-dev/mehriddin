"use strict";
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
let composer=null, gradePass=null, bloomPass=null;
function resize(){ renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); if(composer) composer.setSize(innerWidth, innerHeight); }

function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function sstep(a,b,x){ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); }
function lerp(a,b,t){ return a+(b-a)*t; }
function mixA(a,b,t){ return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]; }

// ===== FASL / KUN-TUN / OB-HAVO (har o'yinda tasodifiy) =====
const SEASON = pick(['bahor','yoz','yoz','kuz','qish']);
let WEATHER = pick(['ochiq','ochiq','ochiq','bulutli','yomgir','tuman']);
if(SEASON==='qish') WEATHER = pick(['qor','qor','bulutli','ochiq','tuman']);
const TOD = pick(['kun','kun','kun','tong','kech','tun']);
const SEASON_UZ={bahor:'Bahor',yoz:'Yoz',kuz:'Kuz',qish:'Qish'};
const TOD_UZ={kun:'☀ Kun',tong:'🌅 Tong',kech:'🌇 Kech',tun:'🌙 Tun'};
const WEATHER_UZ={ochiq:'Ochiq',bulutli:'Bulutli',yomgir:"Yomg'ir",tuman:'Tuman',qor:'Qor'};
const TODS={
  kun:{sd:[0.55,0.62,0.38],sc:[1,0.94,0.82],si:1.55,hs:[0.75,0.85,1],hg:[0.30,0.29,0.22],hi:0.62,zen:[0.10,0.32,0.76],mid:[0.40,0.66,0.92],hor:[0.81,0.87,0.90],fog:[0.81,0.87,0.90],stars:0,expo:1.0,bloom:0.34},
  tong:{sd:[0.9,0.22,0.3],sc:[1,0.70,0.48],si:1.15,hs:[1,0.78,0.63],hg:[0.25,0.22,0.28],hi:0.5,zen:[0.22,0.30,0.58],mid:[0.85,0.62,0.55],hor:[0.98,0.72,0.50],fog:[0.90,0.72,0.58],stars:0.1,expo:1.0,bloom:0.45},
  kech:{sd:[-0.9,0.2,0.2],sc:[1,0.55,0.30],si:1.05,hs:[1,0.62,0.44],hg:[0.22,0.18,0.24],hi:0.45,zen:[0.18,0.20,0.50],mid:[0.75,0.45,0.45],hor:[0.95,0.55,0.30],fog:[0.78,0.52,0.40],stars:0.15,expo:1.0,bloom:0.45},
  tun:{sd:[0.4,0.55,0.35],sc:[0.55,0.65,1],si:0.45,hs:[0.2,0.28,0.5],hg:[0.04,0.05,0.08],hi:0.5,zen:[0.01,0.02,0.06],mid:[0.03,0.05,0.12],hor:[0.07,0.10,0.18],fog:[0.04,0.06,0.11],stars:1,expo:1.35,bloom:0.6}
};
const ENV=(function(){
  const b=JSON.parse(JSON.stringify(TODS[TOD]));
  let gray=0, ff=1, cloud=0.55, sunK=1;
  b.rain=false; b.snow=false;
  if(WEATHER==='bulutli'){ gray=0.5; sunK=0.6; cloud=0.85; ff=0.55; }
  if(WEATHER==='yomgir'){ gray=0.8; sunK=0.35; cloud=1.0; ff=0.22; b.rain=true; }
  if(WEATHER==='tuman'){ gray=0.5; sunK=0.5; cloud=0.7; ff=0.12; }
  if(WEATHER==='qor'){ gray=0.65; sunK=0.5; cloud=0.95; ff=0.2; b.snow=true; }
  const g=(c,k)=>{ const l=(0.3*c[0]+0.59*c[1]+0.11*c[2])*0.9; return mixA(c,[l,l,l*1.03],k); };
  b.zen=g(b.zen,gray); b.mid=g(b.mid,gray); b.hor=g(b.hor,gray); b.fog=g(b.fog,gray);
  b.si*=sunK; b.hi*=(0.8+0.2*sunK);
  b.fogNear=Math.max(4,80*ff); b.fogFar=Math.max(120,1400*ff);
  b.cloud=cloud; b.gray=gray; b.night=(TOD==='tun');
  return b;
})();

const SUN_DIR = new THREE.Vector3(ENV.sd[0],ENV.sd[1],ENV.sd[2]).normalize();
const FOG_COL = new THREE.Color(ENV.fog[0],ENV.fog[1],ENV.fog[2]);
const scene = new THREE.Scene();
scene.background = new THREE.Color(ENV.fog[0],ENV.fog[1],ENV.fog[2]);
scene.fog = new THREE.Fog(FOG_COL, ENV.fogNear, ENV.fogFar);
const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, 0.1, 2400);

const hemi = new THREE.HemisphereLight(new THREE.Color(ENV.hs[0],ENV.hs[1],ENV.hs[2]), new THREE.Color(ENV.hg[0],ENV.hg[1],ENV.hg[2]), ENV.hi);
scene.add(hemi);
const sun = new THREE.DirectionalLight(new THREE.Color(ENV.sc[0],ENV.sc[1],ENV.sc[2]), ENV.si);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-72; sun.shadow.camera.right=72; sun.shadow.camera.top=72; sun.shadow.camera.bottom=-72;
sun.shadow.camera.near=1; sun.shadow.camera.far=420;
sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.04;
sun.position.set(SUN_DIR.x*160,SUN_DIR.y*160,SUN_DIR.z*160);
scene.add(sun); scene.add(sun.target);

// Osmon gumbazi: kun/tun/ob-havoga mos ranglar, quyosh/oy, yulduzlar
const skyMat = new THREE.ShaderMaterial({
  side:THREE.BackSide, depthWrite:false, fog:false,
  uniforms:{
    sunDir:{value:SUN_DIR.clone()},
    cZen:{value:new THREE.Vector3(ENV.zen[0],ENV.zen[1],ENV.zen[2])},
    cMid:{value:new THREE.Vector3(ENV.mid[0],ENV.mid[1],ENV.mid[2])},
    cHor:{value:new THREE.Vector3(ENV.hor[0],ENV.hor[1],ENV.hor[2])},
    sunCol:{value:new THREE.Vector3(ENV.sc[0],ENV.sc[1],ENV.sc[2])},
    stars:{value:ENV.stars*(1-ENV.gray*0.9)},
    discK:{value:1.0-ENV.gray*0.8}
  },
  vertexShader:`varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`varying vec3 vDir; uniform vec3 sunDir,cZen,cMid,cHor,sunCol; uniform float stars,discK;
    float hash(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
    void main(){
      vec3 d=normalize(vDir);
      float h=clamp(d.y,0.0,1.0);
      vec3 col=mix(cHor,cMid,smoothstep(0.0,0.28,h));
      col=mix(col,cZen,smoothstep(0.22,0.95,h));
      float sd=max(dot(d,normalize(sunDir)),0.0);
      col+=sunCol*pow(sd,6.0)*0.30*discK;
      col+=sunCol*pow(sd,64.0)*0.55*discK;
      col+=sunCol*pow(sd,900.0)*3.0*discK;
      if(stars>0.0){ vec3 p=floor(d*280.0); float s=step(0.9965,hash(p))*smoothstep(0.05,0.3,d.y)*stars; col+=vec3(s); }
      gl_FragColor=vec4(col,1.0);
    }`
});
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(2000,32,16), skyMat);
skyDome.renderOrder = -10; skyDome.frustumCulled = false;
scene.add(skyDome);

// Bulutlar
const cloudTex=(function(){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,4,64,64,62); g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(0.5,'rgba(255,255,255,.45)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); })();
const clouds=[];
(function(){
  const cb=Math.max(0.12,1-ENV.gray*0.6)*(TOD==='tun'?0.14:(TOD==='kun'?1:0.82));
  const warm=(TOD==='tong'||TOD==='kech');
  const groups=ENV.cloud>0.8?34:22;
  for(let i=0;i<groups;i++){
    const a=Math.random()*Math.PI*2, r=100+Math.random()*1100, cy=190+Math.random()*120;
    for(let k=0;k<4;k++){
      const m=new THREE.SpriteMaterial({map:cloudTex,transparent:true,opacity:Math.min(0.95,(0.45+Math.random()*0.3)*ENV.cloud+0.1),depthWrite:false,fog:false});
      m.color.setRGB(cb, cb*(warm?0.82:1), cb*(warm?0.7:1));
      const sp=new THREE.Sprite(m);
      sp.position.set(Math.cos(a)*r+(Math.random()-0.5)*140, cy+(Math.random()-0.5)*16, Math.sin(a)*r+(Math.random()-0.5)*140);
      const sc=170+Math.random()*230; sp.scale.set(sc,sc*0.42,1);
      scene.add(sp); clouds.push(sp);
    }
  }
})();

// Parashyut modeli
const chuteMatA=new THREE.MeshStandardMaterial({color:0xd8342b,roughness:.85,side:THREE.DoubleSide});
const chuteMatB=new THREE.MeshStandardMaterial({color:0xf0f0f0,roughness:.85,side:THREE.DoubleSide});
const chuteGeo=new THREE.SphereGeometry(2.2,16,10,0,Math.PI*2,0,Math.PI/2);
const chuteLineMat=new THREE.LineBasicMaterial({color:0x222222});
function makeChute(){
  const g=new THREE.Group();
  const c=new THREE.Mesh(chuteGeo,chuteMatA); c.position.y=3.6; c.scale.set(1.25,1,1.25);
  const c2=new THREE.Mesh(chuteGeo,chuteMatB); c2.position.y=3.62; c2.scale.set(0.5,1.01,1.27);
  g.add(c,c2);
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2;
    const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a)*2.6,3.7,Math.sin(a)*2.6),new THREE.Vector3(0,1.7,0)]);
    g.add(new THREE.Line(geo,chuteLineMat));
  }
  g.visible=false; scene.add(g); return g;
}

// Postprotsessing: bloom + kino ranglari + vinyetka (yuklanmasa oddiy rejim)
(function(){
  try{
    if(!(THREE.EffectComposer && THREE.RenderPass && THREE.ShaderPass && THREE.UnrealBloomPass)) return;
    const w=innerWidth, h=innerHeight;
    let rt;
    if(renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget){ rt=new THREE.WebGLMultisampleRenderTarget(w,h,{format:THREE.RGBAFormat}); rt.samples=4; }
    composer=new THREE.EffectComposer(renderer, rt);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w,h);
    composer.addPass(new THREE.RenderPass(scene,camera));
    bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(w,h), ENV.bloom, 0.7, 0.86);
    composer.addPass(bloomPass);
    gradePass=new THREE.ShaderPass({
      uniforms:{ tDiffuse:{value:null}, vig:{value:0.38}, expo:{value:ENV.expo} },
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:`uniform sampler2D tDiffuse; uniform float vig,expo; varying vec2 vUv;
        vec3 aces(vec3 x){ float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0); }
        void main(){
          vec3 c=texture2D(tDiffuse,vUv).rgb;
          c=aces(c*1.14*expo);
          float l=dot(c,vec3(0.299,0.587,0.114));
          c=mix(vec3(l),c,1.14);
          c=pow(c,vec3(0.94));
          vec2 q=vUv-0.5;
          float v=smoothstep(0.9,0.25,length(q)*1.25);
          c*=mix(1.0-vig,1.0,v);
          gl_FragColor=vec4(c,1.0);
        }`
    });
    gradePass.renderToScreen=true;
    composer.addPass(gradePass);
  }catch(e){ composer=null; gradePass=null; }
})();

// Fasl ranglari
const SEASON_COL={
  bahor:{g:[0.40,0.64,0.26],g2:[0.50,0.70,0.30],snow:0},
  yoz:{g:[0.34,0.56,0.21],g2:[0.42,0.60,0.24],snow:0},
  kuz:{g:[0.52,0.46,0.20],g2:[0.58,0.42,0.18],snow:0},
  qish:{g:[0.86,0.88,0.91],g2:[0.80,0.83,0.88],snow:1}
}[SEASON];

// Geometriyalarni birlashtirish (position+normal+uv)
function mergeGeos(list){
  let vc=0, ic=0, hasUV=true;
  list.forEach(g=>{ vc+=g.attributes.position.count; ic+=g.index?g.index.count:g.attributes.position.count; if(!g.attributes.uv) hasUV=false; });
  const pos=new Float32Array(vc*3), nor=new Float32Array(vc*3), uv=hasUV?new Float32Array(vc*2):null, idx=new Uint32Array(ic);
  let vo=0, io=0;
  list.forEach(g=>{
    const cnt=g.attributes.position.count;
    pos.set(g.attributes.position.array,vo*3); nor.set(g.attributes.normal.array,vo*3);
    if(hasUV) uv.set(g.attributes.uv.array,vo*2);
    if(g.index){ const ia=g.index.array; for(let i=0;i<ia.length;i++) idx[io+i]=ia[i]+vo; io+=ia.length; }
    else { for(let i=0;i<cnt;i++) idx[io+i]=i+vo; io+=cnt; }
    vo+=cnt;
  });
  const m=new THREE.BufferGeometry();
  m.setAttribute('position',new THREE.BufferAttribute(pos,3));
  m.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  if(hasUV) m.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  m.setIndex(new THREE.BufferAttribute(idx,1));
  return m;
}

