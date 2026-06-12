import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function AiChip({ position }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(s.clock.elapsedTime * 1.8) * 0.012;
    ref.current.scale.setScalar(pulse);
  });
  return (
    <group ref={ref} position={position}>
      <mesh><boxGeometry args={[1.3, 1.3, 0.28]} /><meshPhysicalMaterial color="#8f2020" roughness={0.2} metalness={0.6} clearcoat={1} /></mesh>
      <mesh position={[0, 0, 0.15]}><boxGeometry args={[1.26, 1.26, 0.02]} /><meshStandardMaterial color="#5a1515" roughness={0.3} /></mesh>
      {[[-0.48, 0.48], [0.48, 0.48], [-0.48, -0.48], [0.48, -0.48]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.17]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#e8c080" metalness={0.9} roughness={0.1} /></mesh>
      ))}
      <mesh position={[0, 0, 0.14]}><torusGeometry args={[0.72, 0.028, 8, 48]} /><meshStandardMaterial color="#ff6644" transparent opacity={0.4} emissive="#ff4422" emissiveIntensity={0.7} /></mesh>
      <mesh position={[0, 0, 0.16]}><boxGeometry args={[1.0, 0.04, 0.01]} /><meshStandardMaterial color="#e8c080" transparent opacity={0.6} /></mesh>
      <mesh position={[0, 0, 0.16]}><boxGeometry args={[0.04, 1.0, 0.01]} /><meshStandardMaterial color="#e8c080" transparent opacity={0.6} /></mesh>
    </group>
  );
}

function ReportScroll({ position }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(s.clock.elapsedTime * 0.6) * 0.14;
    ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.4) * 0.06;
  });
  return (
    <group ref={ref} position={[position[0], position[1], position[2]]} rotation={[0.1, 0.2, -0.08]}>
      <mesh><cylinderGeometry args={[0.32, 0.32, 1.7, 32]} /><meshPhysicalMaterial color="#f5ede0" roughness={0.55} clearcoat={0.3} /></mesh>
      <mesh position={[0, 0.87, 0]}><cylinderGeometry args={[0.36, 0.36, 0.09, 32]} /><meshStandardMaterial color="#e8d8c4" /></mesh>
      <mesh position={[0, -0.87, 0]}><cylinderGeometry args={[0.36, 0.36, 0.09, 32]} /><meshStandardMaterial color="#e8d8c4" /></mesh>
      {[-0.45, -0.15, 0.15, 0.45].map((y, i) => (
        <mesh key={i} position={[0.31, y, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.55 - i * 0.04, 0.05]} />
          <meshStandardMaterial color="#a06040" transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function CircuitBoard() {
  const groupRef = useRef();
  useFrame((s) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.25) * 0.2;
    groupRef.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.18) * 0.07;
  });

  const traces = useMemo(() => {
    const defs = [
      [[-1.8, 0], [1.8, 0]], [[0, -1.8], [0, 1.8]],
      [[-1.4, 0.6], [1.4, 0.6]], [[-1.4, -0.6], [1.4, -0.6]],
      [[0.6, -1.4], [0.6, 1.4]], [[-0.6, -1.4], [-0.6, 1.4]],
    ];
    return defs.map(([[x1, y1], [x2, y2]], i) => ({
      key: i,
      geo: new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, 0.62), new THREE.Vector3(x2, y2, 0.62)]),
    }));
  }, []);

  const pads = [[-1.4,0.6],[-1.4,-0.6],[1.4,0.6],[1.4,-0.6],[0.6,1.4],[-0.6,1.4],[0.6,-1.4],[-0.6,-1.4]];

  const pins = useMemo(() => {
    const out = [];
    [{ axis:"x", fixed:-2.15 },{ axis:"x", fixed:2.15 },{ axis:"y", fixed:-2.15 },{ axis:"y", fixed:2.15 }].forEach(({ axis, fixed }) => {
      for (let i = 0; i < 5; i++) { const t = -0.8 + i * 0.4; out.push(axis === "x" ? [fixed, t, 0.56] : [t, fixed, 0.56]); }
    });
    return out;
  }, []);

  return (
    <Float speed={1.0} floatIntensity={0.65} rotationIntensity={0.08}>
      <group ref={groupRef} position={[-1.2, -0.5, 0]}>
        <mesh><boxGeometry args={[4.4, 4.4, 1.1]} /><meshPhysicalMaterial color="#7a2020" roughness={0.35} metalness={0.55} clearcoat={0.6} /></mesh>
        {traces.map(({ geo, key }) => (<line key={key} geometry={geo}><lineBasicMaterial color="#e8c0a0" transparent opacity={0.5} /></line>))}
        {pads.map(([x, y], i) => (<mesh key={i} position={[x, y, 0.62]}><cylinderGeometry args={[0.09, 0.09, 0.04, 12]} /><meshStandardMaterial color="#e8c080" metalness={0.9} roughness={0.1} /></mesh>))}
        {pins.map((pos, i) => (<mesh key={i} position={pos}><boxGeometry args={[0.07, 0.26, 0.07]} /><meshStandardMaterial color="#c8a060" metalness={0.95} roughness={0.05} /></mesh>))}
        <AiChip position={[0.3, 0.2, 0.92]} />
        <ReportScroll position={[-0.9, 0.7, 1.3]} />
      </group>
    </Float>
  );
}

function Particles() {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(80 * 3);
    for (let i = 0; i < 80; i++) { arr[i*3]=(Math.random()-0.5)*14; arr[i*3+1]=(Math.random()-0.5)*10; arr[i*3+2]=(Math.random()-0.5)*6; }
    return arr;
  }, []);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.02; });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#cc3322" size={0.04} transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

function SceneRoot() {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const scroll = window.scrollY || 0;
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const p = scroll / max;
    ref.current.rotation.x += (p * 0.4 - ref.current.rotation.x) * 0.055;
    ref.current.rotation.y += (p * 0.25 - ref.current.rotation.y) * 0.055;
  });
  return (<group ref={ref}><Particles /><CircuitBoard /></group>);
}

export default function AnalyticsScene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 54 }} style={{ width:"100%", height:"100%", background:"transparent" }} gl={{ alpha:true, antialias:true }} dpr={Math.min(window.devicePixelRatio, 1.5)}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 7, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-4, -2, -2]} intensity={0.4} color="#ffcccc" />
      <pointLight position={[0, 3, 4]} intensity={1.0} color="#ff4422" />
      <pointLight position={[3, -2, 3]} intensity={0.6} color="#ffffff" />
      <SceneRoot />
    </Canvas>
  );
}

