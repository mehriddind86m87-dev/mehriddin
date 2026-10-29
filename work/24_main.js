// ===================== O'YINNI BOSHLASH =====================
function renderPrompt(){
  const el=document.getElementById('prompt'), t=promptRev||promptVeh||(nearBox?'F — '+nearBox.name+' qutisini ochish 📦':'');
  if(t){ el.style.display='block'; el.textContent=t; } else el.style.display='none';
}
function startMatch(){
  phase='plane'; parachuting=true; chuteOpen=false;
  planeSetup();
  squads.forEach(sq=>{
    if(sq.isMate){ sq.members.forEach(m=>{ m.air=true; m.state='plane'; m.mesh.visible=false; m.chute.visible=false; m.jumpAt=Infinity; }); return; }
    const base=1.5+Math.random()*(PLANE_DUR-4);
    sq.members.forEach((m,i)=>{ m.air=true; m.state='plane'; m.mesh.visible=false; m.chute.visible=false; m.jumpAt=base+i*0.4; });
  });
  zone.started=true; zone.timer=ZONE_PHASES[0].wait+40;
  buildMapStatic();
  showMsg('✈ SAMOLYOTDA — SPACE bilan xohlagan joyda sakrang! (M — xarita)',3500);
}
document.getElementById('envtag').textContent=TOD_UZ[TOD]+' · '+SEASON_UZ[SEASON]+' · '+WEATHER_UZ[WEATHER];
document.getElementById('playBtn').addEventListener('click',()=>{
  document.getElementById('start').style.display='none';
  started=true; resize();
  if(!('ontouchstart' in window) && canvas.requestPointerLock) canvas.requestPointerLock().catch(()=>{});
  startMatch(); clock.getDelta(); animate();
});

// ===================== ASOSIY TSIKL =====================
let frameN=0, safetyFrames=14, blackCount=0;
function animate(){
  if(gameOver) return;
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);
  frameN++;
  fireCooldown=Math.max(0,fireCooldown-dt);
  if(mouseHeld && WEAPONS[currentWeapon].auto && started && !inVehicle) shoot();
  updatePlane(dt);
  updateBots(dt);
  updatePlayer(dt);
  updateVehicle(dt);
  updateDyingBots(dt);
  updateLoot(dt);
  updateZone(dt);
  updatePrecip(dt);
  fxUpdate(dt);
  renderPrompt();
  skyDome.position.copy(camera.position);
  const cx=camera.position.x, cz=camera.position.z;
  sun.position.set(cx+SUN_DIR.x*160,SUN_DIR.y*160,cz+SUN_DIR.z*160);
  sun.target.position.set(cx,0,cz); sun.target.updateMatrixWorld();
  for(const c of clouds){ c.position.x+=dt*3; if(c.position.x>1300) c.position.x=-1300; }
  waterTex.offset.x+=dt*0.0016; waterTex.offset.y+=dt*0.0011;
  if(frameN%3===0) drawMinimap();
  if(bigOpen && frameN%8===0) drawBigMap();
  if(frameN%6===0){ updateSquadHud(); }
  updateLabels();
  if(frameN%20===0){ const el=document.getElementById('alivecount'); if(el) el.textContent=enemiesAlive()+teamAliveCount(); }
  if(composer){
    composer.render(dt);
    if(safetyFrames>0){
      safetyFrames--;
      try{
        const gl=renderer.getContext(), px=new Uint8Array(4);
        gl.readPixels(Math.floor(gl.drawingBufferWidth/2),Math.floor(gl.drawingBufferHeight/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
        if(px[0]+px[1]+px[2]===0){ blackCount++; if(blackCount>=4) composer=null; }
      }catch(e){}
    }
  } else renderer.render(scene,camera);
}
function teamAliveCount(){ let n=(pState==='dead')?0:1; for(const b of bots){ if(b.isMate && b.alive) n++; } return n; }
window.addEventListener('resize',resize);
resize();
renderer.render(scene,camera);
updateHud();

// test uchun: index.html#debug
if(location.hash==='#debug') window.__dbg={
  st:()=>({pState,phase,inVehicle,hp:typeof playerHp!=='undefined'?playerHp:null,pos:[player.position.x,player.position.y,player.position.z],alive:bots.filter(b=>b.alive).length,boxes:deathboxes.length,builds:buildings.length,bridges:bridges.length,cam:vehCam,modes:bots.filter(b=>b.isMate).map(b=>b.ai+(b.down?'/down':'')+(b.alive?'':'/dead')),enemyAi:bots.filter(b=>!b.isMate&&b.alive).reduce((o,b)=>(o[b.air?'air':b.ai]=(o[b.air?'air':b.ai]||0)+1,o),{})}),
  land:(x,z)=>{ if(typeof ph!=='undefined') ph.style.display='none'; phase='ground'; parachuting=false; playerChute.visible=false; player.position.set(x,groundAt(x,z),z); velocityY=0; onGround=true; bots.filter(b=>b.isMate).forEach((b,i)=>{ b.air=false; b.state='ground'; if(b.chute) b.chute.visible=false; b.mesh.visible=true; const mx=x+3+i*2, mz=z+2; b.mesh.position.set(mx,groundAt(mx,mz),mz); b.thinkT=0; }); },
  bld:i=>{ const b=buildings[i]; return {type:b.type,x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,floors:b.floors&&b.floors.length,doors:b.doors}; },
  bridge:i=>{ const b=bridges[i]; return {cx:b.cx,cz:b.cz,ang:b.ang,half:b.half,deckY:b.deckY}; },
  look:(y,p)=>{ yaw=y; pitch=p; },
  car:()=>{ let best=null,bd=1e9; for(const v of vehicles){ if(v.def.water) continue; const d=Math.hypot(v.mesh.position.x-player.position.x,v.mesh.position.z-player.position.z); if(d<bd){bd=d;best=v;} } if(best){ player.position.copy(best.mesh.position); enterVehicle(best);} return best&&best.type; },
  carTo:(x,z,a)=>{ const v=activeVehicle; if(!v) return; v.mesh.position.set(x,terrainY(x,z),z); v.vyaw=a; yaw=a; v.speed=0; },
  veh:()=>{ const v=activeVehicle; return v?{x:v.mesh.position.x,y:v.mesh.position.y,z:v.mesh.position.z,speed:v.speed,air:v.air}:null; },
  knockMate:()=>{ const m=bots.find(b=>b.isMate&&b.alive&&!b.down); if(m){ m.mesh.position.set(player.position.x+1.5,player.position.y,player.position.z); knockBot(m,'test'); } return m&&m.name; },
  killEnemy:()=>{ const e=bots.find(b=>!b.isMate&&b.alive&&!b.air); if(e){ e.mesh.position.set(player.position.x+4,groundAt(player.position.x+4,player.position.z),player.position.z); killBotFinal(e,'Siz',0); } return e&&e.name; },
  env:()=>ENV,
  mateDist:()=>bots.filter(b=>b.isMate).map(b=>+Math.hypot(b.mesh.position.x-player.position.x,b.mesh.position.z-player.position.z).toFixed(1)),
  pick:()=>{ const rc=new THREE.Raycaster(); rc.setFromCamera({x:0,y:0},camera); const vis=o=>{ while(o){ if(!o.visible) return false; o=o.parent; } return true; }; const h=rc.intersectObjects(scene.children,true).filter(o=>vis(o.object)).slice(0,4); return h.map(o=>({d:+o.distance.toFixed(2),g:o.object.geometry.type,p:o.object.parent&&o.object.parent.type,inVeh:!!(activeVehicle&&(function(m){ while(m){ if(m===activeVehicle.mesh) return true; m=m.parent; } return false; })(o.object)),pos:o.object.position.toArray().map(v=>+v.toFixed(2)),par:o.object.geometry.parameters?JSON.stringify(o.object.geometry.parameters).slice(0,80):''})); },
  prof:()=>{ const t0=performance.now(); for(let i=0;i<10;i++) updateBots(0.016); const t1=performance.now(); for(let i=0;i<3;i++) renderer.render(scene,camera); const t2=performance.now(); for(let i=0;i<10;i++) updatePrecip(0.016); const t3=performance.now(); return {bots:(t1-t0)/10,render:(t2-t1)/3,precip:(t3-t2)/10,calls:renderer.info.render.calls,tris:renderer.info.render.triangles}; },
  bridgeProbe:()=>bridges.map(b=>{ let maxStep=0,blocked=0,prev=null,minY=1e9; for(let t=-b.half-14;t<=b.half+14;t+=0.5){ const x=b.cx+Math.sin(b.ang)*t, z=b.cz+Math.cos(b.ang)*t, y=terrainY(x,z); if(prev!==null) maxStep=Math.max(maxStep,Math.abs(y-prev)); prev=y; if(Math.abs(t)<b.half) minY=Math.min(minY,y); if(collides(x,z,1.0,y+0.2)) blocked++; } return {half:+b.half.toFixed(1),deckY:b.deckY,maxStep:+maxStep.toFixed(2),blocked,minDeck:+minY.toFixed(2)}; }),
  bridgeX:()=>{ let n=0; for(let i=0;i<bridges.length;i++) for(let j=i+1;j<bridges.length;j++){ const a=bridges[i], c=bridges[j]; if(Math.hypot(a.cx-c.cx,a.cz-c.cz)<a.half+c.half && segX(a.S,a.E,c.S,c.E)) n++; } return n; },
  killEnemy2:()=>{ const e=bots.find(b=>!b.isMate&&b.alive); if(e){ e.air=false; e.state='ground'; if(e.chute) e.chute.visible=false; e.mesh.position.set(player.position.x+4,groundAt(player.position.x+4,player.position.z),player.position.z); killBotFinal(e,'Siz',0); } return e&&e.name; },
  fps:()=>new Promise(r=>{ let n=0; const t0=performance.now(); (function f(){ n++; if(performance.now()-t0<2000) requestAnimationFrame(f); else r(n/2); })(); })
};
})();
</script>
</body>
</html>

