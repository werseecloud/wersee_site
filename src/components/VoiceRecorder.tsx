import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Trash2, Loader2, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { hapticFeedback } from '../lib/haptics';

import { appToast } from '@/lib/feedback';
interface VoiceRecorderProps {
  onSend: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
  bucket?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel, bucket = 'chat-attachments' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      hapticFeedback('medium');
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      appToast('Microphone access denied. Please enable microphone permissions in your browser settings.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      hapticFeedback('light');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    
    hapticFeedback('medium');
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let fileName = `voice-message-${Date.now()}.webm`;
      if (bucket === 'business_storage') {
        fileName = `${user.id}/voice-messages/${fileName}`;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, audioBlob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onSend(publicUrl, recordingTime);
    } catch (error) {
      console.error('Error uploading voice message:', error);
      appToast('Failed to send voice message');
    } finally {
      setIsUploading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioBlob) return;

    hapticFeedback('light');
    if (!audioPlayerRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioPlayerRef.current = new Audio(url);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-4 bg-[#1A1A1A] p-2 rounded-2xl w-full border border-white/10"
    >
      <button 
        onClick={() => {
          hapticFeedback('light');
          onCancel();
        }}
        className="p-2 hover:bg-white/10 rounded-full text-red-400 transition-colors"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {isRecording ? (
        <div className="flex-1 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-mono">{formatTime(recordingTime)}</span>
          <div className="flex-1 h-8 flex items-center gap-1 justify-center opacity-50">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [4, 16, 4] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1, 
                  delay: i * 0.1 
                }}
                className="w-1 bg-red-500 rounded-full"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-3">
          <button 
            onClick={togglePlayback}
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white/50 w-full" />
          </div>
          <span className="text-xs text-gray-400">{formatTime(recordingTime)}</span>
        </div>
      )}

      {isRecording ? (
        <button 
          onClick={stopRecording}
          className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
        >
          <Square className="w-5 h-5 fill-current" />
        </button>
      ) : (
        <button 
          onClick={handleSend}
          disabled={isUploading}
          className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors shadow-lg disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      )}
    </motion.div>
  );
};
