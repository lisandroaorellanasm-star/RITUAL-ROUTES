import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';
import { LoadingSpinner, MicIcon, MicOffIcon } from './icons';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob } from '../utils/audioUtils';

interface ChatWindowProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    t: { [key: string]: string };
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading, t }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const transcriptionSegmentRef = useRef('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input);
            setInput('');
        }
    };

    const stopTranscription = useCallback(() => {
        if (!sessionPromiseRef.current) return;
        
        sessionPromiseRef.current?.then((session) => {
            session.close();
        });
        sessionPromiseRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        if (audioContextRef.current?.state !== 'closed') {
            audioContextRef.current?.close().catch(console.error);
        }

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        setIsTranscribing(false);
        inputRef.current?.focus();
    }, []);

    const startTranscription = useCallback(async () => {
        if (isTranscribing) return;

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsTranscribing(true);
            setInput('');
            setTranscriptionError(null);
            transcriptionSegmentRef.current = '';
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    inputAudioTranscription: {},
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
                            setInput(transcriptionSegmentRef.current);
                        }
                        if (message.serverContent?.turnComplete) {
                            transcriptionSegmentRef.current += ' ';
                            setInput(transcriptionSegmentRef.current);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setTranscriptionError(t.errorVoiceAgent);
                        stopTranscription();
                    },
                    onclose: () => {
                        // Check if we initiated the close, if not, it might be an unexpected close
                        if (isTranscribing) {
                            setIsTranscribing(false);
                        }
                    },
                },
            });

        } catch (err) {
            console.error('Failed to start transcription:', err);
            setTranscriptionError(t.errorMicrophone);
            setIsTranscribing(false);
        }

    }, [isTranscribing, t, stopTranscription]);

    useEffect(() => {
        return () => {
            stopTranscription();
        }
    }, [stopTranscription]);

    const handleMicToggle = () => {
        if (isTranscribing) {
            stopTranscription();
        } else {
            startTranscription();
        }
    };


    return (
        <div className="flex flex-col h-full bg-slate-800/50 border border-slate-700 rounded-lg animate-fade-in">
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-sky-600 flex-shrink-0"></div>}
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${msg.role === 'user' ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                 {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-sky-600 flex-shrink-0"></div>
                        <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl bg-slate-700 text-slate-200">
                           <LoadingSpinner />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-700">
                {transcriptionError && <p className="text-red-400 text-sm mb-2 text-center">{transcriptionError}</p>}
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isTranscribing ? t.listening + '...' : t.chatPlaceholder}
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-800"
                        disabled={isLoading || isTranscribing}
                    />
                    <button 
                        type="button" 
                        onClick={handleMicToggle} 
                        disabled={isLoading}
                        className={`p-2 rounded-md transition-all duration-200 shrink-0 ${isTranscribing ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
                        aria-label={isTranscribing ? 'Stop recording' : 'Start recording'}
                    >
                       {isTranscribing ? <MicOffIcon /> : <MicIcon />}
                    </button>
                    <button type="submit" disabled={isLoading || !input.trim()} className="bg-sky-600 text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50">{t.send}</button>
                </form>
            </div>
        </div>
    );
};