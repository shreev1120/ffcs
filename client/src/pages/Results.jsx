import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Download, Share2,
    Clock, Calendar as CalendarIcon,
    MapPin, Coffee, Zap, Layers,
    ChevronLeft, ChevronRight, CheckCircle2,
    Trash2, Info
} from 'lucide-react';
import TimetableGrid from '../components/TimetableGrid';
import { timetableService } from '../services/api';

const Results = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const configId = searchParams.get('configId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timetables, setTimetables] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchResults = async () => {
            // Prio 1: Check if data was passed in navigate state
            if (location.state?.timetables) {
                setTimetables(location.state.timetables);
                setLoading(false);
                return;
            }

            if (!configId) {
                setError('No configuration specified');
                setLoading(false);
                return;
            }

            try {
                // Fetch user timetables
                const response = await timetableService.getUserTimetables('65a0b1c2d3e4f5a6b7c8d9e0');

                if (!response.timetables || response.timetables.length === 0) {
                    setError('No generated timetables found for this user.');
                    setLoading(false);
                    return;
                }

                // Find the specific results for this config
                const configResults = response.timetables.find(t => {
                    const id = t.semesterConfigId?._id || t.semesterConfigId;
                    return id === configId;
                });

                if (configResults && configResults.timetables && configResults.timetables.length > 0) {
                    setTimetables(configResults.timetables);
                } else {
                    setError('No timetables found for this configuration. Try regenerating.');
                }
            } catch (err) {
                console.error('Error fetching results:', err);
                setError('Failed to fetch results. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [configId, location.state]);

    if (loading) {
        return (
            <div className="container min-h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold mb-2">Analyzing your schedule...</h2>
                <p className="text-text-secondary">Generating the most optimal combinations for you.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container section-padding text-center">
                <div className="max-w-md mx-auto glass p-10 border-error/20 bg-error/5">
                    <Info className="w-12 h-12 text-error mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-4 text-error">Oops! Something went wrong</h2>
                    <p className="text-text-secondary mb-8">{error}</p>
                    <Link to="/upload" className="btn btn-primary w-full">
                        Try Again
                    </Link>
                </div>
            </div>
        );
    }

    const currentTT = timetables[currentIndex];

    const nextTT = () => setCurrentIndex(prev => (prev + 1) % timetables.length);
    const prevTT = () => setCurrentIndex(prev => (prev - 1 + timetables.length) % timetables.length);

    return (
        <div className="container pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <Link to="/upload" className="p-3 glass rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Generated Options</h1>
                        <p className="text-text-secondary">Explore {timetables.length} clash-free combinations</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="btn btn-ghost px-6">
                        <Share2 className="w-5 h-5" /> Share
                    </button>
                    <button className="btn btn-primary px-6">
                        <Download className="w-5 h-5" /> Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-10 items-start">
                {/* Main Content: Timetable Grid */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-600 px-3 py-1 rounded-md text-sm font-black uppercase tracking-wider">Option {currentIndex + 1}</div>
                                    <div className="text-text-muted text-xs font-medium">Ranked by your preferences</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={prevTT}
                                        disabled={timetables.length <= 1}
                                        className="p-2 glass rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-bold min-w-[60px] text-center">
                                        {currentIndex + 1} / {timetables.length}
                                    </span>
                                    <button
                                        onClick={nextTT}
                                        disabled={timetables.length <= 1}
                                        className="p-2 glass rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {currentTT ? (
                                <TimetableGrid schedule={currentTT.schedule} />
                            ) : (
                                <div className="glass p-20 text-center">
                                    <p className="text-text-secondary">No schedule data available for this option.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Sidebar: Details & Stats */}
                <aside className="space-y-8 sticky top-32">
                    {/* Health Score / Performance Card */}
                    <div className="glass p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full"></div>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-indigo-400" />
                            Optimal Analysis
                        </h3>
                        <div className="space-y-6">
                            {currentTT?.features ? (
                                [
                                    {
                                        icon: <Clock className="w-4 h-4" />,
                                        label: "Earliest Finish",
                                        val: currentTT.features.earliestFinishTime,
                                        color: "text-blue-400"
                                    },
                                    {
                                        icon: <Coffee className="w-4 h-4" />,
                                        label: "Free Days",
                                        val: `${currentTT.features.totalFreeDays} Days`,
                                        color: "text-emerald-400"
                                    },
                                    {
                                        icon: <Layers className="w-4 h-4" />,
                                        label: "Avg. Class Load",
                                        val: `${(currentTT.features.morningClassCount + currentTT.features.eveningClassCount) / 5} / Day`,
                                        color: "text-purple-400"
                                    }
                                ].map((stat, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-text-secondary text-sm">
                                            {stat.icon}
                                            {stat.label}
                                        </div>
                                        <div className={`font-bold ${stat.color}`}>{stat.val}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-text-muted">Analytics not available</p>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center font-black text-xs">
                                    92%
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Efficiency Score</h4>
                                    <p className="text-[10px] text-text-muted">High match with your preferences</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="glass p-6 flex flex-col gap-3">
                        <button className="btn btn-primary w-full py-4 font-bold tracking-wide">
                            <CheckCircle2 className="w-5 h-5" /> Use This Timetable
                        </button>
                        <button onClick={() => navigate('/upload')} className="btn btn-ghost w-full py-4 text-xs">
                            <Trash2 className="w-4 h-4" /> Start Over
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Results;
