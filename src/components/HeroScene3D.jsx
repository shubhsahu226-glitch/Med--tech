import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/* ─── Reusable capsule – pass position, rotation, scale, floatSpeed, phaseOffset ─── */
function Capsule({ position, rotation, scale, floatSpeed = 1.2, phase = 0 }) {
  const innerRef = useRef();

  useFrame((state) => {
    if (!innerRef.current) return;
    const t = state.clock.elapsedTime + phase;
    innerRef.current.rotation.y = Math.sin(t * 0.32) * 0.55;
    innerRef.current.rotation.x = Math.sin(t * 0.19) * 0.08;
  });

  return (
    <Float speed={floatSpeed} rotationIntensity={0.15} floatIntensity={1.8}>
      <group ref={innerRef} position={position} rotation={rotation} scale={[scale, scale, scale]}>
        {/* Red top dome */}
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.38, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#cc2222" roughness={0.06} metalness={0.14}
            clearcoat={1} clearcoatRoughness={0.04} reflectivity={0.98} />
        </mesh>
        {/* Red cylinder top */}
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.74, 48]} />
          <meshPhysicalMaterial color="#cc2222" roughness={0.06} metalness={0.14}
            clearcoat={1} clearcoatRoughness={0.04} reflectivity={0.98} />
        </mesh>
        {/* Seam */}
        <mesh position={[0, -0.185, 0]}>
          <torusGeometry args={[0.39, 0.022, 12, 48]} />
          <meshPhysicalMaterial color="#cccccc" roughness={0.1} metalness={0.75} />
        </mesh>
        {/* White cylinder bottom */}
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.74, 48]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} metalness={0.05}
            clearcoat={1} clearcoatRoughness={0.03} reflectivity={1} />
        </mesh>
        {/* White bottom dome */}
        <mesh position={[0, -0.92, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.38, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} metalness={0.05}
            clearcoat={1} clearcoatRoughness={0.03} reflectivity={1} />
        </mesh>
        {/* Specular highlight */}
        <mesh position={[-0.1, 0.52, 0.33]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color="#ff9999" transparent opacity={0.35} roughness={0} />
        </mesh>
      </group>
    </Float>
  );
}

/* ─── Reusable DNA helix – pass position, height, radius, turns, phase ─── */
function DnaHelix({ position, height = 6, radius = 0.65, turns = 3.5, rungCount = 24, phase = 0, spinSpeed = 0.005 }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y += spinSpeed;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.4 + phase) * 0.32;
    groupRef.current.rotation.z = Math.sin(t * 0.28 + phase) * 0.06;
  });

  const { strand1Curve, strand2Curve, rungs } = useMemo(() => {
    const s1 = [], s2 = [], r = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const tt = i / steps;
      const y = -height / 2 + tt * height;
      const a = tt * turns * Math.PI * 2;
      s1.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
      s2.push(new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius));
    }
    for (let i = 0; i < rungCount; i++) {
      const tt = (i + 0.5) / rungCount;
      const y = -height / 2 + tt * height;
      const a = tt * turns * Math.PI * 2;
      r.push({
        p1: new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius),
        p2: new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius),
      });
    }
    return {
      strand1Curve: new THREE.CatmullRomCurve3(s1),
      strand2Curve: new THREE.CatmullRomCurve3(s2),
      rungs: r,
    };
  }, [height, radius, turns, rungCount]);

  const mat1 = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#cc2222", roughness: 0.09, metalness: 0.2,
    clearcoat: 0.95, clearcoatRoughness: 0.07,
    emissive: "#3a0000", emissiveIntensity: 0.18,
  }), []);

  const mat2 = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#e03030", roughness: 0.12, metalness: 0.14,
    clearcoat: 0.85, clearcoatRoughness: 0.09,
    emissive: "#2a0000", emissiveIntensity: 0.14,
  }), []);

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      <mesh>
        <tubeGeometry args={[strand1Curve, 120, 0.07, 10, false]} />
        <primitive object={mat1} />
      </mesh>
      <mesh>
        <tubeGeometry args={[strand2Curve, 120, 0.07, 10, false]} />
        <primitive object={mat2} />
      </mesh>
      {rungs.map(({ p1, p2 }, i) => {
        const mid = p1.clone().lerp(p2, 0.5);
        const dir = p2.clone().sub(p1);
        const len = dir.length();
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), dir.clone().normalize()
        );
        return (
          <group key={i}>
            <mesh position={mid} quaternion={quat}>
              <cylinderGeometry args={[0.034, 0.034, len, 8]} />
              <meshStandardMaterial color="#ee3333" roughness={0.35} metalness={0.2} transparent opacity={0.75} />
            </mesh>
            <mesh position={p1}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshPhysicalMaterial color={i % 2 === 0 ? "#cc2222" : "#ee5555"} roughness={0.07} metalness={0.28} clearcoat={1} />
            </mesh>
            <mesh position={p2}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshPhysicalMaterial color="#ff6666" roughness={0.07} metalness={0.28} clearcoat={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ─── Particles ─── */
function Particles() {
  const meshRef = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, []);
  useFrame((state) => {
    if (meshRef.current) meshRef.current.rotation.y = state.clock.elapsedTime * 0.025;
  });
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#dd3333" size={0.05} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

/* ─── Root scene: reads window.scrollY directly inside useFrame ─── */
function SceneRoot() {
  const groupRef = useRef();
  const targetRot = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (!groupRef.current) return;
    // Read scroll directly – no React state, no re-renders
    const scroll = window.scrollY || 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight || 1;
    const progress = scroll / maxScroll; // 0 → 1

    // Target angles driven by scroll
    targetRot.current.x = progress * 0.8;
    targetRot.current.y = progress * 0.5;

    // Smooth lerp so motion feels physical
    groupRef.current.rotation.x += (targetRot.current.x - groupRef.current.rotation.x) * 0.06;
    groupRef.current.rotation.y += (targetRot.current.y - groupRef.current.rotation.y) * 0.06;
  });

  return (
    <group ref={groupRef}>
      <Particles />

      {/* ── Primary large DNA – left centre ── */}
      <DnaHelix position={[-3.2, 0, 0]} height={8} radius={0.75} turns={4} rungCount={28} phase={0} spinSpeed={0.005} />

      {/* ── Secondary DNA – right top ── */}
      <DnaHelix position={[4.5, 2, -1.5]} height={5.5} radius={0.55} turns={3} rungCount={20} phase={1.5} spinSpeed={0.007} />

      {/* ── Small DNA – bottom left ── */}
      <DnaHelix position={[-5.5, -2.5, -2]} height={4} radius={0.42} turns={3} rungCount={16} phase={3} spinSpeed={0.009} />

      {/* ── Primary large capsule – right centre ── */}
      <Capsule position={[2.8, -0.2, 0.5]} rotation={[0, 0, -0.28]} scale={2.6} floatSpeed={1.2} phase={0} />

      {/* ── Second capsule – upper right ── */}
      <Capsule position={[5.5, 2.8, -1]} rotation={[0.2, 0.3, 0.5]} scale={1.4} floatSpeed={1.6} phase={2} />

      {/* ── Third capsule – lower left ── */}
      <Capsule position={[-5.8, -3, -1.5]} rotation={[-0.3, 0.1, -0.6]} scale={1.2} floatSpeed={2} phase={4} />
    </group>
  );
}

/* ─── Canvas export ─── */
export default function HeroScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 62 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 8, 6]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-5, -3, -3]} intensity={0.5} color="#ffcccc" />
      <pointLight position={[0, 5, 5]} intensity={1.1} color="#ff4444" />
      <pointLight position={[4, -4, 3]} intensity={0.7} color="#ffffff" />

      <SceneRoot />
    </Canvas>
  );
}
