// ===================== QUROL: otish, zaryadlash =====================
const raycaster=new THREE.Raycaster();
function botFromMesh(o){ while(o){ const b=bots.find(bb=>bb.mesh===o); if(b) return b; o=o.parent; } return null; }
function reload(){
  const w=WEAPONS[currentWeapon], inv=inventory[currentWeapon];
  if(reloading||inv.ammo===w.cap||inv.reserve<=0||pState!=='alive') return;
  reloading=true; showMsg('QAYTA ZARYADLANMOQDA...',Math.round(w.reloadTime*1000));
  setTimeout(()=>{ const need=w.cap-inv.ammo, take=Math.min(need,inv.reserve); inv.ammo+=take; inv.reserve-=take; reloading=false; updateHud(); },w.reloadTime*1000);
}
function showHitMarker(headshot){
  const hm=document.getElementById('hitmarker');
  hm.style.color=headshot?'#ff3333':'#ffffff'; hm.style.display='block';
  clearTimeout(showHitMarker._t); showHitMarker._t=setTimeout(()=>{ hm.style.display='none'; },160);
}
function shoot(){
  const w=WEAPONS[currentWeapon], inv=inventory[currentWeapon];
  if(!started||gameOver||reloading||inv.ammo<=0||inVehicle||fireCooldown>0||parachuting||pState!=='alive') return;
  fireCooldown=w.fireDelay; inv.ammo--; updateHud();
  playShot(); recoil=1;
  gunshots.push({x:player.position.x,z:player.position.z,y:player.position.y,t:performance.now(),mate:true,team:0}); if(gunshots.length>60) gunshots.shift();
  muzzleLight.intensity=3.2; flashMesh.material.opacity=0.9; flashMesh.scale.setScalar(0.7+Math.random()*0.6);
  setTimeout(()=>{ muzzleLight.intensity=0; flashMesh.material.opacity=0; },45);
  const targets=bots.filter(b=>b.alive && !b.air && !b.inVeh && b.team!==0).map(b=>b.mesh);
  let anyHeadshot=false, anyHit=false;
  for(let p=0;p<w.pellets;p++){
    const dir=new THREE.Vector3(); camera.getWorldDirection(dir);
    if(w.pellets>1){ dir.x+=(Math.random()-0.5)*0.09; dir.y+=(Math.random()-0.5)*0.09; dir.normalize(); }
    raycaster.set(camera.position,dir);
    const hits=raycaster.intersectObjects(targets,true);
    let clear=false;
    if(hits.length){ const end=camera.position.clone().addScaledVector(dir,hits[0].distance); clear=segObstacle(camera.position,end)>=0.995; }
    if(hits.length && clear){
      const hitMesh=hits[0].object, bot=botFromMesh(hitMesh);
      if(bot && bot.alive){
        const headshot=!!hitMesh.userData.isHead;
        anyHit=true; if(headshot) anyHeadshot=true;
        damageBot(bot, headshot?w.dmg*2:w.dmg, 'Siz', 0, {x:player.position.x,y:player.position.y,z:player.position.z});
        for(const m of squads[0].members){ if(m.alive&&!m.down&&(!m.mem||performance.now()-m.mem.t>1500)) m.mem={x:bot.mesh.position.x,y:bot.mesh.position.y,z:bot.mesh.position.z,t:performance.now()}; }
      }
    }
  }
  if(anyHit){ playHitBeep(); showHitMarker(anyHeadshot); }
}

