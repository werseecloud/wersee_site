import React, { useRef, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Icosahedron, Points, PointMaterial, Float, Cylinder, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowRight, Globe2, Shield, Zap, BarChart3, Smartphone, CheckCircle2, ChevronRight, Activity, Users, DollarSign, ArrowUpRight, Building2, Stethoscope, Store, Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- 3D Components ---

const SovereignHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#050508]/90 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="text-white font-serif text-2xl tracking-widest uppercase flex items-center gap-2">
          Wersee <span className="text-[#C9A84C] italic">Sovereign</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-light text-gray-300">
          <a href="#story" className="hover:text-[#C9A84C] transition-colors">The Story</a>
          <a href="#pillars" className="hover:text-[#C9A84C] transition-colors">Pillars</a>
          <a href="#pricing" className="hover:text-[#C9A84C] transition-colors">Investment</a>
        </div>
        <a href="mailto:support@wersee.com?subject=Wersee%20Sovereign%20application" className="px-5 py-2 bg-[#C9A84C] text-black text-xs font-bold uppercase tracking-widest hover:bg-[#F0D080] transition-colors">
          Apply Now
        </a>
      </div>
    </header>
  );
};

const GoldenIcosahedron = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Icosahedron ref={meshRef} args={[1.5, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#C9A84C" 
          metalness={0.8} 
          roughness={0.2} 
          wireframe={true}
          emissive="#8B6914"
          emissiveIntensity={0.2}
        />
      </Icosahedron>
      <Icosahedron args={[1.4, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#111" 
          metalness={0.9} 
          roughness={0.1} 
          transparent
          opacity={0.8}
        />
      </Icosahedron>
    </Float>
  );
};

const Particles = () => {
  const ref = useRef<THREE.Points>(null);
  const [positions] = useState(() => {
    const pos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  });

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial transparent color="#F0D080" size={0.05} sizeAttenuation={true} depthWrite={false} opacity={0.6} />
    </Points>
  );
};

const GoldenPillar = ({ position, delay }: { position: [number, number, number], delay: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const elapsedRef = useRef(0);
  useFrame((_, delta) => {
    if (meshRef.current) {
      elapsedRef.current += delta;
      const targetY = Math.min(position[1], -5 + elapsedRef.current * 2 - delay);
      if (targetY > -5) {
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
      }
    }
  });

  return (
    <Cylinder ref={meshRef} args={[0.5, 0.5, 4, 32]} position={[position[0], -5, position[2]]}>
      <meshStandardMaterial 
        color="#C9A84C" 
        metalness={0.9} 
        roughness={0.1} 
        envMapIntensity={1}
      />
    </Cylinder>
  );
};

const NetworkNode = ({ position, label }: { position: [number, number, number], label: string }) => {
  return (
    <group position={position}>
      <Sphere args={[0.2, 16, 16]}>
        <meshStandardMaterial color="#C9A84C" emissive="#C9A84C" emissiveIntensity={0.5} />
      </Sphere>
      <Html distanceFactor={10} position={[0, -0.4, 0]} center>
        <div className="text-[#C9A84C] font-outfit text-xs whitespace-nowrap bg-black/50 px-2 py-1 rounded border border-[#C9A84C]/30 backdrop-blur-sm">
          {label}
        </div>
      </Html>
    </group>
  );
};

const NetworkDiagram = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  const elapsedRef = useRef(0);
  useFrame((_, delta) => {
    if (groupRef.current) {
      elapsedRef.current += delta;
      groupRef.current.rotation.y = Math.sin(elapsedRef.current * 0.2) * 0.2;
    }
  });

  const nodes = [
    { pos: [0, 1.5, 0], label: "Central AI" },
    { pos: [-2, 0, 1], label: "SEO Agent" },
    { pos: [2, 0, 1], label: "Social Agent" },
    { pos: [-1.5, -1.5, -1], label: "Ads Agent" },
    { pos: [1.5, -1.5, -1], label: "Email Agent" },
  ];

  return (
    <group ref={groupRef}>
      {nodes.map((n, i) => (
        <NetworkNode key={i} position={n.pos as [number, number, number]} label={n.label} />
      ))}
      {/* Connections */}
      {nodes.slice(1).map((n, i) => (
        <Line 
          key={`line-${i}`}
          points={[nodes[0].pos as [number, number, number], n.pos as [number, number, number]]} 
          color="#C9A84C" 
          lineWidth={1} 
          transparent 
          opacity={0.3} 
        />
      ))}
    </group>
  );
};

const Globe3D = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group>
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <meshStandardMaterial 
          color="#050508" 
          metalness={0.5} 
          roughness={0.5} 
          wireframe={true}
          transparent
          opacity={0.2}
        />
      </Sphere>
      {/* Orbital Rings */}
      <Cylinder args={[2.5, 2.5, 0.02, 64]} rotation={[Math.PI / 3, 0, 0]}>
        <meshBasicMaterial color="#C9A84C" transparent opacity={0.2} />
      </Cylinder>
      <Cylinder args={[2.8, 2.8, 0.02, 64]} rotation={[-Math.PI / 4, 0, 0]}>
        <meshBasicMaterial color="#C9A84C" transparent opacity={0.1} />
      </Cylinder>
    </group>
  );
};

// --- Main Component ---

export default function WerseeSovereign() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fadeUpVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.2, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
    })
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    }
  };

  const cardVariant: any = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  const listItemVariant = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="bg-[#050508] min-h-screen text-white font-outfit overflow-x-hidden selection:bg-[#C9A84C]/30 selection:text-[#F0D080]">
      <Helmet>
        <title>Wersee Sovereign | The Exclusive Digital Build</title>
        <meta name="description" content="Not every business gets this call. You did. Wersee Sovereign builds your entire digital presence from the ground up." />
      </Helmet>

      {/* Custom Cursor */}
      <div 
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#C9A84C]/50 pointer-events-none z-[100] transition-transform duration-100 ease-out flex items-center justify-center mix-blend-screen hidden md:flex"
        style={{ 
          transform: `translate(${cursorPos.x - 16}px, ${cursorPos.y - 16}px) scale(${isHovering ? 1.5 : 1})`,
        }}
      >
        <div className="w-1.5 h-1.5 bg-[#F0D080] rounded-full" />
        <div className="absolute inset-0 border border-[#C9A84C]/30 rounded-full animate-[spin_4s_linear_infinite]" style={{ borderTopColor: 'transparent' }} />
      </div>

      {/* Subtle Grain Texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-50 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      <SovereignHeader />

      {/* 1. Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.2} />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#F0D080" />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#8B6914" />
            <GoldenIcosahedron />
            <Particles />
          </Canvas>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050508]/80 to-[#050508]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="inline-block mb-6 px-4 py-1.5 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5 backdrop-blur-sm"
          >
            <span className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase">By Invitation Only</span>
          </motion.div>
          
          <motion.h1 
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-light leading-tight mb-8 drop-shadow-[0_0_30px_rgba(201,168,76,0.15)]"
          >
            Not every business gets this call.<br />
            <span className="italic text-[#C9A84C] drop-shadow-[0_0_40px_rgba(201,168,76,0.3)]">You did.</span>
          </motion.h1>
          
          <motion.p 
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
          >
            We find businesses with untapped potential and build their entire digital presence from the ground up. You run your business. We run the rest.
          </motion.p>
          
          <motion.div 
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <a
              href="#story"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#C9A84C] to-[#F0D080] text-black font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(201,168,76,0.3)]"
            >
              See the Formula
            </a>
            <a
              href="mailto:support@wersee.com?subject=Wersee%20Sovereign%20access"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="w-full sm:w-auto px-8 py-4 border border-[#C9A84C]/30 text-white font-bold uppercase tracking-widest text-sm hover:bg-[#C9A84C]/10 transition-all duration-300"
            >
              Request Access
            </a>
          </motion.div>
        </div>
      </section>

      {/* Partners Marquee */}
      <section className="py-12 border-y border-[#C9A84C]/10 bg-[#050508] overflow-hidden flex relative shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050508] to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050508] to-transparent z-10"></div>
        
        <div className="flex w-max animate-marquee gap-16 px-8 items-center opacity-50 hover:opacity-100 transition-opacity duration-700">
          {[
            "Wersee", "Taxi Borger Assen", "Anolia Rides", "Portal Education", 
            "Agency Click", "RKE Media", "Nexora", "+10 more",
            "Wersee", "Taxi Borger Assen", "Anolia Rides", "Portal Education", 
            "Agency Click", "RKE Media", "Nexora", "+10 more",
            "Wersee", "Taxi Borger Assen", "Anolia Rides", "Portal Education", 
            "Agency Click", "RKE Media", "Nexora", "+10 more"
          ].map((partner, i) => (
            <div key={i} className="text-gray-400 font-serif text-2xl md:text-3xl italic tracking-wider whitespace-nowrap">
              {partner}
            </div>
          ))}
        </div>
      </section>

      {/* 2. The Story */}
      <section id="story" className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <h2 className="font-serif text-4xl md:text-6xl italic text-[#C9A84C] mb-6 drop-shadow-[0_0_20px_rgba(201,168,76,0.2)]">The Rotterdam Transformation</h2>
            <p className="text-gray-400 text-xl font-light">A true story of what happens when potential meets infrastructure.</p>
          </motion.div>

          <div className="space-y-24 relative">
            {/* Connecting Line */}
            <div className="absolute left-[28px] md:left-[45px] top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-[#C9A84C]/20 to-transparent hidden md:block"></div>

            {[
              {
                chapter: "01",
                title: "The Discovery",
                text: "It was a small, bustling Italian restaurant in Rotterdam. Incredible food, packed every weekend. But online? Nothing. No website, no reservations system, a claimed but empty Google profile. They were losing hundreds of potential customers who searched for them but couldn't find them."
              },
              {
                chapter: "02",
                title: "The Build",
                text: "We didn't wait for them to call us. We walked in, had an espresso with the owner, and made an offer. Within 7 days, we built a premium website, integrated a booking system, set up professional email, and launched their Google Business profile. All running on Wersee's infrastructure."
              },
              {
                chapter: "03",
                title: "The Result",
                text: "The owner didn't have to lift a finger. Our AI agents took over, posting daily specials to social media and optimizing local SEO. Within three months, reservations increased by 40%, and they finally had a digital presence that matched the quality of their food."
              }
            ].map((story, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="flex flex-col md:flex-row gap-8 md:gap-16 items-start relative z-10"
              >
                <div className="text-[#C9A84C] font-serif text-7xl md:text-8xl opacity-30 shrink-0 drop-shadow-[0_0_30px_rgba(201,168,76,0.2)]">{story.chapter}</div>
                <div className="pt-2 md:pt-6">
                  <h3 className="text-3xl font-serif mb-4 text-white">{story.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-light text-lg md:text-xl">{story.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Who it's for & Before/After */}
      <section className="py-32 bg-[#08080C] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl md:text-5xl mb-6">Built for the <span className="italic text-[#C9A84C]">Foundational</span> Economy</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">We look for businesses that are great at what they do, but invisible online.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
            {[
              { icon: Store, title: "Restaurants & Cafes", desc: "No booking system, invisible on maps." },
              { icon: Hammer, title: "Contractors", desc: "Relying purely on word-of-mouth." },
              { icon: Stethoscope, title: "Clinics & Salons", desc: "Missing out on local search traffic." },
              { icon: Building2, title: "Local Retail", desc: "No way to showcase inventory online." }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="p-8 border border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent hover:border-[#C9A84C]/30 transition-all duration-500 group shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-sm"
              >
                <item.icon className="w-10 h-10 text-[#C9A84C] mb-6 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(201,168,76,0.5)] transition-all duration-500" strokeWidth={1.5} />
                <h3 className="text-xl font-serif mb-3 text-white">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Before / After */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            <motion.div 
              variants={cardVariant}
              className="p-10 border border-red-900/30 bg-red-950/10 backdrop-blur-md relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-red-400/80 font-serif text-2xl mb-8 italic">Without Sovereign</h3>
              <ul className="space-y-6">
                {[
                  "Invisible to local Google searches",
                  "Using @gmail.com for business",
                  "No central place to send customers",
                  "Missing out on automated marketing",
                  "Paying multiple expensive agencies"
                ].map((text, i) => (
                  <motion.li variants={listItemVariant} key={i} className="flex items-start gap-4 text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-900/50 mt-2 shrink-0 shadow-[0_0_10px_rgba(153,27,27,0.5)]" />
                    <span className="font-light">{text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              variants={cardVariant}
              className="p-10 border border-[#C9A84C]/30 bg-[#C9A84C]/5 backdrop-blur-md relative overflow-hidden group shadow-[0_0_40px_rgba(201,168,76,0.1)]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C9A84C] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[#C9A84C]/20 transition-colors duration-700" />
              <h3 className="text-[#C9A84C] font-serif text-2xl mb-8 italic drop-shadow-[0_0_15px_rgba(201,168,76,0.5)]">With Sovereign</h3>
              <ul className="space-y-6 relative z-10">
                {[
                  "Premium, high-converting website",
                  "Professional domain & email routing",
                  "Optimized Google Business Profile",
                  "AI Agents running SEO & Socials",
                  "One partner, one infrastructure"
                ].map((text, i) => (
                  <motion.li variants={listItemVariant} key={i} className="flex items-start gap-4 text-white">
                    <CheckCircle2 className="w-5 h-5 text-[#C9A84C] shrink-0 drop-shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                    <span className="font-light">{text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4. Four Pillars (3D) */}
      <section id="pillars" className="py-32 relative min-h-[80vh] flex items-center">
        <div className="absolute inset-0 z-0 opacity-30">
          <Canvas camera={{ position: [0, 2, 10], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} color="#F0D080" />
            <pointLight position={[-5, 5, -5]} intensity={1} color="#C9A84C" />
            <pointLight position={[0, 5, 5]} intensity={0.5} color="#ffffff" />
            <GoldenPillar position={[-4, 0, 0]} delay={0} />
            <GoldenPillar position={[-1.5, 0, -1]} delay={0.5} />
            <GoldenPillar position={[1.5, 0, 1]} delay={1} />
            <GoldenPillar position={[4, 0, 0]} delay={1.5} />
          </Canvas>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl md:text-5xl mb-6">The Four <span className="italic text-[#C9A84C]">Pillars</span></h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { title: "Presence", desc: "A digital storefront that commands respect." },
              { title: "Trust", desc: "Professional emails, verified profiles, secure hosting." },
              { title: "Reach", desc: "AI-driven local SEO and automated social presence." },
              { title: "Control", desc: "Live insights via the Sovereign App." }
            ].map((pillar, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.8 }}
                className="text-center p-6 backdrop-blur-sm bg-black/20 border border-white/5"
              >
                <div className="text-[#C9A84C] font-serif text-2xl mb-4 italic">{pillar.title}</div>
                <p className="text-sm text-gray-400 font-light">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. AI Agents */}
      <section className="py-32 bg-[#08080C] relative border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl mb-6">Marketing on <span className="italic text-[#C9A84C]">Autopilot</span></h2>
              <p className="text-gray-400 text-lg font-light mb-8 leading-relaxed">
                Sovereign clients get exclusive access to our AI Agent network. They write your social posts, optimize your Google ranking, and manage your ads. You don't do anything.
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-4xl font-serif text-white mb-2">24/7</div>
                  <div className="text-sm text-[#C9A84C] uppercase tracking-wider">Active Monitoring</div>
                </div>
                <div>
                  <div className="text-4xl font-serif text-white mb-2">100%</div>
                  <div className="text-sm text-[#C9A84C] uppercase tracking-wider">Automated</div>
                </div>
              </div>
            </div>
            
            <div className="h-[400px] relative rounded-2xl border border-white/10 bg-black/50 overflow-hidden">
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <NetworkDiagram />
              </Canvas>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Phone App */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative h-[600px] flex items-center justify-center perspective-1000">
              <motion.div 
                initial={{ rotateY: 20, rotateX: 10, opacity: 0, y: 50 }}
                whileInView={{ rotateY: -15, rotateX: 5, opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-[300px] h-[600px] bg-[#0A0A0A] rounded-[3rem] border-[8px] border-[#1A1A1A] shadow-2xl shadow-[#C9A84C]/10 relative overflow-hidden preserve-3d"
              >
                {/* Phone Notch */}
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
                  <div className="w-32 h-6 bg-[#1A1A1A] rounded-b-3xl"></div>
                </div>
                
                {/* App Content */}
                <div className="absolute inset-0 bg-[#050508] p-6 pt-12 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-white font-serif text-xl">Sovereign</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-xs text-gray-500 mb-1">Today's Visitors</div>
                      <div className="text-2xl text-white font-light">1,248</div>
                      <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> +12% from yesterday
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">AI Activity Feed</div>
                      <div className="space-y-3">
                        {[
                          { action: "Published Instagram Post", time: "2m ago" },
                          { action: "Optimized 3 local keywords", time: "1h ago" },
                          { action: "Responded to Google Review", time: "3h ago" }
                        ].map((feed, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] mt-1.5 shrink-0" />
                            <div>
                              <div className="text-sm text-gray-300">{feed.action}</div>
                              <div className="text-[10px] text-gray-600">{feed.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="font-serif text-4xl md:text-5xl mb-6">Total <span className="italic text-[#C9A84C]">Visibility</span></h2>
              <p className="text-gray-400 text-lg font-light mb-8 leading-relaxed">
                You don't need to log into five different platforms. The Sovereign App gives you a live feed of your business performance and what our AI is doing for you right now.
              </p>
              <ul className="space-y-4">
                {["Live traffic analytics", "Lead capture notifications", "AI agent activity log", "Direct support channel"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-1 h-1 bg-[#C9A84C]" />
                    <span className="font-light">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Globe & Availability */}
      <section className="py-32 bg-[#08080C] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl mb-6">Global <span className="italic text-[#C9A84C]">Infrastructure</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-light">Available in multiple countries and languages, running on edge networks for instant load times anywhere.</p>
          </div>
          
          <div className="h-[400px] relative mb-16">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 3, 5]} intensity={1} color="#C9A84C" />
              <Globe3D />
            </Canvas>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {["English", "Dutch", "German", "French", "Spanish"].map((lang, i) => (
              <div key={i} className="px-4 py-2 rounded-full border border-white/10 text-sm text-gray-400">
                {lang}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Pricing */}
      <section id="pricing" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl md:text-5xl mb-6">The <span className="italic text-[#C9A84C]">Investment</span></h2>
            <p className="text-gray-400 font-light">Transparent pricing for a complete digital transformation.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Starter */}
            <motion.div variants={cardVariant} className="p-8 border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col hover:border-white/20 transition-colors group">
              <h3 className="text-xl font-serif mb-2 text-gray-300 group-hover:text-white transition-colors">Starter</h3>
              <div className="text-3xl text-white mb-6">€750 <span className="text-sm text-gray-500">one-time</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="text-sm text-gray-400 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Premium Website Build</li>
                <li className="text-sm text-gray-400 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Domain & Hosting Setup</li>
                <li className="text-sm text-gray-400 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Google Business Profile</li>
              </ul>
              <a href="mailto:support@wersee.com?subject=Wersee%20Sovereign%20Starter" className="block text-center w-full py-3 border border-white/20 text-white hover:bg-white hover:text-black transition-colors text-sm uppercase tracking-wider">Inquire</a>
            </motion.div>

            {/* Pro */}
            <motion.div variants={cardVariant} className="p-8 border border-[#C9A84C]/50 bg-gradient-to-b from-[#C9A84C]/10 to-transparent flex flex-col relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(201,168,76,0.15)] backdrop-blur-xl group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#C9A84C] to-[#F0D080] text-black text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 shadow-[0_0_20px_rgba(201,168,76,0.4)] z-10">Most Selected</div>
              <h3 className="text-xl font-serif mb-2 text-[#C9A84C] drop-shadow-[0_0_10px_rgba(201,168,76,0.5)] relative z-10">Pro</h3>
              <div className="text-3xl text-white mb-6 relative z-10">€1,750 <span className="text-sm text-gray-400">one-time</span></div>
              <ul className="space-y-4 mb-8 flex-1 relative z-10">
                <li className="text-sm text-gray-200 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Everything in Starter</li>
                <li className="text-sm text-gray-200 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Professional Email Routing</li>
                <li className="text-sm text-gray-200 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Custom Booking/Contact Forms</li>
                <li className="text-sm text-gray-200 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Basic SEO Setup</li>
              </ul>
              <a href="mailto:support@wersee.com?subject=Wersee%20Sovereign%20Pro%20build" className="block text-center w-full py-4 bg-gradient-to-r from-[#C9A84C] to-[#F0D080] text-black hover:scale-105 transition-transform duration-300 text-sm uppercase tracking-widest font-bold shadow-[0_0_30px_rgba(201,168,76,0.3)] relative z-10">Claim Build</a>
            </motion.div>

            {/* Elite */}
            <motion.div variants={cardVariant} className="p-8 border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col hover:border-white/20 transition-colors group">
              <h3 className="text-xl font-serif mb-2 text-gray-300 group-hover:text-white transition-colors">Elite</h3>
              <div className="text-3xl text-white mb-2">€3,000 <span className="text-sm text-gray-500">one-time</span></div>
              <div className="text-sm text-[#C9A84C] mb-6">+ €199 / month</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="text-sm text-gray-400 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Everything in Pro</li>
                <li className="text-sm text-gray-400 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Full AI Agent Access</li>
                <li className="text-sm text-gray-400 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Automated Social Media</li>
                <li className="text-sm text-gray-400 flex gap-3"><CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0" /> Sovereign App Access</li>
              </ul>
              <a href="mailto:support@wersee.com?subject=Wersee%20Sovereign%20Elite" className="block text-center w-full py-3 border border-white/20 text-white hover:bg-white hover:text-black transition-colors text-sm uppercase tracking-wider">Apply for Elite</a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-32 relative border-t border-[#C9A84C]/20 bg-gradient-to-b from-[#050508] to-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.05)_0%,transparent_70%)]"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-5xl md:text-7xl mb-8 drop-shadow-[0_0_30px_rgba(201,168,76,0.2)]">Ready to claim your <span className="italic text-[#C9A84C]">territory?</span></h2>
          <p className="text-xl text-gray-400 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
            We only take on a limited number of Sovereign builds per month to ensure absolute quality. Secure your spot today.
          </p>
          <a href="mailto:support@wersee.com?subject=Wersee%20Sovereign%20application" className="inline-flex items-center justify-center w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-[#C9A84C] to-[#F0D080] text-black font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all duration-300 shadow-[0_0_50px_rgba(201,168,76,0.4)]">
            Apply for Sovereign
          </a>
        </div>
      </section>
    </div>
  );
}
