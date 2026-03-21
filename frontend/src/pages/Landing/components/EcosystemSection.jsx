import { motion } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

const EcosystemSection = () => {
    return (
        <section id="ecosystem" className="bg-[#0A192F] py-32 text-white relative overflow-hidden">
            {/* Dot grid background */}
            <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(#FF8C00 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <ScrollReveal className="text-center mb-24">
                    <span className="text-[#FF8C00] text-xs font-bold uppercase tracking-[0.4em] block mb-4">
                        Unified Architecture
                    </span>
                    <h2
                        style={{ fontFamily: "'Playfair Display', serif" }}
                        className="text-4xl lg:text-6xl mb-6 text-white text-center"
                    >
                        The Seamless Ecosystem
                    </h2>
                    <p className="text-white/60 font-light max-w-2xl mx-auto italic text-center">
                        Four mission-critical components, one cohesive intelligence network.
                    </p>
                    <div className="w-24 h-px bg-[#FF8C00]/40 mx-auto mt-8" />
                </ScrollReveal>

                {/* Grid */}
                <div className="grid gap-16 lg:grid-cols-2 items-center">
                    {/* Diagram */}
                    <ScrollReveal direction="left" delay={0.2}>
                        <div className="relative min-h-[500px] flex items-center justify-center">
                            <div
                                className="absolute inset-0"
                                style={{ background: 'radial-gradient(circle at center, rgba(255,140,0,0.08) 0%, transparent 70%)' }}
                            />
                            {/* Center Node */}
                            <motion.div
                                className="z-20 bg-[#112240] border border-[#FF8C00] p-8 shadow-2xl relative"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <div className="absolute -top-4 -left-4 w-8 h-8 border-t border-l border-[#FF8C00]" />
                                <span className="material-symbols-outlined text-[#FF8C00] text-4xl mb-4 block">terminal</span>
                                <h4
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                    className="text-xl uppercase tracking-tight text-white mb-2"
                                >
                                    Core Engine
                                </h4>
                                <p className="text-xs text-white/40 font-mono">Node.js / Python gRPC</p>
                            </motion.div>

                            {/* Top-Right Node */}
                            <div className="z-20 bg-white/5 backdrop-blur-md border border-white/10 p-6 w-48 hover:border-[#FF8C00] transition-colors absolute top-0 right-0 lg:right-10">
                                <span className="material-symbols-outlined text-white/60 text-2xl mb-2 block">dashboard</span>
                                <h5 className="text-xs font-bold uppercase tracking-[0.1em] text-white mb-1">Executive UI</h5>
                                <p className="text-[10px] text-white/40 uppercase">Real-time Visualization</p>
                            </div>

                            {/* Bottom-Left Node */}
                            <div className="z-20 bg-white/5 backdrop-blur-md border border-white/10 p-6 w-48 hover:border-[#FF8C00] transition-colors absolute bottom-0 left-0 lg:left-10">
                                <span className="material-symbols-outlined text-white/60 text-2xl mb-2 block">extension</span>
                                <h5 className="text-xs font-bold uppercase tracking-[0.1em] text-white mb-1">Telemetry Plugin</h5>
                                <p className="text-[10px] text-white/40 uppercase">Session-based Capture</p>
                            </div>

                            {/* Center-Right Node */}
                            <div className="z-20 bg-white/5 backdrop-blur-md border border-white/10 p-6 w-48 hover:border-[#FF8C00] transition-colors absolute top-1/2 -translate-y-1/2 -right-4 lg:right-0">
                                <span className="material-symbols-outlined text-white/60 text-2xl mb-2 block">notifications_active</span>
                                <h5 className="text-xs font-bold uppercase tracking-[0.1em] text-white mb-1">Alerting Bot</h5>
                                <p className="text-[10px] text-white/40 uppercase">Discord Ops Hub</p>
                            </div>

                            {/* SVG lines */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 400 400">
                                <path d="M 200,200 L 320,50" fill="none" stroke="#FF8C00" strokeDasharray="4" strokeWidth="1" />
                                <path d="M 200,200 L 80,350" fill="none" stroke="#FF8C00" strokeDasharray="4" strokeWidth="1" />
                                <path d="M 200,200 L 350,200" fill="none" stroke="#FF8C00" strokeDasharray="4" strokeWidth="1" />
                            </svg>
                        </div>
                    </ScrollReveal>

                    {/* Features */}
                    <div className="flex flex-col gap-12">
                        {[
                            {
                                title: 'Intelligent Core (Backend)',
                                desc: "Our Node.js backbone orchestrates a multi-service architecture, utilizing Python gRPC for high-performance OCR processing and MongoDB for immutable record keeping.",
                            },
                            {
                                title: 'The Command Center (Frontend)',
                                desc: "A refined React-based interface designed for strategic oversight. It implements the \"Single Submission Pattern,\" ensuring complex trip logs are verified and committed in a single atomic transaction.",
                            },
                            {
                                title: 'Silent Telemetry (Extension)',
                                desc: "The FleetEdge Fuel Monitor bridge. A secure Chrome extension that passively captures vehicle telemetry every 5 minutes, automatically flagging fuel discrepancies against manual logs.",
                            },
                            {
                                title: 'Operational Pulse (Discord)',
                                desc: "A dedicated webhook and bot system that keeps your operational leadership informed in real-time, delivering critical alerts and journey milestones directly to your preferred channels.",
                            },
                        ].map((item, i) => (
                            <ScrollReveal key={item.title} direction="right" delay={0.15 * i}>
                                <div className="border-l border-white/10 pl-8 hover:border-[#FF8C00] transition-colors">
                                    <h3
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                        className="text-2xl text-[#FF8C00] mb-4"
                                    >
                                        {item.title}
                                    </h3>
                                    <p className="text-white/60 font-light leading-relaxed">{item.desc}</p>
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
