/**
 * Apex Nitro 3D / Faster Nitro - High-Fidelity 3D Car Mesh Builder
 * Constructs detailed vehicle hierarchies including the iconic BMW M4 Competition Coupé
 * with vertical dual-kidney grilles, sculpted powerdome hood, M carbon roof, angel-eye laser lights,
 * quad chrome exhausts, and heated brake rotors.
 */

import * as THREE from 'three';

export interface CarVisualRig {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  bodyMaterial: THREE.MeshStandardMaterial;
  wheelMeshes: THREE.Group[]; // [FL, FR, RL, RR]
  frontSteerKnuckles: THREE.Group[]; // [FL, FR]
  taillightMaterial: THREE.MeshStandardMaterial;
  headlightMaterial: THREE.MeshStandardMaterial;
  brakeDiscMaterials: THREE.MeshStandardMaterial[];
  headlightBeams: THREE.Mesh[];
  nitroFlames: THREE.Mesh[];
  underglow?: THREE.Mesh;
}

export function buildCarMesh(carId: string, primaryColorHex: string): CarVisualRig {
  const root = new THREE.Group();
  const wheelMeshes: THREE.Group[] = [];
  const frontSteerKnuckles: THREE.Group[] = [];
  const nitroFlames: THREE.Mesh[] = [];
  const brakeDiscMaterials: THREE.MeshStandardMaterial[] = [];
  const headlightBeams: THREE.Mesh[] = [];

  // PBR Glossy Clearcoat Car Paint Material
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryColorHex),
    metalness: 0.88,
    roughness: 0.18,
    envMapIntensity: 1.4
  });

  // Dark carbon-fiber composite material
  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x141820,
    metalness: 0.7,
    roughness: 0.35
  });

  // Cockpit Tinted Glass
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    metalness: 0.95,
    roughness: 0.08,
    transparent: true,
    opacity: 0.92
  });

  // Polished Chrome
  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.98,
    roughness: 0.08
  });

  // Projector LED Headlights
  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x67e8f9,
    emissiveIntensity: 1.2,
    roughness: 0.15
  });

  // Neon Taillights
  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0xef4444,
    emissiveIntensity: 0.75,
    roughness: 0.25
  });

  let bodyMesh: THREE.Mesh;

  if (carId === 'formula_apex') {
    // --- FORMULA 1 APEX MONOPOSTO ---
    const noseGeo = new THREE.ConeGeometry(0.55, 3.8, 8);
    noseGeo.rotateX(Math.PI / 2);
    bodyMesh = new THREE.Mesh(noseGeo, bodyMaterial);
    bodyMesh.position.set(0, 0.45, 0.4);
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // F1 Cockpit & Halo
    const cockpitGeo = new THREE.BoxGeometry(0.72, 0.42, 1.3);
    const cockpit = new THREE.Mesh(cockpitGeo, carbonMaterial);
    cockpit.position.set(0, 0.58, -0.3);
    root.add(cockpit);

    const haloGeo = new THREE.TorusGeometry(0.35, 0.04, 8, 16, Math.PI);
    haloGeo.rotateX(-Math.PI / 2);
    const halo = new THREE.Mesh(haloGeo, chromeMaterial);
    halo.position.set(0, 0.88, 0.1);
    root.add(halo);

    const frontWingMain = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.65), carbonMaterial);
    frontWingMain.position.set(0, 0.22, 2.05);
    const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.65), bodyMaterial);
    endplateL.position.set(-1.05, 0.32, 2.05);
    const endplateR = endplateL.clone();
    endplateR.position.x = 1.05;
    root.add(frontWingMain, endplateL, endplateR);

    const rearWingGeo = new THREE.BoxGeometry(1.85, 0.35, 0.4);
    const rearWing = new THREE.Mesh(rearWingGeo, carbonMaterial);
    rearWing.position.set(0, 0.98, -1.85);

    const pillarGeo = new THREE.BoxGeometry(0.08, 0.55, 0.12);
    const pillarL = new THREE.Mesh(pillarGeo, carbonMaterial);
    pillarL.position.set(-0.5, 0.72, -1.85);
    const pillarR = pillarL.clone();
    pillarR.position.x = 0.5;
    root.add(rearWing, pillarL, pillarR);

  } else if (carId === 'muscle_beast') {
    // --- V8 THUNDER BEAST MUSCLE ---
    const lowerBodyGeo = new THREE.BoxGeometry(1.95, 0.58, 4.45);
    bodyMesh = new THREE.Mesh(lowerBodyGeo, bodyMaterial);
    bodyMesh.position.set(0, 0.5, 0);
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    const cabinGeo = new THREE.BoxGeometry(1.5, 0.52, 2.1);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, 0.96, -0.3);
    root.add(cabin);

    const blowerGeo = new THREE.BoxGeometry(0.65, 0.3, 0.95);
    const blower = new THREE.Mesh(blowerGeo, chromeMaterial);
    blower.position.set(0, 0.88, 0.95);

    const intakeButterflies = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    intakeButterflies.rotateZ(Math.PI / 2);
    intakeButterflies.position.set(0, 0.88, 1.45);
    root.add(blower, intakeButterflies);

    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.36, 0.1), carbonMaterial);
    grille.position.set(0, 0.5, 2.24);
    root.add(grille);

    const ducktail = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.18, 0.2), carbonMaterial);
    ducktail.position.set(0, 0.88, -2.15);
    ducktail.rotation.x = 0.2;
    root.add(ducktail);

  } else if (carId === 'bmw_m4' || carId === 'apex_cruiser') {
    // ========================================================
    // --- BMW M4 COMPETITION COUPÉ (G82) ---
    // ========================================================
    // Muscular sports chassis
    const m4BodyGeo = new THREE.BoxGeometry(1.92, 0.52, 4.4);
    bodyMesh = new THREE.Mesh(m4BodyGeo, bodyMaterial);
    bodyMesh.position.set(0, 0.48, 0);
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // Front sculptured powerdome hood with dual air indents
    const hoodGeo = new THREE.BoxGeometry(1.68, 0.22, 1.6);
    const hood = new THREE.Mesh(hoodGeo, bodyMaterial);
    hood.position.set(0, 0.65, 1.35);
    hood.rotation.x = 0.08;
    root.add(hood);

    // Twin hood indentation recesses (M4 Powerdome grooves)
    const indentMat = carbonMaterial;
    const indentL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 1.1), indentMat);
    indentL.position.set(-0.35, 0.77, 1.35);
    indentL.rotation.x = 0.08;
    const indentR = indentL.clone();
    indentR.position.x = 0.35;
    root.add(indentL, indentR);

    // THE ICONIC VERTICAL DUAL BMW KIDNEY GRILLES
    const grilleFrameMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.95, roughness: 0.15 });
    const grilleMeshMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7, roughness: 0.3 });

    // Left vertical kidney grille
    const kidneyL = new THREE.Group();
    const kFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.62, 0.08), grilleFrameMat);
    const kCoreL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.58, 0.1), grilleMeshMat);
    kidneyL.add(kFrameL, kCoreL);
    kidneyL.position.set(-0.22, 0.46, 2.22);
    kidneyL.rotation.y = -0.06;

    // Right vertical kidney grille
    const kidneyR = new THREE.Group();
    const kFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.62, 0.08), grilleFrameMat);
    const kCoreR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.58, 0.1), grilleMeshMat);
    kidneyR.add(kFrameR, kCoreR);
    kidneyR.position.set(0.22, 0.46, 2.22);
    kidneyR.rotation.y = 0.06;

    // M4 Tri-Color badge on grille
    const mBadge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    mBadge.position.set(0.24, 0.64, 2.23);

    root.add(kidneyL, kidneyR, mBadge);

    // Front Lower Honeycomb Air Intake and Carbon Corner Splitters
    const lowerIntake = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.16, 0.2), carbonMaterial);
    lowerIntake.position.set(0, 0.2, 2.18);
    const frontLip = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.05, 0.5), carbonMaterial);
    frontLip.position.set(0, 0.14, 2.18);
    root.add(lowerIntake, frontLip);

    // Front Side Bumper Air Breather Vents
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.42, 0.1), carbonMaterial);
    ventL.position.set(-0.76, 0.44, 2.18);
    ventL.rotation.y = -0.2;
    const ventR = ventL.clone();
    ventR.position.x = 0.76;
    ventR.rotation.y = 0.2;
    root.add(ventL, ventR);

    // M Carbon Fiber Double-Bubble Roof with aeroflow channel
    const roofGeo = new THREE.BoxGeometry(1.36, 0.46, 2.2);
    const cabin = new THREE.Mesh(roofGeo, glassMaterial);
    cabin.position.set(0, 0.9, -0.25);
    root.add(cabin);

    // Carbon roof shell
    const carbonRoof = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.05, 1.7), carbonMaterial);
    carbonRoof.position.set(0, 1.14, -0.3);
    root.add(carbonRoof);

    // M Aerodynamic Winglet Mirrors with floating aero fin
    const mMirrorGeo = new THREE.BoxGeometry(0.26, 0.12, 0.16);
    const mMirrorFin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.12), carbonMaterial);
    mMirrorFin.position.set(0, 0.08, 0);

    const mMirrorL = new THREE.Group();
    const mirrorBodyL = new THREE.Mesh(mMirrorGeo, carbonMaterial);
    mMirrorL.add(mirrorBodyL, mMirrorFin.clone());
    mMirrorL.position.set(-0.9, 0.84, 0.65);

    const mMirrorR = new THREE.Group();
    const mirrorBodyR = new THREE.Mesh(mMirrorGeo, carbonMaterial);
    mMirrorR.add(mirrorBodyR, mMirrorFin.clone());
    mMirrorR.position.set(0.9, 0.84, 0.65);
    root.add(mMirrorL, mMirrorR);

    // M4 Rear Trunk Lip Ducktail Spoiler
    const lipSpoiler = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 0.22), carbonMaterial);
    lipSpoiler.position.set(0, 0.86, -2.14);
    lipSpoiler.rotation.x = 0.15;
    root.add(lipSpoiler);

    // M Carbon Rear Diffuser with aero strakes
    const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.24, 0.4), carbonMaterial);
    rearDiffuser.position.set(0, 0.24, -2.16);
    rearDiffuser.rotation.x = -0.15;
    root.add(rearDiffuser);

    // Side M Carbon Rocker Panels
    const sideSkirtL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 2.5), carbonMaterial);
    sideSkirtL.position.set(-0.98, 0.22, 0);
    const sideSkirtR = sideSkirtL.clone();
    sideSkirtR.position.x = 0.98;
    root.add(sideSkirtL, sideSkirtR);

  } else {
    // --- SUPERCAR / HYPERCAR ---
    const lowerBodyGeo = new THREE.BoxGeometry(1.88, 0.52, 4.35);
    bodyMesh = new THREE.Mesh(lowerBodyGeo, bodyMaterial);
    bodyMesh.position.set(0, 0.48, 0);
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    const hoodWedgeGeo = new THREE.ConeGeometry(0.92, 1.45, 4);
    hoodWedgeGeo.rotateX(Math.PI / 2);
    hoodWedgeGeo.rotateY(Math.PI / 4);
    const hood = new THREE.Mesh(hoodWedgeGeo, bodyMaterial);
    hood.position.set(0, 0.54, 1.45);
    hood.scale.set(1.4, 0.4, 1.25);
    root.add(hood);

    const cabinGeo = new THREE.BoxGeometry(1.36, 0.48, 2.15);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, 0.88, -0.25);
    root.add(cabin);

    const roofScoopGeo = new THREE.BoxGeometry(0.35, 0.16, 0.8);
    const roofScoop = new THREE.Mesh(roofScoopGeo, carbonMaterial);
    roofScoop.position.set(0, 1.16, -0.1);
    root.add(roofScoop);

    const spoilerWingGeo = new THREE.BoxGeometry(1.85, 0.08, 0.48);
    const spoiler = new THREE.Mesh(spoilerWingGeo, carbonMaterial);
    spoiler.position.set(0, 1.08, -2.1);

    const strutGeo = new THREE.BoxGeometry(0.06, 0.45, 0.18);
    const strutL = new THREE.Mesh(strutGeo, carbonMaterial);
    strutL.position.set(-0.62, 0.88, -2.1);
    const strutR = strutL.clone();
    strutR.position.x = 0.62;
    root.add(spoiler, strutL, strutR);

    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.06, 0.55), carbonMaterial);
    splitter.position.set(0, 0.22, 2.1);
    root.add(splitter);

    const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 2.4), carbonMaterial);
    skirtL.position.set(-0.96, 0.24, 0);
    const skirtR = skirtL.clone();
    skirtR.position.x = 0.96;
    root.add(skirtL, skirtR);

    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.5), carbonMaterial);
    diffuser.position.set(0, 0.24, -2.15);
    diffuser.rotation.x = -0.2;
    root.add(diffuser);
  }

  // --- Projector Laser Headlights ---
  const headlightGeo = new THREE.BoxGeometry(0.38, 0.12, 0.12);
  const headL = new THREE.Mesh(headlightGeo, headlightMaterial);
  headL.position.set(-0.66, 0.52, 2.18);
  const headR = headL.clone();
  headR.position.x = 0.66;
  root.add(headL, headR);

  // Forward Volumetric Headlight Cones (project light onto the road)
  const beamGeo = new THREE.ConeGeometry(1.4, 22, 12, 1, true);
  beamGeo.rotateX(Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const beamL = new THREE.Mesh(beamGeo, beamMat);
  beamL.position.set(-0.66, 0.5, 12.5);
  const beamR = beamL.clone();
  beamR.position.x = 0.66;
  root.add(beamL, beamR);
  headlightBeams.push(beamL, beamR);

  // --- Rear Taillight Lightbar ---
  const taillightGeo = new THREE.BoxGeometry(1.65, 0.12, 0.12);
  const tail = new THREE.Mesh(taillightGeo, taillightMaterial);
  tail.position.set(0, 0.55, -2.18);
  root.add(tail);

  // --- Quad Exhaust Pipes & Nitro Afterburners (M-Sport Quad Exhausts) ---
  const exhaustGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.35, 14);
  exhaustGeo.rotateX(Math.PI / 2);

  const exhaustL1 = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustL1.position.set(-0.48, 0.32, -2.22);
  const exhaustL2 = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustL2.position.set(-0.32, 0.32, -2.22);

  const exhaustR1 = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustR1.position.set(0.32, 0.32, -2.22);
  const exhaustR2 = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustR2.position.set(0.48, 0.32, -2.22);

  root.add(exhaustL1, exhaustL2, exhaustR1, exhaustR2);

  // Outer Thruster Flame (Orange/Hot Glow)
  const outerFlameGeo = new THREE.ConeGeometry(0.18, 1.2, 10);
  outerFlameGeo.rotateX(-Math.PI / 2);
  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });

  // Inner Thruster Core (Bright Cyan Laser Core)
  const innerFlameGeo = new THREE.ConeGeometry(0.09, 0.85, 8);
  innerFlameGeo.rotateX(-Math.PI / 2);
  const innerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });

  const flameGroupL = new THREE.Group();
  flameGroupL.position.set(-0.4, 0.32, -2.8);
  const outerL = new THREE.Mesh(outerFlameGeo, outerFlameMat);
  const innerL = new THREE.Mesh(innerFlameGeo, innerFlameMat);
  flameGroupL.add(outerL, innerL);
  flameGroupL.visible = false;

  const flameGroupR = flameGroupL.clone();
  flameGroupR.position.x = 0.4;

  root.add(flameGroupL, flameGroupR);
  nitroFlames.push(flameGroupL as unknown as THREE.Mesh, flameGroupR as unknown as THREE.Mesh);

  // --- Neon Street Underglow (Matches Primary Paint) ---
  const underglowGeo = new THREE.PlaneGeometry(2.0, 4.2);
  underglowGeo.rotateX(-Math.PI / 2);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(primaryColorHex),
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });
  const underglowMesh = new THREE.Mesh(underglowGeo, underglowMat);
  underglowMesh.position.set(0, 0.08, 0);
  root.add(underglowMesh);

  // --- 4 Detailed Wheels with Rotors & M-Sport Brake Calipers ---
  const wheelRadius = 0.38;
  const wheelWidth = 0.32;
  const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 22);
  tireGeo.rotateZ(Math.PI / 2);

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111418,
    roughness: 0.85,
    metalness: 0.15
  });

  // BMW M-Sport Double-Spoke Alloy Rim
  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth * 1.04, 18);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Gunmetal M Performance Grey
    metalness: 0.95,
    roughness: 0.15
  });

  // M-Sport Blue Brake Caliper
  const caliperGeo = new THREE.BoxGeometry(0.12, 0.22, 0.18);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // BMW M Blue
    roughness: 0.25,
    metalness: 0.6
  });

  const wheelPositions = [
    { x: -0.98, y: wheelRadius, z: 1.35, isFront: true, isLeft: true },  // Front Left
    { x: 0.98, y: wheelRadius, z: 1.35, isFront: true, isLeft: false }, // Front Right
    { x: -1.0, y: wheelRadius, z: -1.35, isFront: false, isLeft: true }, // Rear Left
    { x: 1.0, y: wheelRadius, z: -1.35, isFront: false, isLeft: false }  // Rear Right
  ];

  wheelPositions.forEach((pos) => {
    const steerGroup = new THREE.Group();
    steerGroup.position.set(pos.x, pos.y, pos.z);

    const spinGroup = new THREE.Group();

    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, rimMat);

    // Drilled Brake Disc Rotor
    const discGeo = new THREE.CylinderGeometry(wheelRadius * 0.58, wheelRadius * 0.58, 0.05, 16);
    discGeo.rotateZ(Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0x000000,
      emissiveIntensity: 0
    });
    brakeDiscMaterials.push(discMat);
    const disc = new THREE.Mesh(discGeo, discMat);

    spinGroup.add(tire, rim, disc);

    // Static Caliper placed inside steering knuckle
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(pos.isLeft ? 0.06 : -0.06, 0.12, 0.08);

    steerGroup.add(spinGroup, caliper);
    root.add(steerGroup);

    wheelMeshes.push(spinGroup);

    if (pos.isFront) {
      frontSteerKnuckles.push(steerGroup);
    }
  });

  return {
    root,
    bodyMesh,
    bodyMaterial,
    wheelMeshes,
    frontSteerKnuckles,
    taillightMaterial,
    headlightMaterial,
    brakeDiscMaterials,
    headlightBeams,
    nitroFlames,
    underglow: underglowMesh
  };
}
