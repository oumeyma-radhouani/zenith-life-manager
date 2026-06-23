import React, { useState, useRef, useEffect } from 'react';

const TRACKS = [
  { title: "synth_type", src: "/synth_type.mp3" },
  { title: "blue_sky", src: "/blue_sky.mp3" },
  { title: "007_Synthwave_421k", src: "/007_Synthwave_421k.mp3" }
];

export default function MusicPlayer({ onMinimize }: { onMinimize?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const currentTrack = TRACKS[currentTrackIndex];

  // Handle Play/Pause
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex, isPlaying]);

  // Handle Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const handlePrev = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setProgress((current / duration) * 100 || 0);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - bounds.left) / bounds.width;
      audioRef.current.currentTime = percent * audioRef.current.duration;
    }
  };

  return (
    // The player is now a fully rounded, standalone 3D device with no ugly background!
    <div className="player-drag-handle w-[340px] bg-[#a8a8a8] rounded-[24px] p-4 relative cursor-grab active:cursor-grabbing border-t-[4px] border-l-[4px] border-b-[4px] border-r-[4px] border-t-[#dfdfdf] border-l-[#dfdfdf] border-b-[#5a5e5e] border-r-[#5a5e5e] shadow-[8px_8px_0px_rgba(0,0,0,0.5)] flex flex-col gap-3">
      
      {/* Smooth Sliding Marquee CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes smoothMarquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-150%); }
        }
        .animate-smooth-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: smoothMarquee 8s linear infinite;
        }
      `}} />

      {/* Hidden Audio Engine */}
      <audio ref={audioRef} src={currentTrack.src} onTimeUpdate={handleTimeUpdate} onEnded={handleNext} />

      {/* Close/Minimize Button */}
      {onMinimize && (
        <button 
          onClick={(e) => { e.stopPropagation(); onMinimize(); }} 
          className="absolute -top-3 -left-3 w-8 h-8 bg-[#dfdfdf] border-[2px] border-black rounded-full text-black hover:bg-black hover:text-white font-bold text-xl z-50 flex items-center justify-center pb-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors"
        >
          x
        </button>
      )}

      {/* Spinning CD & Music Notes */}
      <div className="absolute -top-6 -right-2 flex items-center gap-1 z-20 pointer-events-none">
        <img src="/CD.png" className={`w-12 h-12 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] ${isPlaying ? 'animate-spin' : ''}`} style={{ imageRendering: 'pixelated', animationDuration: '3s' }} />
        <img src="/MusicNotes.png" className="w-10 h-10 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]" style={{ imageRendering: 'pixelated' }} />
      </div>

      {/* The Dark Screen */}
      <div className="w-full bg-[#1a1a1a] border-b-[4px] border-r-[4px] border-t-[4px] border-l-[4px] border-t-[#000] border-l-[#000] border-b-[#4a4e50] border-r-[#4a4e50] rounded-xl h-[70px] relative overflow-hidden flex flex-col justify-center px-3 shadow-[inset_0px_4px_10px_rgba(0,0,0,1)] mt-2">
        
        {/* Screen Glare */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '100% 4px' }}></div>
        
        {/* Animated Marquee Text */}
        <div className="w-full overflow-hidden relative flex items-center h-full">
          <span className="text-white font-mono font-bold text-2xl tracking-widest animate-smooth-marquee relative z-10" style={{ textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>
            {currentTrack.title}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center w-full px-2 mt-1 mb-2" onClick={handleProgressClick}>
        <div className="w-full h-2 bg-[#5a5e5e] rounded-full relative cursor-pointer shadow-[inset_0px_2px_4px_rgba(0,0,0,0.8)]">
          <div className="absolute top-1/2 -translate-y-1/2 h-4 w-3 bg-white border-[2px] border-black rounded-sm shadow-[2px_2px_0px_rgba(0,0,0,0.5)] transition-all duration-100 ease-linear pointer-events-none z-10" style={{ left: `calc(${progress}% - 6px)` }} />
          <div className="h-full bg-white rounded-l-full transition-all duration-100 ease-linear pointer-events-none" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Controls & Volume Row */}
      <div className="flex justify-between items-center px-2">
        
        {/* Prev Track */}
        <button onClick={handlePrev} className="hover:scale-110 active:translate-y-1 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)] transition-transform">
          <img src="/Play.png" className="w-8 h-8 scale-x-[-1]" style={{ imageRendering: 'pixelated' }} />
        </button>

        {/* Play / Pause Toggle */}
        <button onClick={togglePlayPause} className="hover:scale-105 active:translate-y-1 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.5)] transition-transform mx-2">
          <img 
            src={isPlaying ? "/PlayPause.png" : "/Play.png"} 
            className="w-14 h-14 object-contain" 
            style={{ imageRendering: 'pixelated' }} 
          />
        </button>

        {/* Next Track */}
        <button onClick={handleNext} className="hover:scale-110 active:translate-y-1 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)] transition-transform">
          <img src="/Play.png" className="w-8 h-8" style={{ imageRendering: 'pixelated' }} />
        </button>

        {/* Vertical Divider */}
        <div className="w-[2px] h-10 bg-[#5a5e5e] mx-2 shadow-[1px_0px_0px_rgba(255,255,255,0.5)]"></div>

        {/* Volume System */}
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => setIsMuted(!isMuted)} className="hover:scale-110 active:translate-y-1 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)] transition-transform">
            <img src={isMuted || volume === 0 ? "/SpeakerMute.png" : "/SpeakerOn.png"} className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
          </button>
          
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={isMuted ? 0 : volume} 
            onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
            className="w-16 h-2 rounded-full appearance-none outline-none cursor-pointer border-[2px] border-black shadow-[inset_0px_1px_2px_rgba(0,0,0,0.8)]"
            style={{ background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, #5a5e5e ${(isMuted ? 0 : volume) * 100}%)` }}
          />
        </div>

      </div>
    </div>
  );
}