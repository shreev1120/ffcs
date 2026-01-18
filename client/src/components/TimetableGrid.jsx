import React from 'react';
import { Clock, MapPin, User, Hash } from 'lucide-react';

const TimetableGrid = ({ schedule }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
    ];

    // Helper to color-code courses based on their code
    const getCourseColor = (code) => {
        const colors = [
            'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
            'bg-pink-500/20 text-pink-400 border-pink-500/30',
            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'bg-amber-500/20 text-amber-400 border-amber-500/30',
            'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        ];
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
            hash = code.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-[800px] border border-white/5 rounded-xl overflow-hidden glass">
                {/* Header (Days) */}
                <div className="grid grid-cols-[100px_repeat(5,1fr)] bg-white/5">
                    <div className="p-4 border-r border-b border-white/5 font-bold text-text-muted text-center">
                        <Clock className="w-4 h-4 mx-auto mb-1" />
                        Time
                    </div>
                    {days.map(day => (
                        <div key={day} className="p-4 border-r border-b border-white/5 font-bold text-center uppercase tracking-wider text-sm">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                <div className="relative">
                    {timeSlots.map((time, timeIdx) => (
                        <div key={time} className="grid grid-cols-[100px_repeat(5,1fr)] border-b border-white/5 last:border-0 h-24">
                            {/* Time Label */}
                            <div className="p-4 border-r border-white/5 flex flex-col items-center justify-center text-xs font-medium text-text-muted">
                                <span>{time}</span>
                                <span className="opacity-50">—</span>
                                <span>{parseInt(time.split(':')[0]) + 1}:00</span>
                            </div>

                            {/* Day Slots */}
                            {days.map(day => {
                                const hour = parseInt(time.split(':')[0]);
                                const dayClasses = schedule[day] || [];
                                const currentClass = dayClasses.find(c => {
                                    const classStartHour = parseInt(c.startTime.split(':')[0]);
                                    return classStartHour === hour;
                                });

                                return (
                                    <div key={`${day}-${time}`} className="border-r border-white/5 last:border-0 relative p-1">
                                        {currentClass && (
                                            <div className={`h-full w-full rounded-lg border p-2 flex flex-col justify-between transition-all hover:brightness-125 ${getCourseColor(currentClass.courseCode)}`}>
                                                <div className="overflow-hidden">
                                                    <p className="text-[10px] font-black opacity-70 uppercase truncate">{currentClass.slot}</p>
                                                    <p className="text-xs font-bold truncate">{currentClass.courseCode}</p>
                                                    <p className="text-[10px] opacity-80 leading-tight line-clamp-2">{currentClass.courseName}</p>
                                                </div>
                                                <div className="flex items-center justify-between mt-auto pt-1 opacity-70 border-t border-current/10">
                                                    <div className="flex items-center gap-1 text-[8px] font-bold">
                                                        <MapPin className="w-2 h-2" />
                                                        {currentClass.venue || 'TBA'}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[8px] font-bold">
                                                        <User className="w-2 h-2" />
                                                        {currentClass.faculty?.split(' ')[0] || 'TBA'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2 text-xs text-text-muted bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    Theory Slots
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    Lab Slots
                </div>
            </div>
        </div>
    );
};

export default TimetableGrid;
