
import React, { useState, useEffect } from 'react';
import { Itinerary, ItineraryDay, ItineraryItem, GroundingChunk } from '../types';
import { PlayIcon, MapPinIcon, SearchIcon, CalendarPlusIcon, TagIcon } from './icons';
import { MapView } from './MapView';

interface ItineraryDisplayProps {
    itinerary: Itinerary;
    groundingChunks: GroundingChunk[];
    onPlayAudio: (text: string) => void;
    onAddToCalendar: (item: ItineraryItem | ItineraryDay) => void;
    t: { [key: string]: string };
}

interface ItineraryCardProps {
    item: ItineraryItem;
    dayNumber: number;
    onPlayAudio: (text: string) => void;
    onAddToCalendar: (item: ItineraryItem) => void;
    onSelectItem: (item: ItineraryItem) => void;
    isSelected: boolean;
    t: { [key: string]: string };
}

const slugify = (text: string) => 
    String(text).toLowerCase().replace(/[\s\W_]+/g, '-');


const ItineraryItemCard: React.FC<ItineraryCardProps> = ({ item, dayNumber, onPlayAudio, onAddToCalendar, onSelectItem, isSelected, t }) => {
    const isMappable = item.latitude != null && item.longitude != null;
    const elementId = `itinerary-item-${dayNumber}-${slugify(item.time)}-${slugify(item.activity)}`;
    
    const baseClasses = 'flex gap-4 transition-colors relative';
    const mappableClasses = isMappable ? 'cursor-pointer rounded-lg p-3 -m-3 hover:bg-slate-700/50' : 'p-3 -m-3';
    const selectedClasses = isSelected ? 'bg-slate-700/70 rounded-lg' : '';

    return (
        <div 
            id={elementId}
            className={`${baseClasses} ${selectedClasses || mappableClasses}`}
            onClick={() => isMappable && onSelectItem(item)}
            role={isMappable ? 'button' : undefined}
            tabIndex={isMappable ? 0 : undefined}
            onKeyDown={(e) => {
                if (isMappable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectItem(item);
                }
            }}
        >
             {isSelected && <div className="absolute left-[-22px] top-1 w-3.5 h-3.5 bg-teal-500 border-2 border-slate-900 rounded-full animate-pulse"></div>}
            <div className="w-20 text-right text-teal-400 font-mono text-sm shrink-0">{item.time}</div>
            <div className="relative pl-6 border-l-2 border-slate-700 w-full">
                <div className={`absolute -left-2 top-1 w-3.5 h-3.5 bg-slate-900 border-2 ${isSelected ? 'border-teal-400' : 'border-slate-700'} rounded-full`}></div>
                <h4 className="font-semibold text-slate-100">{item.activity}</h4>
                <p className="text-slate-400 text-sm mt-1">{item.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPlayAudio(item.details); }}
                        className="text-xs inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors z-10"
                    >
                        <PlayIcon />
                        {t.narrateStory}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddToCalendar(item); }}
                        className="text-xs inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors z-10"
                    >
                        <CalendarPlusIcon />
                        {t.addToCalendar}
                    </button>
                    {item.estimatedCost && (
                        <div className="text-xs inline-flex items-center gap-1.5 text-slate-400">
                           <TagIcon />
                           <span>{t.estimatedCost}: {item.estimatedCost}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ItineraryDayCardProps {
    day: ItineraryDay;
    onPlayAudio: (text: string) => void;
    onAddToCalendar: (item: ItineraryItem | ItineraryDay) => void;
    onSelectItem: (item: ItineraryItem) => void;
    selectedItem: ItineraryItem | null;
    t: { [key: string]: string };
}

const ItineraryDayCard: React.FC<ItineraryDayCardProps> = ({ day, onPlayAudio, onAddToCalendar, onSelectItem, selectedItem, t }) => {
    return (
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-teal-500/10 text-teal-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-teal-500/20">{day.city || 'Destino'}</span>
                    </div>
                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400">{`${t.day} ${day.day}: ${day.title}`}</h3>
                    <p className="text-slate-400 mt-1 text-sm italic">"{day.theme}"</p>
                </div>
                 <button
                    onClick={() => onAddToCalendar(day)}
                    className="text-xs inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                >
                    <CalendarPlusIcon />
                    {t.addDayToCalendar}
                </button>
            </div>
            <div className="mt-6 space-y-6">
                {day.schedule.length > 0 ? (
                    day.schedule.map((item, index) => {
                        const isSelected = selectedItem?.activity === item.activity && selectedItem?.time === item.time && selectedItem?.description === item.description;
                        return (
                           <ItineraryItemCard 
                                key={index} 
                                item={item} 
                                dayNumber={day.day}
                                onPlayAudio={onPlayAudio} 
                                onAddToCalendar={onAddToCalendar} 
                                onSelectItem={onSelectItem}
                                isSelected={isSelected}
                                t={t} 
                            />
                        )
                    })
                ) : (
                    <p className="text-slate-400 text-center py-4">{t.noActivitiesFilter}</p>
                )}
            </div>
        </div>
    );
};

export const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, groundingChunks, onPlayAudio, onAddToCalendar, t }) => {
    const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'half' | 'full'>('all');
    const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);

    useEffect(() => {
        if (selectedItem) {
            const dayOfItem = itinerary.days.find(d => d.schedule.includes(selectedItem));
            if (dayOfItem) {
                const elementId = `itinerary-item-${dayOfItem.day}-${slugify(selectedItem.time)}-slugify(selectedItem.activity)}`;
                const element = document.getElementById(elementId);
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                }
            }
        }
    }, [selectedItem, itinerary.days]);

    const handleMarkerClick = (item: ItineraryItem) => {
        setDurationFilter('all');
        setSelectedItem(item);
    };

    const filteredDays = itinerary.days.map(day => {
        const filteredSchedule = day.schedule.filter(item => {
            if (durationFilter === 'all') return true;
            if (item.durationMinutes === undefined || item.durationMinutes === null) return false;

            switch (durationFilter) {
                case 'short':
                    return item.durationMinutes < 120;
                case 'half':
                    return item.durationMinutes >= 120 && item.durationMinutes <= 240;
                case 'full':
                    return item.durationMinutes > 240;
                default:
                    return true;
            }
        });
        return { ...day, schedule: filteredSchedule };
    });

    const filterOptions = [
        { key: 'all', label: t.allActivities },
        { key: 'short', label: t.shortActivity },
        { key: 'half', label: t.halfDay },
        { key: 'full', label: t.fullDay },
    ];
    
    return (
        <div className="animate-fade-in space-y-8 pb-12">
            <div className="text-center">
                <h2 className="text-4xl font-black text-white tracking-tight">{itinerary.title}</h2>
                <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-sky-500 mx-auto my-4 rounded-full"></div>
                <p className="text-slate-400 mt-2 max-w-2xl mx-auto leading-relaxed">{itinerary.introduction}</p>
            </div>

            <MapView days={filteredDays} t={t} selectedItem={selectedItem} onMarkerClick={handleMarkerClick} />

            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700 flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                 <span className="text-xs font-bold text-slate-500 uppercase px-3">{t.filterByDuration}:</span>
                 {filterOptions.map(option => (
                    <button
                        key={option.key}
                        onClick={() => setDurationFilter(option.key as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            durationFilter === option.key
                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                    >
                        {option.label}
                    </button>
                 ))}
            </div>

            <div className="space-y-12">
                {filteredDays.map((day) => (
                    <ItineraryDayCard 
                        key={day.day} 
                        day={day}
                        onPlayAudio={onPlayAudio} 
                        onAddToCalendar={onAddToCalendar}
                        onSelectItem={setSelectedItem}
                        selectedItem={selectedItem}
                        t={t} 
                    />
                ))}
            </div>

            {groundingChunks.length > 0 && (
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-inner">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <SearchIcon /> {t.sourcesAndFurtherReading}
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groundingChunks.map((chunk, index) => {
                            if (chunk.web && chunk.web.uri && chunk.web.title) {
                                return (
                                    <li key={index} className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 hover:border-sky-500/50 transition-colors">
                                        <div className="p-1 bg-sky-500/10 rounded text-sky-400"><SearchIcon /></div>
                                        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-300 hover:text-sky-300 transition-colors line-clamp-2">
                                            {chunk.web.title}
                                        </a>
                                    </li>
                                )
                            }
                            if (chunk.maps) {
                                return (
                                    <li key={index} className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 hover:border-teal-500/50 transition-colors">
                                        <div className="p-1 bg-teal-500/10 rounded text-teal-400"><MapPinIcon /></div>
                                        <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-300 hover:text-teal-300 transition-colors line-clamp-2">
                                            {chunk.maps.title}
                                        </a>
                                    </li>
                                )
                            }
                            return null;
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};
