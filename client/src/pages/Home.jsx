import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

const Home = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
    };

    return (
        <div className="container">
            {/* Hero Section */}
            <motion.section
                className="section-padding text-center"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Smartest Timetable Generator for VITians</span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
                    Design your <span className="text-primary-gradient">Perfect</span> <br />
                    College Schedule
                </motion.h1>

                <motion.p variants={itemVariants} className="max-w-2xl mx-auto text-xl text-text-secondary mb-10 leading-relaxed">
                    The FFCS Agent helps you generate clash-free, optimized timetables from your course lists. Save hours of manual planning and find the best slots in seconds.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/upload" className="btn btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                        Generate Now <ArrowRight className="w-5 h-5" />
                    </Link>
                    <a href="#features" className="btn btn-ghost text-lg px-8 py-4 w-full sm:w-auto">
                        View Features
                    </a>
                </motion.div>

                {/* Hero Visual - Dashboard Preview with Glassmorphism */}
                <motion.div
                    variants={itemVariants}
                    className="mt-20 glass p-4 max-w-5xl mx-auto overflow-hidden relative"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50"></div>
                    <div className="bg-slate-900/50 rounded-lg aspect-video flex items-center justify-center border border-white/5">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                <Calendar className="w-8 h-8 text-indigo-400" />
                            </div>
                            <p className="text-text-muted text-sm uppercase tracking-widest font-semibold">Ready to generate your first timetable?</p>
                        </div>
                    </div>
                </motion.div>
            </motion.section>

            {/* Features Section */}
            <section id="features" className="section-padding">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">Why choose FFCS Agent?</h2>
                    <p className="text-text-secondary">Designed specifically for VIT's Fully Flexible Credit System.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Zap className="w-6 h-6 text-yellow-400" />,
                            title: "Instant Generation",
                            desc: "Upload your course list and get multiple clash-free options in seconds."
                        },
                        {
                            icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
                            title: "Clash Detection",
                            desc: "100% accurate slot mapping system for both morning and evening batches."
                        },
                        {
                            icon: <ArrowRight className="w-6 h-6 text-purple-400" />,
                            title: "Preference Based",
                            desc: "Filter results by morning labs, no early classes, or maximum free days."
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className="glass glass-hover p-8"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                            <p className="text-text-secondary leading-relaxed">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Steps Section */}
            <section className="section-padding">
                <div className="glass p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6">Start in 3 simple steps</h2>
                            <div className="space-y-8">
                                {[
                                    "Download your course selection list from FFCS portal",
                                    "Upload the Excel file to our smart generator",
                                    "Review and select your favorite timetable combination"
                                ].map((step, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 font-bold text-sm mt-1">
                                            {i + 1}
                                        </div>
                                        <p className="text-lg text-text-secondary leading-normal">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="aspect-[4/3] bg-indigo-500/5 rounded-2xl border border-white/5 flex items-center justify-center">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="p-8 glass bg-white/5"
                                >
                                    <CheckCircle2 className="w-16 h-16 text-indigo-400" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
