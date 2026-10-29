// ===================== O'YINCHI ZARARI / YIQILISH =====================
function applyDamage(dmg,src){
  if(pState==='dead'||gameOver) return;
  if(pState==='down'){ downHp-=dmg; if(downHp<=0) playerDie(src||'Dushman'); updateHud(); return; }
  if(armor>0){ const ab=Math.min(armor,dmg*0.6); armor-=ab; dmg-=ab; }
  hp-=dmg;
  if(hp<=0){ hp=0; if(matesHealthy()>0) knockPlayer(src||'Dushman'); else playerDie(src||'Dushman'); }
  updateHud();
}
function knockPlayer(src){
  pState='down'; downHp=100; revProg=0; zoomed=false;
  camera.fov=NORMAL_FOV; camera.updateProjectionMatrix();
  document.getElementById('scope').style.display='none'; document.getElementById('cross').style.display='block';
  addKillFeed(src,'Siz','🔻');
  showMsg("🔻 SIZ YIQILDINGIZ — o'rtoqlaringiz ko'tarishi mumkin",2800);
  document.getElementById('downfx').style.opacity='1';
}
function playerDie(src){
  if(pState==='dead') return;
  pState='dead'; addKillFeed(src,'Siz','💀');
  document.getElementById('downfx').style.opacity='0';
  loseGame();
}
function revivePlayer(){
  pState='alive'; hp=40; downHp=100;
  document.getElementById('downfx').style.opacity='0';
  showMsg("✅ SIZNI KO'TARISHDI",1600); updateHud();
}
function loseGame(){
  if(gameOver) return;
  gameOver=true; document.exitPointerLock&&document.exitPointerLock();
  showEnd(false);
}
function winGame(){
  if(gameOver) return;
  gameOver=true; document.exitPointerLock&&document.exitPointerLock();
  showEnd(true);
}
function showEnd(win){
  const e=document.getElementById('endscreen');
  document.getElementById('endTitle').textContent=win?'🏆 G\'ALABA — SQUADINGIZ ENG YAXSHISI!':'☠️ SQUADINGIZ YO\'Q QILINDI';
  const alive=1+matesHealthy()+bots.filter(b=>b.isMate&&b.alive&&b.down).length;
  document.getElementById('endStats').textContent='O\'ldirilgan dushmanlar: '+kills+'  ·  Tirik qolgan: '+(enemiesAlive()+alive);
  e.style.display='flex';
}
document.getElementById('againBtn').addEventListener('click',()=>{ location.reload(); });

