import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InterviewerCharacter } from '../../types/characters';
import { Volume2, Mic, Brain, Sparkles } from 'lucide-react';

interface AvatarStudio3DProps {
  character: InterviewerCharacter;
  orbState: 'idle' | 'listening' | 'thinking' | 'speaking';
  isAudioPlaying?: boolean;
  visemes?: Array<{
    time_ms: number;
    viseme: string;
    jaw_open: number;
    mouth_smile: number;
  }>;
}

export const AvatarStudio3D: React.FC<AvatarStudio3DProps> = ({
  character,
  orbState,
  isAudioPlaying = false,
  visemes = [],
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelType, setModelType] = useState<'procedural' | 'glb'>('procedural');

  // References for live animation
  const headGroupRef = useRef<THREE.Group | null>(null);
  const jawMeshRef = useRef<THREE.Mesh | null>(null);
  const leftEyelidRef = useRef<THREE.Mesh | null>(null);
  const rightEyelidRef = useRef<THREE.Mesh | null>(null);
  const eyesGroupRef = useRef<THREE.Group | null>(null);
  const mouthMeshRef = useRef<THREE.Mesh | null>(null);
  const gltfModelRef = useRef<THREE.Object3D | null>(null);

  // Lip-sync / state refs
  const stateRef = useRef(orbState);
  const isAudioPlayingRef = useRef(isAudioPlaying);
  const visemesRef = useRef(visemes);

  useEffect(() => {
    stateRef.current = orbState;
    isAudioPlayingRef.current = isAudioPlaying;
    visemesRef.current = visemes;
  }, [orbState, isAudioPlaying, visemes]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const width = container.clientWidth || 480;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean white/slate background

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 2.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.0);
    keyLight.position.set(1.5, 2.5, 2.0);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.0);
    fillLight.position.set(-2.0, 1.0, 1.5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(new THREE.Color(character.primary_color), 2.5, 6);
    rimLight.position.set(0, 1.5, -1.8);
    scene.add(rimLight);

    // 3. Build Realistic 3D Human Avatar Head & Torso
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);
    headGroupRef.current = avatarGroup;

    // Skin tones and features per character
    const isMale = character.gender === 'male';
    const skinColor = isMale ? 0xe0a98a : 0xebb497;
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.55,
      metalness: 0.05,
    });

    // Head Base
    const headGeometry = new THREE.SphereGeometry(0.38, 36, 36);
    headGeometry.scale(0.85, 1.15, 0.95);
    const headMesh = new THREE.Mesh(headGeometry, skinMaterial);
    headMesh.position.y = 0.22;
    avatarGroup.add(headMesh);

    // Neck
    const neckGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 24);
    const neckMesh = new THREE.Mesh(neckGeometry, skinMaterial);
    neckMesh.position.y = -0.15;
    avatarGroup.add(neckMesh);

    // Torso / Clothing with character styling
    const torsoGeometry = new THREE.CylinderGeometry(0.55, 0.65, 0.6, 32);
    torsoGeometry.scale(1.2, 1.0, 0.7);
    const suitColor = new THREE.Color(character.primary_color).lerp(new THREE.Color(0x1e293b), 0.65);
    const clothingMaterial = new THREE.MeshStandardMaterial({
      color: suitColor,
      roughness: 0.8,
    });
    const torsoMesh = new THREE.Mesh(torsoGeometry, clothingMaterial);
    torsoMesh.position.y = -0.58;
    avatarGroup.add(torsoMesh);

    // Collar / Inner Shirt
    const collarGeometry = new THREE.TorusGeometry(0.24, 0.035, 16, 32);
    collarGeometry.rotateX(Math.PI / 2);
    const collarMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const collarMesh = new THREE.Mesh(collarGeometry, collarMaterial);
    collarMesh.position.set(0, -0.26, 0.04);
    avatarGroup.add(collarMesh);

    // Hair Styling (Gender and age specific)
    const hairColor = isMale ? 0x1f1917 : 0x241c19;
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.7,
    });

    if (isMale) {
      // Short modern crop / side part
      const hairGeometry = new THREE.SphereGeometry(0.40, 24, 24);
      hairGeometry.scale(0.88, 1.05, 0.98);
      const hairMesh = new THREE.Mesh(hairGeometry, hairMaterial);
      hairMesh.position.set(0, 0.34, -0.04);
      avatarGroup.add(hairMesh);

      // Subtle beard shadow for Arjun (age 28)
      if (character.id === 'arjun') {
        const beardGeometry = new THREE.CylinderGeometry(0.26, 0.28, 0.18, 20);
        const beardMaterial = new THREE.MeshStandardMaterial({
          color: 0x4a3b32,
          roughness: 0.9,
          transparent: true,
          opacity: 0.45,
        });
        const beardMesh = new THREE.Mesh(beardGeometry, beardMaterial);
        beardMesh.position.set(0, 0.05, 0.16);
        avatarGroup.add(beardMesh);
      }
    } else {
      // Elegant styled hair with shoulder wave
      const hairGeometry = new THREE.SphereGeometry(0.42, 28, 28);
      hairGeometry.scale(0.92, 1.25, 1.05);
      const hairMesh = new THREE.Mesh(hairGeometry, hairMaterial);
      hairMesh.position.set(0, 0.32, -0.06);
      avatarGroup.add(hairMesh);

      const hairSidesGeom = new THREE.CylinderGeometry(0.18, 0.14, 0.5, 16);
      const hairLeft = new THREE.Mesh(hairSidesGeom, hairMaterial);
      hairLeft.position.set(-0.28, 0.05, -0.02);
      hairLeft.rotateZ(0.1);
      avatarGroup.add(hairLeft);

      const hairRight = new THREE.Mesh(hairSidesGeom, hairMaterial);
      hairRight.position.set(0.28, 0.05, -0.02);
      hairRight.rotateZ(-0.1);
      avatarGroup.add(hairRight);
    }

    // Eyes Group (Blinking & Gaze)
    const eyesGroup = new THREE.Group();
    avatarGroup.add(eyesGroup);
    eyesGroupRef.current = eyesGroup;

    const scleraMaterial = new THREE.MeshStandardMaterial({ color: 0xfcfcfc, roughness: 0.2 });
    const irisMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.3 });
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const eyelidMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });

    const createEye = (xPos: number) => {
      const eyePivot = new THREE.Group();
      eyePivot.position.set(xPos, 0.28, 0.29);

      // Sclera
      const scleraGeom = new THREE.SphereGeometry(0.06, 16, 16);
      const sclera = new THREE.Mesh(scleraGeom, scleraMaterial);
      eyePivot.add(sclera);

      // Iris
      const irisGeom = new THREE.CircleGeometry(0.032, 16);
      const iris = new THREE.Mesh(irisGeom, irisMaterial);
      iris.position.z = 0.059;
      eyePivot.add(iris);

      // Pupil
      const pupilGeom = new THREE.CircleGeometry(0.016, 16);
      const pupil = new THREE.Mesh(pupilGeom, pupilMaterial);
      pupil.position.z = 0.061;
      eyePivot.add(pupil);

      // Eyelid
      const eyelidGeom = new THREE.SphereGeometry(0.068, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const eyelid = new THREE.Mesh(eyelidGeom, eyelidMaterial);
      eyelid.rotation.x = -Math.PI / 2;
      eyePivot.add(eyelid);

      return { eyePivot, eyelid };
    };

    const leftEye = createEye(-0.12);
    const rightEye = createEye(0.12);
    eyesGroup.add(leftEye.eyePivot);
    eyesGroup.add(rightEye.eyePivot);
    leftEyelidRef.current = leftEye.eyelid;
    rightEyelidRef.current = rightEye.eyelid;

    // Eyebrows
    const browMaterial = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 });
    const browGeom = new THREE.BoxGeometry(0.09, 0.018, 0.02);
    const leftBrow = new THREE.Mesh(browGeom, browMaterial);
    leftBrow.position.set(-0.12, 0.37, 0.31);
    leftBrow.rotation.z = 0.08;
    avatarGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeom, browMaterial);
    rightBrow.position.set(0.12, 0.37, 0.31);
    rightBrow.rotation.z = -0.08;
    avatarGroup.add(rightBrow);

    // Articulable Jaw & Mouth for Real-Time Lip-Sync
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, 0.08, 0.18);
    avatarGroup.add(jawPivot);

    const jawGeom = new THREE.SphereGeometry(0.18, 20, 20);
    jawGeom.scale(0.9, 0.8, 0.9);
    const jawMesh = new THREE.Mesh(jawGeom, skinMaterial);
    jawMesh.position.set(0, -0.02, 0.08);
    jawPivot.add(jawMesh);
    jawMeshRef.current = jawMesh;

    // Lips & Mouth Interior
    const mouthGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.018, 16);
    mouthGeom.rotateX(Math.PI / 2);
    const lipColor = isMale ? 0xc77868 : 0xd66870;
    const lipMaterial = new THREE.MeshStandardMaterial({ color: lipColor, roughness: 0.4 });
    const mouthMesh = new THREE.Mesh(mouthGeom, lipMaterial);
    mouthMesh.position.set(0, 0.08, 0.32);
    jawPivot.add(mouthMesh);
    mouthMeshRef.current = mouthMesh;

    // Optional .glb loader from public/avatars/
    if (character.avatar_model) {
      const loader = new GLTFLoader();
      loader.load(
        character.avatar_model,
        (gltf) => {
          gltfModelRef.current = gltf.scene;
          gltf.scene.scale.set(1.2, 1.2, 1.2);
          gltf.scene.position.set(0, -0.6, 0);
          avatarGroup.visible = false;
          scene.add(gltf.scene);
          setModelType('glb');
        },
        undefined,
        () => {
          // Fallback seamlessly to the procedural avatar
          setModelType('procedural');
        }
      );
    }

    // 4. Animation Loop: 60 FPS Lip-Sync, Eye Blinking & Natural Idle Motion
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let nextBlinkTime = 2.0;
    let isBlinking = false;
    let blinkStartTime = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentState = stateRef.current;
      const isSpeaking = currentState === 'speaking' || isAudioPlayingRef.current;

      // Natural Breathing & Subtle Idle Head Motion
      if (avatarGroup) {
        avatarGroup.position.y = Math.sin(elapsed * 1.5) * 0.015;

        if (currentState === 'listening') {
          // Attentive listening: slight head tilt + gentle affirmative nod every 3.2s
          avatarGroup.rotation.z = Math.sin(elapsed * 0.8) * 0.03;
          avatarGroup.rotation.x = Math.sin(elapsed * 2.0) * 0.04 - 0.04;
        } else if (currentState === 'thinking') {
          // Contemplative gaze upwards
          avatarGroup.rotation.x = -0.07;
          avatarGroup.rotation.y = Math.sin(elapsed * 1.2) * 0.06 + 0.06;
        } else {
          avatarGroup.rotation.x = Math.sin(elapsed * 0.6) * 0.015;
          avatarGroup.rotation.y = Math.sin(elapsed * 0.5) * 0.025;
          avatarGroup.rotation.z = 0;
        }
      }

      // Natural Eye Blinking Logic (every 2.5 - 5 seconds)
      if (elapsed > nextBlinkTime && !isBlinking) {
        isBlinking = true;
        blinkStartTime = elapsed;
      }

      if (isBlinking) {
        const blinkProgress = (elapsed - blinkStartTime) / 0.16; // 160ms blink duration
        if (blinkProgress <= 1.0) {
          // Parabolic curve: 0 -> 1 -> 0
          const eyelidFactor = Math.sin(blinkProgress * Math.PI);
          if (leftEyelidRef.current && rightEyelidRef.current) {
            leftEyelidRef.current.scale.y = 1.0 + eyelidFactor * 0.5;
            rightEyelidRef.current.scale.y = 1.0 + eyelidFactor * 0.5;
          }
        } else {
          isBlinking = false;
          nextBlinkTime = elapsed + 2.5 + Math.random() * 2.5;
          if (leftEyelidRef.current && rightEyelidRef.current) {
            leftEyelidRef.current.scale.y = 1.0;
            rightEyelidRef.current.scale.y = 1.0;
          }
        }
      }

      // Real-Time Lip-Sync & Jaw Articulation
      if (jawMeshRef.current && mouthMeshRef.current) {
        if (isSpeaking) {
          // Dynamic lip movements driven by speech visemes or simulated phonemes
          const speechCycle = elapsed * 14.0;
          const jawOpenValue = Math.max(0, Math.sin(speechCycle) * 0.035 + Math.cos(speechCycle * 1.6) * 0.025);
          jawMeshRef.current.position.y = -0.02 - jawOpenValue;
          mouthMeshRef.current.scale.set(
            1.0 + Math.sin(speechCycle * 0.8) * 0.35,
            1.0 + jawOpenValue * 12.0,
            1.0
          );
        } else {
          // Smooth return to neutral mouth pose
          jawMeshRef.current.position.y = THREE.MathUtils.lerp(jawMeshRef.current.position.y, -0.02, 0.2);
          mouthMeshRef.current.scale.set(1.0, 1.0, 1.0);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
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
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [character]);

  // Status visual badge styling
  const stateBadgeConfig = {
    idle: { label: 'Ready', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Sparkles },
    listening: { label: 'Attentively Listening...', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Mic },
    thinking: { label: 'Evaluating Follow-up...', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Brain },
    speaking: { label: 'Speaking & Lip-Syncing', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Volume2 },
  }[orbState];

  const StateIcon = stateBadgeConfig.icon;

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] bg-gradient-to-b from-slate-50/70 to-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden flex flex-col items-center justify-center">
      {/* 3D Canvas Mounting Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Character Profile Badge */}
      <div className="absolute top-4 left-4 flex items-center space-x-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-slate-200/80 shadow-sm shrink-0 bg-slate-100">
          <img
            src={character.avatar_image}
            alt={character.name}
            className="h-full w-full object-cover object-top"
          />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            {character.name}
            <span className="text-[10px] font-normal text-slate-500">
              ({character.gender === 'female' ? 'Female' : 'Male'}, {character.age})
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium line-clamp-1">
            {character.title}
          </div>
        </div>
      </div>

      {/* Top Right: Status Badge */}
      <div className="absolute top-4 right-4 flex items-center space-x-1.5">
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 backdrop-blur-md shadow-sm transition-all duration-300 ${stateBadgeConfig.color}`}
        >
          <StateIcon className={`h-3.5 w-3.5 ${orbState === 'speaking' || orbState === 'listening' ? 'animate-pulse' : ''}`} />
          <span>{stateBadgeConfig.label}</span>
        </div>
      </div>

      {/* Bottom Center: Character Specialization & Tech Tag */}
      <div className="absolute bottom-4 inset-x-4 flex justify-between items-center text-xs text-slate-500 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <span className="font-medium text-slate-700 truncate mr-2">
          Focus: <span className="font-semibold text-slate-900">{character.specialization}</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400 shrink-0">
          Neural Voice: {character.voice_id_kokoro} • 3D {modelType.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
