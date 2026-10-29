// ===================== SQUAD PANELI VA NOMLAR =====================
const squadRows=[];
(function(){
  const box=document.getElementById('squad');
  for(let i=0;i<4;i++){
    const row=document.createElement('div'); row.className='sqrow';
    const nm=document.createElement('span'); nm.className='sqn';
    const bar=document.createElement('div'); bar.className='sqbar'; const fill=document.createElement('div'); fill.className='sqfill'; bar.appendChild(fill);
    const st=document.createElement('span'); st.className='sqs';
    row.appendChild(nm); row.appendChild(bar); row.appendChild(st); box.appendChild(row);
    squadRows.push({row,nm,fill,st});
  }
})();
function updateSquadHud(){
  const mates=squads[0].members;
  const r0=squadRows[0]; r0.nm.textContent='Siz';
  r0.fill.style.width=(pState==='down'?downHp:hp)+'%'; r0.fill.style.background=pState==='down'?'#e53935':'#4caf50';
  r0.st.textContent=pState==='down'?'🔻':(inVehicle?'🚗':'');
  mates.forEach((m,i)=>{
    const r=squadRows[i+1]; r.nm.textContent=m.name;
    r.fill.style.width=(!m.alive?0:(m.down?m.downHp:m.hp))+'%'; r.fill.style.background=m.down?'#e53935':'#4aa8ff';
    r.st.textContent=!m.alive?'💀':(m.down?'🔻':(m.inVeh?'🚗':(m.air?'🪂':'')));
  });
}
const labelEls=[], _pv=new THREE.Vector3();
(function(){
  const box=document.getElementById('labels');
  for(let i=0;i<3;i++){ const d=document.createElement('div'); d.className='nameplate'; box.appendChild(d); labelEls.push(d); }
})();
function updateLabels(){
  squads[0].members.forEach((m,i)=>{
    const el=labelEls[i];
    if(!m.alive||m.inVeh&&inVehicle&&false){ el.style.display='none'; return; }
    _pv.set(m.mesh.position.x,m.mesh.position.y+2.6,m.mesh.position.z); _pv.project(camera);
    if(_pv.z>1||_pv.z<-1){ el.style.display='none'; return; }
    el.style.display='block'; el.textContent=(m.down?'🔻 ':'')+m.name;
    el.style.left=((_pv.x*0.5+0.5)*innerWidth)+'px'; el.style.top=((-_pv.y*0.5+0.5)*innerHeight)+'px';
  });
}

