import React, { useEffect, useRef } from 'react';
import { ItineraryDay, ItineraryItem } from '../types';

interface MapViewProps {
    days: ItineraryDay[];
    t: { [key: string]: string };
    selectedItem: ItineraryItem | null;
    onMarkerClick: (item: ItineraryItem) => void;
}

// Minimal type for Leaflet, which is loaded from a CDN
declare const L: any;

let defaultIcon: any;
let highlightedIcon: any;

// Initialize icons only on the client-side
if (typeof L !== 'undefined') {
    defaultIcon = new L.Icon.Default();
    highlightedIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

export const MapView: React.FC<MapViewProps> = ({ days, t, selectedItem, onMarkerClick }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    const locations = days.flatMap(day => 
        day.schedule.filter(item => item.latitude != null && item.longitude != null)
    );

    useEffect(() => {
        // Initialize map on component mount
        if (mapRef.current && typeof L !== 'undefined' && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);
        }

        // Cleanup map instance on component unmount
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only once

    useEffect(() => {
        // Update markers when locations change
        if (mapInstance.current) {
            // Clear existing markers from the map
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            if (locations.length > 0) {
                const newMarkers = locations.map(item => {
                    const marker = L.marker([item.latitude!, item.longitude!], {
                            itineraryItem: item,
                            icon: defaultIcon,
                        })
                        .addTo(mapInstance.current)
                        .bindPopup(`<b>${item.activity}</b><br>${item.time}`);

                    marker.on('click', () => {
                        onMarkerClick(item);
                    });
                    
                    return marker;
                });
                
                markersRef.current = newMarkers;

                // Adjust map view to fit all markers
                if (newMarkers.length > 0) {
                    const markerGroup = L.featureGroup(newMarkers);
                    mapInstance.current.fitBounds(markerGroup.getBounds().pad(0.1));
                }
            }
        }
    }, [locations, onMarkerClick]);

    useEffect(() => {
        if (!mapInstance.current || markersRef.current.length === 0 || !defaultIcon) return;

        // Reset all markers to default icon
        markersRef.current.forEach(marker => {
            marker.setIcon(defaultIcon);
        });
        
        if (selectedItem?.latitude != null && selectedItem?.longitude != null) {
            const targetMarker = markersRef.current.find(marker => {
                const markerItem = marker.options.itineraryItem;
                return markerItem.activity === selectedItem.activity && 
                       markerItem.time === selectedItem.time &&
                       markerItem.description === selectedItem.description;
            });

            if (targetMarker) {
                mapInstance.current.flyTo([selectedItem.latitude, selectedItem.longitude], 15, {
                    animate: true,
                    duration: 1
                });
                targetMarker.setIcon(highlightedIcon);
                targetMarker.openPopup();
            }
        }
    }, [selectedItem]);

    // Don't render the component if there are no locations with coordinates
    if (locations.length === 0) {
        return null;
    }

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-8">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-4">{t.journeyMap}</h3>
            <div ref={mapRef} style={{ height: '400px', borderRadius: '8px', backgroundColor: '#334155' }}></div>
        </div>
    );
};