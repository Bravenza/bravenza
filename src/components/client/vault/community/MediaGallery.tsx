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

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation */}
            {items.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-10 text-white hover:bg-white/20 h-12 w-12"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(selectedIndex === 0 ? items.length - 1 : selectedIndex - 1);
                  }}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-10 text-white hover:bg-white/20 h-12 w-12"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(selectedIndex === items.length - 1 ? 0 : selectedIndex + 1);
                  }}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Content */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-[90vw] max-h-[85vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {items[selectedIndex]?.type === "video" ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={items[selectedIndex].url}
                    className="max-w-full max-h-[80vh] rounded-lg"
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    muted={isMuted}
                    playsInline
                    onClick={togglePlay}
                  />
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 h-10 w-10"
                        onClick={togglePlay}
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      
                      <Slider
                        value={[progress]}
                        onValueChange={handleSeek}
                        max={100}
                        step={0.1}
                        className="flex-1"
                      />
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 h-10 w-10"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={items[selectedIndex]?.url}
                  alt=""
                  className="max-w-full max-h-[85vh] rounded-lg object-contain"
                />
              )}
            </motion.div>

            {/* Thumbnails */}
            {items.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {items.map((item, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(i);
                    }}
                    className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                      i === selectedIndex ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    {item.type === "video" ? (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/80 text-sm font-medium">
              {selectedIndex + 1} / {items.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
