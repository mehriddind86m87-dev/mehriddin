// ===================== BOSHQARUV =====================
document.addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(e.code==='KeyR') reload();
  if(e.code==='Digit1') switchWeapon('pistol');
  if(e.code==='Digit2') switchWeapon('rifle');
  if(e.code==='Digit3') switchWeapon('shotgun');
  if(e.code==='Digit4') switchWeapon('sniper');
  if(e.code==='KeyM') toggleBigMap();
  if(e.code==='KeyN') toggleFlash();
});
document.addEventListener('keyup',e=>{ keys[e.code]=false; });
const LOOK_SENS=0.0045;
let isDragging=false,lastX=0,lastY=0;
function beginDrag(x,y){ isDragging=true; lastX=x; lastY=y; }
function moveDrag(x,y){
  if(!isDragging) return;
  const dx=x-lastX, dy=y-lastY; lastX=x; lastY=y;
  const sens=zoomed?LOOK_SENS*0.4:LOOK_SENS;
  yaw-=dx*sens; pitch-=dy*sens; pitch=Math.max(-1.1,Math.min(1.1,pitch));
}
function endDrag(){ isDragging=false; }
function setZoom(on){
  if(pState==='down') on=false;
  zoomed=on; camera.fov=on?ZOOM_FOV:NORMAL_FOV; camera.updateProjectionMatrix();
  document.getElementById('scope').style.display=on?'block':'none';
  document.getElementById('cross').style.display=on?'none':'block';
}
canvas.addEventListener('click',()=>{ if(started && !gameOver && document.pointerLockElement!==canvas && canvas.requestPointerLock && !('ontouchstart' in window)) canvas.requestPointerLock().catch(()=>{}); });
canvas.addEventListener('mousedown',e=>{
  if(!started||gameOver) return;
  if(e.button===0){ mouseHeld=true; shoot(); }
  if(e.button===2) setZoom(true);
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('mousemove',e=>{
  if(document.pointerLockElement===canvas){
    const sens=zoomed?LOOK_SENS*0.4:LOOK_SENS;
    yaw-=e.movementX*sens; pitch-=e.movementY*sens; pitch=Math.max(-1.1,Math.min(1.1,pitch));
  }
});
document.addEventListener('mouseup',e=>{ if(e.button===0) mouseHeld=false; if(e.button===2) setZoom(false); });
canvas.addEventListener('touchstart',e=>{
  if(!started||gameOver) return;
  if(e.touches.length>=2){ setZoom(true); return; }
  const t=e.touches[0]; beginDrag(t.clientX,t.clientY); shoot();
},{passive:true});
canvas.addEventListener('touchmove',e=>{ const t=e.touches[0]; moveDrag(t.clientX,t.clientY); },{passive:true});
canvas.addEventListener('touchend',e=>{ endDrag(); if(e.touches.length<2 && zoomed) setZoom(false); });

