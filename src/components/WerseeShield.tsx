import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { Shield, ShieldCheck, ShieldAlert, ChevronRight, Lock, Fingerprint, Eye, Key, UserCheck, Cpu, Globe, Zap, ShieldHalf } from 'lucide-react';

interface Challenge {
  id: number;
  text: string;
  icon: React.ReactNode;
  color: string;
}

const CHALLENGES: Challenge[] = [
  { id: 1, text: "Slide to verify identity", icon: <Fingerprint className="w-5 h-5" />, color: "from-indigo-500 to-purple-600" },
  { id: 2, text: "Slide to confirm humanity", icon: <UserCheck className="w-5 h-5" />, color: "from-emerald-500 to-teal-600" },
  { id: 3, text: "Slide to authorize access", icon: <Key className="w-5 h-5" />, color: "from-blue-500 to-cyan-600" },
  { id: 4, text: "Slide to unlock workspace", icon: <Lock className="w-5 h-5" />, color: "from-amber-500 to-orange-600" },
  { id: 5, text: "Slide to secure session", icon: <Shield className="w-5 h-5" />, color: "from-rose-500 to-pink-600" },
  { id: 6, text: "Slide to validate credentials", icon: <Eye className="w-5 h-5" />, color: "from-violet-500 to-fuchsia-600" },
  { id: 7, text: "Slide to activate shield", icon: <ShieldHalf className="w-5 h-5" />, color: "from-sky-500 to-indigo-600" },
  { id: 8, text: "Slide to verify biometric", icon: <Fingerprint className="w-5 h-5" />, color: "from-teal-500 to-emerald-600" },
  { id: 9, text: "Slide to sync neural link", icon: <Cpu className="w-5 h-5" />, color: "from-purple-500 to-indigo-600" },
  { id: 10, text: "Slide to globalize security", icon: <Globe className="w-5 h-5" />, color: "from-cyan-500 to-blue-600" }
];

export const WerseeShield = ({ onVerify }: { onVerify: () => void }) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 200], [1, 0]);
  const scale = useTransform(x, [0, 250], [1, 1.1]);
  const successOpacity = useTransform(x, [200, 250], [0, 1]);

  useEffect(() => {
    const randomChallenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    setChallenge(randomChallenge);
  }, []);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (x.get() > 220) {
      setIsVerified(true);
      setTimeout(() => {
        onVerify();
      }, 1000);
    } else {
      x.set(0);
    }
  };

  if (!challenge) return null;

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/5 border border-white/10 mb-4 relative overflow-hidden group"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${challenge.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
          <AnimatePresence mode="wait">
            {isVerified ? (
              <motion.div
                key="success"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="text-emerald-400 relative z-10"
              >
                <ShieldCheck className="w-10 h-10" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-white relative z-10"
              >
                <Shield className="w-10 h-10" />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 bg-gradient-to-br ${challenge.color} blur-xl`}
          />
        </motion.div>
        <h2 className="text-2xl font-black text-white mb-2">Wersee Shield</h2>
        <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Security Protocol Active</p>
      </div>

      <div 
        ref={containerRef}
        className="relative h-20 bg-white/5 border border-white/10 rounded-3xl p-2 flex items-center overflow-hidden backdrop-blur-xl"
      >
        {/* Track Text */}
        <motion.div 
          style={{ opacity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className="text-gray-400 font-bold text-sm select-none flex items-center gap-2">
            {challenge.icon}
            {challenge.text}
          </span>
        </motion.div>

        {/* Success Text */}
        <motion.div 
          style={{ opacity: successOpacity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none bg-emerald-500/10"
        >
          <span className="text-emerald-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Identity Verified
          </span>
        </motion.div>

        {/* Slider Handle */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 260 }}
          dragElastic={0.1}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={`relative z-10 w-16 h-16 rounded-2xl bg-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-2xl transition-colors ${isVerified ? 'bg-emerald-500' : ''}`}
        >
          {isVerified ? (
            <ShieldCheck className="w-6 h-6 text-white" />
          ) : (
            <motion.div
              animate={isDragging ? { x: [0, 5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <ChevronRight className="w-6 h-6 text-black" />
            </motion.div>
          )}
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          style={{ width: x }}
          className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${challenge.color} opacity-20`}
        />
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
        <div className="flex flex-col items-center gap-1">
          <Lock className="w-4 h-4 text-gray-400" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">AES-256</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex flex-col items-center gap-1">
          <ShieldAlert className="w-4 h-4 text-gray-400" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Anti-Bot</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex flex-col items-center gap-1">
          <Fingerprint className="w-4 h-4 text-gray-400" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Biometric</span>
        </div>
      </div>
    </div>
  );
};
