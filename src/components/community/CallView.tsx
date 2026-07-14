import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Users, Radio, Settings, MonitorUp, Smile, ChevronDown, Check, X } from 'lucide-react';

interface CallViewProps {
  channel: any;
  user: any;
  onEndCall?: () => void;
  hideHeader?: boolean;
}

export const CallView: React.FC<CallViewProps> = ({ channel, user, onEndCall, hideHeader }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(channel.type === 'voice');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [peers, setPeers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [callMetadata, setCallMetadata] = useState<any>(null);

  // New states for Devices, Emojis, and Speaking Indicators
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string, emoji: string, x: number }[]>([]);
  const [speakingUsers, setSpeakingUsers] = useState<Record<string, boolean>>({});

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const channelRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodesRef = useRef<Record<string, AnalyserNode>>({});
  const animationFrameRef = useRef<number | null>(null);

  const [iceServers, setIceServers] = useState<any>({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        setDevices(devs);
        const audioInput = devs.find(d => d.kind === 'audioinput');
        const videoInput = devs.find(d => d.kind === 'videoinput');
        if (audioInput && !selectedAudioDevice) setSelectedAudioDevice(audioInput.deviceId);
        if (videoInput && !selectedVideoDevice) setSelectedVideoDevice(videoInput.deviceId);
      } catch (err) {
        console.error("Error enumerating devices", err);
      }
    };
    getDevices();
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  const setupAudioAnalyser = (stream: MediaStream, userId: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserNodesRef.current[userId] = analyser;
    } catch (err) {
      console.error("Error setting up audio analyser", err);
    }
  };

  const checkSpeaking = () => {
    const newSpeakingState: Record<string, boolean> = {};
    const dataArray = new Uint8Array(256);
    
    Object.entries(analyserNodesRef.current).forEach(([id, analyser]) => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      newSpeakingState[id] = average > 15; // threshold
    });

    setSpeakingUsers(newSpeakingState);
    animationFrameRef.current = requestAnimationFrame(checkSpeaking);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(checkSpeaking);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const triggerEmoji = (emoji: string, senderId: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const x = Math.random() * 100 - 50; 
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 3000);
  };

  const sendEmoji = (emoji: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'emoji',
        payload: { emoji, userId: user.id }
      });
      triggerEmoji(emoji, user.id);
      setShowEmojis(false);
    }
  };

  const switchDevice = async (kind: 'audioinput' | 'videoinput', deviceId: string) => {
    if (kind === 'audioinput') setSelectedAudioDevice(deviceId);
    if (kind === 'videoinput') setSelectedVideoDevice(deviceId);

    try {
      const isVideo = channel.type === 'video' || channel.type === 'stream';
      const constraints: MediaStreamConstraints = {
        audio: kind === 'audioinput' ? { deviceId: { exact: deviceId } } : (selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true),
        video: isVideo ? (kind === 'videoinput' ? { deviceId: { exact: deviceId }, width: 1280, height: 720 } : (selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice }, width: 1280, height: 720 } : { width: 1280, height: 720 })) : false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (localStream) {
        if (kind === 'audioinput') {
          const newAudioTrack = newStream.getAudioTracks()[0];
          const oldAudioTrack = localStream.getAudioTracks()[0];
          if (oldAudioTrack) {
            localStream.removeTrack(oldAudioTrack);
            oldAudioTrack.stop();
          }
          localStream.addTrack(newAudioTrack);
          
          Object.values(peersRef.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
            if (sender) sender.replaceTrack(newAudioTrack);
          });
          setupAudioAnalyser(newStream, user.id);
        } else if (kind === 'videoinput') {
          const newVideoTrack = newStream.getVideoTracks()[0];
          const oldVideoTrack = localStream.getVideoTracks()[0];
          if (oldVideoTrack) {
            localStream.removeTrack(oldVideoTrack);
            oldVideoTrack.stop();
          }
          localStream.addTrack(newVideoTrack);
          
          Object.values(peersRef.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(newVideoTrack);
          });
        }
      }
    } catch (err) {
      console.error("Error switching device", err);
    }
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCall = async () => {
      try {
        // Call our advanced Edge Function to register the call and get TURN credentials
        const res = await fetch('/api/calls/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            channelId: channel.id, 
            userId: user.id 
          })
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to initialize call');
        }

        const initData = await res.json();

        if (initData.callId) {
          setCallId(initData.callId);
        }
        if (initData.turnConfig) {
          setIceServers(initData.turnConfig);
        }
        if (initData.metadata) {
          setCallMetadata(initData.metadata);
        }

        const isVideo = channel.type === 'video' || channel.type === 'stream';
        
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? { width: 1280, height: 720 } : false
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        setupAudioAnalyser(stream, user.id);
        setIsConnected(true);
        joinRoom(stream, initData.turnConfig || iceServers);
      } catch (err: any) {
        console.error('Error accessing media devices or init call:', err);
        setError(err.message || 'Could not access camera/microphone');
      }
    };

    startCall();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      leaveRoom();
    };
  }, [channel.id]);

  const joinRoom = (stream: MediaStream, currentIceServers: any) => {
    const room = supabase.channel(`webrtc-${channel.id}`, {
      config: {
        broadcast: { self: false },
        presence: { key: user.id }
      }
    });

    channelRef.current = room;

    room.on('presence', { event: 'sync' }, () => {
      const state = room.presenceState();
      const currentPeers = Object.keys(state).filter(id => id !== user.id);
      setPeers(currentPeers.map(id => ({ id, ...state[id][0] })));
    });

    room.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (key !== user.id) {
        createPeerConnection(key, stream, true, currentIceServers);
      }
    });

    room.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (peersRef.current[key]) {
        peersRef.current[key].close();
        delete peersRef.current[key];
        
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    });

    room.on('broadcast', { event: 'webrtc-signal' }, async ({ payload }) => {
      if (payload.target !== user.id) return;

      const { sender, signal } = payload;
      
      let pc = peersRef.current[sender];
      if (!pc) {
        pc = createPeerConnection(sender, stream, false, currentIceServers);
      }

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          room.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: { target: sender, sender: user.id, signal: answer }
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (err) {
        console.error('Error handling signal:', err);
      }
    });

    room.on('broadcast', { event: 'emoji' }, ({ payload }) => {
      const { emoji, userId: senderId } = payload;
      triggerEmoji(emoji, senderId);
    });

    room.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await room.track({ 
          user_id: user.id, 
          name: user.user_metadata?.full_name || 'User',
          avatar_url: user.user_metadata?.avatar_url
        });
      }
    });
  };

  const createPeerConnection = (targetId: string, stream: MediaStream, isInitiator: boolean, currentIceServers: any) => {
    const pc = new RTCPeerConnection(currentIceServers);
    peersRef.current[targetId] = pc;

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: { target: targetId, sender: user.id, signal: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [targetId]: event.streams[0]
      }));
      setupAudioAnalyser(event.streams[0], targetId);
    };

    if (isInitiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        channelRef.current?.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: { target: targetId, sender: user.id, signal: offer }
        });
      });
    }

    return pc;
  };

  const leaveRoom = async () => {
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    setRemoteStreams({});
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    // Notify edge function that call ended
    try {
      await fetch('/api/calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          callId: callId || channel.id, 
          channelId: channel.id,
          userId: user.id 
        })
      });
    } catch (err) {
      console.error('Error ending call:', err);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          stopScreenShare();
        };

        // Replace video track for all peers
        Object.values(peersRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  };

  const stopScreenShare = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <VideoOff className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white">Connection Error</h3>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0A] overflow-hidden relative">
      {/* Floating Emojis */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        <AnimatePresence>
          {floatingEmojis.map(emoji => (
            <motion.div
              key={emoji.id}
              initial={{ y: '100vh', opacity: 1, scale: 0.5, x: `calc(50vw + ${emoji.x}px)` }}
              animate={{ y: '-20vh', opacity: 0, scale: 2, x: `calc(50vw + ${emoji.x + (Math.random() * 100 - 50)}px)` }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute text-6xl drop-shadow-2xl"
            >
              {emoji.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Settings Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 right-8 w-80 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl p-4 z-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Device Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Microphone</label>
                <div className="relative">
                  <select 
                    value={selectedAudioDevice}
                    onChange={(e) => switchDevice('audioinput', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-white text-sm appearance-none focus:outline-none focus:border-indigo-500"
                  >
                    {devices.filter(d => d.kind === 'audioinput').map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.substr(0, 5)}`}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Camera</label>
                <div className="relative">
                  <select 
                    value={selectedVideoDevice}
                    onChange={(e) => switchDevice('videoinput', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-white text-sm appearance-none focus:outline-none focus:border-indigo-500"
                  >
                    {devices.filter(d => d.kind === 'videoinput').map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.substr(0, 5)}`}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-[#1A1A1A] border border-white/10 rounded-full shadow-2xl p-2 z-50 flex items-center gap-2"
          >
            {['👍', '❤️', '😂', '😮', '👏', '🔥', '🎉'].map(emoji => (
              <button
                key={emoji}
                onClick={() => sendEmoji(emoji)}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-white/10 rounded-full transition-colors hover:scale-110 transform"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      {!hideHeader && (
        <div className="absolute top-0 left-0 right-0 p-6 z-10 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center backdrop-blur-md">
              {channel.type === 'voice' ? <Mic className="w-5 h-5 text-indigo-400" /> : 
               channel.type === 'stream' ? <Radio className="w-5 h-5 text-rose-400" /> :
               <VideoIcon className="w-5 h-5 text-indigo-400" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight drop-shadow-md">{channel.name}</h2>
              <div className="flex items-center gap-2 text-white/80 text-sm font-medium drop-shadow-md">
                <Users className="w-4 h-4" />
                <span>{peers.length + 1} participant{peers.length + 1 !== 1 ? 's' : ''}</span>
                {callMetadata?.region && (
                  <span className="ml-2 px-2 py-0.5 bg-white/10 rounded-full text-[10px] uppercase tracking-wider">
                    {callMetadata.region}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 p-4 lg:p-8 flex items-center justify-center">
        <div className={`w-full max-w-6xl grid gap-4 ${
          Object.keys(remoteStreams).length === 0 ? 'grid-cols-1 max-w-3xl' :
          Object.keys(remoteStreams).length === 1 ? 'grid-cols-1 md:grid-cols-2' :
          Object.keys(remoteStreams).length <= 3 ? 'grid-cols-2' :
          'grid-cols-2 md:grid-cols-3'
        }`}>
          
          {/* Local Video */}
          <div className={`relative aspect-video bg-[#141414] rounded-[32px] overflow-hidden border-2 shadow-2xl group transition-colors duration-300 ${speakingUsers[user.id] ? 'border-green-500 shadow-green-500/20' : 'border-white/10'}`}>
            {channel.type !== 'voice' && !isVideoOff ? (
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${isScreenSharing ? '' : 'transform scale-x-[-1]'}`}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]">
                <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-4xl font-black text-indigo-400">
                    {user.user_metadata?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-medium text-sm flex items-center gap-2">
                You {isScreenSharing && '(Screen)'}
                {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
              </div>
            </div>
          </div>

          {/* Remote Videos */}
          {Object.entries(remoteStreams).map(([id, stream]) => {
            const peerInfo = peers.find(p => p.id === id);
            return (
              <div key={id} className={`relative aspect-video bg-[#141414] rounded-[32px] overflow-hidden border-2 shadow-2xl transition-colors duration-300 ${speakingUsers[id] ? 'border-green-500 shadow-green-500/20' : 'border-white/10'}`}>
                {channel.type !== 'voice' ? (
                  <video 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                    ref={el => { if (el) el.srcObject = stream; }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                      <span className="text-4xl font-black text-white/40">
                        {peerInfo?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-medium text-sm flex items-center gap-2">
                    {peerInfo?.name || 'Participant'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="h-24 bg-black/50 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-4 px-8">
        <button 
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {channel.type !== 'voice' && (
          <button 
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
          </button>
        )}

        {channel.type !== 'voice' && (
          <button 
            onClick={toggleScreenShare}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isScreenSharing ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <MonitorUp className="w-6 h-6" />
          </button>
        )}

        <button 
          onClick={() => setShowEmojis(!showEmojis)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            showEmojis ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Smile className="w-6 h-6" />
        </button>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            showSettings ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Settings className="w-6 h-6" />
        </button>

        <div className="w-px h-8 bg-white/10 mx-2" />

        <button 
          onClick={() => {
            if (onEndCall) {
              onEndCall();
            } else {
              window.location.reload();
            }
          }}
          className="w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-all shadow-lg shadow-red-500/20"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
