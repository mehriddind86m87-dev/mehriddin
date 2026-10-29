// ===================== OB-HAVO ZARRACHALARI, CHIROQ =====================
let precip=null;
(function(){
  if(!ENV.rain && !ENV.snow) return;
  const rain=ENV.rain, N=rain?3200:2600;
  const geo=new THREE.BufferGeometry(), pos=new Float32Array(N*(rain?6:3)), off=new Float32Array(N*3), vel=new Float32Array(N);
  for(let i=0;i<N;i++){ off[i*3]=(Math.random()-0.5)*80; off[i*3+1]=Math.random()*40-16; off[i*3+2]=(Math.random()-0.5)*80; vel[i]=rain?(22+Math.random()*10):(1.8+Math.random()*1.6); }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const obj=rain?new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xaac4dd,transparent:true,opacity:0.45}))
                :new THREE.Points(geo,new THREE.PointsMaterial({color:0xffffff,size:0.28,transparent:true,opacity:0.9,depthWrite:false}));
  obj.frustumCulled=false; scene.add(obj);
  precip={obj,geo,off,vel,rain,N,hid:new Uint8Array(N)};
})();
function updatePrecip(dt){
  if(!precip) return;
  const a=precip.geo.attributes.position.array, off=precip.off, vel=precip.vel, N=precip.N, rain=precip.rain;
  const cx=camera.position.x, cy=camera.position.y, cz=camera.position.z, t=performance.now()*0.001;
  for(let i=0;i<N;i++){
    off[i*3+1]-=vel[i]*dt; if(off[i*3+1]<-16) off[i*3+1]=24;
    if(!rain) off[i*3]+=Math.sin(t+i)*dt*0.6;
    const x=cx+off[i*3], z=cz+off[i*3+2]; let y=cy+off[i*3+1];
    if((i&3)===(frameN&3)) precip.hid[i]=covered(x,y,z)?1:0; // tom ostida yomg'ir/qor yo'q
    if(precip.hid[i]) y=-500;
    if(rain){ a[i*6]=x; a[i*6+1]=y; a[i*6+2]=z; a[i*6+3]=x+0.15; a[i*6+4]=y-0.9; a[i*6+5]=z; }
    else { a[i*3]=x; a[i*3+1]=y; a[i*3+2]=z; }
  }
  precip.geo.attributes.position.needsUpdate=true;
  // ichkarida: yomg'ir ovozi va ko'rinishi pasayadi
  const inside=covered(cx,cy,cz); precip.obj.material.opacity+=(((inside?0.25:1)*(rain?0.45:0.9))-precip.obj.material.opacity)*Math.min(1,dt*4);
}
const flashL=new THREE.SpotLight(0xfff0d0,0,48,0.45,0.4,1);
camera.add(flashL); flashL.position.set(0.25,-0.1,0); camera.add(flashL.target); flashL.target.position.set(0,0,-6);
let flashOn=false;
function toggleFlash(){ flashOn=!flashOn; flashL.intensity=flashOn?2.2:0; showMsg(flashOn?'🔦 Chiroq yoqildi':'🔦 Chiroq o\'chdi',700); }

