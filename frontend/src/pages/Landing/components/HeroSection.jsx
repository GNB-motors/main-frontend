import { motion } from 'framer-motion';
import heroVideo from '../../../assets/Video/Revolutionizing Fleet Management with Gnbedge AI-1774097241597.mp4';

const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden">
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source src={heroVideo} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-[#0A192F]/70" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F]/50 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/60 via-transparent to-[#0A192F]/20" />
            </div>

            {/* Content */}
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-32">
                <div className="max-w-2xl">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-[#FF8C00] font-semibold uppercase tracking-[0.3em] text-xs mb-5"
                    >
                        Next-Gen Fleet Intelligence
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        style={{ fontFamily: "'Playfair Display', serif" }}
                        className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] mb-6 text-white"
                    >
                        Revolutionizing{' '}
                        <br className="hidden sm:block" />
                        <span className="italic font-normal">Fleet Management</span>
                        <br />
                        <span className="text-[#FF8C00]">with GNB Edge</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="text-base md:text-lg text-white/60 font-light mb-10 leading-relaxed max-w-xl"
                    >
                        From real-time GPS telemetry to automated document verification,
                        GNB Edge delivers a unified intelligence platform that transforms
                        how enterprises manage fleet operations at scale.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <button className="bg-[#FF8C00] text-white px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] hover:brightness-110 hover:scale-[1.02] transition-all duration-300 cursor-pointer border-none rounded-sm">
                            Get Started
                        </button>
                        <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] hover:bg-white/20 transition-all duration-300 cursor-pointer rounded-sm">
                            Watch Demo
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Bottom scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
                <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">Scroll</span>
                <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
            </motion.div>
        </section>
    );
};

export default HeroSection;
