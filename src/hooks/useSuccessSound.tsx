import { useCallback, useRef } from "react";

// Create a success sound using Web Audio API
function createSuccessSound(audioContext: AudioContext): void {
  const now = audioContext.currentTime;
  
  // Create multiple oscillators for a rich sound
  const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - C major chord
  
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, now);
    
    // Stagger the start times slightly for an arpeggio effect
    const startTime = now + index * 0.05;
    const duration = 0.4;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  });
  
  // Add a higher note at the end for sparkle
  setTimeout(() => {
    const sparkleOsc = audioContext.createOscillator();
    const sparkleGain = audioContext.createGain();
    
    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(audioContext.destination);
    
    sparkleOsc.type = "sine";
    sparkleOsc.frequency.setValueAtTime(1046.5, audioContext.currentTime); // C6
    
    sparkleGain.gain.setValueAtTime(0, audioContext.currentTime);
    sparkleGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    sparkleOsc.start(audioContext.currentTime);
    sparkleOsc.stop(audioContext.currentTime + 0.3);
  }, 200);
}

export function useSuccessSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSuccessSound = useCallback(() => {
    try {
      // Create or resume audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      
      createSuccessSound(audioContext);
    } catch (error) {
      // Silently fail if audio is not supported
      logger.log("Audio not supported:", error);
    }
  }, []);

  return { playSuccessSound };
}
