
import React, { useState, useMemo } from 'react';
import { LoadingSpinner, SparklesIcon } from './icons';
import { ItineraryRequest, Budget, Stop } from '../types';
import { LocationInput } from './LocationInput';

interface DestinationFormProps {
    onGenerate: (data: ItineraryRequest) => void;
    isLoading: boolean;
    t: { [key: string]: string };
}

const createInitialStop = (): Stop => ({
    id: crypto.randomUUID(),
    municipality: '',
    department: '',
    country: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    arrivalTime: '09:00 AM',
    departureDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    departureTime: '05:00 PM',
});

export const DestinationForm: React.FC<DestinationFormProps> = ({ onGenerate, isLoading, t }) => {
    const [stops, setStops] = useState<Stop[]>([createInitialStop()]);
    const [budget, setBudget] = useState<Budget>('moderate');
    const [useProModel, setUseProModel] = useState<boolean>(false);
    const [showValidationError, setShowValidationError] = useState(false);

    const addStop = () => {
        const lastStop = stops[stops.length - 1];
        const newArrival = lastStop ? lastStop.departureDate : new Date().toISOString().split('T')[0];
        const newDeparture = new Date(new Date(newArrival).getTime() + 86400000 * 2).toISOString().split('T')[0];
        
        setStops([...stops, {
            ...createInitialStop(),
            arrivalDate: newArrival,
            departureDate: newDeparture
        }]);
    };

    const removeStop = (id: string) => {
        if (stops.length > 1) {
            setStops(stops.filter(s => s.id !== id));
        }
    };

    const updateStop = (id: string, updates: Partial<Stop>) => {
        setStops(stops.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const validation = useMemo(() => {
        const hasCities = stops.every(s => s.municipality.trim() !== '');
        const datesValid = stops.every(s => {
            const arr = new Date(`${s.arrivalDate} ${s.arrivalTime}`);
            const dep = new Date(`${s.departureDate} ${s.departureTime}`);
            return dep > arr;
        });
        return { hasCities, datesValid };
    }, [stops]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowValidationError(true);
        if (validation.hasCities && validation.datesValid && !isLoading) {
            onGenerate({ stops, budget, useProModel });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="max-w-4xl w-full">
                <div className="flex justify-center mb-2"><SparklesIcon /></div>
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-slate-200 to-slate-400">
                    {t.whereDoesYourJourneyBegin}
                </h2>
                <p className="text-slate-400 mt-4 mb-8">
                    {t.destinationFormDescription}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                    <div className="space-y-6">
                        {stops.map((stop, index) => (
                            <div key={stop.id} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 relative animate-fade-in shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-xs">
                                            {index + 1}
                                        </div>
                                        <h3 className="font-bold text-slate-300 uppercase tracking-wider text-sm">
                                            {t.stopNumber}
                                        </h3>
                                    </div>
                                    {stops.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeStop(stop.id)}
                                            className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                                        >
                                            {t.removeStop}
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <LocationInput
                                        label={t.country}
                                        value={stop.country}
                                        type="country"
                                        placeholder={t.countryPlaceholder}
                                        onChange={(val) => updateStop(stop.id, { country: val, department: '', municipality: '' })}
                                        disabled={isLoading}
                                        t={t}
                                    />
                                    <LocationInput
                                        label={t.department}
                                        value={stop.department}
                                        type="department"
                                        context={{ country: stop.country }}
                                        placeholder={t.departmentPlaceholder}
                                        onChange={(val) => updateStop(stop.id, { department: val, municipality: '' })}
                                        disabled={isLoading || !stop.country}
                                        t={t}
                                    />
                                    <LocationInput
                                        label={t.municipality}
                                        value={stop.municipality}
                                        type="municipality"
                                        context={{ country: stop.country, department: stop.department }}
                                        placeholder={t.municipalityPlaceholder}
                                        onChange={(val) => updateStop(stop.id, { municipality: val })}
                                        disabled={isLoading || !stop.department}
                                        t={t}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-700/50">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">{t.arrival}</label>
                                            <input 
                                                type="date" 
                                                value={stop.arrivalDate} 
                                                onChange={e => updateStop(stop.id, { arrivalDate: e.target.value })} 
                                                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500" 
                                                disabled={isLoading} 
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">{t.time}</label>
                                            <input 
                                                type="text" 
                                                value={stop.arrivalTime} 
                                                onChange={e => updateStop(stop.id, { arrivalTime: e.target.value })} 
                                                placeholder="09:00 AM"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500" 
                                                disabled={isLoading} 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">{t.departure}</label>
                                            <input 
                                                type="date" 
                                                value={stop.departureDate} 
                                                onChange={e => updateStop(stop.id, { departureDate: e.target.value })} 
                                                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500" 
                                                disabled={isLoading} 
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">{t.time}</label>
                                            <input 
                                                type="text" 
                                                value={stop.departureTime} 
                                                onChange={e => updateStop(stop.id, { departureTime: e.target.value })} 
                                                placeholder="05:00 PM"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500" 
                                                disabled={isLoading} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addStop}
                        disabled={isLoading}
                        className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 font-semibold hover:border-teal-500 hover:text-teal-400 transition-all flex items-center justify-center gap-2 group"
                    >
                        <div className="group-hover:scale-110 transition-transform"><SparklesIcon /></div>
                        {t.addStop}
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">{t.budget}</label>
                            <select
                                value={budget}
                                onChange={(e) => setBudget(e.target.value as Budget)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-md px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                disabled={isLoading}
                            >
                                <option value="budget">{t.budgetFriendly}</option>
                                <option value="moderate">{t.moderate}</option>
                                <option value="luxury">{t.luxury}</option>
                            </select>
                        </div>
                        <div className="flex items-center bg-slate-800/50 p-4 rounded-md border border-slate-700">
                            <label htmlFor="thinking-mode" className="flex items-center gap-3 cursor-pointer w-full">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        id="thinking-mode" 
                                        className="sr-only"
                                        checked={useProModel}
                                        onChange={(e) => setUseProModel(e.target.checked)}
                                        disabled={isLoading}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${useProModel ? 'bg-teal-500' : 'bg-slate-700'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useProModel ? 'translate-x-full' : ''}`}></div>
                                </div>
                                <div className="ml-2">
                                    <span className="font-medium text-slate-200">{t.thinkingMode}</span>
                                    <p className="text-xs text-slate-400">{t.thinkingModeDescription}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !validation.hasCities || !validation.datesValid}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-sky-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-teal-500/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoadingSpinner /> : t.generateJourney}
                    </button>
                    
                    {showValidationError && !validation.hasCities && <p className="text-red-400 text-sm mt-2 text-center">{t.cityRequired}</p>}
                    {showValidationError && validation.hasCities && !validation.datesValid && <p className="text-red-400 text-sm mt-2 text-center">{t.departureAfterArrival}</p>}
                </form>
            </div>
        </div>
    );
};
