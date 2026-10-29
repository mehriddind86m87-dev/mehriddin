// ===================== SAMOLYOT, SAKRASH, PARASHYUT =====================
const PLANE_ALT=260, PLANE_SPEED=55, PLANE_LEN=1200, CHUTE_AUTO=95, PLANE_DUR=PLANE_LEN/PLANE_SPEED;
let phase='idle', parachuting=false, chuteOpen=false, planeActive=false, planeT=0, airVY=0, airHX=0, airHZ=0;
const planeDir=new THREE.Vector3(), planeStart=new THREE.Vector3(), planePos=new THREE.Vector3();
const plane=new THREE.Group();
(function(){
  const white=gM(0xe9edf1,.45,.5), blue=gM(0x2b5d9b,.5,.4), dk=gM(0x222428,.6,.3);
  const fus=new THREE.Mesh(new THREE.CylinderGeometry(3,3.4,26,14),white); fus.rotation.x=Math.PI/2; plane.add(fus);
  const nose=new THREE.Mesh(new THREE.SphereGeometry(3,14,10),white); nose.position.z=13; nose.scale.z=1.6; plane.add(nose);
  const stripe=new THREE.Mesh(new THREE.CylinderGeometry(3.05,3.45,5,14),blue); stripe.rotation.x=Math.PI/2; stripe.position.z=-4; plane.add(stripe);
  const wing=new THREE.Mesh(new THREE.BoxGeometry(38,0.5,6.5),white); wing.position.set(0,-0.6,1); plane.add(wing);
  const tail=new THREE.Mesh(new THREE.BoxGeometry(12,0.4,3.5),white); tail.position.set(0,0.4,-12); plane.add(tail);
  const fin=new THREE.Mesh(new THREE.BoxGeometry(0.5,5,4),blue); fin.position.set(0,3.5,-12); plane.add(fin);
  [-9,9].forEach(sx=>{ const e=new THREE.Mesh(new THREE.CylinderGeometry(1,1,4,10),dk); e.rotation.x=Math.PI/2; e.position.set(sx,-1.4,3); plane.add(e); });
  plane.scale.setScalar(1.4);
})();
plane.visible=false; scene.add(plane);
const playerChute=makeChute();
function planeSetup(){
  const a=Math.random()*Math.PI*2;
  planeDir.set(Math.cos(a),0,Math.sin(a));
  const perp=new THREE.Vector3(-planeDir.z,0,planeDir.x), off=(Math.random()-0.5)*300;
  planeStart.copy(planeDir).multiplyScalar(-PLANE_LEN/2).addScaledVector(perp,off); planeStart.y=PLANE_ALT;
  planePos.copy(planeStart); plane.rotation.y=Math.atan2(planeDir.x,planeDir.z); plane.position.copy(planePos);
  planeT=0; planeActive=true; plane.visible=true;
}
function updatePlane(dt){
  if(!planeActive) return;
  planeT+=dt; planePos.copy(planeStart).addScaledVector(planeDir,planeT*PLANE_SPEED); plane.position.copy(planePos);
  if(planeT*PLANE_SPEED>=PLANE_LEN){ planeActive=false; plane.visible=false; if(phase==='plane') jumpFromPlane(); }
}
function findFree(x,z){
  if(!collides(x,z,0.7)) return {x,z};
  for(let r=1.5;r<24;r+=1.5){ for(let k=0;k<10;k++){ const a=k/10*Math.PI*2, nx=x+Math.cos(a)*r, nz=z+Math.sin(a)*r; if(!collides(nx,nz,0.7)) return {x:nx,z:nz}; } }
  return {x,z};
}
function jumpFromPlane(){
  if(phase!=='plane') return;
  phase='drop'; chuteOpen=false; player.position.copy(planePos);
  airVY=0; airHX=planeDir.x*PLANE_SPEED*0.7; airHZ=planeDir.z*PLANE_SPEED*0.7;
  plane.visible=planeActive;
  squads[0].members.forEach((m,i)=>{ m.jumpAt=planeT+0.5+i*0.6; });
  showMsg('🪂 SAKRADINGIZ!',1200);
}
function openChute(){ if(phase!=='drop'||chuteOpen) return; chuteOpen=true; playerChute.visible=true; showMsg('🪂 PARASHYUT OCHILDI',900); }
document.addEventListener('keydown',e=>{
  if(!started||gameOver) return;
  if(e.code==='Space'){ e.preventDefault(); if(phase==='plane') jumpFromPlane(); }
  if(e.code==='KeyF' && phase==='drop') openChute();
});
function updateAirPhase(dt){
  head.visible=false; body.visible=false; player.visible=false;
  const ph=document.getElementById('phasehud');
  camera.rotation.order='YXZ';
  if(phase==='plane'){
    player.position.copy(planePos);
    camera.position.set(planePos.x,planePos.y+1.5,planePos.z); camera.rotation.set(pitch,yaw,0);
    plane.visible=false;
    ph.style.display='block';
    ph.innerHTML='✈ SAMOLYOT · <b>SPACE</b> — SAKRASH<br><span style="font-size:13px;font-weight:600">Minixarita/xarita (M): oq chiziq — samolyot yo\'li. Xohlagan joyda sakrang · '+Math.max(0,Math.ceil(PLANE_DUR-planeT))+' s</span>';
    return;
  }
  const gy=terrainY(player.position.x,player.position.z), alt=player.position.y-gy;
  if(!chuteOpen && alt<=CHUTE_AUTO) openChute();
  const fwd=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)), rgt=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const f=(keys['KeyW']?1:0)-(keys['KeyS']?0.4:0), sd=(keys['KeyD']?1:0)-(keys['KeyA']?1:0);
  const sp=chuteOpen?15:(keys['KeyW']?32:9);
  const tx=(fwd.x*f+rgt.x*sd*0.6)*sp, tz=(fwd.z*f+rgt.z*sd*0.6)*sp;
  airHX+=(tx-airHX)*Math.min(1,dt*1.6); airHZ+=(tz-airHZ)*Math.min(1,dt*1.6);
  airVY+=((chuteOpen?-9:-50)-airVY)*Math.min(1,dt*(chuteOpen?2.2:1.0));
  player.position.x+=airHX*dt; player.position.z+=airHZ*dt; player.position.y+=airVY*dt;
  camera.position.set(player.position.x,player.position.y+1.7,player.position.z); camera.rotation.set(pitch,yaw,0);
  playerChute.position.copy(player.position);
  ph.style.display='block';
  ph.innerHTML='🪂 Balandlik: <b>'+Math.max(0,Math.round(alt))+' m</b> · '+(chuteOpen?'parashyut ochiq':'<b>F</b> — parashyutni ochish (avto 95 m)')+'<br><span style="font-size:13px;font-weight:600">W — oldinga uchish · A/D — yonga · o\'rtoqlaringiz sizga ergashadi</span>';
  const roofY=groundAt(player.position.x,player.position.z);
  if(player.position.y<=Math.max(gy,roofY)+0.2){
    const s2=findFree(player.position.x,player.position.z);
    player.position.set(s2.x,Math.max(groundAt(s2.x,s2.z),-0.9),s2.z);
    phase='ground'; parachuting=false; playerChute.visible=false; velocityY=0; onGround=true;
    ph.style.display='none'; showMsg('🪂 QO\'NDINGIZ! Qurol va o\'lja qidiring!',1800);
  }
}
function pickLanding(b,first){
  const p=b.mesh.position;
  if(b.isMate){ b.land.x=player.position.x+b.off.x*2; b.land.z=player.position.z+b.off.z*2; return; }
  const sq=b.sq;
  if(!sq.landing){
    const near=buildingSpots.filter(s=>Math.hypot(s.x-p.x,s.z-p.z)<230);
    if(near.length && Math.random()<0.8){ const s=pick(near), a=Math.random()*6.283, r=Math.max(s.w,s.d)/2+5; sq.landing={x:s.x+Math.cos(a)*r,z:s.z+Math.sin(a)*r}; sq.dest={x:s.x,z:s.z,bld:s.b}; sq.destT=50; }
    else { const a=Math.random()*6.283, r=30+Math.random()*120; sq.landing={x:p.x+Math.cos(a)*r,z:p.z+Math.sin(a)*r}; }
  }
  b.land.x=sq.landing.x+b.off.x*2; b.land.z=sq.landing.z+b.off.z*2;
}
function updateBotAir(b,dt){
  const p=b.mesh.position;
  if(b.state==='plane'){
    if(planeT>=b.jumpAt || !planeActive){ p.copy(planePos); b.mesh.visible=true; b.state='fall'; b.vy=0; pickLanding(b,true); } else return;
  }
  if(b.isMate) pickLanding(b,false);
  const gy=terrainY(p.x,p.z), alt=p.y-gy;
  const dx=b.land.x-p.x, dz=b.land.z-p.z, d=Math.hypot(dx,dz);
  if(b.state==='fall'){ b.vy+=(-48-b.vy)*Math.min(1,dt*1.2); if(alt<92){ b.state='chute'; b.chute.visible=true; } }
  else b.vy+=(-9-b.vy)*Math.min(1,dt*2.5);
  const hs=b.state==='fall'?(b.isMate?30:24):(b.isMate?16:13);
  if(d>2){ p.x+=dx/d*hs*dt; p.z+=dz/d*hs*dt; b.mesh.rotation.y=Math.atan2(dx,dz); }
  p.y+=b.vy*dt; b.chute.position.set(p.x,p.y,p.z);
  const up=(b.state==='chute'?-2.7:-1.2);
  applyPose(b.c,{armL:up,armR:up,legL:b.state==='fall'?0.3:-0.2,legR:b.state==='fall'?0.5:-0.1,kneeL:0.4,kneeR:0.6,upper:b.state==='fall'?0.4:0},Math.min(1,dt*5));
  const roofY=groundAt(p.x,p.z);
  if(p.y<=Math.max(gy,roofY)+0.1){
    const f=findFree(p.x,p.z); p.x=f.x; p.z=f.z; p.y=Math.max(groundAt(p.x,p.z),-0.9);
    b.air=false; b.state='ground'; b.chute.visible=false; b.vy=0; b.thinkT=0; b.lastX=p.x; b.lastZ=p.z;
  }
}

