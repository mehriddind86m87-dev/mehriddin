// ===================== GURUHLAR (SQUAD) VA AQLLI BOTLAR (AI) =====================
const bots=[], squads=[];
const BOT_NAMES=['Sherzod','Bekzod','Jasur','Nodir','Otabek','Diyor','Sanjar','Ravshan','Farrux','Islom','Alisher','Jahongir','Bobur','Dilshod',"Ulug'bek",'Aziz','Shoxrux','Timur','Rustam','Anvar','Kamron','Shavkat','Davron','Elyor','Sardor','Murod','Hasan','Husan','Zafar','Laziz','Odil','Nuriddin','Behzod','Akmal','Doniyor','Sirojiddin','Mansur','Umid','Eldor','Javlon','Habib','Ilhom','Lochin','Mirzo','Qodir','Rahim','Said','Temur','Voris','Yusuf','Zokir','Asror','Botir','Fazliddin','Gayrat','Hamza','Jamshid','Kamol','Nurbek','Oybek','Pulat','Quvonch','Rasul','Saidakbar','Toxir','Ummat','Vali','Xurshid','Yorqin','Zuhriddin','Abror','Baxtiyor','Dostonbek','Erkin','Fayzullo','Gulom','Hikmat','Ibrohim','Jaloliddin','Komil','Lutfulla','Mahmud','Nosir','Orif','Parviz','Ramziddin','Sobir','Tolib','Ulmas','Vohid','Xasan','Yahyo','Zarif','Abbos','Bahrom','Dadaxon','Eshmat','Firdavs','G\'ofur','Hayot'];
let botNamePool=[...BOT_NAMES].sort(()=>Math.random()-0.5), botNameIdx=0;
function nextBotName(){ if(botNameIdx>=botNamePool.length) botNameIdx=0; return botNamePool[botNameIdx++]; }
const W_RANK={pistol:1,shotgun:2,rifle:3,sniper:3};
const W_RANGE={pistol:45,shotgun:24,rifle:120,sniper:260};
const W_PREF={pistol:14,shotgun:7,rifle:28,sniper:70};
function setBotWeapon(b,key){
  if(b.gun) b.c.upper.remove(b.gun);
  const g=buildWeaponModel(key); g.rotation.y=Math.PI; g.scale.setScalar(0.8); g.position.set(0.16,0.42,0.42);
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); b.c.upper.add(g); b.gun=g; b.weap=key; b.mag=WEAPONS[key].cap;
}
function spawnBot(team,isMate,hue){
  const c=new THREE.Color().setHSL(hue,isMate?0.65:0.55,isMate?0.42:0.38);
  const pants=new THREE.Color().setHSL(isMate?0.6:Math.random(),0.3,0.22);
  const bc=buildCharacter(c.getHex(),pants.getHex());
  const g=bc.group;
  g.position.set(0,-50,0); g.visible=false; scene.add(g);
  const b={mesh:g,c:bc,gun:null,head:bc.head,legL:bc.legL,legR:bc.legR,armL:bc.armL,armR:bc.armR,
    name:nextBotName(),team,isMate,sq:null,off:{x:0,z:0},hp:100,alive:true,down:false,downHp:100,reviveT:0,beingRevived:0,
    dir:Math.random()*Math.PI*2,shootTimer:Math.random()*2,dying:false,deadT:0,walkPhase:Math.random()*10,aiming:false,
    air:false,state:'ground',chute:makeChute(),vy:0,land:{x:0,z:0},jumpAt:0,inVeh:null,seat:-1,
    weap:'pistol',mag:12,reloadT:0,meds:Math.random()<0.4?1:0,armor:0,skill:isMate?0.62+Math.random()*0.1:0.36+Math.random()*0.2,
    ai:'explore',thinkT:Math.random()*0.4,tgt:null,tgtVis:false,mem:null,path:[],pathGoal:null,pathT:0,stuck:0,unstuckT:0,lastX:0,lastZ:0,
    crouch:false,strafe:Math.random()<0.5?1:-1,strafeT:0,healT:0,lootTgt:null,post:null,postT:0,callT:0,seenT:0,moving:false,pose:null,watchYaw:0,coverPt:null};
  setBotWeapon(b,Math.random()<0.25?pick(['rifle','shotgun']):'pistol');
  return b;
}
function makeSquad(id,count,isMate){
  const sq={id,members:[],dest:null,destT:0,isMate,leader:null,landing:null};
  for(let i=0;i<count;i++){
    const b=spawnBot(id,isMate,isMate?0.58+Math.random()*0.04:(id*0.137)%1);
    const a=i*2.1+0.5, r=3+Math.random()*2; b.off={x:Math.cos(a)*r,z:Math.sin(a)*r};
    b.sq=sq; sq.members.push(b); bots.push(b);
  }
  squads.push(sq); return sq;
}
makeSquad(0,3,true);                                   // sizning o'rtoqlaringiz (siz + 3)
for(let s=1;s<=24;s++) makeSquad(s,4,false);           // 24 ta dushman guruhi × 4 → jami 100 o'yinchi

// --- hisob-kitob yordamchilari
function teamHealthy(team){ let n=0; for(const b of bots){ if(b.team===team && b.alive && !b.down) n++; } if(team===0 && pState==='alive') n++; return n; }
function matesHealthy(){ let n=0; for(const b of bots){ if(b.isMate && b.alive && !b.down) n++; } return n; }
function enemiesAlive(){ let n=0; for(const b of bots){ if(b.team!==0 && b.alive) n++; } return n; }
function botAt(b){ const p=b.mesh.position; return {x:p.x,y:p.y,z:p.z}; }
function mateSay(b,text,cd){ if(!b.isMate) return; const now=performance.now(); if(now<b.callT) return; b.callT=now+(cd||5000); teamSay(b.name,text); }

// --- zarar / yiqilish / o'lim
function damageBot(b,dmg,killerName,killerTeam,from){
  if(!b.alive||b.air||gameOver) return;
  if(from){ b.mem={x:from.x,y:from.y,z:from.z,t:performance.now(),hurt:true}; shareIntel(b,b.mem); }
  if(b.down){ b.downHp-=dmg; if(b.downHp<=0) killBotFinal(b,killerName,killerTeam); return; }
  if(b.armor>0){ const ab=Math.min(b.armor,dmg*0.45); b.armor-=ab; dmg-=ab; }
  b.hp-=dmg;
  if(b.hp<=0){
    b.hp=0;
    if(teamHealthy(b.team)-1>0) knockBot(b,killerName); else killBotFinal(b,killerName,killerTeam);
  } else if(b.isMate && b.hp<45) mateSay(b,'Menga tegdi, HP kam!',7000);
}
function knockBot(b,killerName){
  b.down=true; b.downHp=100; b.reviveT=0; b.aiming=false; b.crouch=false; b.path=[];
  if(b.inVeh) vehicleUnseat(b);
  b.mesh.rotation.x=0; b.mesh.rotation.z=0;
  addKillFeed(killerName,b.name,'🔻');
  if(b.isMate) teamSay(b.name,'Meni yiqitishdi! Ko\'taringlar! 🔻');
}
function reviveBot(b){
  b.down=false; b.hp=35; b.downHp=100; b.reviveT=0; b.beingRevived=0;
  b.mesh.rotation.x=0; b.mesh.rotation.z=0;
  for(let i=0;i<14;i++) fxSpawn(b.mesh.position.x,b.mesh.position.y+0.5,b.mesh.position.z,0.8,2.2);
  if(b.isMate) teamSay(b.name,'Rahmat! Davom etamiz 💪');
}
function killBotFinal(b,killerName,killerTeam){
  if(!b.alive) return;
  b.alive=false; b.aiming=false;
  const wasDown=b.down; b.down=false;
  if(b.inVeh) vehicleUnseat(b);
  b.mesh.visible=true; b.dying=true; b.deadT=0; b.fallDir=Math.random()<0.5?1:-1; b.wasDown=wasDown;
  spawnDeathbox(b);
  addKillFeed(killerName,b.name,'💀');
  if(killerTeam===0 && killerName==='Siz'){ kills++; document.getElementById('killcount').textContent=kills; }
  if(b.isMate) teamSay(b.name,'... 💀');
  else if(killerTeam===0){ const m=squads[0].members.find(x=>x.alive&&!x.down&&x!==b); if(m && Math.random()<0.5) mateSay(m,pick(['Zo\'r! Bittasi tugadi','Yaxshi otding!','Bitta kam!']),4000); }
  squadCheck(b.team);
  if(!gameOver && enemiesAlive()===0) winGame();
}
function squadCheck(team){
  if(teamHealthy(team)>0) return;
  for(const m of bots){ if(m.team===team && m.alive && m.down) killBotFinal(m,'Guruh tugadi',-1); }
  if(team===0 && pState==='down') playerDie('Guruh tugadi');
}
// O'lgan o'yinchidan o'lja qutisi (deathbox) qoladi
const deathboxes=[];
const dbMat=new THREE.MeshStandardMaterial({color:0x2e3a2a,roughness:.6,metalness:.4}), dbLid=new THREE.MeshStandardMaterial({color:0x3e4c38,roughness:.5,metalness:.5}), dbGlow=new THREE.MeshStandardMaterial({color:0xffd34d,emissive:0xffb300,emissiveIntensity:1.4});
function spawnDeathbox(b){
  const p=b.mesh.position, g=new THREE.Group();
  const box=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.5,0.62),dbMat); box.position.y=0.25; box.castShadow=true;
  const lid=new THREE.Mesh(new THREE.BoxGeometry(1.04,0.12,0.66),dbLid); lid.position.y=0.56; lid.castShadow=true;
  const band=new THREE.Mesh(new THREE.BoxGeometry(1.01,0.06,0.63),dbGlow); band.position.y=0.38;
  const h1=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.08,0.3),dbLid); h1.position.set(-0.53,0.36,0); const h2=h1.clone(); h2.position.x=0.53;
  g.add(box,lid,band,h1,h2);
  const a=Math.random()*6.283; const x=p.x+Math.cos(a)*0.9, z=p.z+Math.sin(a)*0.9;
  g.position.set(x,Math.max(groundAt(x,z,p.y+0.3),-0.9),z); g.rotation.y=Math.random()*6.28; scene.add(g);
  deathboxes.push({mesh:g,band,x,z,y:g.position.y,name:b.name,weap:b.weap,ammo:20+Math.floor(Math.random()*60),meds:b.meds+(Math.random()<0.5?1:0),armor:Math.round(b.armor),empty:false});
}
function lootDeathboxPlayer(db){
  const got=[];
  if(db.weap!=='pistol'){ const inv=inventory[db.weap]; if(!inv.owned){ inv.owned=true; inv.ammo=WEAPONS[db.weap].cap; inv.reserve=Math.min(WEAPONS[db.weap].reserveMax,db.ammo); switchWeapon(db.weap); got.push(WEAPONS[db.weap].name); } else { inv.reserve=Math.min(WEAPONS[db.weap].reserveMax,inv.reserve+db.ammo); got.push('+'+db.ammo+' patron'); } }
  else { const inv=inventory[currentWeapon]; inv.reserve=Math.min(WEAPONS[currentWeapon].reserveMax,inv.reserve+db.ammo); got.push('+'+db.ammo+' patron'); }
  if(db.meds>0){ hp=Math.min(100,hp+35*db.meds); got.push('aptechka'); }
  if(db.armor>armor){ armor=db.armor; got.push('bronjilet'); }
  db.empty=true; db.band.material=new THREE.MeshStandardMaterial({color:0x444444}); updateHud();
  showMsg('📦 '+db.name+' qutisi: '+got.join(', '),1800);
}
function updateDyingBots(dt){
  for(const b of bots){
    if(!b.dying) continue;
    b.deadT+=dt;
    applyPose(b.c,POSE_DEAD,Math.min(1,dt*6));
    if(b.deadT<0.6){ const t=Math.min(1,b.deadT/0.6); b.mesh.rotation.x=-t*Math.PI/2; b.c.hips.position.y=0.86-(b.wasDown?0.36:0)*(1-t)-t*0.62; }
    if(b.deadT>4){ b.mesh.visible=false; b.dying=false; scene.remove(b.mesh); }
  }
}
// O'yinchi yaqinidagi qutini ochish (F)
let nearBox=null;
document.addEventListener('keydown',e=>{ if(e.code==='KeyF' && nearBox && phase==='ground' && pState==='alive' && !inVehicle){ lootDeathboxPlayer(nearBox); nearBox=null; } });
function updateDeathboxes(){
  nearBox=null;
  if(inVehicle||pState!=='alive') return;
  const pp=player.position;
  for(const d of deathboxes){ if(d.empty) continue; if(Math.hypot(d.x-pp.x,d.z-pp.z)<2.3 && Math.abs(d.y-pp.y)<1.8){ nearBox=d; break; } }
}

// --- jismoniy harakat (balandlik, gravitatsiya, zinapoya)
function botPhysics(b,dt){
  const p=b.mesh.position, gy=Math.max(groundAt(p.x,p.z,p.y),-0.9);
  if(p.y>gy+0.05){ b.vy-=20*dt; p.y=Math.max(gy,p.y+b.vy*dt); if(p.y===gy) b.vy=0; }
  else { p.y=gy; b.vy=0; }
}
function botStep(b,gx,gz,speed,dt){
  const p=b.mesh.position, dx=gx-p.x, dz=gz-p.z;
  if(Math.hypot(dx,dz)<0.35) return false;
  const sp=speed*(terrainBase(p.x,p.z)<-0.3?0.5:1), ang=Math.atan2(dx,dz);
  const offs=b.unstuckT>0?[b.strafe*1.4,b.strafe*2.2,0]:[0,0.6,-0.6,1.2,-1.2,1.9,-1.9];
  for(let k=0;k<offs.length;k++){
    const a=ang+offs[k], nx=p.x+Math.sin(a)*sp*dt, nz=p.z+Math.cos(a)*sp*dt;
    if(!collides(nx,nz,0.38,p.y) && terrainBase(nx,nz)>-4.5 && groundAt(nx,nz,p.y)<p.y+STEP_UP){ p.x=nx; p.z=nz; b.dir=a; return true; }
  }
  return false;
}
// --- yo'l topish: eshiklar va zinapoyalar orqali
function floorIdx(bl,y){ let k=0; for(let i=0;i<bl.floors.length;i++) if(y>=bl.floors[i]-0.7) k=i; return k; }
function nearestDoor(bl,x,z){ let best=bl.doors[0], bd=1e9; for(const d of bl.doors){ const dd=Math.hypot(d.o.x-x,d.o.z-z); if(dd<bd){ bd=dd; best=d; } } return best; }
function planPath(b,g){
  const p=b.mesh.position, pb=buildingAt(p.x,p.z,0.3), gb=buildingAt(g.x,g.z,0.3), path=[];
  let fk=0;
  if(pb){
    fk=floorIdx(pb,p.y);
    const gk=(gb===pb)?floorIdx(pb,g.y):0;
    for(let k=fk-1;k>=gk;k--){ const s=pb.stairs[k]; if(s){ path.push({x:s.hi.x,z:s.hi.z},{x:s.lo.x,z:s.lo.z}); } }
    if(gb===pb){ for(let k=fk;k<gk;k++){ const s=pb.stairs[k]; if(s) path.push({x:s.lo.x,z:s.lo.z},{x:s.hi.x,z:s.hi.z}); } path.push({x:g.x,z:g.z}); return path; }
    const d=nearestDoor(pb,g.x,g.z); path.push({x:d.i.x,z:d.i.z},{x:d.o.x,z:d.o.z});
  }
  if(gb){
    const d=nearestDoor(gb,p.x,p.z); path.push({x:d.o.x,z:d.o.z},{x:d.i.x,z:d.i.z});
    const gk=floorIdx(gb,g.y);
    for(let k=0;k<gk;k++){ const s=gb.stairs[k]; if(s) path.push({x:s.lo.x,z:s.lo.z},{x:s.hi.x,z:s.hi.z}); }
  }
  path.push({x:g.x,z:g.z});
  return path;
}
function navTo(b,gx,gz,gy,speed,dt){
  const p=b.mesh.position;
  if(gy===undefined) gy=groundAt(gx,gz);
  const pg=b.pathGoal;
  b.pathT-=dt;
  if(!pg || Math.hypot(pg.x-gx,pg.z-gz)>3 || Math.abs(pg.y-gy)>1.5 || b.pathT<=0 || !b.path.length){ b.path=planPath(b,{x:gx,z:gz,y:gy}); b.pathGoal={x:gx,z:gz,y:gy}; b.pathT=4; }
  while(b.path.length>1 && Math.hypot(b.path[0].x-p.x,b.path[0].z-p.z)<0.8) b.path.shift();
  const w=b.path[0]; if(!w) return false;
  if(b.path.length===1 && Math.hypot(w.x-p.x,w.z-p.z)<0.6) return false;
  return botStep(b,w.x,w.z,speed,dt);
}
// --- sezgi: ko'rish (to'siq orqali ko'rmaydi) va eshitish
function eyeOf(o,isPlayer){
  if(isPlayer){ const pp=player.position; return {x:pp.x,y:pp.y+(pState==='down'?0.5:(keys['KeyC']?1.0:1.5)),z:pp.z}; }
  const p=o.mesh.position; return {x:p.x,y:p.y+(o.down?0.55:(o.crouch?1.05:1.5)),z:p.z};
}
function senseTargets(b){
  const p=b.mesh.position, me=eyeOf(b,false), maxR=Math.max(130,W_RANGE[b.weap]);
  const cands=[];
  if(b.team!==0 && phase==='ground' && pState!=='dead' && !inVehicle){
    const pp=player.position, d=Math.hypot(pp.x-p.x,pp.z-p.z); if(d<maxR) cands.push({d,isPlayer:true,bot:null});
  }
  for(const o of bots){
    if(o===b||o.team===b.team||!o.alive||o.air||o.inVeh) continue;
    const op=o.mesh.position, d=Math.abs(op.x-p.x)+Math.abs(op.z-p.z); if(d>maxR*1.3) continue;
    cands.push({d:Math.hypot(op.x-p.x,op.z-p.z),isPlayer:false,bot:o});
  }
  cands.sort((a,c)=>(a.d+(a.bot&&a.bot.down?25:0))-(c.d+(c.bot&&c.bot.down?25:0)));
  for(let i=0;i<Math.min(4,cands.length);i++){
    const c=cands[i]; if(c.d>maxR) break;
    // ko'rish burchagi: uzoqdagini faqat oldida bo'lsa yoki ovoz eshitilgan bo'lsa ko'radi
    const tp=c.isPlayer?player.position:c.bot.mesh.position;
    if(c.d>30 && !(b.mem && performance.now()-b.mem.t<8000)){ const fa=Math.atan2(tp.x-p.x,tp.z-p.z); let da=Math.abs(fa-b.mesh.rotation.y)%6.283; if(da>Math.PI) da=6.283-da; if(da>1.4) continue; }
    const te=eyeOf(c.bot,c.isPlayer); te.y-=0.3;
    if(losClear(me,te)) return {x:tp.x,y:tp.y,z:tp.z,d:c.d,isPlayer:c.isPlayer,bot:c.bot,down:c.isPlayer?pState==='down':c.bot.down};
  }
  return null;
}
function hearShots(b){
  const now=performance.now(), p=b.mesh.position;
  for(let i=gunshots.length-1;i>=0;i--){ const g=gunshots[i]; if(now-g.t>1200) break; if(g.team===b.team||(g.team===0&&b.isMate)) continue;
    const d=Math.hypot(g.x-p.x,g.z-p.z); if(d<170){ if(!b.mem || now-b.mem.t>3000) b.mem={x:g.x,y:g.y,z:g.z,t:now}; return true; } }
  return false;
}
function shareIntel(b,m){
  for(const o of bots){ if(o===b||o.team!==b.team||!o.alive||o.down) continue; const d=Math.hypot(o.mesh.position.x-b.mesh.position.x,o.mesh.position.z-b.mesh.position.z); if(d<160 && (!o.mem||performance.now()-o.mem.t>2000)) o.mem={x:m.x,y:m.y,z:m.z,t:m.t}; }
}
function findReviveTarget(b){
  let best=null, bd=b.isMate?70:50;
  if(b.isMate && pState==='down' && phase==='ground'){
    const d=Math.hypot(player.position.x-b.mesh.position.x,player.position.z-b.mesh.position.z);
    if(d<bd){ bd=d; best={x:player.position.x,y:player.position.y,z:player.position.z,d,player:true,bot:null}; }
  }
  for(const o of bots){
    if(o===b||o.team!==b.team||!o.alive||!o.down) continue;
    const d=Math.hypot(o.mesh.position.x-b.mesh.position.x,o.mesh.position.z-b.mesh.position.z);
    if(d<bd){ bd=d; best={x:o.mesh.position.x,y:o.mesh.position.y,z:o.mesh.position.z,d,player:false,bot:o}; }
  }
  return best;
}
// eng yaqin o'lja (yoki o'lja qutisi) — faqat kerakli narsa
function wantsLoot(b){ return W_RANK[b.weap]<3 || b.meds<2 || b.armor<40; }
function findLoot(b,R){
  const p=b.mesh.position; let best=null, bd=R;
  for(const it of loot){ if(it.taken) continue; const d=Math.abs(it.x-p.x)+Math.abs(it.z-p.z); if(d>bd*1.4) continue;
    const t=it.type; const useful=(t.startsWith('weapon_')&&W_RANK[t.slice(7)]>W_RANK[b.weap])||(t==='medkit'&&b.meds<2)||(t==='armor'&&b.armor<40)||(t==='ammo'&&false);
    if(!useful) continue; const dd=Math.hypot(it.x-p.x,it.z-p.z)+Math.abs(it.gy-p.y)*3; if(dd<bd){ bd=dd; best={x:it.x,y:it.gy,z:it.z,item:it}; } }
  for(const db of deathboxes){ if(db.empty&&db.botLooted) continue; const d=Math.hypot(db.x-p.x,db.z-p.z); if(d<bd && (W_RANK[db.weap]>W_RANK[b.weap]||(db.meds>0&&b.meds<2))){ bd=d; best={x:db.x,y:db.y,z:db.z,box:db}; } }
  return best;
}
function takeLoot(b,L){
  if(L.item){ const it=L.item; if(it.taken) return; it.taken=true; if(it.mesh) scene.remove(it.mesh);
    if(it.type.startsWith('weapon_')){ setBotWeapon(b,it.type.slice(7)); mateSay(b,WEAPONS[b.weap].name+' topdim 🎯',6000); }
    else if(it.type==='medkit') b.meds++; else if(it.type==='armor'){ b.armor=Math.min(100,b.armor+50); mateSay(b,'Bronjilet kiydim 🛡️',8000); } }
  else if(L.box){ const db=L.box; if(W_RANK[db.weap]>W_RANK[b.weap]){ setBotWeapon(b,db.weap); db.weap='pistol'; } if(db.meds>0&&b.meds<2){ b.meds+=db.meds; db.meds=0; } db.botLooted=true; }
}
// pana joy: dushmandan qaraganda to'siq ortidagi nuqta
function findCover(b,t){
  const p=b.mesh.position; let best=null, bd=1e9;
  gridQuery(obGrid,p.x-14,p.x+14,p.z-14,p.z+14,o=>{
    if(o.y1-o.y0<1.0||o.y1<p.y+0.9||o.y0>p.y+0.5||o.roof) return false;
    const ox=(o.x0+o.x1)/2, oz=(o.z0+o.z1)/2, dx=ox-t.x, dz=oz-t.z, L=Math.hypot(dx,dz)||1;
    const hx=(o.x1-o.x0)/2+0.9, hz=(o.z1-o.z0)/2+0.9, s=Math.min(hx/Math.abs(dx/L||1e-6),hz/Math.abs(dz/L||1e-6));
    const cx=ox+dx/L*s, cz=oz+dz/L*s; if(collides(cx,cz,0.4,p.y)) return false;
    const d=Math.hypot(cx-p.x,cz-p.z); if(d<bd){ bd=d; best={x:cx,z:cz,y:groundAt(cx,cz,p.y)}; }
    return false;
  });
  return best;
}
function updateSquads(dt){
  for(const sq of squads){
    if(sq.isMate) continue;
    const leader=sq.members.find(m=>m.alive&&!m.down&&!m.air&&!m.inVeh)||null;
    sq.leader=leader;
    if(!leader) continue;
    sq.destT-=dt;
    const lp=leader.mesh.position;
    const outside=zone.started && Math.hypot(lp.x-zone.cx,lp.z-zone.cz)>zone.radius*0.82;
    if(outside && (!sq.dest || Math.hypot(sq.dest.x-zone.cx,sq.dest.z-zone.cz)>zone.radius*0.7)){ sq.dest=null; sq.destT=0; }
    if(!sq.dest || sq.destT<=0){
      const R=Math.max(40,zone.radius*0.75);
      const near=buildings.filter(s=>Math.hypot(s.x-lp.x,s.z-lp.z)<240 && Math.hypot(s.x-zone.tcx,s.z-zone.tcz)<Math.min(R,zone.tr||R));
      if(near.length && Math.random()<0.8){ const s=pick(near); sq.dest={x:s.x,z:s.z,bld:s}; }
      else { const a=Math.random()*6.283, r=Math.random()*Math.min(zone.radius,zone.tr||zone.radius)*0.6; sq.dest={x:(zone.tcx||zone.cx)+Math.cos(a)*r,z:(zone.tcz||zone.cz)+Math.sin(a)*r}; }
      sq.destT=45+Math.random()*35;
      sq.members.forEach(m=>{ m.post=null; });
    }
  }
}
// har bir a'zo o'z joyini tanlaydi (bino ichida turli qavat/burchak)
function memberSpot(b){
  const sq=b.sq, d=sq.dest; if(!d) return null;
  if(!b.post || b.postT<=0){
    if(d.bld){ const bl=d.bld, f=bl.floors[Math.floor(Math.random()*bl.floors.length)];
      let x=bl.x0+1.5+Math.random()*(bl.x1-bl.x0-3), z=bl.z0+1.5+Math.random()*(bl.z1-bl.z0-3);
      for(let k=0;k<8 && (collides(x,z,0.5,f)||Math.abs(groundAt(x,z,f+0.2)-f)>0.4);k++){ x=bl.x0+1.5+Math.random()*(bl.x1-bl.x0-3); z=bl.z0+1.5+Math.random()*(bl.z1-bl.z0-3); }
      b.post={x,z,y:f}; }
    else b.post={x:d.x+b.off.x*3,z:d.z+b.off.z*3};
    b.postT=20+Math.random()*25;
  }
  return b.post;
}
// sherik: o'yinchi atrofida o'ylab joy tanlaydi (pana, tarqalgan holda, tahdid tomonga qarab)
function matePost(b){
  const pp=player.position, idx=squads[0].members.indexOf(b);
  const moved=!b.anchor || Math.hypot(b.anchor.x-pp.x,b.anchor.z-pp.z)>9;
  if(moved || !b.post || b.postT<=0){
    b.anchor={x:pp.x,z:pp.z};
    const pb=buildingAt(pp.x,pp.z,0);
    if(pb){ // o'yinchi bino ichida — sherik ham shu binoga, boshqa xona/derazaga
      const f=pp.y; let x=pp.x,z=pp.z;
      for(let k=0;k<10;k++){ const tx=pb.x0+1.2+Math.random()*(pb.x1-pb.x0-2.4), tz=pb.z0+1.2+Math.random()*(pb.z1-pb.z0-2.4); if(!collides(tx,tz,0.5,f)&&Math.abs(groundAt(tx,tz,f+0.2)-f)<0.4&&Math.hypot(tx-pp.x,tz-pp.z)>2.5){ x=tx; z=tz; break; } }
      b.post={x,z,y:f};
    } else {
      const base=yaw+Math.PI+(idx-1)*0.9, r=7+idx*3+Math.random()*3;
      let x=pp.x+Math.sin(base)*r, z=pp.z+Math.cos(base)*r;
      // yaqin daraxt/quti/devor yonida turishni afzal ko'radi
      let bestC=null, bd=6;
      gridQuery(obGrid,x-6,x+6,z-6,z+6,o=>{ if(o.y1-o.y0<1.2||o.roof) return false; const ox=(o.x0+o.x1)/2, oz=(o.z0+o.z1)/2, d=Math.hypot(ox-x,oz-z); if(d<bd){ bd=d; bestC=o; } return false; });
      if(bestC){ const ox=(bestC.x0+bestC.x1)/2, oz=(bestC.z0+bestC.z1)/2, dx=ox-pp.x, dz=oz-pp.z, L=Math.hypot(dx,dz)||1; x=ox-dx/L*((bestC.x1-bestC.x0)/2+1.0); z=oz-dz/L*((bestC.z1-bestC.z0)/2+1.0); }
      if(collides(x,z,0.5)) { x=pp.x+Math.sin(base)*r; z=pp.z+Math.cos(base)*r; }
      b.post={x,z};
    }
    b.postT=6+Math.random()*4;
    b.watchYaw=yaw+Math.PI+(idx-1)*1.6; // har biri o'z tomonini kuzatadi
  }
  return b.post;
}
function updateDownedBot(b,dt){
  b.downHp-=dt*(b.beingRevived>0?0:1.0);
  if(b.downHp<=0){ killBotFinal(b,'Qon ketish',-1); return; }
  const p=b.mesh.position;
  let moved=false;
  if(b.beingRevived<=0){
    let mate=null, md=40;
    for(const o of bots){ if(o===b||o.team!==b.team||!o.alive||o.down) continue; const d=Math.hypot(o.mesh.position.x-p.x,o.mesh.position.z-p.z); if(d<md){ md=d; mate=o.mesh.position; } }
    if(b.isMate && pState==='alive' && phase==='ground'){ const d=Math.hypot(player.position.x-p.x,player.position.z-p.z); if(d<md){ md=d; mate=player.position; } }
    if(mate && md>2.2){ moved=botStep(b,mate.x,mate.z,0.9,dt); if(moved) b.mesh.rotation.y=b.dir; }
  }
  botPhysics(b,dt);
  b.walkPhase+=dt*(moved?5:1);
  const sw=moved?Math.sin(b.walkPhase)*0.25:0;
  const P=Object.assign({},POSE_KNOCK); P.legL+=sw; P.legR-=sw; P.armL+=moved?-Math.abs(sw)*2:0;
  const P2=b.beingRevived>0?lerpPose(P,poseWalk(0,0,false),Math.min(1,b.beingRevived*0.9)):P;
  applyPose(b.c,P2,Math.min(1,dt*7));
  b.beingRevived=Math.max(0,b.beingRevived-dt*3);
}
function botShoot(b,t,dt){
  const w=WEAPONS[b.weap];
  if(b.reloadT>0){ b.reloadT-=dt; if(b.reloadT<=0) b.mag=w.cap; return; }
  b.shootTimer-=dt; if(b.shootTimer>0) return;
  b.shootTimer=w.fireDelay*(b.isMate?1.4:1.8)+Math.random()*0.35+(b.weap==='rifle'&&Math.random()<0.3?0.6:0);
  if(!b.tgtVis) return;
  b.mag--; if(b.mag<=0){ b.reloadT=w.reloadTime*1.4; if(b.isMate) mateSay(b,'Zaryadlayapman!',8000); }
  const p=b.mesh.position, muzzle=new THREE.Vector3(); b.gun.getWorldPosition(muzzle);
  const te=eyeOf(t.bot,t.isPlayer); te.y-=t.down?0.2:0.35;
  const range=W_RANGE[b.weap], d=t.d;
  let ch=b.skill*Math.max(0.06,1-d/range)*(b.moving?0.65:1)*(b.crouch?1.15:1)*(t.down?1.3:1);
  if(t.isPlayer){ if(keys['KeyW']||keys['KeyA']||keys['KeyS']||keys['KeyD']) ch*=0.75; if(keys['ShiftLeft']) ch*=0.8; }
  else if(t.bot.moving) ch*=0.75;
  const pellets=w.pellets; let hit=0;
  for(let k=0;k<pellets;k++) if(Math.random()<ch) hit++;
  const end=hit?new THREE.Vector3(te.x,te.y,te.z):new THREE.Vector3(te.x+(Math.random()-0.5)*2.4,te.y+(Math.random()-0.3)*1.6,te.z+(Math.random()-0.5)*2.4);
  const f=segObstacle(muzzle,end); if(f<1) end.lerpVectors(muzzle,end,f);
  fireTracer(muzzle,end); gunshotAt(p.x,p.z,b.isMate,b.team,p.y);
  if(hit && f>=0.98){
    const head=Math.random()<0.12, mult=t.isPlayer?0.42:0.6;
    const dmg=w.dmg*hit*mult*(head?1.8:1);
    if(t.isPlayer){ applyDamage(dmg,b.name); flashDamage(); for(const m of squads[0].members){ if(m.alive&&!m.down) m.mem={x:p.x,y:p.y,z:p.z,t:performance.now()}; } }
    else damageBot(t.bot,dmg,b.name,b.team,{x:p.x,y:p.y,z:p.z});
  }
}
function updateBotGround(b,dt){
  const p=b.mesh.position, now=performance.now();
  const far=Math.hypot(p.x-player.position.x,p.z-player.position.z)>320;
  // --- o'ylash (har 0.3–0.5 s)
  b.thinkT-=dt;
  if(b.thinkT<=0){
    b.thinkT=far?0.9:0.3+Math.random()*0.2;
    const prev=b.tgt;
    b.tgt=senseTargets(b); b.tgtVis=!!b.tgt;
    if(b.tgt){ b.mem={x:b.tgt.x,y:b.tgt.y,z:b.tgt.z,t:now}; if(!prev){ shareIntel(b,b.mem); b.seenT=now; if(b.isMate) mateSay(b,'Dushman! '+dirName(b.tgt.x-p.x,b.tgt.z-p.z)+', '+Math.round(b.tgt.d)+' m',5000); } }
    else hearShots(b);
    const zoneR=zone.started?zone.radius:1e9, zd=Math.hypot(p.x-zone.cx,p.z-zone.cz);
    const rv=findReviveTarget(b);
    const lowHp=b.hp<60 && b.meds>0;
    if(zd>zoneR*0.92 && (!b.tgt || b.tgt.d>20)) b.ai='rotate';
    else if(rv && (!b.tgt || b.tgt.d>35 || rv.d<4)) { b.ai='revive'; b.rv=rv; }
    else if(b.tgt){
      if(b.hp<40 && b.tgt.d>8){ const c=findCover(b,b.tgt); if(c){ b.ai='cover'; b.coverPt=c; } else b.ai='fight'; }
      else b.ai='fight';
    }
    else if(lowHp && (!b.mem || now-b.mem.t>2500)) b.ai='heal';
    else if(b.mem && now-b.mem.t<(b.isMate?6000:14000) && (!b.isMate || Math.hypot(b.mem.x-player.position.x,b.mem.z-player.position.z)<70)) b.ai='investigate';
    else if(wantsLoot(b) && (b.lootTgt=findLoot(b,b.isMate?28:45)) && (!b.isMate || Math.hypot(b.lootTgt.x-player.position.x,b.lootTgt.z-player.position.z)<40)) b.ai='loot';
    else b.ai=b.isMate?'follow':'explore';
    if(b.ai!=='heal') b.healT=0;
    if(b.ai!=='revive') b.reviveT=0;
    if(b.isMate && b.ai==='follow' && Math.hypot(p.x-player.position.x,p.z-player.position.z)>45 && phase==='ground' && pState!=='dead') b.path=[];
  }
  // --- harakat
  let moved=false, speed=2.9, pose=null, faceYaw=null;
  b.crouch=false;
  const t=b.tgt;
  switch(b.ai){
    case 'rotate': moved=navTo(b,zone.tcx||zone.cx,zone.tcz||zone.cz,undefined,5.6,dt); break;
    case 'revive': {
      const rv=b.rv; const tp=rv.player?player.position:(rv.bot&&rv.bot.alive&&rv.bot.down?rv.bot.mesh.position:null);
      if(!tp||(rv.player&&pState!=='down')){ b.thinkT=0; break; }
      const d=Math.hypot(tp.x-p.x,tp.z-p.z);
      if(d>1.6){ moved=navTo(b,tp.x,tp.z,tp.y,5.6,dt); b.reviveT=0; if(d<30) mateSay(b,rv.player?'Kelyapman, chida!':'Seni ko\'taraman, '+rv.bot.name+'!',8000); }
      else {
        faceYaw=Math.atan2(tp.x-p.x,tp.z-p.z); pose=POSE_REVIVER; b.reviveT+=dt;
        const fr=b.reviveT/4; reviveMark(rv.player?'player':rv.bot,tp.x,tp.y,tp.z,fr);
        if(rv.player){ playerRevFrac=Math.max(playerRevFrac,fr); playerReviver=b.name; } else rv.bot.beingRevived=fr+0.01;
        if(b.reviveT>=4){ b.reviveT=0; if(rv.player) revivePlayer(); else reviveBot(rv.bot); b.thinkT=0; }
      }
      break; }
    case 'heal':
      pose=POSE_HEAL; b.healT+=dt; healFx(p.x,p.y,p.z);
      if(b.healT>=4){ b.healT=0; b.meds--; b.hp=Math.min(100,b.hp+50); b.thinkT=0; mateSay(b,'Davolandim ✚',6000); }
      break;
    case 'cover': {
      const c=b.coverPt; const d=Math.hypot(c.x-p.x,c.z-p.z);
      if(d>0.8){ moved=navTo(b,c.x,c.z,c.y,5.8,dt); }
      else { b.crouch=true; if(b.meds>0 && !b.tgtVis){ b.ai='heal'; } }
      if(t) faceYaw=Math.atan2(t.x-p.x,t.z-p.z);
      break; }
    case 'fight': {
      if(!t) break;
      faceYaw=Math.atan2(t.x-p.x,t.z-p.z);
      const pref=W_PREF[b.weap]*(t.down?0.4:1);
      b.strafeT-=dt; if(b.strafeT<=0){ b.strafeT=0.8+Math.random()*1.6; b.strafe=Math.random()<0.5?1:-1; b.stand=Math.random()<(b.weap==='sniper'||b.weap==='rifle'?0.45:0.2); }
      const dx=(t.x-p.x)/t.d, dz=(t.z-p.z)/t.d;
      let mx=0,mz=0;
      if(t.d>pref*1.3){ mx+=dx; mz+=dz; } else if(t.d<pref*0.6){ mx-=dx; mz-=dz; }
      if(!b.stand){ mx+=-dz*b.strafe*0.9; mz+=dx*b.strafe*0.9; }
      if(mx||mz){ const L=Math.hypot(mx,mz); moved=botStep(b,p.x+mx/L*3,p.z+mz/L*3,t.d>pref*1.3?4.6:3.0,dt); if(!moved) b.strafe*=-1; }
      else b.crouch=b.weap!=='shotgun';
      break; }
    case 'investigate': {
      const m=b.mem; if(!m) break;
      const d=Math.hypot(m.x-p.x,m.z-p.z);
      if(d>(b.isMate?12:6)) moved=navTo(b,m.x,m.z,m.y,4.2,dt); else { faceYaw=Math.atan2(m.x-p.x,m.z-p.z)+Math.sin(now*0.001)*0.9; }
      break; }
    case 'loot': {
      const L=b.lootTgt; if(!L||(L.item&&L.item.taken)||(L.box&&L.box.botLooted)){ b.thinkT=0; break; }
      const d=Math.hypot(L.x-p.x,L.z-p.z);
      if(d>1.2) moved=navTo(b,L.x,L.z,L.y,3.6,dt); else if(Math.abs(L.y-p.y)<1.6){ takeLoot(b,L); b.thinkT=0; } else b.path=[];
      break; }
    case 'follow': {
      if(phase!=='ground'||pState==='dead') break;
      const P=matePost(b); b.postT-=dt;
      const d=Math.hypot(P.x-p.x,P.z-p.z), dp=Math.hypot(player.position.x-p.x,player.position.z-p.z);
      if(d>1.0) moved=navTo(b,P.x,P.z,P.y,dp>25?5.6:(d>6?4.2:2.6),dt);
      else { faceYaw=b.watchYaw+Math.sin(now*0.0006+b.walkPhase)*0.6; b.crouch=Math.random()<0.002?!b.crouch:b.crouch; }
      break; }
    case 'explore': {
      const sq=b.sq;
      const S=memberSpot(b); b.postT-=dt;
      if(S){ const d=Math.hypot(S.x-p.x,S.z-p.z); if(d>1.0) moved=navTo(b,S.x,S.z,S.y,sq.leader===b?3.4:3.6,dt); else faceYaw=b.mesh.rotation.y+Math.sin(now*0.0005+b.walkPhase)*0.02; }
      break; }
  }
  // tiqilib qolishni aniqlash
  if(b.unstuckT>0) b.unstuckT-=dt;
  b.stuck+=dt;
  if(b.stuck>1.3){ const mv=Math.hypot(p.x-b.lastX,p.z-b.lastZ); if(mv<0.5 && (b.ai==='follow'||b.ai==='explore'||b.ai==='loot'||b.ai==='investigate'||b.ai==='rotate'||b.ai==='revive'||b.ai==='cover') && b.path.length){ b.unstuckT=0.9; b.strafe*=-1; b.path=[]; if(b.ai==='loot'&&b.lootTgt&&b.lootTgt.item&&Math.random()<0.4){ b.lootTgt=null; b.thinkT=0; b.ai='explore'; } } b.stuck=0; b.lastX=p.x; b.lastZ=p.z; }
  botPhysics(b,dt);
  b.moving=moved;
  if(t && (b.ai==='fight'||b.ai==='cover')) faceYaw=Math.atan2(t.x-p.x,t.z-p.z);
  const ty=faceYaw!==null?faceYaw:(moved?b.dir:b.mesh.rotation.y);
  let dy=ty-b.mesh.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); b.mesh.rotation.y+=dy*Math.min(1,dt*(t?12:7));
  b.aiming=!!t && (b.ai==='fight'||b.ai==='cover');
  // poza
  if(!far || b.isMate){
    let P=pose;
    if(!P){ if(b.crouch && b.aiming) P=POSE_CROUCH_AIM; else { b.walkPhase+=dt*(moved?(speed>3.5?11:8):1); P=poseWalk(b.walkPhase,moved?0.6:0,b.aiming); if(b.crouch){ P.drop=-0.32; P.kneeL=1.4; P.kneeR=1.4; P.legL=-0.9; P.legR=0.2; } } }
    applyPose(b.c,P,Math.min(1,dt*10));
  }
  if(t && (b.ai==='fight'||b.ai==='cover') && (!b.coverPt || b.ai==='fight' || Math.random()<0.6)) botShoot(b,t,dt);
}
function tryBoard(b){
  const v=activeVehicle, vp=v.mesh.position, p=b.mesh.position;
  if(Math.hypot(p.x-vp.x,p.z-vp.z)>28) return false;
  for(let i=1;i<4;i++){ if(!v.seats[i]){ vehicleBoard(b,v,i); return true; } }
  return false;
}
let playerReviver='';
function updateBots(dt){
  playerRevFrac=0; playerReviver='';
  updateSquads(dt);
  const cx=camera.position.x, cz=camera.position.z;
  for(const b of bots){
    if(!b.alive) continue;
    if(b.air){ updateBotAir(b,dt); continue; }
    if(b.inVeh){ seatBot(b); continue; }
    if(b.isMate && inVehicle && activeVehicle && !b.down && tryBoard(b)){ seatBot(b); continue; }
    if(b.down){ updateDownedBot(b,dt); continue; }
    updateBotGround(b,dt);
    if(!b.isMate){ b.mesh.visible=Math.hypot(b.mesh.position.x-cx,b.mesh.position.z-cz)<300; }
  }
  updateDeathboxes();
}
