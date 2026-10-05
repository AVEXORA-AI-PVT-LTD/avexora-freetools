"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Hero3DCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 18;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for objects
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Core: High-tech Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(4.2, 1);
    
    // Wireframe overlay
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xff6a00,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coreWireframe = new THREE.Mesh(coreGeo, wireframeMat);
    mainGroup.add(coreWireframe);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(2.5, 24, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    mainGroup.add(innerMesh);

    // 2. Orbital Rings
    const ringGeo1 = new THREE.TorusGeometry(6.2, 0.04, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xff6a00,
      transparent: true,
      opacity: 0.6,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(7.5, 0.03, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x111318,
      transparent: true,
      opacity: 0.3,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    mainGroup.add(ring2);

    // 3. Floating Matrix Nodes / Particle Field
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);

    const colorOrange = new THREE.Color(0xff6a00);
    const colorWhite = new THREE.Color(0xffffff);
    const colorBlack = new THREE.Color(0x222222);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 22;
      posArray[i + 1] = (Math.random() - 0.5) * 18;
      posArray[i + 2] = (Math.random() - 0.5) * 16;

      const pickColor = Math.random() > 0.4 ? colorOrange : (Math.random() > 0.5 ? colorWhite : colorBlack);
      colorsArray[i] = pickColor.r;
      colorsArray[i + 1] = pickColor.g;
      colorsArray[i + 2] = pickColor.b;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    mainGroup.add(particlesMesh);

    // Mouse Tracking for Parallax
    let targetX = 0;
    let targetY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    const onMouseMove = (event: MouseEvent) => {
      targetX = (event.clientX - windowHalfX) * 0.0008;
      targetY = (event.clientY - windowHalfY) * 0.0008;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;
    };

    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth idle rotations
      coreWireframe.rotation.y += 0.005;
      coreWireframe.rotation.x += 0.003;

      innerMesh.rotation.y -= 0.004;
      innerMesh.rotation.z += 0.002;

      ring1.rotation.z += 0.008;
      ring2.rotation.y += 0.005;

      particlesMesh.rotation.y += 0.001;

      // Mouse Parallax interpolation
      mainGroup.rotation.y += (targetX - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (targetY - mainGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      coreGeo.dispose();
      wireframeMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-75 sm:opacity-90 transition-opacity"
      aria-hidden="true"
    />
  );
};
