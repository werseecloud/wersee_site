import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'motion/react';
import { ShieldCheck, Lock, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

interface WerseeCaptchaProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

export const WerseeCaptcha: React.FC<WerseeCaptchaProps> = ({ onVerify, onExpire }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Width of the slider track minus the handle width
  const [maxWidth, setMaxWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const handleWidth = 64; // w-16
      setMaxWidth(containerWidth - handleWidth - 8); // 8 is padding
    }
  }, []);

  const opacity = useTransform(x, [0, maxWidth * 0.8], [1, 0]);
  const scale = useTransform(x, [0, maxWidth], [1, 1.1]);
  const background = useTransform(
    x,
    [0, maxWidth],
    ['rgba(255, 255, 255, 0.05)', 'rgba(16, 185, 129, 0.2)']
  );

  const handleDragEnd = async () => {
    setIsDragging(false);
    const currentX = x.get();
    
    if (currentX >= maxWidth * 0.95) {
      // Success
      await controls.start({ x: maxWidth, transition: { type: 'spring', stiffness: 500, damping: 30 } });
      setIsVerified(true);
      // Generate a dummy "wersee-token"
      onVerify(`wersee-v1-${Math.random().toString(36).substring(7)}`);
    } else {
      // Reset
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
      onExpire();
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative p-6 rounded-3xl bg-white/[0.03] border border-white/[0.08] overflow-hidden group transition-all hover:border-white/20">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-24 h-24 bg-white/5 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center p-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Wersee Shield
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </h4>
              <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Slide to verify identity</p>
            </div>
          </div>

          <div 
            ref={containerRef}
            className="w-full h-16 bg-white/5 rounded-2xl border border-white/10 p-1 relative flex items-center overflow-hidden"
          >
            <motion.div 
              style={{ background, width: x }}
              className="absolute left-0 top-0 bottom-0 rounded-l-2xl"
            />
            
            <motion.div
              className="relative z-10 w-full text-center pointer-events-none"
              style={{ opacity }}
            >
              <span className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                Slide to verify <ArrowRight className="w-3 h-3" />
              </span>
            </motion.div>

            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: maxWidth }}
              dragElastic={0}
              dragMomentum={false}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              animate={controls}
              style={{ x, scale }}
              className={`absolute left-1 z-20 w-14 h-14 rounded-xl flex items-center justify-center transition-colors cursor-grab active:cursor-grabbing ${
                isVerified ? 'bg-emerald-500' : 'bg-white text-black'
              }`}
            >
              {isVerified ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <ArrowRight className={`w-6 h-6 transition-transform ${isDragging ? 'scale-110' : ''}`} />
              )}
            </motion.div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-white/30 font-medium uppercase tracking-widest">
            <Lock className="w-3 h-3" />
            <span>Secured by Wersee Custom Captcha</span>
          </div>
        </div>
      </div>
    </div>
  );
};
