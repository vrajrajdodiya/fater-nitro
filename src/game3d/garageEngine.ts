/**
 * Apex Nitro 3D - 3D Showroom / Garage Engine
 */

import * as THREE from 'three';
import { buildCarMesh, CarVisualRig } from './carMeshBuilder';

export class GarageEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;

  private currentRig: CarVisualRig | null = null;
  private carGroup: THREE.Group;
  private isDragging = false;
  private previousMouseX = 0;
  private targetRotationY = 0;
  private autoRotate = true;

  constructor(container: HTMLElement, carId: string, colorHex: string) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.carGroup = new THREE.Group();
    this.scene.add(this.carGroup);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(5.5, 2.5, 6.5);
    this.camera.lookAt(0, 0.6, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.borderStyle = 'dotted';
    this.renderer.domElement.style.borderColor = 'rgba(6, 182, 212, 0.35)';
    this.renderer.domElement.style.borderWidth = '1.5px';
    this.renderer.domElement.style.backgroundColor = '#000000';
    this.renderer.domElement.style.borderRadius = '1rem';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';

    container.replaceChildren(this.renderer.domElement);

    this.initShowroom();
    this.loadCar(carId, colorHex);
    this.initInteraction();

    window.addEventListener('resize', this.handleResize);
    this.animate();
  }

  private initShowroom() {
    // Showroom studio lighting
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    this.scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.5);
    rimLight.position.set(-6, 4, -6);
    this.scene.add(rimLight);

    const fillLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(fillLight);

    // Reflective turntable pedestal
    const pedestalGeo = new THREE.CylinderGeometry(4.2, 4.4, 0.4, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.2;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    // Glowing neon ring around pedestal
    const ringGeo = new THREE.TorusGeometry(4.2, 0.05, 12, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.01;
    this.scene.add(ring);
  }

  public loadCar(carId: string, colorHex: string) {
    if (this.currentRig) {
      this.carGroup.remove(this.currentRig.root);
    }
    this.currentRig = buildCarMesh(carId, colorHex);
    this.carGroup.add(this.currentRig.root);
  }

  public updateColor(colorHex: string) {
    if (this.currentRig) {
      this.currentRig.bodyMaterial.color.set(colorHex);
    }
  }

  private initInteraction() {
    const el = this.renderer.domElement;

    const onPointerDown = (clientX: number) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.previousMouseX = clientX;
    };

    const onPointerMove = (clientX: number) => {
      if (!this.isDragging) return;
      const deltaX = clientX - this.previousMouseX;
      this.targetRotationY += deltaX * 0.008;
      this.previousMouseX = clientX;
    };

    const onPointerUp = () => {
      this.isDragging = false;
      // Resume slow auto-rotate after 3s of inactivity
      setTimeout(() => {
        if (!this.isDragging) this.autoRotate = true;
      }, 3000);
    };

    el.addEventListener('mousedown', (e) => onPointerDown(e.clientX));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX));
    window.addEventListener('mouseup', onPointerUp);

    el.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) onPointerDown(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) onPointerMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', onPointerUp);
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);

    if (this.autoRotate) {
      this.targetRotationY += 0.005;
    }

    this.carGroup.rotation.y = THREE.MathUtils.lerp(this.carGroup.rotation.y, this.targetRotationY, 0.1);

    this.renderer.render(this.scene, this.camera);
  };

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
    try {
      this.renderer.dispose();
      this.container.innerHTML = '';
    } catch {
      // ignore
    }
  }
}
