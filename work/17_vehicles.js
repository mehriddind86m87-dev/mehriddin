// ===================== MASHINALAR (hammasi 4 o'rinli) =====================
const VTYPES={
  jeep:  {name:'Jeep', maxF:26,maxR:9, acc:16,turn:1.55,colors:[0x4a5a32,0x6b4a2a,0x2f3f4f,0x8a2f2a],water:false},
  sedan: {name:'Sedan',maxF:38,maxR:10,acc:22,turn:1.8, colors:[0x1d3f7a,0xb02a2a,0xe0e0e0,0x222222,0xd0a020],water:false},
  pickup:{name:'Pikap',maxF:24,maxR:8, acc:14,turn:1.35,colors:[0x7a2f2f,0x2e5d3a,0x808080,0xcfa23a],water:false},
  boat:  {name:'Qayiq',maxF:22,maxR:6, acc:11,turn:1.5, colors:[0xeeeeee,0x2b5d9b,0xd0a020],water:true}
};
// Haqiqiy shakldagi mashinalar: yon profil (ExtrudeGeometry), kabina, ichki salon (rul, panel, o'rindiqlar)
const CAR_SPECS={
  sedan:{W:1.86,body:[[2.3,0.32],[2.38,0.55],[2.3,0.78],[1.15,0.95],[-1.55,0.98],[-2.28,0.9],[-2.36,0.6],[-2.3,0.32]],cab:[[1.15,0.93],[0.25,1.42],[-1.0,1.42],[-1.7,0.96]],cabW:1.66,wheels:[[1.42,0.36],[-1.42,0.36]],wr:0.36,ww:0.26,
    seats:[{x:-0.45,y:-0.05,z:0.05,s:0.8},{x:0.47,y:-0.05,z:0.05,s:0.8},{x:-0.42,y:-0.05,z:0.95,s:0.82},{x:0.42,y:-0.05,z:0.95,s:0.82}],dash:0.75,roof:true},
  jeep:{W:2.0,body:[[2.05,0.45],[2.12,0.8],[2.0,1.18],[0.9,1.22],[0.75,1.12],[-1.95,1.12],[-2.0,0.45]],cab:[[0.9,1.2],[0.78,1.9]],cabW:1.9,wheels:[[1.3,0.48],[-1.3,0.48]],wr:0.48,ww:0.38,
    seats:[{x:-0.45,y:0.3,z:0.0,s:1},{x:0.45,y:0.3,z:0.0,s:1},{x:-0.45,y:0.3,z:1.0,s:1},{x:0.45,y:0.3,z:1.0,s:1}],dash:0.6,roof:false,rollbar:true},
  pickup:{W:1.96,body:[[2.45,0.45],[2.5,0.75],[2.4,1.1],[1.4,1.18],[-2.55,1.18],[-2.6,0.45]],cab:[[1.35,1.16],[0.75,1.82],[-0.55,1.84],[-0.65,1.16]],cabW:1.84,wheels:[[1.55,0.46],[-1.6,0.46]],wr:0.46,ww:0.34,
    seats:[{x:-0.45,y:0.12,z:-0.0,s:0.86},{x:0.45,y:0.12,z:-0.0,s:0.86},{x:-0.5,y:0.75,z:1.5,s:1},{x:0.5,y:0.75,z:1.5,s:1}],dash:0.95,roof:true,bed:true}
};
function profileGeo(pts,width,bevel){
  const sh=new THREE.Shape(); pts.forEach((p,i)=>{ if(i===0) sh.moveTo(p[0],p[1]); else sh.lineTo(p[0],p[1]); }); sh.closePath();
  const g=new THREE.ExtrudeGeometry(sh,{depth:width-(bevel?0.16:0),bevelEnabled:!!bevel,bevelSize:0.08,bevelThickness:0.08,bevelSegments:3,steps:1,curveSegments:6});
  g.translate(0,0,-(width-(bevel?0.16:0))/2); g.rotateY(Math.PI/2); // u → -z (old tomon -z)
  return g;
}
function buildVehicleModel(type,color){
  const g=new THREE.Group(); g.rotation.order='YXZ';
  const wheels=[], steerW=[];
  const paint=new THREE.MeshStandardMaterial({color,roughness:.28,metalness:.65,side:THREE.DoubleSide}), black=gM(0x111111,.85,.1), chrome=gM(0xcfd2d6,.2,.9), dark=gM(0x1b1b1d,.7,.3), seatM=gM(0x3a3027,.9,.05), plast=gM(0x202124,.8,.1);
  const glass=new THREE.MeshStandardMaterial({color:0x1b2a35,roughness:.05,metalness:.9,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false});
  const lampW=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff2cc,emissiveIntensity:1.2});
  const lampR=new THREE.MeshStandardMaterial({color:0xaa0000,emissive:0xff2020,emissiveIntensity:0.9});
  const gauge=new THREE.MeshStandardMaterial({color:0x0a1a10,emissive:0x2aff8a,emissiveIntensity:0.8});
  function box(w,h,d,m,x,y,z){ const b=gBox(w,h,d,m,x,y,z); b.castShadow=true; g.add(b); return b; }
  function wheel(x,y,z,r,wd,front){
    const steer=new THREE.Group(); steer.position.set(x,y,z); g.add(steer);
    const spin=new THREE.Group(); steer.add(spin);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(r,r,wd,18),black); tire.rotation.z=Math.PI/2; tire.castShadow=true; spin.add(tire);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(r*0.62,r*0.62,wd+0.02,12),chrome); rim.rotation.z=Math.PI/2; spin.add(rim);
    for(let k=0;k<5;k++){ const sp=new THREE.Mesh(new THREE.BoxGeometry(wd+0.04,r*1.1,0.06),dark); sp.rotation.x=k*Math.PI/5; spin.add(sp); }
    wheels.push(spin); if(front) steerW.push(steer);
  }
  let seats, cockpit=null, wheelMesh=null;
  const S=CAR_SPECS[type];
  if(S){
    // kuzov: salon qismi ichi bo'sh (pol + eshik panellari), aks holda kabina ichidan ko'rinmaydi
    const cf=S.cab[0][0]-0.05, cr=(S.roof?S.cab[S.cab.length-1][0]:-1.6)+0.05, floorY=S.body[0][1]+0.18;
    const prof=[]; let notched=false;
    for(let k=0;k<S.body.length;k++){ const a=S.body[k], b2=S.body[(k+1)%S.body.length]; prof.push(a);
      if(!notched && a[0]>=cf && b2[0]<cf && a[1]>floorY+0.3){ const t=(a[0]-cf)/(a[0]-b2[0]||1), yA=a[1]+(b2[1]-a[1])*t; prof.push([cf,yA],[cf,floorY],[cr,floorY]); notched=true;
        let m=k+1; while(m<S.body.length && S.body[m][0]>cr) m++; const c=S.body[m-1], d=S.body[m]; const t2=(c[0]-cr)/(c[0]-d[0]||1); prof.push([cr,c[1]+(d[1]-c[1])*t2]); k=m-1; }
    }
    const body=new THREE.Mesh(profileGeo(prof,S.W,true),paint); body.castShadow=true; body.receiveShadow=true; g.add(body);
    const beltY=Math.min(S.cab[0][1],S.roof?S.cab[S.cab.length-1][1]:S.cab[0][1]);
    [-1,1].forEach(sx=>{ box(0.07,beltY-floorY,cf-cr,paint,sx*(S.W/2-0.035),(beltY+floorY)/2,-(cf+cr)/2); box(0.03,0.02,cf-cr-0.3,chrome,sx*(S.W/2+0.005),beltY-0.25,-(cf+cr)/2); box(0.04,0.04,0.2,chrome,sx*(S.W/2+0.01),beltY-0.12,-(cf+cr)/2+0.3); });
    box(S.W-0.1,0.04,cf-cr,dark,0,floorY+0.02,-(cf+cr)/2);
    if(!S.roof) box(S.W-0.14,beltY-floorY,0.06,paint,0,(beltY+floorY)/2,-cr);
    // kabina oynalari + tom + ustunlar
    if(S.roof){
      const cab=new THREE.Mesh(profileGeo(S.cab,S.cabW,false),glass); g.add(cab);
      const top=S.cab[1][1], zf=-S.cab[1][0], zr=-S.cab[2][0];
      box(S.cabW+0.04,0.07,zr-zf+0.1,paint,0,top+0.02,(zf+zr)/2);
      [-1,1].forEach(sx=>{
        const ax=sx*(S.cabW/2-0.02);
        const pA=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,Math.hypot(S.cab[0][0]-S.cab[1][0],S.cab[0][1]-S.cab[1][1])),paint);
        pA.position.set(ax,(S.cab[0][1]+top)/2,-(S.cab[0][0]+S.cab[1][0])/2); pA.rotation.x=-Math.atan2(top-S.cab[0][1],S.cab[0][0]-S.cab[1][0]); g.add(pA);
        const pC=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.07,Math.hypot(S.cab[3][0]-S.cab[2][0],S.cab[3][1]-S.cab[2][1])),paint);
        pC.position.set(ax,(S.cab[3][1]+top)/2,-(S.cab[2][0]+S.cab[3][0])/2); pC.rotation.x=Math.atan2(top-S.cab[3][1],S.cab[2][0]-S.cab[3][0]); g.add(pC);
        box(0.08,top-S.cab[0][1],0.09,paint,ax,(top+S.cab[0][1])/2,(zf+zr)/2+0.2); // B-ustun
        box(0.06,0.12,0.18,paint,sx*(S.W/2+0.06),S.cab[0][1]+0.08,-S.cab[0][0]+0.25); // ko'zgu
      });
    } else {
      // jip: old oyna ramkasi + roll-bar
      const fz=-S.cab[0][0]; box(S.cabW,0.06,0.06,black,0,S.cab[1][1],fz); [-1,1].forEach(sx=>box(0.06,S.cab[1][1]-S.cab[0][1],0.06,black,sx*S.cabW/2,(S.cab[1][1]+S.cab[0][1])/2,fz));
      const ws=new THREE.Mesh(new THREE.PlaneGeometry(S.cabW-0.1,S.cab[1][1]-S.cab[0][1]-0.05),glass); ws.position.set(0,(S.cab[1][1]+S.cab[0][1])/2,fz); g.add(ws);
      [-1,1].forEach(sx=>{ box(0.08,0.9,0.08,black,sx*0.9,1.55,1.3); }); box(1.88,0.08,0.08,black,0,2.0,1.3); [-1,1].forEach(sx=>box(0.08,0.08,1.0,black,sx*0.9,2.0,0.8));
      const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,0.25,14),black); sp.rotation.x=Math.PI/2; sp.position.set(0,1.0,2.15); g.add(sp);
    }
    if(S.bed){ box(1.8,0.06,2.3,dark,0,1.0,1.4); }
    // chiroqlar, bamper, panjara
    const fz=-S.body[0][0], rz=-S.body[S.body.length-1][0];
    [-1,1].forEach(sx=>{ box(0.42,0.14,0.08,lampW,sx*(S.W/2-0.3),S.body[1][1]+0.06,fz-0.03); box(0.36,0.16,0.08,lampR,sx*(S.W/2-0.28),S.body[1][1]+0.1,rz+0.03); });
    box(S.W*0.5,0.18,0.06,dark,0,S.body[1][1]-0.02,fz-0.04);
    box(S.W+0.04,0.16,0.18,plast,0,S.body[0][1]+0.06,fz); box(S.W+0.04,0.16,0.18,plast,0,S.body[0][1]+0.06,rz);
    box(0.5,0.12,0.04,new THREE.MeshStandardMaterial({color:0xf2f2f2}),0,S.body[0][1]+0.22,rz+0.1);
    // g'ildirak arkalari (qora)
    S.wheels.forEach(w=>[-1,1].forEach(sx=>{ const a=new THREE.Mesh(new THREE.CylinderGeometry(S.wr+0.1,S.wr+0.1,0.06,16,1,true,0,Math.PI),dark); a.rotation.z=Math.PI/2; a.rotation.y=Math.PI/2; a.position.set(sx*(S.W/2+0.01),w[1],-w[0]); g.add(a); }));
    S.wheels.forEach((w,i)=>[-1,1].forEach(sx=>wheel(sx*(S.W/2-S.ww/2+0.04),w[1],-w[0],S.wr,S.ww,i===0)));
    seats=S.seats;
    // ichki salon
    const dz=-S.cab[0][0]+0.35, dy=S.cab[0][1];
    box(S.cabW-0.1,0.28,0.5,plast,0,dy-0.1,dz);
    box(0.5,0.14,0.04,gauge,seats[0].x,dy+0.02,dz+0.24);
    box(0.3,0.1,0.03,gauge,0.15,dy-0.05,dz+0.26);
    seats.forEach((s,i)=>{ const sy=s.y+0.58*s.s; box(0.55,0.14,0.55,seatM,s.x,sy,s.z+0.05); const bk=box(0.55,0.7,0.12,seatM,s.x,sy+0.38,s.z+0.36); bk.rotation.x=-0.15; if(i<2) box(0.3,0.18,0.1,seatM,s.x,sy+0.82,s.z+0.42); });
    const col=new THREE.Group(); col.position.set(seats[0].x,dy+0.0,dz+0.32); col.rotation.x=-1.1; g.add(col);
    wheelMesh=new THREE.Group(); col.add(wheelMesh);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(0.19,0.025,8,24),plast); wheelMesh.add(rim);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.06,10),plast); hub.rotation.x=Math.PI/2; wheelMesh.add(hub);
    [0,2.1,4.2].forEach(a=>{ const sp=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.17,0.02),plast); sp.position.set(Math.sin(a)*0.09,Math.cos(a)*0.09,0); sp.rotation.z=-a; wheelMesh.add(sp); });
    const skin=new THREE.MeshStandardMaterial({color:0xe8b98a,roughness:.6}), glove=new THREE.MeshStandardMaterial({color:0x2b2b2b,roughness:.8});
    const hands=new THREE.Group(); [-1,1].forEach(sx=>{ const h=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8),glove); h.scale.set(1,1.3,0.9); h.position.set(sx*0.18,0.02,0.03); hands.add(h); });
    hands.visible=false; wheelMesh.add(hands);
    const mirror=box(0.24,0.07,0.03,plast,0,S.roof?S.cab[1][1]-0.1:S.cab[1][1]-0.05,-S.cab[1][0]+0.12);
    cockpit={wheel:wheelMesh,hands,eyeY:seats[0].y+1.42*seats[0].s};
  } else {
    // qayiq
    box(2.4,0.7,4.6,paint,0,0.35,0.6);
    const bow=new THREE.Mesh(new THREE.ConeGeometry(1.2,2.6,4),paint); bow.rotation.x=-Math.PI/2; bow.position.set(0,0.35,-2.9); bow.scale.set(1.35,1,0.55); bow.castShadow=true; g.add(bow);
    box(1.8,0.5,0.1,glass,0,1.05,-0.7); box(2.2,0.12,0.5,black,0,0.75,0.2); box(2.2,0.12,0.5,black,0,0.75,1.5);
    box(0.5,0.9,0.5,dark,0,0.7,3.1);
    seats=[{x:-0.6,y:0.4,z:0.2,s:1},{x:0.6,y:0.4,z:0.2,s:1},{x:-0.6,y:0.4,z:1.5,s:1},{x:0.6,y:0.4,z:1.5,s:1}];
    cockpit={wheel:null,hands:null,eyeY:1.9};
  }
  return {g,wheels,seats,steerW,cockpit};
}
const vehicles=[];
function addVehicle(type,x,z,yaw){
  const def=VTYPES[type], m=buildVehicleModel(type,pick(def.colors));
  m.g.position.set(x,def.water?0:terrainY(x,z),z); m.g.rotation.y=yaw; scene.add(m.g);
  const v={type,def,mesh:m.g,wheels:m.wheels,steerW:m.steerW||[],cockpit:m.cockpit,seats:[null,null,null,null],seatPos:m.seats,speed:0,vyaw:yaw,vy:0,slip:0,steer:0,pitch:0,roll:0,air:false};
  vehicles.push(v); return v;
}
(function(){
  const kinds=['jeep','sedan','pickup','sedan','jeep','pickup','sedan'];
  let placed=0, tries=0;
  while(placed<12 && tries<400){
    tries++;
    let x,z,yaw;
    if(roadSamples.length && Math.random()<0.8){ const s=pick(roadSamples); x=s.x+Math.cos(s.ang)*1.8; z=s.z-Math.sin(s.ang)*1.8; yaw=s.ang+Math.PI; }
    else { const a=Math.random()*6.283, r=Math.random()*420; x=Math.cos(a)*r; z=Math.sin(a)*r; yaw=Math.random()*6.283; }
    if(terrainBase(x,z)<1.5 || collides(x,z,3)) continue;
    if(vehicles.some(v=>Math.hypot(v.mesh.position.x-x,v.mesh.position.z-z)<60)) continue;
    addVehicle(pick(kinds),x,z,yaw); placed++;
  }
  // qayiqlar daryoda
  rivers.forEach(pts=>{
    for(let k=0;k<2;k++){
      const i=30+Math.floor(Math.random()*70), p=pts[i], q=pts[i+1];
      if(terrainBase(p.x,p.z)<-1.2) addVehicle('boat',p.x,p.z,Math.atan2(q.x-p.x,q.z-p.z)+Math.PI);
    }
  });
})();

// dvigatel ovozi
let engOsc=null;
function engineStart(){ try{ const c=ac(); engOsc=c.createOscillator(); engOsc.type='sawtooth'; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420; const gn=c.createGain(); gn.gain.value=0.05; engOsc.connect(f); f.connect(gn); gn.connect(c.destination); engOsc.start(); }catch(e){} }
function engineUpdate(sp){ if(engOsc) engOsc.frequency.value=40+Math.abs(sp)*3.2; }
function engineStop(){ try{ if(engOsc) engOsc.stop(); }catch(e){} engOsc=null; }
// faralar
const headL=new THREE.SpotLight(0xfff2cc,0,85,0.6,0.5,1);
scene.add(headL); scene.add(headL.target);
const LIGHTS_ON=ENV.night||ENV.fogFar<350;

let inVehicle=false, activeVehicle=null, promptVeh='';
function seatWorld(v,idx){
  const sp=v.seatPos[idx], c=Math.cos(v.vyaw), s=Math.sin(v.vyaw), vp=v.mesh.position;
  return {x:vp.x+sp.x*c+sp.z*s, y:vp.y+sp.y, z:vp.z-sp.x*s+sp.z*c};
}
function seatBot(b){
  const v=b.inVeh, w=seatWorld(v,b.seat);
  b.mesh.position.set(w.x,w.y,w.z); b.mesh.rotation.y=v.vyaw+Math.PI; b.mesh.rotation.x=0; b.mesh.visible=true;
  applyPose(b.c,{legL:-1.45,legR:-1.45,kneeL:1.4,kneeR:1.4,armL:-0.8,armR:-0.8,elbowL:-0.6,elbowR:-0.6,drop:-0.1},1);
}
function vehicleBoard(b,v,idx){ v.seats[idx]=b; b.inVeh=v; b.seat=idx; b.mesh.scale.setScalar(v.seatPos[idx].s||1); b.aiming=false; }
function vehicleUnseat(b){
  const v=b.inVeh; if(!v) return;
  v.seats[b.seat]=null; const idx=b.seat; b.inVeh=null; b.seat=-1; b.mesh.scale.setScalar(1);
  const side=(idx%2===1)?1:-1, a=v.vyaw+side*1.57+(idx>1?0.5:0);
  const f=findFree(v.mesh.position.x+Math.sin(a)*3.6,v.mesh.position.z+Math.cos(a)*3.6);
  b.mesh.position.set(f.x,groundAt(f.x,f.z),f.z); b.path=[];
}
function enterVehicle(v){
  inVehicle=true; activeVehicle=v; v.seats[0]='player'; v.vyaw=v.mesh.rotation.y; yaw=v.vyaw;
  setZoom(false); engineStart();
  for(const b of bots){ if(b.isMate && b.alive && !b.down && !b.air && !b.inVeh) tryBoard(b); }
  showMsg('🚗 '+v.def.name.toUpperCase()+' — o\'rtoqlar ham o\'tirishmoqda',1400);
}
function exitVehicle(){
  const v=activeVehicle; if(!v) return;
  for(let i=1;i<4;i++){ const b=v.seats[i]; if(b && b!=='player') vehicleUnseat(b); }
  const a=v.vyaw+1.57, f=findFree(v.mesh.position.x+Math.sin(a)*3.4,v.mesh.position.z+Math.cos(a)*3.4);
  player.position.set(f.x,groundAt(f.x,f.z),f.z); if(v.cockpit&&v.cockpit.hands) v.cockpit.hands.visible=false; camera.rotation.z=0;
  v.seats[0]=null; v.speed=0; v.slip=0; inVehicle=false; camera.fov=NORMAL_FOV; camera.updateProjectionMatrix(); activeVehicle=null; velocityY=0; onGround=true;
  headL.intensity=0; engineStop();
  showMsg('🚶 MASHINADAN TUSHDINGIZ',900);
}
document.addEventListener('keydown',e=>{
  if(e.code!=='KeyE'||!started||gameOver||parachuting||pState!=='alive') return;
  if(!inVehicle){
    let nv=null, nd=5;
    for(const v of vehicles){ const d=Math.hypot(player.position.x-v.mesh.position.x,player.position.z-v.mesh.position.z); if(d<nd && !v.seats[0]){ nd=d; nv=v; } }
    if(nv) enterVehicle(nv);
  } else exitVehicle();
});
let vehCam='fpp';
document.addEventListener('keydown',e=>{ if(e.code==='KeyV' && inVehicle){ vehCam=vehCam==='fpp'?'tpp':'fpp'; showMsg(vehCam==='fpp'?'🎥 Kabina ichidan':'🎥 Orqadan',700); } });
// ko'prik ustida g'ildiraklar panjara tashqarisidagi suvni emas, ko'prik sathini "his qiladi"
function carGroundY(x,z){
  const y=terrainY(x,z), br=bridgeAt(x,z);
  return (br && Math.abs(br.al)<br.b.half) ? Math.max(y,br.b.deckY) : y;
}
function updateVehicle(dt){
  if(!inVehicle){
    promptVeh='';
    if(started && !gameOver && !parachuting){
      let nv=null, nd=5;
      for(const v of vehicles){ const d=Math.hypot(player.position.x-v.mesh.position.x,player.position.z-v.mesh.position.z); if(d<nd && !v.seats[0]){ nd=d; nv=v; } }
      if(nv) promptVeh='E — '+nv.def.name+' (4 o\'rin) ga o\'tirish';
    }
    for(const v of vehicles) if(!v.seats[0] && Math.abs(v.speed)>0.1) idleVehicle(v,dt);
    return;
  }
  promptVeh='E — tushish · W/S gaz · A/D rul · Bo\'shliq — qo\'l tormozi (drift) · V — kamera';
  const v=activeVehicle, def=v.def, vp=v.mesh.position, prevYaw=v.vyaw;
  let acc=0, steerIn=0;
  if(keys['KeyW']) acc=1; if(keys['KeyS']) acc=-1; if(keys['KeyA']) steerIn=1; if(keys['KeyD']) steerIn=-1;
  const hb=!!keys['Space'];
  // dvigatel, tormoz, havo qarshiligi, qiyalik (gravitatsiya)
  if(!v.air){
    if(acc>0) v.speed+=(v.speed<0?def.acc*2.2:def.acc*(1-Math.max(0,v.speed)/def.maxF*0.6))*dt;
    else if(acc<0) v.speed-=(v.speed>0?def.acc*2.4:def.acc*0.7)*dt;
    v.speed-=Math.sign(v.speed)*Math.min(Math.abs(v.speed),(0.6+v.speed*v.speed*0.004)*dt);
    if(hb) v.speed*=Math.max(0,1-dt*1.6);
    if(!def.water) v.speed-=9.8*Math.sin(v.pitch)*dt*0.9;
    v.speed=Math.max(-def.maxR,Math.min(def.maxF,v.speed));
  }
  v.steer+=(steerIn*0.55-v.steer)*Math.min(1,dt*(steerIn?3.5:6));
  const sp=v.speed, wb=2.8;
  if(!v.air && Math.abs(sp)>0.3){
    const grip=hb?0.45:1, yr=sp/wb*Math.tan(v.steer)*grip*(1/(1+Math.abs(sp)*0.02));
    v.vyaw+=yr*dt;
    v.slip+=(-yr*Math.abs(sp)*(hb?0.10:0.025)-v.slip)*Math.min(1,dt*(hb?1.5:4)); // yon sirpanish (drift)
  } else v.slip*=Math.max(0,1-dt*2);
  const fx=-Math.sin(v.vyaw), fz=-Math.cos(v.vyaw), rx=Math.cos(v.vyaw), rz=-Math.sin(v.vyaw);
  const mvx=fx*sp+rx*v.slip, mvz=fz*sp+rz*v.slip;
  const nx=vp.x+mvx*dt, nz=vp.z+mvz*dt;
  const tb=terrainBase(nx,nz), ty=terrainY(nx,nz);
  const waterOK=def.water?(tb<-0.6):(ty>-0.35); // ko'prik ustida terrainY = ko'prik balandligi
  // old/orqa burchaklar to'qnashuvi (balandlik bilan)
  const L=def.water?3:2.3, Wd=0.9, dirS=Math.sign(sp||1);
  const cxp=nx+fx*L*dirS, czp=nz+fz*L*dirS;
  const hit=collides(cxp+rx*Wd,czp+rz*Wd,0.25,vp.y+0.2)||collides(cxp-rx*Wd,czp-rz*Wd,0.25,vp.y+0.2)||collides(nx,nz,1.0,vp.y+0.2);
  let otherV=null; for(const o of vehicles){ if(o!==v && Math.hypot(o.mesh.position.x-nx,o.mesh.position.z-nz)<3.6){ otherV=o; break; } }
  if(!hit && waterOK && !otherV){ vp.x=nx; vp.z=nz; }
  else {
    const imp=Math.abs(sp);
    if(otherV){ otherV.speed=sp*0.6; otherV.vyaw=otherV.mesh.rotation.y; otherV.pushYaw=Math.atan2(mvx,mvz); }
    if(imp>14 && hit){ applyDamage((imp-14)*1.2,'To\'qnashuv'); flashDamage(); camShake=0.5; }
    v.speed=-sp*0.25; v.slip*=-0.3; if(imp>4) camShake=Math.max(camShake,imp*0.02);
  }
  // ko'prik panjarasi — chetga chiqib ketmaslik
  const br=bridgeAt(vp.x,vp.z);
  if(br && Math.abs(br.ac)>3.3 && Math.abs(br.al)<br.b.half){
    const push=(Math.abs(br.ac)-3.3)*Math.sign(br.ac); vp.x-=Math.cos(br.b.ang)*push; vp.z+=Math.sin(br.b.ang)*push; v.speed*=0.97;
    // panjaraga tegsa mashina ko'prik yo'nalishiga suriladi (sirpanib boradi)
    let dy=br.b.ang+(Math.cos(v.vyaw-br.b.ang)<0?Math.PI:0)-v.vyaw; dy=Math.atan2(Math.sin(dy),Math.cos(dy));
    v.vyaw+=dy*Math.min(1,dt*3); v.slip*=0.5;
  }
  // yo'lovchilarni urib ketish
  if(Math.abs(sp)>7){ for(const b of bots){ if(!b.alive||b.inVeh||b.air||b.isMate) continue; const p=b.mesh.position; if(Math.abs(p.y-vp.y)<2 && Math.hypot(p.x-(vp.x+fx*1.6),p.z-(vp.z+fz*1.6))<1.8){ damageBot(b,Math.abs(sp)*5,'Siz',0,{x:vp.x,y:vp.y,z:vp.z}); b.mesh.position.x+=mvx*0.08; b.mesh.position.z+=mvz*0.08; v.speed*=0.8; } } }
  // osma (suspension), sakrash, havoda uchish
  if(def.water){ vp.y=Math.sin(performance.now()*0.002)*0.08; v.pitch=Math.sin(performance.now()*0.0015)*0.03-Math.min(0.08,Math.abs(sp)*0.003); v.roll=-v.steer*Math.min(1,Math.abs(sp)/10)*0.12; }
  else {
    const hx=L*0.9, hw=Wd;
    const yF=carGroundY(vp.x+fx*hx,vp.z+fz*hx), yB=carGroundY(vp.x-fx*hx,vp.z-fz*hx), yL=carGroundY(vp.x-rx*hw,vp.z-rz*hw), yR=carGroundY(vp.x+rx*hw,vp.z+rz*hw);
    const gyc=Math.max((yF+yB)/2,(yL+yR)/2,carGroundY(vp.x,vp.z)-0.15);
    const tp=Math.max(-0.5,Math.min(0.5,Math.atan2(yF-yB,2*hx))), tr=Math.max(-0.4,Math.min(0.4,Math.atan2(yL-yR,2*hw)*0.8));
    if(v.air){ v.vy-=18*dt; vp.y+=v.vy*dt; if(vp.y<=gyc){ vp.y=gyc; if(v.vy<-9) camShake=Math.min(0.6,-v.vy*0.03); v.vy=0; v.air=false; } v.pitch+=(-0.08-v.pitch)*dt*0.8; }
    else {
      const dropOff=vp.y-gyc;
      if(dropOff>0.45 && Math.abs(sp)>8){ v.air=true; v.vy=Math.sin(v.pitch)*Math.abs(sp)*0.6; }
      else { vp.y=gyc+Math.max(0,dropOff*0.4); v.pitch+=(tp-v.pitch)*Math.min(1,dt*8); }
      v.roll+=(tr-v.steer*Math.min(1,Math.abs(sp)/20)*0.07-v.slip*0.01-v.roll)*Math.min(1,dt*6);
    }
  }
  v.mesh.rotation.y=v.vyaw; v.mesh.rotation.x=v.pitch; v.mesh.rotation.z=v.roll;
  v.wheels.forEach(w=>{ w.rotation.x-=sp*dt/0.42; });
  v.steerW.forEach(s=>{ s.rotation.y=v.steer; });
  if(v.cockpit && v.cockpit.wheel){ v.cockpit.wheel.rotation.z=-v.steer*2.4; v.cockpit.hands.visible=(vehCam==='fpp'); }
  player.position.set(vp.x,vp.y,vp.z);
  // kamera: kabina ichida (haydovchi ko'zi) yoki orqadan
  yaw+=v.vyaw-prevYaw; let off=Math.atan2(Math.sin(yaw-v.vyaw),Math.cos(yaw-v.vyaw)); if(Math.abs(off)>1.7){ off=Math.sign(off)*1.7; yaw=v.vyaw+off; }
  camShake=Math.max(0,camShake-dt*1.5);
  const sh=camShake*(Math.random()-0.5)*0.15, rough=Math.min(0.03,Math.abs(sp)*0.0012)*Math.sin(performance.now()*0.03);
  camera.rotation.order='YXZ';
  if(vehCam==='fpp' && v.cockpit){
    const s0=v.seatPos[0], ey=v.cockpit.eyeY;
    const local=new THREE.Vector3(s0.x,ey,s0.z+0.05); v.mesh.updateMatrixWorld(); local.applyMatrix4(v.mesh.matrixWorld);
    camera.position.set(local.x,local.y+rough+sh,local.z);
    camera.rotation.set(Math.max(-0.9,Math.min(0.6,pitch))+v.pitch,yaw,v.roll*Math.cos(off)+sh);
    if(camera.fov!==75){ camera.fov=75; camera.updateProjectionMatrix(); }
  } else {
    const bx=Math.sin(yaw), bz=Math.cos(yaw);
    const cx=vp.x+bx*8.5, cz=vp.z+bz*8.5, cy=Math.max(vp.y+3.6,terrainY(cx,cz)+1.5);
    camera.position.set(cx,cy+sh,cz); camera.lookAt(vp.x,vp.y+1.4,vp.z);
    if(camera.fov!==NORMAL_FOV){ camera.fov=NORMAL_FOV; camera.updateProjectionMatrix(); }
  }
  headL.position.set(vp.x+fx*2.4,vp.y+1.1,vp.z+fz*2.4); headL.target.position.set(vp.x+fx*22,vp.y+0.5,vp.z+fz*22);
  headL.intensity=LIGHTS_ON?2.8:0;
  engineUpdate(v.speed);
}
let camShake=0;
// haydovchisiz mashina (urilib ketgan) sekin to'xtaydi
function idleVehicle(v,dt){
  const vp=v.mesh.position, a=v.pushYaw!==undefined?v.pushYaw:v.vyaw+Math.PI;
  const nx=vp.x+Math.sin(a)*Math.abs(v.speed)*dt, nz=vp.z+Math.cos(a)*Math.abs(v.speed)*dt;
  if(!collides(nx,nz,1.2,vp.y+0.2) && terrainY(nx,nz)>-0.35){ vp.x=nx; vp.z=nz; vp.y=terrainY(nx,nz); } else v.speed=0;
  v.speed*=Math.max(0,1-dt*1.8); if(Math.abs(v.speed)<0.15){ v.speed=0; v.pushYaw=undefined; }
}
