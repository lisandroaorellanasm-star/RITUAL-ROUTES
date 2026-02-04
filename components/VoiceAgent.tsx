import React, { useEffect, useRef } from 'react';
import { MicOffIcon } from './icons';

interface VoiceAgentProps {
    transcriptions: { user: string; model: string; final: boolean }[];
    onStop: () => void;
    t: { [key: string]: string };
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({ transcriptions, onStop, t }) => {
    const transcriptionsEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        transcriptionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptions]);

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-lg flex flex-col items-center justify-center z-20 animate-fade-in p-4">
            <div className="w-full max-w-4xl h-full flex flex-col">
                <div className="text-center pt-8 pb-4">
                    <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center">
                             <div className="w-20 h-20 rounded-full bg-slate-900"></div>
                        </div>
                        <div className="absolute inset-0 animate-ping rounded-full border-4 border-teal-400 opacity-75"></div>
                    </div>
                    <h2 className="text-3xl font-bold mt-4">{t.listening}</h2>
                    <p className="text-slate-400">{t.voiceAgentDescription}</p>
                </div>

                <div className="flex-grow overflow-y-auto space-y-4 p-4 text-lg">
                    {transcriptions.map((tItem, i) => (
                        <div key={i} className={`${tItem.final ? 'opacity-100' : 'opacity-60'}`}>
                            {tItem.user && <p><span className="font-semibold text-sky-400">{t.you}: </span>{tItem.user}</p>}
                            {tItem.model && <p><span className="font-semibold text-teal-300">{t.guide}: </span>{tItem.model}</p>}
                        </div>
                    ))}
                    <div ref={transcriptionsEndRef} />
                </div>

                <div className="py-8 text-center">
                    <button
                        onClick={onStop}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full inline-flex items-center gap-2 transition-colors"
                    >
                        <MicOffIcon />
                        {t.endSession}
                    </button>
                </div>
            </div>
        </div>
    );
};
