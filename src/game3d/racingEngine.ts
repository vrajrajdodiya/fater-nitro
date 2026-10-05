/**
 * Apex Nitro 3D - Three.js Racing Engine & Physics Simulator
 */

import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { LevelConfig, CarStats, RaceResult, GameSettings } from '../types/game';
import { BIOME_CONFIGS } from '../data/levelsData';
import { buildCarMesh, CarVisualRig } from './carMeshBuilder';
import { generateTrack, GeneratedTrackData, CoinPickup, CheckpointGate, BoostPad, NitroPickup, TrackObstacle } from './trackGenerator';
import { soundManager } from '../audio/soundManager';

export interface CarInputs {
  steerLeft: boolean;
  steerRight: boolean;
  accelerate: boolean;
  brakeReverse: boolean;
  nitro: boolean;
}

export interface OpponentCar {
  id: number;
  name: string;
  rig: CarVisualRig;
  progress: number; // 0 to 1
  laneOffset: number; // -4 to +4 meters from track center
  speedMps: number;
  maxSpeedMps: number;
  targetSpeedMps: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  isBoss?: boolean;
}

export class RacingEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private lastTime = 0;

  // Level & Config
  private level: LevelConfig;
  private playerCarId: string;
  private playerCarColor: string;
  private stats: CarStats;
  private settings: GameSettings;
  private onRaceFinish: (result: RaceResult) => void;
  private onUpdateHud: (hudData: {
    speedKmh: number;
    rpm: number;
    nitroPercent: number;
    elapsedTime: number;
    position: number;
    totalRacers: number;
    progressPercent: number;
    coinsCollected: number;
    totalCoins: number;
    checkpointsPassed: number;
    totalCheckpoints: number;
    headlightsOn?: boolean;
    nearMissCount?: number;
    nearMissCombo?: number;
    driftMeters?: number;
    isBossRace?: boolean;
    activeNotification?: { text: string; subtext?: string; type: string } | null;
  }) => void;

  // Track data
  private trackData!: GeneratedTrackData;
  private coins: CoinPickup[] = [];
  private checkpoints: CheckpointGate[] = [];
  private boostPads: BoostPad[] = [];
  private nitroPickups: NitroPickup[] = [];
  private obstacles: TrackObstacle[] = [];
  private boostPadTimer = 0;

  // Player Vehicle Physics State
  private playerRig!: CarVisualRig;
  private playerPos = new THREE.Vector3();
  private playerVel = new THREE.Vector3();
  private playerHeading = 0; // Yaw angle in radians
  private currentSpeedMps = 0;
  private currentSteerAngle = 0;
  private currentPitch = 0;
  private currentRoll = 0;
  private driftFactor = 0;
  private nitroCapacity = 100;
  private currentNitro = 100;
  private isNitroActive = false;
  private playerProgress = 0.01;
  private coinsCollected = 0;
  private checkpointsPassed = 0;

  // Near Miss & Drift Stats
  private nearMissCount = 0;
  private nearMissCombo = 1;
  private lastNearMissTime = -10;
  private nearMissBonusCoins = 0;
  private nearMissCooldowns: Record<string, number> = {};
  private driftMeters = 0;
  private cameraShake = 0;
  private activeNotification: { text: string; subtext?: string; type: string } | null = null;
  private notificationTimer = 0;

  // Race State
  public raceState: 'countdown' | 'racing' | 'paused' | 'finished' = 'countdown';
  private countdownValue = 3;
  private countdownTimer = 0;
  private raceElapsedTime = 0;
  private opponents: OpponentCar[] = [];
  private hudUpdateTimer = 0;

  // Input states
  private inputs: CarInputs = {
    steerLeft: false,
    steerRight: false,
    accelerate: false,
    brakeReverse: false,
    nitro: false
  };

  constructor(
    container: HTMLElement,
    level: LevelConfig,
    playerCarId: string,
    playerCarColor: string,
    stats: CarStats,
    settings: GameSettings,
    onRaceFinish: (result: RaceResult) => void,
    onUpdateHud: (data: any) => void
  ) {
    this.container = container;
    this.level = level;
    this.playerCarId = playerCarId;
    this.playerCarColor = playerCarColor;
    this.stats = stats;
    this.settings = settings;
    this.onRaceFinish = onRaceFinish;
    this.onUpdateHud = onUpdateHud;

    this.scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.2, 1200);
    this.renderer = new THREE.WebGLRenderer({
      antialias: settings.graphicsQuality === 'high',
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.graphicsQuality === 'high' ? 2 : 1));
    this.renderer.shadowMap.enabled = settings.graphicsQuality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(this.renderer.domElement);

    this.initScene();
    this.initPlayer();
    this.initOpponents();
    this.startCountdown();

    window.addEventListener('resize', this.handleResize);
    this.animate(0);
  }

  private initScene() {
    const biome = BIOME_CONFIGS[this.level.biome];

    // Background & Fog
    this.scene.background = new THREE.Color(biome.skyColor);
    this.scene.fog = new THREE.FogExp2(biome.fogColor, biome.fogDensity);

    // Directional Sunlight with Shadows
    const sunLight = new THREE.DirectionalLight(biome.lightColor, 1.4);
    sunLight.position.set(120, 200, 100);
    if (this.settings.graphicsQuality === 'high') {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 450;
      const d = 120;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
    }
    this.scene.add(sunLight);

    // Ambient & Hemisphere Lighting
    const hemiLight = new THREE.HemisphereLight(biome.lightColor, biome.ambientColor, 0.7);
    this.scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(biome.ambientColor, 0.4);
    this.scene.add(ambientLight);

    // Terrain Ground Mesh
    const groundGeo = new THREE.PlaneGeometry(3000, 3000, 16, 16);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(biome.groundColor),
      roughness: 0.95,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Generate Track Ribbon & Scenery
    this.trackData = generateTrack(this.level);
    this.scene.add(this.trackData.trackMesh);
    this.trackData.curbMeshes.forEach(curb => this.scene.add(curb));
    this.trackData.guardrailMeshes.forEach(rail => this.scene.add(rail));
    this.scene.add(this.trackData.finishArch);
    this.scene.add(this.trackData.propsGroup);

    // Add Checkpoint Gates
    this.checkpoints = this.trackData.checkpoints;
    this.checkpoints.forEach(cp => this.scene.add(cp.mesh));

    // Add Speed Boost Pads
    this.boostPads = this.trackData.boostPads;
    this.boostPads.forEach(pad => this.scene.add(pad.mesh));

    // Add Floating Coins
    this.coins = this.trackData.coins;
    this.coins.forEach(coin => this.scene.add(coin.mesh));

    // Add Nitro Canister Pickups
    this.nitroPickups = this.trackData.nitroPickups || [];
    this.nitroPickups.forEach(np => this.scene.add(np.mesh));

    // Add Roadside & Track Obstacles
    this.obstacles = this.trackData.obstacles || [];
    this.obstacles.forEach(obs => this.scene.add(obs.mesh));
  }

  private initPlayer() {
    this.playerRig = buildCarMesh(this.playerCarId, this.playerCarColor);
    this.scene.add(this.playerRig.root);

    // Position at start of track spline
    const startPoint = this.trackData.curve.getPointAt(0.005);
    const startTangent = this.trackData.curve.getTangentAt(0.005).normalize();
    const startNormal = new THREE.Vector3().crossVectors(startTangent, new THREE.Vector3(0, 1, 0)).normalize();

    // Player starts in center-left lane
    this.playerPos.copy(startPoint).addScaledVector(startNormal, -2.5);
    this.playerPos.y = startPoint.y;
    this.playerHeading = Math.atan2(startTangent.x, startTangent.z);

    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.set(0, this.playerHeading, 0);

    // Set camera immediately behind player
    this.updateCamera(1.0);
  }

  private initOpponents() {
    this.opponents = [];
    const count = this.level.opponentCount;
    const isBossLevel = this.level.id === 5;

    const opponentNames = [
      isBossLevel ? 'SHADOW PHANTOM (BOSS)' : 'Viper Apex',
      'Thunder Bolt',
      'Crimson Fang',
      'Storm Racer',
      'Titan Spectre'
    ];
    const opponentCars = ['cyber_gtr', 'hyper_sport', 'muscle_beast', 'formula_apex', 'titan_hyper', 'bmw_m4'];
    const opponentColors = [
      isBossLevel ? '#090d16' : '#f59e0b',
      '#dc2626',
      '#3b82f6',
      '#10b981',
      '#a855f7'
    ];

    for (let i = 0; i < count; i++) {
      const isBoss = isBossLevel && i === 0;
      const oppCarId = isBoss ? 'cyber_gtr' : opponentCars[i % opponentCars.length];
      const oppColor = isBoss ? '#090d16' : opponentColors[i % opponentColors.length];
      const oppRig = buildCarMesh(oppCarId, oppColor);

      if (isBoss && oppRig.underglow) {
        (oppRig.underglow.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
      }

      this.scene.add(oppRig.root);

      // Lane offset and staggered start position
      const laneOffset = (i % 2 === 0 ? 3.0 : 0.0) + (i > 1 ? -3.0 : 0);
      const startT = 0.005 + (i + 1) * 0.008; // slightly ahead or staggered

      // Max speed scaled by level difficulty and player car speed
      const playerMaxMps = this.stats.topSpeed / 3.6;
      // Difficulty multiplier (0.85 at level 1, up to 1.05 for boss or level 100)
      const diffMultiplier = isBoss ? 1.04 : (0.84 + (this.level.id / 100) * 0.18);
      const oppMaxSpeed = playerMaxMps * diffMultiplier;

      const oppPos = this.trackData.curve.getPointAt(startT);
      const oppTan = this.trackData.curve.getTangentAt(startT).normalize();
      const oppNorm = new THREE.Vector3().crossVectors(oppTan, new THREE.Vector3(0, 1, 0)).normalize();
      const actualPos = oppPos.clone().addScaledVector(oppNorm, laneOffset);
      actualPos.y = oppPos.y;

      oppRig.root.position.copy(actualPos);
      const heading = Math.atan2(oppTan.x, oppTan.z);
      oppRig.root.rotation.set(0, heading, 0);

      this.opponents.push({
        id: i,
        name: opponentNames[i % opponentNames.length],
        rig: oppRig,
        progress: startT,
        laneOffset,
        speedMps: 0,
        maxSpeedMps: oppMaxSpeed,
        targetSpeedMps: oppMaxSpeed,
        position: actualPos,
        rotation: new THREE.Euler(0, heading, 0),
        isBoss
      });
    }
  }

  private startCountdown() {
    this.raceState = 'countdown';
    this.countdownValue = 3;
    soundManager.startEngine(this.playerCarId === 'muscle_beast' ? 'v8' : 'sport');
    soundManager.playCountdown(3);

    const interval = window.setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue > 0) {
        soundManager.playCountdown(this.countdownValue);
      } else if (this.countdownValue === 0) {
        soundManager.playCountdown('GO');
        this.raceState = 'racing';
        soundManager.startMusic();
        window.clearInterval(interval);
      }
    }, 1000);
  }

  public setInputs(inputs: Partial<CarInputs>) {
    this.inputs = { ...this.inputs, ...inputs };
  }

  private animate = (timestamp: number) => {
    this.animFrameId = requestAnimationFrame(this.animate);

    if (!this.lastTime) this.lastTime = timestamp;
    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (this.raceState === 'racing') {
      this.raceElapsedTime += delta;
      this.updatePlayerPhysics(delta);
      this.updateOpponents(delta);
      this.checkBoostPads(delta);
      this.checkCollectibles();
      this.checkNitroPickups(delta);
      this.checkObstacles(delta);
      this.checkNearMisses(delta);
      this.checkCheckpoints();
      this.checkFinishLine();
    } else if (this.raceState === 'countdown') {
      // Idle rev engine
      this.updatePlayerIdle(delta);
    }

    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - delta * 2.5);
    }
    if (this.notificationTimer > 0) {
      this.notificationTimer -= delta;
      if (this.notificationTimer <= 0) {
        this.activeNotification = null;
      }
    }

    this.updateVisualEffects(delta);
    this.updateCamera(delta);

    this.hudUpdateTimer += delta;
    if (this.hudUpdateTimer >= 0.06) {
      this.hudUpdateTimer = 0;
      this.updateHud();
    }

    this.renderer.render(this.scene, this.camera);
  };

  private showNotification(text: string, subtext?: string, type: string = 'near_miss') {
    this.activeNotification = { text, subtext, type };
    this.notificationTimer = 2.2;
  }

  private checkNearMisses(delta: number) {
    if (this.currentSpeedMps < 15) return; // Must be driving fast (> 54 km/h) for near miss

    // 1. Check rivals
    this.opponents.forEach((opp) => {
      const cooldownKey = `opp_${opp.id}`;
      const lastTrigger = this.nearMissCooldowns[cooldownKey] || -10;
      if (this.raceElapsedTime - lastTrigger < 3.0) return;

      const dist = this.playerPos.distanceTo(opp.position);
      // Sweet spot for Near Miss: close pass (between 1.7m and 3.2m)
      if (dist >= 1.6 && dist <= 3.2) {
        this.triggerNearMiss(cooldownKey);
      }
    });

    // 2. Check traffic cars
    this.obstacles.forEach((obs) => {
      if (obs.type !== 'traffic_car' || obs.hit) return;
      const cooldownKey = `obs_${obs.id}`;
      const lastTrigger = this.nearMissCooldowns[cooldownKey] || -10;
      if (this.raceElapsedTime - lastTrigger < 3.0) return;

      const dist = this.playerPos.distanceTo(obs.position);
      if (dist >= 1.6 && dist <= 3.2) {
        this.triggerNearMiss(cooldownKey);
      }
    });
  }

  private triggerNearMiss(cooldownKey: string) {
    this.nearMissCooldowns[cooldownKey] = this.raceElapsedTime;

    // Check combo timeout (4.0s)
    if (this.raceElapsedTime - this.lastNearMissTime < 4.0) {
      this.nearMissCombo = Math.min(8, this.nearMissCombo + 1);
    } else {
      this.nearMissCombo = 1;
    }
    this.lastNearMissTime = this.raceElapsedTime;
    this.nearMissCount++;

    const bonus = 50 * this.nearMissCombo;
    this.nearMissBonusCoins += bonus;

    // Instant nitro reward
    this.currentNitro = Math.min(100, this.currentNitro + 16);

    // Audio & tactile feedback
    soundManager.playNearMissCombo(this.nearMissCombo);
    if (this.settings.vibration && navigator.vibrate) {
      navigator.vibrate(40);
    }
    this.cameraShake = 0.08;

    const sub = this.nearMissCombo > 1
      ? `COMBO x${this.nearMissCombo} · +16% NITRO REFILL`
      : '+16% NITRO REFILL';
    this.showNotification(`NEAR MISS +${bonus}!`, sub, 'near_miss');
  }

  private checkObstacles(delta: number) {
    this.obstacles.forEach((obs) => {
      // Advance traffic cars along spline
      if (obs.type === 'traffic_car' && !obs.hit) {
        obs.progress = Math.min(0.99, obs.progress + (obs.speedMps * delta) / this.trackData.trackLength);
        const curvePt = this.trackData.curve.getPointAt(obs.progress);
        const curveTan = this.trackData.curve.getTangentAt(obs.progress).normalize();
        const curveNorm = new THREE.Vector3().crossVectors(curveTan, new THREE.Vector3(0, 1, 0)).normalize();
        const pos = curvePt.clone().addScaledVector(curveNorm, obs.laneOffset);
        pos.y = curvePt.y;
        obs.position.copy(pos);
        obs.mesh.position.copy(pos);
        obs.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), curveTan);
      }

      if (!obs.hit) {
        const d = this.playerPos.distanceTo(obs.position);
        if (d < obs.radius) {
          obs.hit = true;
          soundManager.playObstacleHit();

          if (this.settings.vibration && navigator.vibrate) {
            navigator.vibrate(70);
          }
          this.cameraShake = 0.16;

          // Durability reduces speed loss
          const durabilityFactor = (this.stats.durability || 5) * 0.6;
          const penalty = Math.max(3, 11 - durabilityFactor);
          this.currentSpeedMps = Math.max(0, this.currentSpeedMps - penalty);

          // Knock obstacle out of the way
          obs.mesh.position.y += 0.8;
          obs.mesh.rotation.x += 1.2;
          obs.mesh.position.x += (Math.random() - 0.5) * 2;
        }
      }
    });
  }

  private checkNitroPickups(delta: number) {
    this.nitroPickups.forEach((np) => {
      if (!np.collected) {
        np.mesh.rotation.y += delta * 3.5;
        if (this.playerPos.distanceTo(np.position) < 3.4) {
          np.collected = true;
          np.mesh.visible = false;
          this.currentNitro = Math.min(100, this.currentNitro + 40);
          soundManager.playNitroPickup();

          if (this.settings.vibration && navigator.vibrate) {
            navigator.vibrate(50);
          }
          this.showNotification('NITRO BOOST +40%!', 'SURGE TANK COLLECTED', 'nitro');
        }
      }
    });
  }

  private updatePlayerIdle(delta: number) {
    // Engine idle rumble
    soundManager.updateEngine(15, this.stats.topSpeed, false, false);
    // Slight wheel spin
    this.playerRig.wheelMeshes.forEach(w => w.rotation.x += delta * 0.5);
  }

  private updatePlayerPhysics(delta: number) {
    const maxSpeedMps = this.stats.topSpeed / 3.6;
    const accelRate = 7.0 + this.stats.acceleration * 1.8;
    const brakeRate = 18.0 + this.stats.braking * 2.5;
    const naturalDecel = 3.5;
    const maxReverseMps = -12;

    // Nitro handling
    if (this.inputs.nitro && this.currentNitro > 0 && this.inputs.accelerate) {
      this.isNitroActive = true;
      this.currentNitro = Math.max(0, this.currentNitro - delta * 25);
      if (this.settings.vibration && navigator.vibrate && Math.random() < 0.2) {
        navigator.vibrate(30);
      }
    } else {
      this.isNitroActive = false;
      // Slow passive nitro recharge
      this.currentNitro = Math.min(100, this.currentNitro + delta * (4 + this.stats.nitro * 0.8));
    }

    soundManager.setNitroActive(this.isNitroActive);

    // Acceleration & Braking with Boost Pad Support
    const padBoost = this.boostPadTimer > 0 ? 1.35 : 1.0;
    const nitroBoost = this.isNitroActive ? (1.35 + this.stats.nitro * 0.05) : 1.0;
    const effectiveMaxSpeed = maxSpeedMps * (this.isNitroActive ? 1.25 : 1.0) * padBoost;

    if (this.inputs.accelerate) {
      const accelMultiplier = nitroBoost * (this.boostPadTimer > 0 ? 1.6 : 1.0);
      this.currentSpeedMps = Math.min(effectiveMaxSpeed, this.currentSpeedMps + accelRate * accelMultiplier * delta);
    } else if (this.inputs.brakeReverse) {
      if (this.currentSpeedMps > 0.5) {
        this.currentSpeedMps = Math.max(0, this.currentSpeedMps - brakeRate * delta);
      } else {
        this.currentSpeedMps = Math.max(maxReverseMps, this.currentSpeedMps - 8 * delta);
      }
    } else {
      // Coasting deceleration
      if (this.currentSpeedMps > 0) {
        this.currentSpeedMps = Math.max(0, this.currentSpeedMps - naturalDecel * delta);
      } else if (this.currentSpeedMps < 0) {
        this.currentSpeedMps = Math.min(0, this.currentSpeedMps + naturalDecel * delta);
      }
    }

    // Heated Brake Rotors glowing under heavy braking
    if (this.inputs.brakeReverse && this.currentSpeedMps > 8) {
      this.playerRig.brakeDiscMaterials.forEach(m => {
        m.emissive.setHex(0xff3300);
        m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, 2.4, delta * 8);
      });
    } else {
      this.playerRig.brakeDiscMaterials.forEach(m => {
        m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, 0, delta * 4);
      });
    }

    // Steering & Drift Physics
    const speedRatio = Math.abs(this.currentSpeedMps) / maxSpeedMps;
    // Lower speed sensitivity vs high speed stability + user sensitivity setting
    const sensitivityMultiplier = this.settings.steeringSensitivity || 1.0;
    const steerSensitivity = (1.8 + this.stats.handling * 0.16 - speedRatio * 0.4) * sensitivityMultiplier;
    let targetSteer = 0;

    if (this.inputs.steerLeft) targetSteer += 1;
    if (this.inputs.steerRight) targetSteer -= 1;

    // Smooth knuckle turning
    this.currentSteerAngle = THREE.MathUtils.lerp(this.currentSteerAngle, targetSteer * 0.55, delta * 12);
    this.playerRig.frontSteerKnuckles.forEach(k => k.rotation.y = this.currentSteerAngle);

    // Apply heading yaw
    if (Math.abs(this.currentSpeedMps) > 0.2) {
      const turnSign = this.currentSpeedMps >= 0 ? 1 : -1;
      const turnAmount = this.currentSteerAngle * steerSensitivity * (0.6 + speedRatio * 0.8) * delta * turnSign;
      this.playerHeading += turnAmount;

      // Drift calculation
      if (Math.abs(targetSteer) > 0.5 && speedRatio > 0.45 && (this.inputs.brakeReverse || this.isNitroActive)) {
        this.driftFactor = THREE.MathUtils.lerp(this.driftFactor, 1.0, delta * 8);
        this.driftMeters += Math.abs(this.currentSpeedMps) * delta;
        if (this.settings.vibration && navigator.vibrate && Math.random() < 0.15) {
          navigator.vibrate(20);
        }
      } else {
        this.driftFactor = THREE.MathUtils.lerp(this.driftFactor, 0.0, delta * 6);
      }
    } else {
      this.driftFactor = 0;
    }

    soundManager.setDriftIntensity(this.driftFactor);

    // Update body roll and pitch
    this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, -this.currentSteerAngle * speedRatio * 0.18, delta * 10);
    const accelPitch = this.inputs.accelerate ? 0.04 : this.inputs.brakeReverse ? -0.06 : 0;
    this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, accelPitch, delta * 8);

    // Move along heading vector with drift slip
    const moveDir = new THREE.Vector3(Math.sin(this.playerHeading), 0, Math.cos(this.playerHeading));
    if (this.driftFactor > 0.1) {
      const slipDir = new THREE.Vector3(Math.cos(this.playerHeading), 0, -Math.sin(this.playerHeading));
      moveDir.addScaledVector(slipDir, -this.currentSteerAngle * this.driftFactor * 0.35).normalize();
    }

    this.playerPos.addScaledVector(moveDir, this.currentSpeedMps * delta);

    // Project player onto track elevation
    this.updateTrackPositionProgress();

    // Position player rig
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.set(this.currentPitch, this.playerHeading, this.currentRoll);

    // Rotate wheels
    const wheelRotSpeed = (this.currentSpeedMps / 0.38) * delta;
    this.playerRig.wheelMeshes.forEach(w => w.rotation.x += wheelRotSpeed);

    // Brake lights
    this.playerRig.taillightMaterial.emissiveIntensity = this.inputs.brakeReverse ? 2.5 : 0.6;

    // Nitro exhaust flames
    this.playerRig.nitroFlames.forEach(flame => {
      flame.visible = this.isNitroActive;
      if (this.isNitroActive) {
        const flicker = 0.8 + Math.random() * 0.4;
        flame.scale.set(flicker, flicker, flicker * 1.5);
      }
    });

    // Sound updates
    const speedKmh = Math.abs(this.currentSpeedMps * 3.6);
    soundManager.updateEngine(speedKmh, this.stats.topSpeed, this.inputs.accelerate, this.isNitroActive);
  }

  private updateTrackPositionProgress() {
    // Find closest point on spline to calculate progress and keep car on road elevation
    const curve = this.trackData.curve;
    // Sample around current progress window [progress - 0.05, progress + 0.05]
    let bestT = this.playerProgress;
    let bestDistSq = Infinity;
    const windowStart = Math.max(0, this.playerProgress - 0.04);
    const windowEnd = Math.min(1.0, this.playerProgress + 0.06);

    for (let t = windowStart; t <= windowEnd; t += 0.003) {
      const pt = curve.getPointAt(t);
      const dSq = pt.distanceToSquared(this.playerPos);
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestT = t;
      }
    }

    this.playerProgress = Math.max(this.playerProgress, bestT);

    // Conform player elevation to track surface
    const trackPoint = curve.getPointAt(this.playerProgress);
    this.playerPos.y = THREE.MathUtils.lerp(this.playerPos.y, trackPoint.y, 0.25);

    // Off-road penalty if player drifts too far outside track width
    const trackTan = curve.getTangentAt(this.playerProgress).normalize();
    const trackNorm = new THREE.Vector3().crossVectors(trackTan, new THREE.Vector3(0, 1, 0)).normalize();
    const distToCenter = Math.abs(new THREE.Vector3().subVectors(this.playerPos, trackPoint).dot(trackNorm));
    const halfWidth = this.trackData.trackWidth / 2;

    if (distToCenter > halfWidth) {
      // Off-road grass/dirt drag
      this.currentSpeedMps = Math.max(0, this.currentSpeedMps - 8.0 * (1 / 60));
      // Subtle bump
      this.playerPos.y += (Math.random() - 0.5) * 0.04;
    }
  }

  private updateOpponents(delta: number) {
    const curve = this.trackData.curve;

    this.opponents.forEach((opp, idx) => {
      // Accelerate towards target speed with slight rubber-banding
      const playerSpeed = this.currentSpeedMps;
      const progressDiff = this.playerProgress - opp.progress;

      // Smart rubber banding so races stay thrilling
      let speedFactor = 1.0;
      if (progressDiff > 0.05) {
        // Opponent is behind player -> slight boost
        speedFactor = 1.08;
      } else if (progressDiff < -0.05) {
        // Opponent is far ahead -> moderate pacing
        speedFactor = 0.94;
      }

      const target = opp.maxSpeedMps * speedFactor;
      opp.speedMps = THREE.MathUtils.lerp(opp.speedMps, target, delta * 1.5);

      // Advance progress on spline
      const deltaProgress = (opp.speedMps * delta) / this.trackData.trackLength;
      opp.progress = Math.min(1.0, opp.progress + deltaProgress);

      // Follow spline with lane offset
      const splinePt = curve.getPointAt(opp.progress);
      const splineTan = curve.getTangentAt(opp.progress).normalize();
      const splineNorm = new THREE.Vector3().crossVectors(splineTan, new THREE.Vector3(0, 1, 0)).normalize();

      // Weave slightly for dynamic racing feel
      const weaveOffset = Math.sin(this.raceElapsedTime * 1.2 + idx * 2.0) * 1.2;
      const finalOffset = opp.laneOffset + weaveOffset;

      const oppPos = splinePt.clone().addScaledVector(splineNorm, finalOffset);
      oppPos.y = splinePt.y;

      opp.position.copy(oppPos);
      opp.rig.root.position.copy(oppPos);

      const heading = Math.atan2(splineTan.x, splineTan.z);
      opp.rotation.set(0, heading, 0);
      opp.rig.root.rotation.copy(opp.rotation);

      // Rotate wheels
      const wheelRot = (opp.speedMps / 0.38) * delta;
      opp.rig.wheelMeshes.forEach(w => w.rotation.x += wheelRot);
    });
  }

  private checkBoostPads(delta: number) {
    if (this.boostPadTimer > 0) {
      this.boostPadTimer -= delta;
    }

    this.boostPads.forEach(pad => {
      // Pulse animation
      const padMesh = pad.mesh.children[0] as THREE.Mesh;
      if (padMesh && padMesh.material) {
        (padMesh.material as THREE.MeshBasicMaterial).opacity = 0.65 + Math.sin(this.raceElapsedTime * 10) * 0.25;
      }

      if (this.playerPos.distanceTo(pad.position) < 4.8) {
        if (this.boostPadTimer <= 0) {
          this.boostPadTimer = 2.2;
          soundManager.playCheckpoint();
          if (this.settings.vibration && navigator.vibrate) {
            navigator.vibrate(60);
          }
        }
      }
    });
  }

  private checkCollectibles() {
    this.coins.forEach(coin => {
      if (!coin.collected) {
        // Rotate coin continuously
        coin.mesh.rotation.y += 0.05;

        // Check distance to player
        if (this.playerPos.distanceTo(coin.position) < 3.2) {
          coin.collected = true;
          coin.mesh.visible = false;
          this.coinsCollected++;
          soundManager.playCoin();
        }
      }
    });
  }

  private checkCheckpoints() {
    this.checkpoints.forEach(cp => {
      if (!cp.passed) {
        if (this.playerProgress >= cp.progress || this.playerPos.distanceTo(cp.position) < 8.0) {
          cp.passed = true;
          this.checkpointsPassed++;
          soundManager.playCheckpoint();
          // Change ring color to green
          (cp.mesh.children[0] as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        }
      }
    });
  }

  private checkFinishLine() {
    if (this.playerProgress >= 0.985 || this.playerPos.distanceTo(this.trackData.finishArch.position) < 6.0) {
      this.finishRace();
    }
  }

  private finishRace() {
    if (this.raceState === 'finished') return;
    this.raceState = 'finished';

    soundManager.stopEngine();
    soundManager.playWin();

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    // Determine position
    const racers = [{ progress: this.playerProgress, isPlayer: true }, ...this.opponents.map(o => ({ progress: o.progress, isPlayer: false }))];
    racers.sort((a, b) => b.progress - a.progress);
    const playerRank = racers.findIndex(r => r.isPlayer) + 1;

    // Calculate stars
    let stars = 1;
    if (playerRank === 1 && this.raceElapsedTime <= this.level.targetTime) {
      stars = 3;
    } else if (playerRank <= 2 && this.raceElapsedTime <= this.level.twoStarTime) {
      stars = 2;
    }

    // Calculate coins breakdown
    const baseReward = this.level.coinReward;
    const positionBonus = playerRank === 1 ? Math.round(baseReward * 0.5) : playerRank === 2 ? Math.round(baseReward * 0.25) : 0;
    const timeBonus = this.raceElapsedTime < this.level.targetTime ? 120 : 0;
    const collectedCoinsBonus = this.coinsCollected * 25;
    const nearMissBonus = this.nearMissBonusCoins;
    const totalCoins = baseReward + positionBonus + timeBonus + collectedCoinsBonus + nearMissBonus;

    const result: RaceResult = {
      completed: true,
      won: playerRank === 1,
      time: Math.round(this.raceElapsedTime * 100) / 100,
      targetTime: this.level.targetTime,
      stars,
      position: playerRank,
      totalRacers: racers.length,
      nearMisses: this.nearMissCount,
      driftMeters: Math.round(this.driftMeters),
      isBossRace: this.level.id === 5,
      coinsEarned: {
        base: baseReward,
        positionBonus,
        timeBonus,
        nearMissBonus,
        collectedCoins: collectedCoinsBonus,
        total: totalCoins
      },
      milestoneUnlocked: this.level.milestoneReward
    };

    setTimeout(() => {
      this.onRaceFinish(result);
    }, 1200);
  }

  private updateVisualEffects(delta: number) {
    // Underglow pulsing
    if (this.playerRig.underglow) {
      (this.playerRig.underglow.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(this.raceElapsedTime * 5) * 0.2;
    }
  }

  private updateCamera(delta: number) {
    const cameraMode = this.settings.cameraView;

    let targetCamDist = 7.5;
    let targetCamHeight = 2.8;
    let fov = 65;

    if (cameraMode === 'close') {
      targetCamDist = 5.2;
      targetCamHeight = 2.0;
      fov = 68;
    } else if (cameraMode === 'hood') {
      targetCamDist = -0.4;
      targetCamHeight = 1.35;
      fov = 75;
    }

    // Dynamic FOV widening on high speed & nitro
    const speedRatio = Math.abs(this.currentSpeedMps) / (this.stats.topSpeed / 3.6);
    fov += speedRatio * 8 + (this.isNitroActive ? 12 : 0);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, fov, 0.1);
    this.camera.updateProjectionMatrix();

    // Camera shake offset
    const shakeX = (Math.random() - 0.5) * (this.cameraShake + (this.isNitroActive ? 0.04 : 0));
    const shakeY = (Math.random() - 0.5) * (this.cameraShake + (this.isNitroActive ? 0.04 : 0));

    if (cameraMode === 'hood') {
      // Bumper / Hood Cam
      const forward = new THREE.Vector3(Math.sin(this.playerHeading), 0, Math.cos(this.playerHeading));
      const hoodPos = this.playerPos.clone().addScaledVector(forward, targetCamDist);
      hoodPos.y += targetCamHeight + shakeY;
      hoodPos.x += shakeX;
      this.camera.position.copy(hoodPos);

      const lookTarget = hoodPos.clone().addScaledVector(forward, 20);
      lookTarget.y -= 0.5;
      this.camera.lookAt(lookTarget);
    } else {
      // Chase Cam
      const backVector = new THREE.Vector3(-Math.sin(this.playerHeading), 0, -Math.cos(this.playerHeading));
      const desiredPos = this.playerPos.clone().addScaledVector(backVector, targetCamDist);
      desiredPos.y += targetCamHeight + shakeY;
      desiredPos.x += shakeX;

      // Smooth camera damping
      this.camera.position.lerp(desiredPos, Math.min(1.0, delta * 10));

      const lookTarget = this.playerPos.clone();
      lookTarget.y += 1.2;
      // Slight forward look ahead
      const forwardVector = new THREE.Vector3(Math.sin(this.playerHeading), 0, Math.cos(this.playerHeading));
      lookTarget.addScaledVector(forwardVector, 6.0);
      this.camera.lookAt(lookTarget);
    }
  }

  private updateHud() {
    const speedKmh = Math.round(Math.abs(this.currentSpeedMps * 3.6));
    const speedRatio = Math.min(1, speedKmh / this.stats.topSpeed);
    const rpm = Math.round(1200 + ((speedRatio * 5) % 1) * 6500 + speedRatio * 1500);

    // Compute player rank against opponents
    const racers = [{ progress: this.playerProgress, isPlayer: true }, ...this.opponents.map(o => ({ progress: o.progress, isPlayer: false }))];
    racers.sort((a, b) => b.progress - a.progress);
    const currentRank = racers.findIndex(r => r.isPlayer) + 1;

    this.onUpdateHud({
      speedKmh,
      rpm,
      nitroPercent: Math.round(this.currentNitro),
      elapsedTime: this.raceElapsedTime,
      position: currentRank,
      totalRacers: racers.length,
      progressPercent: Math.min(100, Math.round(this.playerProgress * 100)),
      coinsCollected: this.coinsCollected,
      totalCoins: this.coins.length,
      checkpointsPassed: this.checkpointsPassed,
      totalCheckpoints: this.checkpoints.length,
      headlightsOn: this.headlightsOn,
      nearMissCount: this.nearMissCount,
      nearMissCombo: this.nearMissCombo,
      driftMeters: Math.round(this.driftMeters),
      isBossRace: this.level.id === 5,
      activeNotification: this.activeNotification
    });
  }

  public headlightsOn = true;

  public toggleHeadlights(): boolean {
    this.headlightsOn = !this.headlightsOn;
    if (this.playerRig) {
      this.playerRig.headlightBeams.forEach(b => {
        b.visible = this.headlightsOn;
      });
      this.playerRig.headlightMaterial.emissiveIntensity = this.headlightsOn ? 1.4 : 0.05;
    }
    soundManager.playClick();
    return this.headlightsOn;
  }

  public areHeadlightsOn(): boolean {
    return this.headlightsOn;
  }

  public honkHorn() {
    soundManager.playHornShort();
    // Swerve nearby rival AI slightly if honked from behind
    this.opponents.forEach(opp => {
      if (this.playerPos.distanceTo(opp.position) < 14) {
        opp.laneOffset += (Math.random() > 0.5 ? 1.5 : -1.5);
      }
    });
  }

  public startHorn() {
    soundManager.startHorn();
    this.opponents.forEach(opp => {
      if (this.playerPos.distanceTo(opp.position) < 16) {
        opp.laneOffset += (Math.random() > 0.5 ? 1.2 : -1.2);
      }
    });
  }

  public stopHorn() {
    soundManager.stopHorn();
  }

  public setCameraView(view: 'chase' | 'close' | 'hood') {
    this.settings.cameraView = view;
  }

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    soundManager.stopEngine();
    soundManager.stopMusic();

    try {
      this.renderer.dispose();
      this.container.innerHTML = '';
    } catch {
      // ignore
    }
  }
}
