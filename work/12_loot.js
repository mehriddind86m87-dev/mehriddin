// ===================== O'LJA (yaqinlashganda yaratiladi) =====================
const loot=[];
function spawnLoot(type,x,z,y){ loot.push({type,x,z,gy:(y===undefined?terrainY(x,z):y),taken:false,mesh:null}); }
function scatterLoot(type,n){
  for(let i=0;i<n;i++){
    let x,z,tries=0;
    do{ const a=Math.random()*6.283, r=Math.sqrt(Math.random())*500; x=Math.cos(a)*r; z=Math.sin(a)*r; tries++; }
    while((collides(x,z,1)||terrainBase(x,z)<1.3||roadWeight(x,z)>0.05)&&tries<30);
    if(tries<30) spawnLoot(type,x,z);
  }
}
scatterLoot('ammo',80); scatterLoot('medkit',46); scatterLoot('armor',34);
scatterLoot('weapon_rifle',22); scatterLoot('weapon_shotgun',15); scatterLoot('weapon_sniper',9);
// binolar ichida har qavatda o'lja
buildings.forEach(b=>{
  b.floors.forEach(fy=>{
    const n=(b.type==='shed'?1:1+Math.floor(Math.random()*2.5));
    for(let i=0;i<n;i++){
      const r=Math.random();
      const type=r<0.34?'ammo':r<0.5?'medkit':r<0.62?'armor':r<0.78?'weapon_rifle':r<0.9?'weapon_shotgun':'weapon_sniper';
      let x,z,tries=0;
      do{ x=b.x0+1.2+Math.random()*(b.x1-b.x0-2.4); z=b.z0+1.2+Math.random()*(b.z1-b.z0-2.4); tries++; }
      while((collides(x,z,0.6,fy)||Math.abs(groundAt(x,z,fy)-fy)>0.3)&&tries<20);
      if(tries<20) spawnLoot(type,x,z,fy);
    }
  });
});
let lootTick=0;
function updateLoot(dt){
  if(parachuting) return;
  lootTick++;
  const px=player.position.x, pz=player.position.z;
  if(lootTick%6===0){
    for(const it of loot){
      if(it.taken) continue;
      const d=Math.hypot(it.x-px,it.z-pz);
      if(d<110){
        if(!it.mesh){ it.mesh=buildLootModel(it.type); it.mesh.traverse(o=>{ if(o.isMesh && !o.material.transparent) o.castShadow=true; }); scene.add(it.mesh); }
        it.mesh.visible=true;
      } else if(it.mesh) it.mesh.visible=false;
    }
  }
  for(const it of loot){
    if(it.taken||!it.mesh||!it.mesh.visible) continue;
    it.mesh.rotation.y+=dt*1.6;
    it.mesh.position.set(it.x,it.gy+0.9+Math.sin(performance.now()*0.003+it.x)*0.1,it.z);
    if(pState==='alive' && Math.hypot(it.x-px,it.z-pz)<1.6 && Math.abs(it.gy-player.position.y)<1.6){
      it.taken=true; scene.remove(it.mesh);
      if(it.type==='ammo'){ const inv=inventory[currentWeapon], w=WEAPONS[currentWeapon]; inv.reserve=Math.min(w.reserveMax,inv.reserve+30); showMsg('🔸 PATRON OLINDI (+30)',900); }
      else if(it.type==='medkit'){ hp=Math.min(100,hp+40); showMsg('🩹 APTECHKA (+40 HP)',900); }
      else if(it.type==='armor'){ armor=Math.min(100,armor+50); showMsg('🛡️ BRONJILET (+50)',900); }
      else if(it.type==='weapon_rifle'){ inventory.rifle.owned=true; inventory.rifle.ammo=WEAPONS.rifle.cap; inventory.rifle.reserve=60; switchWeapon('rifle'); showMsg('🎯 AVTOMAT TOPILDI!',900); }
      else if(it.type==='weapon_shotgun'){ inventory.shotgun.owned=true; inventory.shotgun.ammo=WEAPONS.shotgun.cap; inventory.shotgun.reserve=18; switchWeapon('shotgun'); showMsg('💥 DROBOVIK TOPILDI!',900); }
      else { inventory.sniper.owned=true; inventory.sniper.ammo=WEAPONS.sniper.cap; inventory.sniper.reserve=10; switchWeapon('sniper'); showMsg('🔭 SNAYPER TOPILDI!',900); }
      updateHud();
    }
  }
}

