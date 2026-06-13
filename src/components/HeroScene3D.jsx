import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/virtualvaidya-logo3d.glb");

function ResponsiveFov() {
  const { camera, size } = useThree();
  useEffect(() => {
    const ref = 700;
    const fov = 2 * Math.atan(Math.tan((55 * Math.PI) / 360) * (ref / size.width)) * (180 / Math.PI);
    camera.fov = Math.min(Math.max(fov, 40), 100);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function VirtualVaidyaLogo() {
  const { scene } = useGLTF("/virtualvaidya-logo3d.glb");
  const { gl } = useThree();
  const groupRef = useRef();
  const cloned = useMemo(() => scene.clone(), [scene]);

  const drag = useRef({ active: false, lastX: 0, lastY: 0, velX: 0, velY: 0 });
  const userRot = useRef({ x: 0, y: 0 });
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.lastX;
      const dy = e.clientY - drag.current.lastY;
      drag.current.velX = dx;
      drag.current.velY = dy;
      userRot.current.y += dx * 0.012;
      userRot.current.x += dy * 0.012;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
    };
    const onMouseDown = (e) => {
      drag.current.active = true;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
      drag.current.velX = 0;
      drag.current.velY = 0;
      canvas.style.cursor = "grabbing";
    };
    const onMouseUp = () => { drag.current.active = false; canvas.style.cursor = "grab"; };

    const onTouchStart = (e) => {
      const t = e.touches[0];
      drag.current.active = true;
      drag.current.lastX = t.clientX;
      drag.current.lastY = t.clientY;
      drag.current.velX = 0; drag.current.velY = 0;
    };
    const onTouchMove = (e) => {
      if (!drag.current.active) return;
      const t = e.touches[0];
      const dx = t.clientX - drag.current.lastX;
      const dy = t.clientY - drag.current.lastY;
      drag.current.velX = dx; drag.current.velY = dy;
      userRot.current.y += dx * 0.012;
      userRot.current.x += dy * 0.012;
      drag.current.lastX = t.clientX;
      drag.current.lastY = t.clientY;
    };
    const onTouchEnd = () => { drag.current.active = false; };

    canvas.style.cursor = "grab";
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: true });
    canvas.addEventListener("touchend",   onTouchEnd);
    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchend",   onTouchEnd);
    };
  }, [gl]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const scroll = window.scrollY || 0;
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const scrollY = (scroll / max) * Math.PI * 2;

    if (!drag.current.active) {
      drag.current.velX *= 0.92;
      drag.current.velY *= 0.92;
      userRot.current.y += drag.current.velX * 0.008;
      userRot.current.x += drag.current.velY * 0.008;
    }

    const idleTwist = drag.current.active ? 0 : Math.sin(t * 0.5) * 0.08;
    const tiltX     = drag.current.active ? 0 : mouse.current.y * 0.1;
    const tiltZ     = drag.current.active ? 0 : mouse.current.x * 0.07;

    const targetY = scrollY + userRot.current.y;
    const targetX = userRot.current.x + tiltX + idleTwist;

    groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.08;
    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.08;
    groupRef.current.rotation.z += (tiltZ    - groupRef.current.rotation.z) * 0.06;

    const breathe = 1 + Math.sin(t * 0.9) * 0.018;
    groupRef.current.scale.setScalar(5.5 * breathe);
    groupRef.current.position.y = Math.sin(t * 0.45) * 0.18;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

function Capsule({ position, rotation, scale, floatSpeed = 1.4, phase = 0 }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + phase;
    ref.current.rotation.y = Math.sin(t * 0.28) * 0.4;
    ref.current.rotation.x = Math.sin(t * 0.18) * 0.06;
  });
  return (
    <Float speed={floatSpeed} rotationIntensity={0.1} floatIntensity={1.2}>
      <group ref={ref} position={position} rotation={rotation} scale={[scale, scale, scale]}>
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#cc2222" roughness={0.06} metalness={0.14} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.74, 32]} />
          <meshPhysicalMaterial color="#cc2222" roughness={0.06} metalness={0.14} clearcoat={1} />
        </mesh>
        <mesh position={[0, -0.185, 0]}>
          <torusGeometry args={[0.39, 0.02, 8, 32]} />
          <meshPhysicalMaterial color="#bbbbbb" roughness={0.1} metalness={0.75} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.74, 32]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} metalness={0.05} clearcoat={1} />
        </mesh>
        <mesh position={[0, -0.92, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} metalness={0.05} clearcoat={1} />
        </mesh>
      </group>
    </Float>
  );
}

function Particles() {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(40 * 3);
    for (let i = 0; i < 40; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, []);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.015; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#dd3333" size={0.05} transparent opacity={0.2} sizeAttenuation />
    </points>
  );
}

export default function HeroScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 55 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={Math.min(window.devicePixelRatio, 1.5)}
    >
      <ResponsiveFov />
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 8, 6]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[-4, -2, -2]} intensity={0.4} color="#ffdddd" />
      <pointLight position={[0, 0, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-2, 2, 4]} intensity={0.7} color="#ffeeee" />

      <Particles />
      <VirtualVaidyaLogo />

      <Capsule position={[-7.5,  4.0, -3]} rotation={[ 0.3,  0,  0.5]} scale={1.1}  floatSpeed={1.3} phase={0}   />
      <Capsule position={[ 7.5,  3.6, -3]} rotation={[-0.2,  0, -0.5]} scale={1.0}  floatSpeed={1.6} phase={1.5} />
      <Capsule position={[-7.0, -4.2, -3]} rotation={[ 0.4,  0.2, 0.6]} scale={0.95} floatSpeed={1.9} phase={3}   />
      <Capsule position={[ 7.0, -4.0, -3]} rotation={[-0.3,  0, -0.6]} scale={1.0}  floatSpeed={1.4} phase={4.5} />
    </Canvas>
  );
}
