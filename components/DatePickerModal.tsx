import React, { useState } from 'react';

interface DatePickerModalProps {
    onConfirm: (date: Date) => void;
    onCancel: () => void;
    t: { [key: string]: string };
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({ onConfirm, onCancel, t }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const handleConfirm = () => {
        // The input gives 'YYYY-MM-DD', which new Date() interprets as UTC.
        // To avoid timezone issues, create the date with an explicit time and timezone context.
        const [year, month, day] = selectedDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        onConfirm(date);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-sm">
                <h3 className="text-lg font-semibold text-slate-100">{t.setTripStartDate}</h3>
                <p className="text-sm text-slate-400 mt-2">{t.datePickerDescription}</p>
                <div className="mt-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md text-sm font-semibold"
                    >
                        {t.cancel}
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-md text-sm font-semibold text-white"
                    >
                        {t.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
};
