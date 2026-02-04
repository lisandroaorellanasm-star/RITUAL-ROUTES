
import React, { useState, useEffect, useRef } from 'react';
import { getPlaceSuggestions } from '../services/geminiService';
import { LoadingSpinner, ChevronDownIcon } from './icons';

interface LocationInputProps {
    label: string;
    value: string;
    placeholder: string;
    type: 'country' | 'department' | 'municipality';
    context?: { country?: string; department?: string };
    onChange: (value: string) => void;
    disabled?: boolean;
    t: { [key: string]: string };
}

export const LocationInput: React.FC<LocationInputProps> = ({ 
    label, value, placeholder, type, context, onChange, disabled, t 
}) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (query: string) => {
        setIsSearching(true);
        const results = await getPlaceSuggestions(type, query, context);
        setSuggestions(results);
        setIsSearching(false);
        setIsOpen(results.length > 0);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
            fetchSuggestions(val);
        }, 600);
    };

    const handleToggleDropdown = async () => {
        if (disabled) return;
        if (isOpen) {
            setIsOpen(false);
        } else {
            // If we don't have suggestions yet or the value is empty, fetch them
            if (suggestions.length === 0 || !value) {
                await fetchSuggestions(value);
            }
            setIsOpen(true);
        }
    };

    const selectSuggestion = (suggestion: string) => {
        onChange(suggestion);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
            <div className="relative group">
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (!isOpen && !disabled) handleToggleDropdown();
                    }}
                    placeholder={placeholder}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md pl-3 pr-10 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all cursor-pointer"
                    disabled={disabled}
                />
                <button
                    type="button"
                    onClick={handleToggleDropdown}
                    disabled={disabled}
                    className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-slate-500 hover:text-teal-400 transition-colors border-l border-slate-700/50"
                >
                    {isSearching ? (
                        <LoadingSpinner />
                    ) : (
                        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon />
                        </div>
                    )}
                </button>
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-xl overflow-y-auto max-h-60 animate-fade-in ring-1 ring-white/5">
                    <li className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase bg-slate-900/40 border-b border-slate-700 sticky top-0">
                        {t.suggested}
                    </li>
                    {suggestions.map((s, i) => (
                        <li key={i}>
                            <button
                                type="button"
                                onClick={() => selectSuggestion(s)}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-teal-500/10 hover:text-teal-300 transition-all flex items-center gap-3 border-b border-white/5 last:border-0"
                            >
                                <span className={`w-2 h-2 rounded-full transition-colors ${value === s ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]' : 'bg-slate-600'}`}></span>
                                {s}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
