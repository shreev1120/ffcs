import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Calendar, Settings2, ArrowRight, Table } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { timetableService } from '../services/api';

const Upload = () => {
    const navigate = useNavigate();
    const [uploadData, setUploadData] = useState(null);
    const [error, setError] = useState(null);
    const [preferences, setPreferences] = useState({
        batchPreference: 'Both',
        maxTimetables: 5,
        rankingCriteria: 'balanced'
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleUploadSuccess = (data) => {
        setUploadData(data);
        setError(null);
    };

    const handleUploadError = (msg) => {
        setError(msg);
    };

    const handlePreferenceChange = (name, value) => {
        setPreferences(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = async () => {
        if (!uploadData) return;
        setIsGenerating(true);
        setError(null);

        try {
            const result = await timetableService.generateTimetables(
                uploadData.semesterConfigId,
                preferences
            );
            // Navigate to results page with the data in state
            navigate(`/results?configId=${uploadData.semesterConfigId}`, {
                state: { timetables: result.timetables }
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate timetables');
            setIsGenerating(false);
        }
    };

    return (
        <div className="container pb-20">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Timetable Generator</h1>
                    <p className="text-text-secondary">Upload your FFCS Excel to begin the magic.</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 text-error"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 gap-10">
                    {/* Step 1: Upload */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">1</div>
                            <h2 className="text-2xl font-bold">Upload Course Data</h2>
                        </div>

                        <FileUpload
                            onUploadSuccess={handleUploadSuccess}
                            onUploadError={handleUploadError}
                        />
                    </section>

                    {/* Step 2: Preferences (Only show after upload) */}
                    <AnimatePresence>
                        {uploadData && (
                            <motion.section
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-8 overflow-hidden pt-4"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">2</div>
                                    <h2 className="text-2xl font-bold">Configure Preferences</h2>
                                </div>

                                <div className="glass p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Batch Preference */}
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-sm font-bold text-text-secondary uppercase tracking-wider">
                                            <Settings2 className="w-4 h-4" />
                                            Batch Preference
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Morning', 'Evening', 'Both'].map((batch) => (
                                                <button
                                                    key={batch}
                                                    onClick={() => handlePreferenceChange('batchPreference', batch)}
                                                    className={`p-3 rounded-lg border text-sm font-semibold transition-all ${preferences.batchPreference === batch
                                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                        : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'
                                                        }`}
                                                >
                                                    {batch}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Optimization Goal */}
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-sm font-bold text-text-secondary uppercase tracking-wider">
                                            <Zap className="w-4 h-4" />
                                            Optimization Goal
                                        </label>
                                        <select
                                            value={preferences.rankingCriteria}
                                            onChange={(e) => handlePreferenceChange('rankingCriteria', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-text-primary focus:outline-none focus:border-primary transition-colors"
                                        >
                                            <option value="balanced">Balanced Distribution</option>
                                            <option value="earliest_finish">Earliest Finish Time</option>
                                            <option value="no_morning">No Morning Classes</option>
                                            <option value="max_free_days">Maximum Free Days</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="btn btn-primary px-10 py-4 text-lg"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Generating Timetables...
                                            </>
                                        ) : (
                                            <>
                                                Generate Timetables <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {/* Statistics Info */}
                    {uploadData && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 p-6 glass border-green-500/20 bg-green-500/5 flex items-start gap-4"
                        >
                            <div className="bg-green-500/20 p-2 rounded-lg">
                                <Check className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-400">Successfully Processed</h4>
                                <p className="text-sm text-text-secondary mt-1">
                                    Found <span className="text-white font-bold">{uploadData.coursesFound}</span> courses
                                    with a total of <span className="text-white font-bold">{uploadData.statistics.totalCredits}</span> credits.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Upload;
