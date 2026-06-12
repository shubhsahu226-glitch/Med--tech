import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/* ── Capsule ── */
function Capsule({ position, rotation, scale, phase = 0, floatSpeed = 1.5 }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.3 + phase) * 0.6;
  });
  return (
    <Float speed={floatSpeed} floatIntensity={1.5} rotationIntensity={0.18}>
      <group ref={ref} position={position} rotation={rotation} scale={[scale, scale, scale]}>
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#cc2222" roughness={0.06} metalness={0.14} clearcoat={1} reflectivity={0.98} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.74, 32]} />
          <meshPhysicalMaterial color="#cc2222" roughness={0.06} metalness={0.14} clearcoat={1} reflectivity={0.98} />
        </mesh>
        <mesh position={[0, -0.185, 0]}>
          <torusGeometry args={[0.39, 0.02, 10, 32]} />
          <meshPhysicalMaterial color="#cccccc" roughness={0.1} metalness={0.75} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.74, 32]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} metalness={0.05} clearcoat={1} reflectivity={1} />
        </mesh>
        <mesh position={[0, -0.92, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} metalness={0.05} clearcoat={1} reflectivity={1} />
        </mesh>
        {/* shine */}
        <mesh position={[-0.1, 0.52, 0.33]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#ff9999" transparent opacity={0.35} roughness={0} />
        </mesh>
      </group>
    </Float>
  );
}

/* ── DNA helix ── */
function DnaHelix({ position, height = 4, radius = 0.5, turns = 3, rungCount = 18, phase = 0, spinSpeed = 0.006 }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y += spinSpeed;
    ref.current.position.y = position[1] + Math.sin(s.clock.elapsedTime * 0.45 + phase) * 0.22;
    ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.3 + phase) * 0.05;
  });

  const { c1, c2, rungs } = useMemo(() => {
    const s1 = [], s2 = [], r = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = -height / 2 + t * height;
      const a = t * turns * Math.PI * 2;
      s1.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
      s2.push(new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius));
    }
    for (let i = 0; i < rungCount; i++) {
      const t = (i + 0.5) / rungCount;
      const y = -height / 2 + t * height;
      const a = t * turns * Math.PI * 2;
      r.push({
        p1: new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius),
        p2: new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius),
      });
    }
    return { c1: new THREE.CatmullRomCurve3(s1), c2: new THREE.CatmullRomCurve3(s2), rungs: r };
  }, [height, radius, turns, rungCount]);

  const mat1 = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#cc2222", roughness: 0.09, metalness: 0.2,
    clearcoat: 0.9, emissive: "#3a0000", emissiveIntensity: 0.15,
  }), []);
  const mat2 = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#e03030", roughness: 0.13, metalness: 0.14,
    clearcoat: 0.8, emissive: "#2a0000", emissiveIntensity: 0.12,
  }), []);

  return (
    <group ref={ref} position={[position[0], position[1], position[2]]}>
      <mesh><tubeGeometry args={[c1, 80, 0.055, 8, false]} /><primitive object={mat1} /></mesh>
      <mesh><tubeGeometry args={[c2, 80, 0.055, 8, false]} /><primitive object={mat2} /></mesh>
      {rungs.map(({ p1, p2 }, i) => {
        const mid = p1.clone().lerp(p2, 0.5);
        const dir = p2.clone().sub(p1);
        const len = dir.length(); // get length BEFORE normalizing
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), dir.clone().normalize()
        );
        return (
          <group key={i}>
            <mesh position={mid} quaternion={q}>
              <cylinderGeometry args={[0.028, 0.028, len, 6]} />
              <meshStandardMaterial color="#ee3333" transparent opacity={0.7} />
            </mesh>
            <mesh position={p1}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshPhysicalMaterial color={i % 2 === 0 ? "#cc2222" : "#ff5555"} clearcoat={1} roughness={0.08} />
            </mesh>
            <mesh position={p2}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshPhysicalMaterial color="#ff6666" clearcoat={1} roughness={0.08} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ── Molecule cluster ── */
function Molecule({ position, phase = 0 }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime + phase;
    ref.current.rotation.y = t * 0.35;
    ref.current.rotation.x = Math.sin(t * 0.28) * 0.3;
    ref.current.position.y = position[1] + Math.sin(t * 0.5) * 0.14;
  });
  const atoms = [
    { pos: [0, 0, 0],       r: 0.17, color: "#dd3333" },
    { pos: [0.55, 0.3, 0.1],  r: 0.11, color: "#f5bfbf" },
    { pos: [-0.5, 0.4, -0.1], r: 0.11, color: "#f5bfbf" },
    { pos: [0.3, -0.5, 0.2],  r: 0.10, color: "#f5bfbf" },
    { pos: [-0.2, -0.45, -0.15], r: 0.10, color: "#f5bfbf" },
  ];
  const bonds = [[0,1],[0,2],[0,3],[0,4]];
  const vecs = atoms.map(a => new THREE.Vector3(...a.pos));
  return (
    <group ref={ref} position={position}>
      {atoms.map((a, i) => (
        <mesh key={i} position={a.pos}>
          <sphereGeometry args={[a.r, 16, 16]} />
          <meshPhysicalMaterial color={a.color} roughness={0.1} metalness={0.2} clearcoat={1} />
        </mesh>
      ))}
      {bonds.map(([a, b], i) => {
        const p1 = vecs[a], p2 = vecs[b];
        const mid = p1.clone().lerp(p2, 0.5);
        const dir = p2.clone().sub(p1);
        const len = dir.length();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
        return (
          <mesh key={i} position={mid} quaternion={q}>
            <cylinderGeometry args={[0.022, 0.022, len, 6]} />
            <meshStandardMaterial color="#e8a0a0" transparent opacity={0.65} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ── Particles ── */
function Particles() {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      arr[i*3]   = (Math.random()-0.5)*13;
      arr[i*3+1] = (Math.random()-0.5)*11;
      arr[i*3+2] = (Math.random()-0.5)*6;
    }
    return arr;
  }, []);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.02; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#dd3333" size={0.04} transparent opacity={0.32} sizeAttenuation />
    </points>
  );
}

/* ── Root group with scroll parallax ── */
function SceneRoot() {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const scroll = window.scrollY || 0;
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const p = scroll / max;
    ref.current.rotation.x += (p * 0.55 - ref.current.rotation.x) * 0.055;
    ref.current.rotation.y += (p * 0.35 - ref.current.rotation.y) * 0.055;
  });

  return (
    <group ref={ref}>
      <Particles />

      {/* Large DNA – bottom centre-left */}
      <DnaHelix position={[-1.2, -0.4, 0]} height={5} radius={0.55} turns={3.5} rungCount={20} phase={0} spinSpeed={0.005} />

      {/* Small DNA – upper right */}
      <DnaHelix position={[3.5, 1.8, -1]} height={3} radius={0.38} turns={3} rungCount={14} phase={2} spinSpeed={0.008} />

      {/* Large capsule – right */}
      <Capsule position={[3.0, 0.2, 0.5]} rotation={[0.1, 0, 0.45]} scale={2.0} phase={0} floatSpeed={1.2} />

      {/* Small capsule – upper left */}
      <Capsule position={[-3.5, 2.2, -0.8]} rotation={[-0.2, 0.3, -0.5]} scale={1.0} phase={2.5} floatSpeed={1.8} />

      {/* Molecules */}
      <Molecule position={[0.8, 2.2, 0.3]} phase={0} />
      <Molecule position={[-3.0, -1.8, -0.5]} phase={1.5} />
    </group>
  );
}

export default function ConnectivityScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8.5], fov: 56 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.68} />
      <directionalLight position={[5, 7, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-4, -2, -3]} intensity={0.45} color="#ffcccc" />
      <pointLight position={[0, 4, 4]} intensity={1.0} color="#ff4444" />
      <pointLight position={[3, -3, 2]} intensity={0.5} color="#ffffff" />
      <SceneRoot />
    </Canvas>
  );
}
