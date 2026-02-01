import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: "circle" | "square" | "star";
  delay: number;
}

const GOLD_COLORS = [
  "#FFD700", // Gold
  "#FFA500", // Orange
  "#DAA520", // Goldenrod
  "#F0E68C", // Khaki
  "#FFDF00", // Golden yellow
  "#FFB900", // Selective yellow
];

const generateParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -20 - Math.random() * 30,
    rotation: Math.random() * 360,
    scale: 0.3 + Math.random() * 0.7,
    color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
    shape: (["circle", "square", "star"] as const)[Math.floor(Math.random() * 3)],
    delay: Math.random() * 0.5,
  }));
};

const StarShape = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" fill={color} className="w-full h-full">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

interface GoldenConfettiProps {
  isActive: boolean;
  duration?: number;
}

export function GoldenConfetti({ isActive, duration = 4000 }: GoldenConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isActive) {
      setParticles(generateParticles(60));
      setShowConfetti(true);

      const timeout = setTimeout(() => {
        setShowConfetti(false);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [isActive, duration]);

  return (
    <AnimatePresence>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.x}%`,
                width: `${12 * particle.scale}px`,
                height: `${12 * particle.scale}px`,
              }}
              initial={{
                y: `${particle.y}vh`,
                rotate: particle.rotation,
                opacity: 1,
              }}
              animate={{
                y: "120vh",
                rotate: particle.rotation + 720,
                x: [0, Math.sin(particle.id) * 50, Math.cos(particle.id) * -50, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: particle.delay,
                ease: "easeOut",
                x: {
                  duration: 3 + Math.random() * 2,
                  repeat: 0,
                  ease: "easeInOut",
                },
              }}
            >
              {particle.shape === "circle" && (
                <div
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: particle.color }}
                />
              )}
              {particle.shape === "square" && (
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: particle.color }}
                />
              )}
              {particle.shape === "star" && <StarShape color={particle.color} />}
            </motion.div>
          ))}
          
          {/* Sparkle burst effect */}
          <motion.div
            className="absolute top-1/4 left-1/2 -translate-x-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2, 3], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-radial from-primary/60 via-primary/20 to-transparent blur-2xl" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
