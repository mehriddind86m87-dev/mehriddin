// ===== QUROL MODELLARI — har bir qurol alohida shaklda =====
function gM(color,rough,metal){ return new THREE.MeshStandardMaterial({color, roughness:rough, metalness:metal}); }
function gBox(w,h,d,mat,x,y,z){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); return m; }
function gCyl(r,len,mat,x,y,z){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,12),mat); m.rotation.x=Math.PI/2; m.position.set(x,y,z); return m; }
const mSteel=gM(0x2b2d31,.35,.85), mDark=gM(0x111214,.55,.4), mWood=gM(0x7a5230,.8,.05), mOlive=gM(0x3f4a30,.75,.15);
const mGlass=new THREE.MeshStandardMaterial({color:0x3a8fd9,roughness:.1,metalness:.9,emissive:0x1a4a7a,emissiveIntensity:.6});
function buildWeaponModel(key){
  const g=new THREE.Group();
  if(key==='pistol'){
    g.add(gBox(.07,.09,.32,mSteel,0,0,-.16), gBox(.06,.2,.08,mDark,0,-.13,-.04), gCyl(.016,.1,mDark,0,.005,-.36), gBox(.012,.02,.012,mDark,0,.055,-.3), gBox(.07,.02,.12,mDark,0,-.05,-.12));
  } else if(key==='rifle'){
    g.add(gBox(.07,.1,.5,mSteel,0,0,-.3), gBox(.075,.07,.34,mWood,0,-.005,-.7), gCyl(.014,.42,mDark,0,.025,-1.0), gBox(.05,.24,.08,mDark,0,-.16,-.4), gBox(.06,.12,.3,mWood,0,-.02,.03), gBox(.02,.05,.02,mDark,0,.075,-1.15), gBox(.03,.04,.03,mDark,0,.075,-.15));
    g.children[3].rotation.x=.3;
  } else if(key==='shotgun'){
    g.add(gBox(.08,.1,.4,mWood,0,0,-.2), gCyl(.022,.75,mSteel,0,.035,-.7), gCyl(.02,.6,mSteel,0,-.015,-.65), gBox(.09,.07,.26,mWood,0,-.05,-.62), gBox(.07,.13,.32,mWood,0,-.03,.12));
  } else {
    g.add(gBox(.07,.11,.6,mOlive,0,0,-.3), gCyl(.017,.9,mDark,0,.02,-1.05), gCyl(.032,.34,mDark,0,.11,-.38), gCyl(.04,.03,mGlass,0,.11,-.56), gCyl(.04,.03,mGlass,0,.11,-.2), gBox(.03,.05,.03,mDark,0,.07,-.5), gBox(.03,.05,.03,mDark,0,.07,-.26), gBox(.06,.15,.3,mOlive,0,-.025,.14), gBox(.05,.1,.1,mDark,0,-.1,-.3), gBox(.02,.02,.5,mDark,0,.035,-1.3));
  }
  return g;
}
const MUZZLE_Z={pistol:-.45,rifle:-1.2,shotgun:-1.1,sniper:-1.55};
const gun = new THREE.Group();
const gunModels={};
['pistol','rifle','shotgun','sniper'].forEach(k=>{ const m=buildWeaponModel(k); m.visible=(k==='pistol'); gun.add(m); gunModels[k]=m; });
camera.add(gun);
gun.position.set(0.35,-0.32,-0.55);
const gunRestPos = gun.position.clone();
scene.add(camera);

// o't ochish miltillashi (muzzle flash)
const muzzleLight = new THREE.PointLight(0xffd27a, 0, 4, 2);
muzzleLight.position.set(0,0.01,-0.9);
gun.add(muzzleLight);
const flashGeo = new THREE.ConeGeometry(0.05,0.18,6);
const flashMesh = new THREE.Mesh(flashGeo, new THREE.MeshBasicMaterial({color:0xffe27a, transparent:true, opacity:0}));
flashMesh.rotation.x = -Math.PI/2; flashMesh.position.set(0,0.01,-0.95);
gun.add(flashMesh);

// ovoz effektlari (WebAudio, tashqi fayl kerak emas)
let actx=null;
function ac(){ if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)(); return actx; }
function playShot(){
  try{
    const ctx = ac();
    const now = ctx.currentTime;
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate*0.08, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i] = (Math.random()*2-1)*(1-i/data.length);
    const noise = ctx.createBufferSource(); noise.buffer = noiseBuf;
    const filt = ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.setValueAtTime(3200,now);
    const gainN = ctx.createGain(); gainN.gain.setValueAtTime(0.55,now); gainN.gain.exponentialRampToValueAtTime(0.001,now+0.09);
    noise.connect(filt); filt.connect(gainN); gainN.connect(ctx.destination); noise.start(now); noise.stop(now+0.09);
    const osc = ctx.createOscillator(); osc.type='square'; osc.frequency.setValueAtTime(120,now); osc.frequency.exponentialRampToValueAtTime(40,now+0.07);
    const gainO = ctx.createGain(); gainO.gain.setValueAtTime(0.3,now); gainO.gain.exponentialRampToValueAtTime(0.001,now+0.08);
    osc.connect(gainO); gainO.connect(ctx.destination); osc.start(now); osc.stop(now+0.08);
  }catch(e){}
}
// ===== O'Q OVOZLARI: masofaga qarab balandlik va xaritadagi belgi =====
const gunshots=[];
let lastShotSnd=0;
function gunshotAt(x,z,mate,team,y){
  const dx=x-player.position.x, dz=z-player.position.z, d=Math.hypot(dx,dz);
  gunshots.push({x,z,y:y||0,t:performance.now(),mate:!!mate,team:team===undefined?-1:team});
  if(gunshots.length>60) gunshots.shift();
  if(d>420) return;
  const nowMs=performance.now(); if(nowMs-lastShotSnd<40) return; lastShotSnd=nowMs;
  try{
    const ctx=ac(), t0=ctx.currentTime+Math.min(1.0,d/340);
    const vol=0.55*14/(d+14);
    if(vol<0.01) return;
    const buf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*0.13),ctx.sampleRate), data=buf.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*(1-i/data.length);
    const src=ctx.createBufferSource(); src.buffer=buf;
    const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=Math.max(450,3400-d*9);
    const g=ctx.createGain(); g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(0.0005,t0+0.13);
    src.connect(lp); lp.connect(g);
    if(ctx.createStereoPanner){ const pn=ctx.createStereoPanner(); pn.pan.value=Math.max(-1,Math.min(1,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/(d||1))); g.connect(pn); pn.connect(ctx.destination); }
    else g.connect(ctx.destination);
    src.start(t0); src.stop(t0+0.14);
  }catch(e){}
}
function playHitBeep(){
  try{
    const ctx = ac(); const now = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.setValueAtTime(950,now);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.18,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.09);
    osc.connect(g); g.connect(ctx.destination); osc.start(now); osc.stop(now+0.09);
  }catch(e){}
}

let recoil = 0; // kamera va qurol tebranishi (recoil)

function buildLootModel(type){
  const g=new THREE.Group();
  const glowCol={ammo:0xffb020,medkit:0x35e06a,armor:0x4aa8ff,weapon_rifle:0xffffff,weapon_shotgun:0xffd84a,weapon_sniper:0x38ff9a}[type];
  if(type==='ammo'){
    g.add(gBox(.5,.26,.32,gM(0x4b5d2a,.7,.2),0,0,0), gBox(.53,.05,.35,gM(0x2f3b1a,.8,.1),0,.155,0), gBox(.14,.06,.02,gM(0xffc84a,.5,.3),0,.02,.17));
    const brass=gM(0xc9a227,.3,.9), tipM=gM(0x8a5a2b,.4,.7);
    for(let i=-2;i<=2;i++){
      const b=new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,.14,8),brass); b.position.set(i*.085,.26,0); g.add(b);
      const t=new THREE.Mesh(new THREE.ConeGeometry(.028,.06,8),tipM); t.position.set(i*.085,.36,0); g.add(t);
    }
  } else if(type==='medkit'){
    const white=gM(0xf2f2f2,.5,.05), red=gM(0xd62020,.5,.05);
    g.add(gBox(.5,.34,.2,white,0,0,0), gBox(.26,.07,.215,red,0,0,0), gBox(.07,.26,.215,red,0,0,0), gBox(.2,.06,.07,gM(0x555555,.5,.4),0,.2,0));
  } else if(type==='armor'){
    const cl=gM(0x2f4256,.7,.2), pl=gM(0x1b222b,.35,.7), pk=gM(0x56684a,.8,.1);
    g.add(gBox(.5,.56,.2,cl,0,0,0), gBox(.14,.22,.22,cl,-.17,.34,0), gBox(.14,.22,.22,cl,.17,.34,0), gBox(.34,.32,.05,pl,0,.04,.12), gBox(.34,.32,.05,pl,0,.04,-.12), gBox(.12,.1,.06,pk,-.14,-.18,.14), gBox(.12,.1,.06,pk,.14,-.18,.14));
  } else {
    const w=buildWeaponModel(type.replace('weapon_','')); w.scale.setScalar(.9); w.rotation.y=Math.PI/2; w.position.x=.45; g.add(w);
  }
  const ring=new THREE.Mesh(new THREE.RingGeometry(.45,.6,28), new THREE.MeshBasicMaterial({color:glowCol,transparent:true,opacity:.55,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2; ring.position.y=-.8; g.add(ring);
  if(type.indexOf('weapon_')===0){
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,7,8,1,true), new THREE.MeshBasicMaterial({color:glowCol,transparent:true,opacity:.28,depthWrite:false}));
    beam.position.y=3; g.add(beam);
  }
  return g;
}


