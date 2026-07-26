import React, { useRef, useState } from 'react';
import { Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';

type QuickPayVideoPlayerProps = {
  src: string;
  poster?: string;
  title: string;
  className?: string;
  cover?: boolean;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
};

export const QuickPayVideoPlayer = ({
  src,
  poster,
  title,
  className = '',
  cover = false,
}: QuickPayVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play();
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const enterFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) await video.requestFullscreen();
    else if ('webkitEnterFullscreen' in video) (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
  };

  return (
    <div className={`group relative overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        muted={muted}
        autoPlay={cover}
        loop={cover}
        aria-label={title}
        onClick={() => void togglePlayback()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        className={`h-full w-full cursor-pointer ${cover ? 'object-cover' : 'object-contain'}`}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3 text-white">
        <button
          type="button"
          onClick={() => void togglePlayback()}
          aria-label={playing ? 'Pause video' : 'Play video'}
          className="rounded-full bg-black/45 p-2 backdrop-blur-md transition hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-white/70"
        >
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            aria-label="Video progress"
            onChange={(event) => {
              const nextTime = Number(event.target.value);
              if (videoRef.current) videoRef.current.currentTime = nextTime;
              setCurrentTime(nextTime);
            }}
            className="h-1 w-full cursor-pointer accent-yellow-400"
          />
          <div className="mt-0.5 font-mono text-[9px] text-white/70">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          className="rounded-full p-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => void enterFullscreen()}
          aria-label="Open video fullscreen"
          className="rounded-full p-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
