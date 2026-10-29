// ===================== O'YIN HOLATI =====================
const keys={}; let yaw=0,pitch=0,velocityY=0,onGround=true,reloading=false,hp=100,armor=0,kills=0,gameOver=false,started=false,zoomed=false;
let pState='alive', downHp=100, revProg=0, playerRevFrac=0;
const NORMAL_FOV=65, ZOOM_FOV=28;
const clock=new THREE.Clock();

const WEAPONS={
  pistol:  {name:'Pistol',  dmg:26, cap:12, reserveMax:60,  fireDelay:0.33, reloadTime:1.0, pellets:1, color:0x2a2a2a},
  rifle:   {name:'Rifle', auto:true, dmg:24, cap:30, reserveMax:120, fireDelay:0.13, reloadTime:1.6, pellets:1, color:0x1f1f1f},
  shotgun: {name:'Shotgun', dmg:15, cap:6,  reserveMax:36,  fireDelay:0.75, reloadTime:1.8, pellets:5, color:0x4a3627},
  sniper:  {name:'Sniper',  dmg:95, cap:5,  reserveMax:20,  fireDelay:1.35, reloadTime:2.2, pellets:1, color:0x1a2b1a}
};
const inventory={
  pistol:{owned:true,ammo:12,reserve:24}, rifle:{owned:false,ammo:0,reserve:0},
  shotgun:{owned:false,ammo:0,reserve:0}, sniper:{owned:false,ammo:0,reserve:0}
};
let currentWeapon='pistol', fireCooldown=0, mouseHeld=false;
function switchWeapon(key){
  if(!inventory[key].owned || key===currentWeapon || reloading) return;
  currentWeapon=key; fireCooldown=0;
  Object.keys(gunModels).forEach(k=>{ gunModels[k].visible=(k===key); });
  muzzleLight.position.z=MUZZLE_Z[key]+0.05; flashMesh.position.z=MUZZLE_Z[key]-0.05;
  showMsg(WEAPONS[key].name.toUpperCase()+' TANLANDI',650);
  updateHud();
}

// ===================== HUD yordamchilari =====================
function showMsg(t,dur){
  const m=document.getElementById('msg');
  m.textContent=t; m.style.display='block';
  clearTimeout(showMsg._t);
  showMsg._t=setTimeout(()=>{ m.style.display='none'; },dur||800);
}
function addKillFeed(killer,victim,icon){
  const feed=document.getElementById('killfeed');
  const row=document.createElement('div'); row.className='kfrow';
  row.textContent=killer+' '+(icon||'💀')+' '+victim;
  feed.appendChild(row);
  while(feed.children.length>6) feed.removeChild(feed.firstChild);
  setTimeout(()=>{ if(row.parentNode) row.parentNode.removeChild(row); },5000);
}
const dmgFlash=document.createElement('div');
dmgFlash.style.cssText='position:fixed;inset:0;background:rgba(255,0,0,.35);pointer-events:none;opacity:0;transition:opacity .08s;z-index:5;';
document.body.appendChild(dmgFlash);
function flashDamage(){ dmgFlash.style.opacity='1'; setTimeout(()=>{ dmgFlash.style.opacity='0'; },120); }
const tracerMat=new THREE.LineBasicMaterial({color:0xffe066,transparent:true,opacity:0.9});
function fireTracer(a,b){
  const geo=new THREE.BufferGeometry().setFromPoints([a,b]);
  const line=new THREE.Line(geo,tracerMat.clone());
  scene.add(line);
  setTimeout(()=>{ scene.remove(line); geo.dispose(); },90);
}
function updateHud(){
  const inv=inventory[currentWeapon], w=WEAPONS[currentWeapon];
  document.getElementById('ammoCount').textContent=inv.ammo;
  document.getElementById('ammoReserve').textContent=inv.reserve;
  document.getElementById('weaponName').textContent=w.name;
  const hf=document.getElementById('hpfill');
  if(pState==='down'){ hf.style.width=Math.max(0,downHp)+'%'; hf.style.background='linear-gradient(90deg,#b71c1c,#ef5350)'; }
  else { hf.style.width=Math.max(0,hp)+'%'; hf.style.background='linear-gradient(90deg,#4caf50,#8bc34a)'; }
  document.getElementById('armorfill').style.width=Math.max(0,armor)+'%';
  ['pistol','rifle','shotgun','sniper'].forEach(k=>{
    const el=document.getElementById('slot_'+k);
    el.classList.toggle('owned',inventory[k].owned); el.classList.toggle('active',k===currentWeapon);
  });
}

