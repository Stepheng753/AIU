"use client";

import { Mic, Volume2, Loader2, MicOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceChatProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onClick: () => void;
  statusText: string;
  disabled?: boolean;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocity: { x: number; y: number };
}

export function VoiceChat({
  isListening,
  isProcessing,
  isSpeaking,
  onClick,
  statusText,
  disabled = false,
  className,
}: VoiceChatProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(0));
  const intervalRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  // Generate particles for ambient effect
  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 260 - 130, // Centered around the button
          y: Math.random() * 260 - 130,
          size: Math.random() * 2.5 + 1.5,
          opacity: Math.random() * 0.4 + 0.1,
          velocity: {
            x: (Math.random() - 0.5) * 0.4,
            y: (Math.random() - 0.5) * 0.4
          }
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  // Animate particles
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + particle.velocity.x + 130) % 260 - 130,
        y: (particle.y + particle.velocity.y + 130) % 260 - 130,
        opacity: Math.max(0.05, Math.min(0.5, particle.opacity + (Math.random() - 0.5) * 0.02))
      })));
      animationRef.current = requestAnimationFrame(animateParticles);
    };

    animationRef.current = requestAnimationFrame(animateParticles);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Waveform & volume simulation based on states
  useEffect(() => {
    const isActive = isListening || isSpeaking;
    if (isActive) {
      intervalRef.current = setInterval(() => {
        // Simulate audio waveform
        const maxVal = isListening ? 25 : 18;
        const newWaveform = Array(32).fill(0).map(() => 
          Math.random() * maxVal + 3
        );
        setWaveformData(newWaveform);
      }, 70);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Decay waveform
      setWaveformData(Array(32).fill(2));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isListening, isSpeaking]);

  // Color mapping based on states
  const getThemeColor = () => {
    if (isListening) return "#3b82f6"; // Blue
    if (isProcessing) return "#eab308"; // Yellow
    if (isSpeaking) return "#10b981"; // Green
    return "#9ca3af"; // Muted Gray
  };

  const getGlowShadow = () => {
    if (isListening) return "0 0 25px rgba(59, 130, 246, 0.35)";
    if (isProcessing) return "0 0 25px rgba(234, 179, 8, 0.3)";
    if (isSpeaking) return "0 0 25px rgba(16, 185, 129, 0.3)";
    return "0 4px 12px rgba(0, 0, 0, 0.05)";
  };

  return (
    <div 
      className={className} 
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        width: "100%",
        padding: "10px 0",
        fontFamily: "inherit"
      }}
    >
      {/* Background glow effects */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 0
        }}
      >
        <motion.div
          style={{
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            filter: "blur(40px)",
            background: isListening 
              ? "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)" 
              : isSpeaking 
              ? "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)" 
              : "transparent"
          }}
          animate={{
            scale: isListening || isSpeaking ? [1, 1.2, 1] : 1,
            opacity: isListening || isSpeaking ? [0.4, 0.8, 0.4] : 0
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Ambient floating particles */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 1
        }}
      >
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            style={{
              position: "absolute",
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderRadius: "50%",
              left: `calc(50% + ${particle.x}px)`,
              top: `calc(50% - 40px + ${particle.y}px)`, // centered slightly above the middle to align with button
              opacity: particle.opacity,
              backgroundColor: getThemeColor(),
            }}
            animate={{
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 2 + (particle.id % 2),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div 
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          width: "100%"
        }}
      >
        {/* Main circular button */}
        <motion.div
          whileHover={{ scale: disabled ? 1 : 1.03 }}
          whileTap={{ scale: disabled ? 1 : 0.97 }}
          style={{ position: "relative" }}
        >
          <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: `3px solid ${getThemeColor()}`,
              background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)",
              boxShadow: getGlowShadow(),
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
              cursor: disabled ? "not-allowed" : "pointer",
              outline: "none"
            }}
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="animate-spin" size={28} style={{ color: getThemeColor() }} />
                </motion.div>
              ) : isSpeaking ? (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Volume2 size={28} style={{ color: getThemeColor() }} />
                </motion.div>
              ) : isListening ? (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Mic size={28} style={{ color: getThemeColor() }} />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <MicOff size={28} style={{ color: "var(--text-secondary)" }} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Double outer pulse rings for listening */}
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div
                  style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: "50%",
                    border: `2px solid ${getThemeColor()}`,
                    pointerEvents: "none"
                  }}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.35, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Waveform visualizer (horizontal bar line aligned in middle) */}
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            height: "32px",
            width: "100%",
            maxWidth: "320px"
          }}
        >
          {waveformData.map((height, index) => (
            <motion.div
              key={index}
              style={{
                width: "3px",
                borderRadius: "9999px",
                backgroundColor: getThemeColor(),
                opacity: isListening || isSpeaking ? 1 : 0.15
              }}
              animate={{
                height: `${Math.max(4, height)}px`
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 15
              }}
            />
          ))}
        </div>

        {/* Status text */}
        <div style={{ textAlign: "center" }}>
          <motion.p
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: getThemeColor(),
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              margin: 0,
              transition: "color 0.3s ease"
            }}
            animate={isListening || isProcessing || isSpeaking ? { opacity: [1, 0.6, 1] } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {statusText}
          </motion.p>
        </div>

      </div>
    </div>
  );
}
