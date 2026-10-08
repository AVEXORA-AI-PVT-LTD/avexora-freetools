"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Categories3DCanvasProps {
  activeCategoryIndex: number;
}

export const Categories3DCanvas: React.FC<Categories3DCanvasProps> = ({ activeCategoryIndex }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const meshGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 450;
    const height = container.clientHeight || 450;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    meshGroupRef.current = group;

    // 1. Central Futuristic Cyber Geometric Core (Octahedron Lattice)
    const coreGeometry = new THREE.OctahedronGeometry(4.2, 2);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xf97316, // Orange 500
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(coreMesh);

    // Inner Glowing Nano-Core
    const innerGeometry = new THREE.IcosahedronGeometry(2.2, 0);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0xfbbf24, // Amber 400
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerMesh);



    // Mouse Tracking Parallax Handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotationRef.current = { x: y * 0.45, y: x * 0.45 };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Constant orbital rotation
      coreMesh.rotation.y += delta * 0.25;
      coreMesh.rotation.x += delta * 0.15;
      innerMesh.rotation.y -= delta * 0.4;
      innerMesh.rotation.z += delta * 0.2;

      // Smooth interpolation toward mouse target
      group.rotation.x += (targetRotationRef.current.x - group.rotation.x) * 0.05;
      group.rotation.y += (targetRotationRef.current.y - group.rotation.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Quick 3D rotation pulse whenever active category switches
  useEffect(() => {
    if (meshGroupRef.current) {
      meshGroupRef.current.rotation.y += 0.8;
      meshGroupRef.current.rotation.x += 0.4;
    }
  }, [activeCategoryIndex]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full pointer-events-none select-none opacity-85"
      aria-hidden="true"
    />
  );
};
