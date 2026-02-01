import { motion } from "framer-motion";
import { Shield, CheckCircle } from "lucide-react";

export function HolographicSeal() {
  return (
    <div className="relative w-32 h-32 md:w-40 md:h-40">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, #FFD700, #FFA500, #FFD700, #DAA520, #FFD700)",
          filter: "blur(20px)",
          opacity: 0.5,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Main holographic container */}
      <motion.div
        className="absolute inset-2 rounded-full overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
          boxShadow: "0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)",
        }}
      >
        {/* Holographic effect layers */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.3) 50%, transparent 70%)",
          }}
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1,
          }}
        />
        
        <motion.div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%)",
          }}
          animate={{
            x: ["200%", "-100%"],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1.5,
          }}
        />
        
        {/* Rainbow holographic shimmer */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: "conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff80, #00ffff, #0080ff, #8000ff, #ff0080, #ff0000)",
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          {/* Shield icon with glow */}
          <motion.div
            className="relative"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="absolute inset-0 blur-md">
              <Shield className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>
            <Shield className="relative w-10 h-10 md:w-12 md:h-12 text-primary" />
          </motion.div>
          
          {/* Text */}
          <div className="mt-2 text-center">
            <p className="text-[10px] md:text-xs font-bold text-primary tracking-wider">
              AUTÊNTICO
            </p>
            <p className="text-[8px] md:text-[10px] text-white/70 tracking-widest">
              VERIFICADO
            </p>
          </div>
        </div>
        
        {/* Border ring */}
        <div 
          className="absolute inset-1 rounded-full border-2 border-primary/30"
          style={{
            boxShadow: "inset 0 0 10px rgba(255, 215, 0, 0.2)",
          }}
        />
        
        {/* Outer decorative ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid transparent",
            borderImage: "linear-gradient(45deg, #FFD700, transparent, #FFD700, transparent) 1",
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>
      
      {/* Check badge */}
      <motion.div
        className="absolute -bottom-1 -right-1 w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <CheckCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
      </motion.div>
    </div>
  );
}
