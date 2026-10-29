// ===================== ZONA (Blue Zone) =====================
const ZONE_PHASES=[
  {wait:75,shrink:60,r:410,dmg:1.5},{wait:55,shrink:55,r:270,dmg:3},{wait:45,shrink:50,r:160,dmg:5},
  {wait:35,shrink:45,r:85,dmg:8},{wait:25,shrink:40,r:35,dmg:12},{wait:20,shrink:30,r:8,dmg:16}];
const zone={cx:0,cz:0,radius:640,tcx:0,tcz:0,tr:410,sx:0,sz:0,sr:640,state:'wait',timer:ZONE_PHASES[0].wait,t:0,idx:0,dmg:1.5,dmgTimer:0,started:false};
function zonePickTarget(i){
  const P=ZONE_PHASES[i], maxOff=Math.max(0,zone.radius-P.r), a=Math.random()*Math.PI*2, o=Math.sqrt(Math.random())*maxOff*0.85;
  zone.tcx=zone.cx+Math.cos(a)*o; zone.tcz=zone.cz+Math.sin(a)*o; zone.tr=P.r; zone.dmg=P.dmg;
}
zonePickTarget(0);
function makeZoneTex(){
  const c=document.createElement('canvas'); c.width=64; c.height=256; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,256); g.addColorStop(0,'rgba(60,150,255,0.10)'); g.addColorStop(1,'rgba(60,150,255,0.45)');
  x.fillStyle=g; x.fillRect(0,0,64,256);
  for(let y=0;y<256;y+=32){ x.fillStyle='rgba(170,215,255,0.55)'; x.fillRect(0,y,64,3); }
  x.fillStyle='rgba(200,230,255,0.5)'; x.fillRect(0,0,3,256);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(90,2); return t;
}
const zoneTex=makeZoneTex();
const zoneWall=new THREE.Mesh(new THREE.CylinderGeometry(1,1,260,140,1,true),new THREE.MeshBasicMaterial({map:zoneTex,transparent:true,opacity:0.8,side:THREE.DoubleSide,depthWrite:false,fog:false}));
zoneWall.position.y=110; zoneWall.frustumCulled=false; scene.add(zoneWall);
const zoneTarget=new THREE.Mesh(new THREE.CylinderGeometry(1,1,160,100,1,true),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.12,side:THREE.DoubleSide,depthWrite:false,fog:false}));
zoneTarget.position.y=70; zoneTarget.frustumCulled=false; scene.add(zoneTarget);
let zoneWarned=false;
function updateZone(dt){
  if(zone.started){
    if(zone.state==='wait'){ zone.timer-=dt; if(zone.timer<=0){ zone.state='shrink'; zone.t=0; zone.sx=zone.cx; zone.sz=zone.cz; zone.sr=zone.radius; } }
    else if(zone.state==='shrink'){
      zone.t+=dt; const P=ZONE_PHASES[zone.idx], p=Math.min(1,zone.t/P.shrink);
      zone.radius=zone.sr+(zone.tr-zone.sr)*p; zone.cx=zone.sx+(zone.tcx-zone.sx)*p; zone.cz=zone.sz+(zone.tcz-zone.sz)*p;
      if(p>=1){ zone.idx++; if(zone.idx<ZONE_PHASES.length){ zonePickTarget(zone.idx); zone.state='wait'; zone.timer=ZONE_PHASES[zone.idx].wait; } else zone.state='final'; }
    }
  }
  const zs=document.getElementById('zonestate');
  zs.textContent=!zone.started?'samolyotda':zone.state==='wait'?((zone.idx+1)+'-zona · '+Math.ceil(zone.timer)+'s'):zone.state==='shrink'?('TORAYMOQDA · '+Math.round(zone.radius)+'m'):'yakuniy zona';
  zoneWall.scale.set(zone.radius,1,zone.radius); zoneWall.position.x=zone.cx; zoneWall.position.z=zone.cz;
  zoneTarget.scale.set(zone.tr,1,zone.tr); zoneTarget.position.x=zone.tcx; zoneTarget.position.z=zone.tcz;
  zoneTex.offset.y-=dt*0.1;
  let outside=false;
  if(zone.started){
    zone.dmgTimer-=dt; const tick=zone.dmgTimer<=0; if(tick) zone.dmgTimer=1;
    for(const b of bots){
      if(!b.alive||b.air) continue;
      if(tick && Math.hypot(b.mesh.position.x-zone.cx,b.mesh.position.z-zone.cz)>zone.radius) damageBot(b,zone.dmg*1.3,'🔵 Zona',-1);
    }
    if(!parachuting && !gameOver && pState!=='dead'){
      outside=Math.hypot(player.position.x-zone.cx,player.position.z-zone.cz)>zone.radius;
      if(outside){
        if(!zoneWarned){ zoneWarned=true; showMsg('🔵 ZONADAN TASHQARIDASIZ — ICHKARIGA CHOPING!',1800); }
        if(tick){ applyDamage(zone.dmg,'🔵 Zona'); flashDamage(); }
      } else zoneWarned=false;
    }
  }
  document.getElementById('zonefx').style.opacity=outside?'1':'0';
}

