import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

const EcosystemSection = () => {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "center center"]
    });

    // Parallax transforms for the outer nodes (Assemble as you scroll down)
    const trX = useTransform(scrollYProgress, [0, 1], [150, 0]);
    const trY = useTransform(scrollYProgress, [0, 1], [-150, 0]);

    const blX = useTransform(scrollYProgress, [0, 1], [-150, 0]);
    const blY = useTransform(scrollYProgress, [0, 1], [150, 0]);

    const crX = useTransform(scrollYProgress, [0, 1], [180, 0]);
    
    // Opacity fades
    const nodesOpacity = useTransform(scrollYProgress, [0.2, 1], [0, 1]);
    
    // Path drawing!
    const pathLength = useTransform(scrollYProgress, [0.4, 1], [0, 1]);

    return (
        <section ref={sectionRef} id="ecosystem" className="bg-[#F1F5F9] py-32 text-slate-900 relative overflow-hidden">
            {/* Dot grid background - subtle technical feel */}
            <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-24 max-w-3xl mx-auto">
                    <ScrollReveal>
                        <span className="text-blue-600 text-xs font-bold uppercase tracking-[0.4em] block mb-4">
                            Unified Architecture
                        </span>
                    </ScrollReveal>
                    <div className="overflow-hidden py-2">
                        <ScrollReveal>
                            <h2 className="text-3xl sm:text-4xl lg:text-6xl mb-6 font-sans font-extrabold tracking-tight text-slate-900">
                                The Seamless Ecosystem
                            </h2>
                        </ScrollReveal>
                    </div>
                    <ScrollReveal delay={0.1}>
                        <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
                            Four mission-critical components, converging into a single intelligence network.
                        </p>
                    </ScrollReveal>
                    <ScrollReveal delay={0.2}>
                        <div className="w-24 h-1 bg-blue-600 mx-auto mt-8 rounded-full" />
                    </ScrollReveal>
                </div>

                {/* Grid */}
                <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
                    {/* Diagram */}
                    <div className="relative min-h-[350px] sm:min-h-[500px] flex items-center justify-center">
                        <div
                            className="absolute inset-0"
                            style={{ background: 'radial-gradient(circle at center, rgba(37,99,235,0.05) 0%, transparent 70%)' }}
                        />
                        {/* Center Node */}
                        <motion.div
                            className="z-20 bg-white border border-blue-600 p-5 sm:p-8 shadow-[0_0_40px_rgba(37,99,235,0.15)] relative rounded-xl"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: 'spring', stiffness: 300, bounce: 0.5 }}
                        >
                            <span className="material-symbols-outlined text-blue-600 text-3xl sm:text-4xl mb-3 sm:mb-4 block">terminal</span>
                            <h4 className="text-lg sm:text-xl font-extrabold font-sans uppercase tracking-tight text-slate-900 mb-2">
                                Core Engine
                            </h4>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-mono font-bold tracking-widest bg-slate-100 inline-block px-2 py-1 rounded">NODE.JS / GRPC</p>
                        </motion.div>

                        {/* Top-Right Node */}
                        <motion.div
                            className="z-20 bg-white/60 backdrop-blur-xl border border-slate-200 shadow-xl p-3 sm:p-6 w-36 sm:w-52 rounded-xl transition-colors absolute top-0 right-0 lg:right-4"
                            style={{ x: trX, y: trY, opacity: nodesOpacity }}
                        >
                            <span className="material-symbols-outlined text-blue-500 text-xl sm:text-2xl mb-2 sm:mb-3 block">dashboard</span>
                            <h5 className="text-[10px] sm:text-xs font-extrabold font-sans uppercase tracking-[0.1em] text-slate-900 mb-1">Executive UI</h5>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wider">Real-time Visualization</p>
                        </motion.div>

                        {/* Bottom-Left Node */}
                        <motion.div
                            className="z-20 bg-white/60 backdrop-blur-xl border border-slate-200 shadow-xl p-3 sm:p-6 w-36 sm:w-52 rounded-xl transition-colors absolute bottom-0 left-0 lg:left-4"
                            style={{ x: blX, y: blY, opacity: nodesOpacity }}
                        >
                            <span className="material-symbols-outlined text-blue-500 text-xl sm:text-2xl mb-2 sm:mb-3 block">extension</span>
                            <h5 className="text-[10px] sm:text-xs font-extrabold font-sans uppercase tracking-[0.1em] text-slate-900 mb-1">Telemetry Plugin</h5>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wider">Session Capture</p>
                        </motion.div>

                        {/* Center-Right Node */}
                        <motion.div
                            className="z-20 bg-white/60 backdrop-blur-xl border border-slate-200 shadow-xl p-3 sm:p-6 w-36 sm:w-52 rounded-xl transition-colors absolute top-1/2 -translate-y-1/2 -right-2 sm:-right-8 lg:-right-12"
                            style={{ x: crX, opacity: nodesOpacity }}
                        >
                            <span className="material-symbols-outlined text-blue-500 text-xl sm:text-2xl mb-2 sm:mb-3 block">smart_button</span>
                            <h5 className="text-[10px] sm:text-xs font-extrabold font-sans uppercase tracking-[0.1em] text-slate-900 mb-1">Command Layer</h5>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wider">Atomic Transactions</p>
                        </motion.div>

                        {/* SVG lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
                            <motion.path
                                d="M 200,200 L 320,80"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                style={{ pathLength }}
                            />
                            <motion.path
                                d="M 200,200 L 80,320"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                style={{ pathLength }}
                            />
                            <motion.path
                                d="M 200,200 L 350,200"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                style={{ pathLength }}
                            />
                        </svg>
                    </div>

                    {/* Features List */}
                    <div className="flex flex-col gap-10">
                        {[
                            {
                                icon: 'dns',
                                title: 'Intelligent Core',
                                desc: "Node.js backbone orchestrating multi-service logic, featuring Python gRPC for high-performance processing and immutable MongoDB record keeping.",
                            },
                            {
                                icon: 'dashboard',
                                title: 'The Command Center',
                                desc: "Refined React architecture. Implements the 'Single Submission Pattern', committing complex operational logs in one atomic transaction.",
                            },
                            {
                                icon: 'api',
                                title: 'Silent Telemetry',
                                desc: "A robust browser extension that passively captures live telemetry, automatically running discrepancy checks against manually reported inputs.",
                            },
                            {
                                icon: 'hub',
                                title: 'Operational Pulse',
                                desc: "Discord webhook integration providing real-time mechanical alerts directly to operational leaders exactly where they work.",
                            },
                        ].map((item, i) => (
                            <ScrollReveal key={item.title} direction="right" delay={0.1 * i}>
                                <div className="group pl-6 relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-blue-600 transition-colors duration-500" />
                                    <div className="flex items-start gap-4 mb-2">
                                        <span className="material-symbols-outlined text-blue-600 mt-1">{item.icon}</span>
                                        <h3 className="text-xl font-sans font-extrabold tracking-tight text-slate-900">
                                            {item.title}
                                        </h3>
                                    </div>
                                    <p className="text-slate-500 font-medium leading-relaxed pl-10">{item.desc}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EcosystemSection;
