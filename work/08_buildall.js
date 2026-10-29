// ===================== hammasini qurish =====================
buildTerrain(); buildWater(); buildRoads(); buildBridges();
planBuildings().forEach(s=>{ const b=makeBuilding(s.type,s.w,s.d,s.x,s.z,s.rot); buildingSpots.push({x:s.x,z:s.z,w:b.x1-b.x0,d:b.z1-b.z0,b}); });
finalizeBuildings(); buildCrates(); planNature(); buildTrees(); buildRocks(); buildGrass();

