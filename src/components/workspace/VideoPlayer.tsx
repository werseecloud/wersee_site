import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, PictureInPicture } from 'lucide-react';
import { ContentProtection } from './ContentProtection';

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
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

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (isMuted) {
        videoRef.current.volume = volume || 1;
      } else {
        videoRef.current.volume = 0;
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(Number(e.target.value));
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed', error);
    }
  };

  const changePlaybackRate = () => {
    if (!videoRef.current) return;
    const rates = [1, 1.25, 1.5, 2, 0.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    videoRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <ContentProtection contentId={src}>
      <div 
        ref={containerRef}
        className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 group"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
        
        {/* Center Play Button Overlay */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 pointer-events-none
            ${!isPlaying || showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-110 hover:bg-white/20 transition-all pointer-events-auto group/btn"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white fill-white group-hover/btn:scale-110 transition-transform" />
            ) : (
              <Play className="w-10 h-10 text-white fill-white ml-1 group-hover/btn:scale-110 transition-transform" />
            )}
          </button>
        </div>

        {/* Bottom Controls Bar */}
        <div 
          className={`absolute bottom-0 inset-x-0 p-6 sm:p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-500 transform
            ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Progress Bar */}
          <div className="relative h-1.5 w-full bg-white/10 rounded-full mb-6 group/progress cursor-pointer flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full relative pointer-events-none shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl scale-0 group-hover/progress:scale-100 transition-all duration-300" />
            </div>
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="hover:text-indigo-400 transition-all hover:scale-110 active:scale-90">
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>
              
              <div className="flex items-center gap-3 group/volume">
                <button onClick={toggleMute} className="hover:text-indigo-400 transition-all hover:scale-110 active:scale-90">
                  {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <div className="w-0 group-hover/volume:w-24 transition-all duration-500 overflow-hidden flex items-center">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              <span className="text-[10px] font-black font-mono tracking-widest opacity-60">
                {formatTime(currentTime)} <span className="mx-1 opacity-30">/</span> {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center gap-5">
              <button 
                onClick={changePlaybackRate}
                className="text-[10px] font-black tracking-widest px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
              >
                {playbackRate}x
              </button>
              <button onClick={togglePiP} className="hover:text-indigo-400 transition-all hover:scale-110 active:scale-90" title="Picture in Picture">
                <PictureInPicture className="w-6 h-6" />
              </button>
              <button onClick={toggleFullscreen} className="hover:text-indigo-400 transition-all hover:scale-110 active:scale-90">
                {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ContentProtection>
  );
};
