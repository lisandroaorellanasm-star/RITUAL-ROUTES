import React from 'react';
import { View } from '../types';
import { CompassIcon, MessageSquareIcon, MicIcon, MicOffIcon, SpeechToTextIcon } from './icons';

interface NavigationProps {
    currentView: View;
    onNavigate: (view: View) => void;
    isVoiceAgentActive: boolean;
    onStartVoiceAgent: () => void;
    onStopVoiceAgent: () => void;
    t: { [key: string]: string };
}

const NavButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${isActive ? 'text-teal-300' : 'text-slate-400 hover:text-slate-200'}`}
    >
        {icon}
        <span className="text-xs font-medium">{label}</span>
    </button>
);

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, isVoiceAgentActive, onStartVoiceAgent, onStopVoiceAgent, t }) => {
    const handleVoiceToggle = () => {
        if (isVoiceAgentActive) {
            onStopVoiceAgent();
        } else {
            onStartVoiceAgent();
        }
    };

    return (
        <footer className="sticky bottom-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700">
            <nav className="container mx-auto px-4 py-2 flex justify-around items-center">
                <NavButton
                    icon={<CompassIcon />}
                    label={t.itinerary}
                    isActive={currentView === View.ITINERARY}
                    onClick={() => onNavigate(View.ITINERARY)}
                />
                <NavButton
                    icon={<MessageSquareIcon />}
                    label={t.chat}
                    isActive={currentView === View.CHAT}
                    onClick={() => onNavigate(View.CHAT)}
                />
                 <NavButton
                    icon={<SpeechToTextIcon />}
                    label={t.transcription}
                    isActive={currentView === View.TRANSCRIPTION}
                    onClick={() => onNavigate(View.TRANSCRIPTION)}
                />
                <button
                    onClick={handleVoiceToggle}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${isVoiceAgentActive ? 'text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    {isVoiceAgentActive ? <MicOffIcon /> : <MicIcon />}
                    <span className="text-xs font-medium">{t.voiceGuide}</span>
                </button>
            </nav>
        </footer>
    );
};