/**
 * Apex Nitro 3D - High-Fidelity Track & Roadway Generator
 * Generates continuous highway guardrails, speed boost pads, rubberized asphalt,
 * overhead gantry billboards, and biome scenery.
 */

import * as THREE from 'three';
import { LevelConfig } from '../types/game';
import { BIOME_CONFIGS } from '../data/levelsData';

export interface CoinPickup {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  progress: number;
  collected: boolean;
}

export interface CheckpointGate {
  index: number;
  progress: number;
  position: THREE.Vector3;
  mesh: THREE.Group;
  passed: boolean;
}

export interface BoostPad {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  progress: number;
  active: boolean;
}

export interface NitroPickup {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  progress: number;
  collected: boolean;
}

export interface TrackObstacle {
  id: number;
  type: 'traffic_car' | 'barrier' | 'cone' | 'rock';
  mesh: THREE.Group;
  position: THREE.Vector3;
  progress: number;
  speedMps: number;
  laneOffset: number;
  hit: boolean;
  radius: number;
}

export interface GeneratedTrackData {
  curve: THREE.CatmullRomCurve3;
  trackMesh: THREE.Mesh;
  curbMeshes: THREE.Mesh[];
  guardrailMeshes: THREE.Mesh[];
  finishArch: THREE.Group;
  coins: CoinPickup[];
  checkpoints: CheckpointGate[];
  boostPads: BoostPad[];
  nitroPickups: NitroPickup[];
  obstacles: TrackObstacle[];
  propsGroup: THREE.Group;
  trackLength: number;
  trackWidth: number;
  startPosition: THREE.Vector3;
  startRotation: THREE.Euler;
}

function seededRandom(seed: number) {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
}

export function generateTrack(level: LevelConfig): GeneratedTrackData {
  const biome = BIOME_CONFIGS[level.biome];
  const trackWidth = 14.5; // meters
  const halfWidth = trackWidth / 2;

  // 1. Generate smooth procedural spline
  const pointsCount = Math.max(14, Math.min(38, Math.floor(level.trackLength / 70)));
  const points: THREE.Vector3[] = [];

  const turnMagnitude = 20 + level.turnsDifficulty * 18;
  const elevationMagnitude = level.biome === 'mountain' ? 15 : level.biome === 'desert' ? 8 : 4;

  let currentPos = new THREE.Vector3(0, 0, 0);
  let currentAngle = 0;
  points.push(currentPos.clone());

  // Straight start stretch
  const startLength = 75;
  currentPos.z += startLength;
  points.push(currentPos.clone());

  for (let i = 2; i < pointsCount - 1; i++) {
    const seed = level.id * 1000 + i * 17;
    const rnd1 = seededRandom(seed) * 2 - 1;
    const rndElevation = seededRandom(seed + 99) * 2 - 1;

    const turnDelta = rnd1 * (turnMagnitude * Math.PI / 180);
    currentAngle += turnDelta;

    const segmentDist = 65 + seededRandom(seed + 5) * 45;
    currentPos.x += Math.sin(currentAngle) * segmentDist;
    currentPos.z += Math.cos(currentAngle) * segmentDist;
    currentPos.y += rndElevation * elevationMagnitude;

    if (currentPos.y < 0) currentPos.y = 0;
    points.push(currentPos.clone());
  }

  // Final finish straight
  const lastDir = new THREE.Vector3().subVectors(points[points.length - 1], points[points.length - 2]).normalize();
  currentPos.addScaledVector(lastDir, 85);
  points.push(currentPos.clone());

  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  const totalLength = curve.getLength();

  // 2. Build Extruded Road & Curbs & Guardrails Geometry
  const sampleSteps = Math.max(180, Math.floor(totalLength / 4.5));
  const roadGeom = new THREE.BufferGeometry();
  const curbGeomL = new THREE.BufferGeometry();
  const curbGeomR = new THREE.BufferGeometry();
  const railGeomL = new THREE.BufferGeometry();
  const railGeomR = new THREE.BufferGeometry();

  const roadPositions: number[] = [];
  const roadNormals: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  const curbLPositions: number[] = [];
  const curbRPositions: number[] = [];
  const curbIndices: number[] = [];
  const curbUvs: number[] = [];

  const railLPositions: number[] = [];
  const railRPositions: number[] = [];
  const railIndices: number[] = [];

  const curbWidth = 1.1;
  const curbHeight = 0.28;
  const railHeight = 0.85;

  for (let i = 0; i <= sampleSteps; i++) {
    const t = i / sampleSteps;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Road edges
    const leftPt = pos.clone().addScaledVector(normal, -halfWidth);
    const rightPt = pos.clone().addScaledVector(normal, halfWidth);

    roadPositions.push(leftPt.x, leftPt.y, leftPt.z);
    roadPositions.push(rightPt.x, rightPt.y, rightPt.z);

    roadNormals.push(0, 1, 0);
    roadNormals.push(0, 1, 0);

    const uvV = t * (totalLength / 12);
    roadUvs.push(0, uvV);
    roadUvs.push(1, uvV);

    // Curbs with bevel
    const curbOuterL = leftPt.clone().addScaledVector(normal, -curbWidth);
    curbOuterL.y += curbHeight;
    curbLPositions.push(leftPt.x, leftPt.y, leftPt.z);
    curbLPositions.push(curbOuterL.x, curbOuterL.y, curbOuterL.z);

    const curbOuterR = rightPt.clone().addScaledVector(normal, curbWidth);
    curbOuterR.y += curbHeight;
    curbRPositions.push(rightPt.x, rightPt.y, rightPt.z);
    curbRPositions.push(curbOuterR.x, curbOuterR.y, curbOuterR.z);

    curbUvs.push(0, uvV * 3);
    curbUvs.push(1, uvV * 3);

    // Guardrail barriers beyond curbs
    const railBottomL = curbOuterL.clone();
    const railTopL = curbOuterL.clone();
    railTopL.y += railHeight;
    railLPositions.push(railBottomL.x, railBottomL.y, railBottomL.z);
    railLPositions.push(railTopL.x, railTopL.y, railTopL.z);

    const railBottomR = curbOuterR.clone();
    const railTopR = curbOuterR.clone();
    railTopR.y += railHeight;
    railRPositions.push(railBottomR.x, railBottomR.y, railBottomR.z);
    railRPositions.push(railTopR.x, railTopR.y, railTopR.z);

    if (i < sampleSteps) {
      const baseIdx = i * 2;
      roadIndices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      roadIndices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);

      curbIndices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      curbIndices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);

      railIndices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      railIndices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
    }
  }

  roadGeom.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeom.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeom.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeom.setIndex(roadIndices);

  curbGeomL.setAttribute('position', new THREE.Float32BufferAttribute(curbLPositions, 3));
  curbGeomL.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
  curbGeomL.setIndex(curbIndices);
  curbGeomL.computeVertexNormals();

  curbGeomR.setAttribute('position', new THREE.Float32BufferAttribute(curbRPositions, 3));
  curbGeomR.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
  curbGeomR.setIndex(curbIndices);
  curbGeomR.computeVertexNormals();

  railGeomL.setAttribute('position', new THREE.Float32BufferAttribute(railLPositions, 3));
  railGeomL.setIndex(railIndices);
  railGeomL.computeVertexNormals();

  railGeomR.setAttribute('position', new THREE.Float32BufferAttribute(railRPositions, 3));
  railGeomR.setIndex(railIndices);
  railGeomR.computeVertexNormals();

  // 3. High-Definition Canvas Asphalt Texture with Starting Grid & Tire Skidmarks
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = biome.roadColor;
  ctx.fillRect(0, 0, 1024, 1024);

  // High-frequency asphalt grain
  for (let g = 0; g < 6000; g++) {
    const gx = Math.random() * 1024;
    const gy = Math.random() * 1024;
    const galpha = Math.random() * 0.09;
    ctx.fillStyle = `rgba(255,255,255,${galpha})`;
    ctx.fillRect(gx, gy, 2, 2);
  }

  // Realistic Racing Grooves (rubber deposited by racing slicks)
  const gradL = ctx.createLinearGradient(180, 0, 360, 0);
  gradL.addColorStop(0, 'rgba(0,0,0,0)');
  gradL.addColorStop(0.5, 'rgba(0,0,0,0.35)');
  gradL.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradL;
  ctx.fillRect(180, 0, 180, 1024);

  const gradR = ctx.createLinearGradient(660, 0, 840, 0);
  gradR.addColorStop(0, 'rgba(0,0,0,0)');
  gradR.addColorStop(0.5, 'rgba(0,0,0,0.35)');
  gradR.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradR;
  ctx.fillRect(660, 0, 180, 1024);

  // Center dashed dividing line
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 14;
  ctx.setLineDash([50, 40]);
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.stroke();

  // Edge solid lane boundary lines
  ctx.setLineDash([]);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#facc15'; // Racing Yellow
  ctx.beginPath();
  ctx.moveTo(50, 0);
  ctx.lineTo(50, 1024);
  ctx.moveTo(974, 0);
  ctx.lineTo(974, 1024);
  ctx.stroke();

  const roadTex = new THREE.CanvasTexture(canvas);
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.repeat.set(1, totalLength / 18);

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.75,
    metalness: 0.15
  });

  const roadMesh = new THREE.Mesh(roadGeom, roadMat);
  roadMesh.receiveShadow = true;

  // Curbs Material
  const curbMatL = new THREE.MeshStandardMaterial({
    color: new THREE.Color(biome.curbColorA),
    roughness: 0.45,
    metalness: 0.25
  });
  const curbMatR = new THREE.MeshStandardMaterial({
    color: new THREE.Color(biome.curbColorB),
    roughness: 0.45,
    metalness: 0.25
  });

  const curbMeshL = new THREE.Mesh(curbGeomL, curbMatL);
  const curbMeshR = new THREE.Mesh(curbGeomR, curbMatR);

  // Metallic Guardrail Material with Reflective Sheen
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.3
  });
  const railMeshL = new THREE.Mesh(railGeomL, railMat);
  const railMeshR = new THREE.Mesh(railGeomR, railMat);

  // 4. Speed Boost Pads on Road Surface
  const boostPads: BoostPad[] = [];
  const boostCount = Math.max(2, Math.floor(totalLength / 220));

  // Neon Boost Chevron Pad Canvas Texture
  const boostCanvas = document.createElement('canvas');
  boostCanvas.width = 256;
  boostCanvas.height = 256;
  const bstCtx = boostCanvas.getContext('2d')!;
  bstCtx.fillStyle = '#06b6d4';
  bstCtx.fillRect(0, 0, 256, 256);
  bstCtx.fillStyle = '#ffffff';
  // Chevrons >>>
  for (let c = 0; c < 3; c++) {
    bstCtx.beginPath();
    const yOff = 40 + c * 65;
    bstCtx.moveTo(40, yOff);
    bstCtx.lineTo(128, yOff + 45);
    bstCtx.lineTo(216, yOff);
    bstCtx.lineTo(128, yOff + 25);
    bstCtx.closePath();
    bstCtx.fill();
  }

  const boostTex = new THREE.CanvasTexture(boostCanvas);
  const boostMat = new THREE.MeshBasicMaterial({
    map: boostTex,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  const boostGeo = new THREE.PlaneGeometry(5.5, 9.0);
  boostGeo.rotateX(-Math.PI / 2);

  for (let b = 0; b < boostCount; b++) {
    const bProgress = 0.12 + (b / boostCount) * 0.78;
    const bPos = curve.getPointAt(bProgress);
    const bTan = curve.getTangentAt(bProgress).normalize();

    const boostGroup = new THREE.Group();
    const padMesh = new THREE.Mesh(boostGeo, boostMat);
    padMesh.position.y = 0.05;
    boostGroup.add(padMesh);

    boostGroup.position.copy(bPos);
    boostGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), bTan);

    boostPads.push({
      id: b,
      mesh: boostGroup,
      position: bPos,
      progress: bProgress,
      active: true
    });
  }

  // 5. Build Finish Line Gantry Archway with LED Screen
  const finishArch = new THREE.Group();
  const finishPos = curve.getPointAt(1.0);
  const finishTangent = curve.getTangentAt(1.0).normalize();

  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 512;
  bannerCanvas.height = 128;
  const bCtx = bannerCanvas.getContext('2d')!;
  const sq = 32;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 16; c++) {
      bCtx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0f172a';
      bCtx.fillRect(c * sq, r * sq, sq, sq);
    }
  }
  bCtx.fillStyle = '#dc2626';
  bCtx.fillRect(96, 24, 320, 80);
  bCtx.fillStyle = '#ffffff';
  bCtx.font = 'black 48px sans-serif';
  bCtx.textAlign = 'center';
  bCtx.fillText('FINISH LINE', 256, 82);

  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex });
  const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 3, 3.2, 0.6), bannerMat);
  bannerMesh.position.y = 5.8;
  finishArch.add(bannerMesh);

  // Truss pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
  const pillarGeo = new THREE.BoxGeometry(1.4, 7.5, 1.4);
  const pillarL = new THREE.Mesh(pillarGeo, pillarMat);
  pillarL.position.set(-halfWidth - 1.4, 3.75, 0);
  const pillarR = new THREE.Mesh(pillarGeo, pillarMat);
  pillarR.position.set(halfWidth + 1.4, 3.75, 0);
  finishArch.add(pillarL, pillarR);

  finishArch.position.copy(finishPos);
  finishArch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), finishTangent);

  // 6. Checkpoint Gates
  const checkpoints: CheckpointGate[] = [];
  const checkpointPercentages = [0.25, 0.5, 0.75];

  checkpointPercentages.forEach((pct, idx) => {
    const cpPos = curve.getPointAt(pct);
    const cpTan = curve.getTangentAt(pct).normalize();

    const gate = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(trackWidth * 0.48, 0.38, 10, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 4.2;
    gate.add(ring);

    gate.position.copy(cpPos);
    gate.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cpTan);

    checkpoints.push({
      index: idx,
      progress: pct,
      position: cpPos,
      mesh: gate,
      passed: false
    });
  });

  // 7. Floating 3D Collectible Coins (Arranged in smart lines, apex curves & risk/reward lines)
  const coins: CoinPickup[] = [];
  const coinGroupCount = Math.max(8, Math.floor(totalLength / 80));

  const coinGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.18, 18);
  coinGeo.rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 0.65,
    metalness: 0.95,
    roughness: 0.12
  });

  let coinIdCounter = 0;
  for (let g = 0; g < coinGroupCount; g++) {
    const baseProgress = 0.06 + (g / coinGroupCount) * 0.88;
    const patternType = g % 3; // 0 = straight line, 1 = apex turn curve, 2 = risk/reward edge line
    const coinsInCluster = 4 + (g % 3);

    for (let c = 0; c < coinsInCluster; c++) {
      const stepT = baseProgress + (c * 0.0035);
      if (stepT >= 0.98) break;

      const cPos = curve.getPointAt(stepT);
      const cTan = curve.getTangentAt(stepT).normalize();
      const cNormal = new THREE.Vector3().crossVectors(cTan, new THREE.Vector3(0, 1, 0)).normalize();

      let laneOffset = 0;
      if (patternType === 0) {
        // Straight line in center or lane
        const laneChoice = ((g * 7) % 3) - 1; // -1, 0, 1
        laneOffset = laneChoice * 3.5;
      } else if (patternType === 1) {
        // Curved line through apex
        laneOffset = Math.sin((c / coinsInCluster) * Math.PI) * 4.5 * (g % 2 === 0 ? 1 : -1);
      } else {
        // Risk/reward line near barrier
        laneOffset = (halfWidth - 1.8) * (g % 2 === 0 ? 1 : -1);
      }

      const coinGroup = new THREE.Group();
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.castShadow = true;
      coinGroup.add(coinMesh);

      const actualPos = cPos.clone().addScaledVector(cNormal, laneOffset);
      actualPos.y += 0.95;
      coinGroup.position.copy(actualPos);

      coins.push({
        id: coinIdCounter++,
        mesh: coinGroup,
        position: actualPos,
        progress: stepT,
        collected: false
      });
    }
  }

  // 8. Glowing Nitro Pickup Canisters (Spinning cyan fuel tanks)
  const nitroPickups: NitroPickup[] = [];
  const nitroCount = Math.max(2, Math.min(6, Math.floor(totalLength / 280)));

  const nitroCanisterGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
  const nitroMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.9,
    metalness: 0.8,
    roughness: 0.2
  });
  const nitroRingGeo = new THREE.TorusGeometry(0.7, 0.06, 8, 20);
  const nitroRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  for (let n = 0; n < nitroCount; n++) {
    const nProgress = 0.15 + (n / nitroCount) * 0.72;
    const nPos = curve.getPointAt(nProgress);
    const nTan = curve.getTangentAt(nProgress).normalize();
    const nNorm = new THREE.Vector3().crossVectors(nTan, new THREE.Vector3(0, 1, 0)).normalize();

    const nLane = (n % 2 === 0 ? -3.5 : 3.5);
    const actualNPos = nPos.clone().addScaledVector(nNorm, nLane);
    actualNPos.y += 1.1;

    const nitroGroup = new THREE.Group();
    const canister = new THREE.Mesh(nitroCanisterGeo, nitroMat);
    const ring = new THREE.Mesh(nitroRingGeo, nitroRingMat);
    ring.rotation.x = Math.PI / 2;
    nitroGroup.add(canister, ring);
    nitroGroup.position.copy(actualNPos);

    nitroPickups.push({
      id: n,
      mesh: nitroGroup,
      position: actualNPos,
      progress: nProgress,
      collected: false
    });
  }

  // 9. Racing Obstacles (Traffic Cars, Barriers, Cones, Fallen Rocks)
  const obstacles: TrackObstacle[] = [];
  // Introduce obstacles gradually based on level
  if (level.id >= 2) {
    const obstacleCount = Math.min(10, Math.max(3, Math.floor(level.id / 8) + Math.floor(totalLength / 350)));
    
    // Cone geometry
    const coneGeo = new THREE.ConeGeometry(0.4, 0.9, 8);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
    // Barrier geometry
    const barrierGeo = new THREE.BoxGeometry(2.4, 0.9, 0.5);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4, roughness: 0.5 });
    // Rock geometry
    const rockObsGeo = new THREE.DodecahedronGeometry(1.0, 0);
    const rockObsMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
    // Traffic car simple low-poly mesh
    const trafficCarMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const trafficCarGeo = new THREE.BoxGeometry(1.8, 0.8, 3.8);

    for (let o = 0; o < obstacleCount; o++) {
      const oProgress = 0.12 + (o / obstacleCount) * 0.80;
      const oPos = curve.getPointAt(oProgress);
      const oTan = curve.getTangentAt(oProgress).normalize();
      const oNorm = new THREE.Vector3().crossVectors(oTan, new THREE.Vector3(0, 1, 0)).normalize();

      // Lane choice: left, center, right
      const laneChoices = [-4.0, 0, 4.0];
      const laneOffset = laneChoices[(o * 2 + level.id) % 3];

      let type: TrackObstacle['type'] = 'cone';
      let speedMps = 0;
      let radius = 1.4;

      const obsGroup = new THREE.Group();

      if (level.id > 10 && o % 3 === 0) {
        // Traffic civilian car
        type = 'traffic_car';
        speedMps = 14 + (o % 3) * 4; // slowly moving forward
        radius = 2.0;
        const carMesh = new THREE.Mesh(trafficCarGeo, trafficCarMat);
        carMesh.position.y = 0.5;
        // Tail lights on traffic car
        const tLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.1), tLightMat);
        tl1.position.set(-0.6, 0.5, -1.9);
        const tl2 = tl1.clone();
        tl2.position.x = 0.6;
        obsGroup.add(carMesh, tl1, tl2);
      } else if (level.biome === 'mountain' || level.biome === 'desert' || level.biome === 'extreme_storm') {
        type = 'rock';
        radius = 1.3;
        const rock = new THREE.Mesh(rockObsGeo, rockObsMat);
        rock.position.y = 0.8;
        obsGroup.add(rock);
      } else if (o % 2 === 0) {
        type = 'barrier';
        radius = 1.6;
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.y = 0.45;
        obsGroup.add(barrier);
      } else {
        type = 'cone';
        radius = 1.0;
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = 0.45;
        obsGroup.add(cone);
      }

      const actualPos = oPos.clone().addScaledVector(oNorm, laneOffset);
      obsGroup.position.copy(actualPos);
      obsGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), oTan);

      obstacles.push({
        id: o,
        type,
        mesh: obsGroup,
        position: actualPos,
        progress: oProgress,
        speedMps,
        laneOffset,
        hit: false,
        radius
      });
    }
  }

  // 10. Roadside Props (High-rise buildings, Trees, Rocks, Highway Gantries, Signs)
  const propsGroup = new THREE.Group();
  const propCount = Math.floor(totalLength / 18);

  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 3.5, 6);
  const pineLeavesGeo = new THREE.ConeGeometry(2.4, 6.0, 7);
  const palmLeavesGeo = new THREE.SphereGeometry(2.2, 7, 7);
  const rockGeo = new THREE.DodecahedronGeometry(2.8, 1);
  const bldgGeo = new THREE.BoxGeometry(14, 45, 14);
  const lightPoleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 6);
  const signPoleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6);
  const signBoardGeo = new THREE.BoxGeometry(1.6, 1.6, 0.1);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
  const pineMat = new THREE.MeshStandardMaterial({
    color: level.biome === 'snow_mountain' ? 0xe2e8f0 : 0x15803d,
    roughness: 0.8
  });
  const palmMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
  const rockMat = new THREE.MeshStandardMaterial({
    color: level.biome === 'desert' ? 0xb45309 : level.biome === 'coastal_road' ? 0x9a3412 : 0x64748b,
    roughness: 0.9
  });
  const bldgMat = new THREE.MeshStandardMaterial({
    color: level.biome === 'night' ? 0x0f172a : 0x1e293b,
    metalness: 0.6,
    roughness: 0.25
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.2
  });
  const lightGlowMat = new THREE.MeshBasicMaterial({
    color: level.biome === 'night' ? 0xec4899 : 0x67e8f9
  });
  const signWarningMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.4
  });

  for (let p = 0; p < propCount; p++) {
    const t = (p / propCount);
    const pos = curve.getPointAt(t);
    const tan = curve.getTangentAt(t).normalize();
    const norm = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

    const side = p % 2 === 0 ? 1 : -1;
    const distFromTrack = halfWidth + 4.5 + seededRandom(p * 47) * 22;
    const propPos = pos.clone().addScaledVector(norm, side * distFromTrack);

    // Occasional Roadside Traffic Signs near the road barrier
    if (p % 8 === 0) {
      const signGroup = new THREE.Group();
      const sPole = new THREE.Mesh(signPoleGeo, lightMat);
      sPole.position.y = 1.6;
      const sBoard = new THREE.Mesh(signBoardGeo, signWarningMat);
      sBoard.position.y = 3.0;
      sBoard.rotation.z = Math.PI / 4; // diamond hazard shape
      signGroup.add(sPole, sBoard);
      const signPos = pos.clone().addScaledVector(norm, side * (halfWidth + 2.2));
      signGroup.position.copy(signPos);
      signGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
      propsGroup.add(signGroup);
    }

    if (biome.propType === 'city_buildings' || biome.propType === 'night_lights') {
      if (p % 3 === 0) {
        const bHeight = 28 + seededRandom(p * 91) * 45;
        const bldg = new THREE.Mesh(bldgGeo, bldgMat);
        bldg.scale.set(1 + seededRandom(p) * 0.7, bHeight / 45, 1 + seededRandom(p * 2) * 0.7);
        bldg.position.set(propPos.x, propPos.y + bHeight / 2, propPos.z);
        bldg.castShadow = true;
        propsGroup.add(bldg);
      } else {
        const pole = new THREE.Mesh(lightPoleGeo, lightMat);
        pole.position.set(propPos.x, propPos.y + 3.75, propPos.z);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), lightGlowMat);
        lamp.position.set(propPos.x, propPos.y + 7.5, propPos.z);
        propsGroup.add(pole, lamp);
      }
    } else if (biome.propType === 'highway_palms' || biome.propType === 'coastal_cliffs') {
      if (p % 2 === 0) {
        const palm = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeo, woodMat);
        trunk.position.y = 1.75;
        const top = new THREE.Mesh(palmLeavesGeo, palmMat);
        top.position.y = 4.2;
        palm.add(trunk, top);
        palm.position.copy(propPos);
        palm.castShadow = true;
        propsGroup.add(palm);
      } else {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(propPos.x, propPos.y + 2.0, propPos.z);
        rock.castShadow = true;
        propsGroup.add(rock);
      }
    } else if (biome.propType === 'mountain_pines' || biome.propType === 'forest_woods' || biome.propType === 'snow_ice' || biome.propType === 'storm_mountains') {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, woodMat);
      trunk.position.y = 1.75;
      const leaves = new THREE.Mesh(pineLeavesGeo, pineMat);
      leaves.position.y = 5.2;
      tree.add(trunk, leaves);
      const scale = 0.85 + seededRandom(p * 13) * 0.7;
      tree.scale.set(scale, scale, scale);
      tree.position.copy(propPos);
      tree.castShadow = true;
      propsGroup.add(tree);
    } else {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const rScale = 1.1 + seededRandom(p * 29) * 1.8;
      rock.scale.set(rScale, rScale * (0.8 + seededRandom(p) * 0.6), rScale);
      rock.position.set(propPos.x, propPos.y + rScale * 1.3, propPos.z);
      rock.rotation.set(seededRandom(p), seededRandom(p * 2), seededRandom(p * 3));
      rock.castShadow = true;
      propsGroup.add(rock);
    }
  }

  const startPos = curve.getPointAt(0.01);
  const startTangent = curve.getTangentAt(0.01).normalize();
  const startRotation = new THREE.Euler(0, Math.atan2(startTangent.x, startTangent.z), 0);

  return {
    curve,
    trackMesh: roadMesh,
    curbMeshes: [curbMeshL, curbMeshR],
    guardrailMeshes: [railMeshL, railMeshR],
    finishArch,
    coins,
    checkpoints,
    boostPads,
    nitroPickups,
    obstacles,
    propsGroup,
    trackLength: totalLength,
    trackWidth,
    startPosition: startPos,
    startRotation
  };
}
