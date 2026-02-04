import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed non-exported member `LiveSession` and added `Modality`.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MicIcon, MicOffIcon } from './icons';
import { createBlob } from '../utils/audioUtils';

interface TranscriptionViewProps {
    t: { [key: string]: string };
}

export const TranscriptionView: React.FC<TranscriptionViewProps> = ({ t }) => {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // FIX: `LiveSession` is not an exported type. Using `any` for the promise result.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const transcriptionSegmentRef = useRef('');

    const stopTranscription = useCallback(() => {
        sessionPromiseRef.current?.then((session) => {
            session.close();
        });
        sessionPromiseRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        if (audioContextRef.current?.state !== 'closed') {
            audioContextRef.current?.close();
        }

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        setIsTranscribing(false);
    }, []);

    const startTranscription = useCallback(async () => {
        if (isTranscribing) return;

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsTranscribing(true);
            setTranscription('');
            setError(null);
            transcriptionSegmentRef.current = '';
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    inputAudioTranscription: {},
                    // FIX: Used Modality.AUDIO enum instead of string literal 'AUDIO'
                    responseModalities: [Modality.AUDIO] // Required by API, but we'll ignore audio output
                },
                callbacks: {
                    onopen: () => {
                        if (!streamRef.current) return;
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            transcriptionSegmentRef.current += message.serverContent.inputTranscription.text;
                            setTranscription(transcriptionSegmentRef.current);
                        }
                        if (message.serverContent?.turnComplete) {
                            transcriptionSegmentRef.current += ' ';
                            setTranscription(transcriptionSegmentRef.current);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError(t.errorVoiceAgent);
                        stopTranscription();
                    },
                    onclose: () => {
                        setIsTranscribing(false);
                    },
                },
            });

        } catch (err) {
            console.error('Failed to start transcription:', err);
            setError(t.errorMicrophone);
            setIsTranscribing(false);
        }

    }, [isTranscribing, t, stopTranscription]);

    useEffect(() => {
        return () => {
            stopTranscription();
        }
    }, [stopTranscription]);

    const handleToggle = () => {
        if (isTranscribing) {
            stopTranscription();
        } else {
            startTranscription();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in">
            <div className="max-w-3xl w-full">
                <h2 className="text-3xl md:text-4xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-br from-slate-200 to-slate-400">
                    {t.transcription}
                </h2>
                <p className="text-slate-400 mt-4 mb-8">
                    {t.transcriptionDescription}
                </p>

                <div className="space-y-6">
                    <button
                        onClick={handleToggle}
                        className={`inline-flex items-center justify-center gap-3 font-semibold px-8 py-4 rounded-full transition-colors text-white ${
                            isTranscribing 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-gradient-to-r from-teal-500 to-sky-600 hover:opacity-90'
                        }`}
                    >
                        {isTranscribing ? <MicOffIcon /> : <MicIcon />}
                        <span>{isTranscribing ? t.stopTranscribing : t.startTranscribing}</span>
                    </button>

                    {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md text-left">{error}</div>}

                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 min-h-[200px] text-left">
                         <h3 className="font-semibold text-slate-300 mb-2">{t.transcriptionResult}</h3>
                         <p className="text-slate-100 whitespace-pre-wrap">{transcription || '...'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
