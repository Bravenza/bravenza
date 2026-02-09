import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronLeft, ChevronRight, Play, Pause, 
  Volume2, VolumeX, Maximize2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface MediaItem {
  url: string;
  type: "image" | "video";
}

interface MediaGalleryProps {
  items: MediaItem[];
  onDoubleClick?: () => void;
}

export function MediaGallery({ items, onDoubleClick }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const gridClass = items.length === 1 
    ? "grid-cols-1" 
    : items.length === 2 
      ? "grid-cols-2" 
      : items.length === 3 
        ? "grid-cols-2" 
        : "grid-cols-2";

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(prog);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = (value[0] / 100) * videoRef.current.duration;
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (selectedIndex !== null && items[selectedIndex]?.type === "video") {
      setIsPlaying(false);
      setProgress(0);
    }
  }, [selectedIndex, items]);

  if (items.length === 0) return null;

  return (
    <>
      {/* Grid Preview */}
      <div 
        className={cn("grid gap-1 rounded-xl overflow-hidden", gridClass)}
        onDoubleClick={onDoubleClick}
      >
        {items.slice(0, 4).map((item, i) => (
          <motion.div
            key={i}
            className={cn(
              "relative bg-muted cursor-pointer group overflow-hidden",
              items.length === 1 ? "aspect-video" : "aspect-square",
              items.length === 3 && i === 0 && "row-span-2 aspect-auto h-full"
            )}
            onClick={() => setSelectedIndex(i)}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {item.type === "video" ? (
              <>
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Play className="h-6 w-6 text-black fill-black ml-1" />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={item.url}
                alt=""
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            )}
            
            {/* Overlay for +N more */}
            {i === 3 && items.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl font-bold text-white">
                  +{items.length - 4}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-xl flex flex-col"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 shrink-0">
              <span className="text-white/60 text-sm font-medium tracking-wide">
                {selectedIndex + 1} / {items.length}
              </span>
              <button
                onClick={() => setSelectedIndex(null)}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex items-center justify-center relative min-h-0 px-4 sm:px-16">
              {/* Navigation arrows */}
              {items.length > 1 && (
                <>
                  <button
                    className="absolute left-2 sm:left-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(selectedIndex === 0 ? items.length - 1 : selectedIndex - 1);
                    }}
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                  <button
                    className="absolute right-2 sm:right-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(selectedIndex === items.length - 1 ? 0 : selectedIndex + 1);
                    }}
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                </>
              )}

              {/* Media content */}
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="max-w-full max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {items[selectedIndex]?.type === "video" ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <video
                      ref={videoRef}
                      src={items[selectedIndex].url}
                      className="max-w-[90vw] max-h-[75vh] sm:max-h-[80vh] rounded-2xl"
                      onTimeUpdate={handleVideoTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                      muted={isMuted}
                      playsInline
                      onClick={togglePlay}
                    />
                    
                    {/* Video Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
                      <div className="flex items-center gap-3">
                        <button
                          className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                          onClick={togglePlay}
                        >
                          {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
                        </button>
                        
                        <Slider
                          value={[progress]}
                          onValueChange={handleSeek}
                          max={100}
                          step={0.1}
                          className="flex-1"
                        />
                        
                        <button
                          className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                          onClick={() => setIsMuted(!isMuted)}
                        >
                          {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={items[selectedIndex]?.url}
                    alt=""
                    className="max-w-[90vw] max-h-[75vh] sm:max-h-[80vh] rounded-2xl object-contain shadow-2xl"
                  />
                )}
              </motion.div>
            </div>

            {/* Bottom thumbnails */}
            {items.length > 1 && (
              <div className="shrink-0 flex justify-center py-3 px-4">
                <div className="flex gap-2 max-w-[90vw] overflow-x-auto px-2 pb-1 scrollbar-hide">
                  {items.map((item, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(i);
                      }}
                      className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                        i === selectedIndex 
                          ? "border-white ring-2 ring-white/30 scale-105" 
                          : "border-white/10 opacity-50 hover:opacity-80"
                      )}
                    >
                      {item.type === "video" ? (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
