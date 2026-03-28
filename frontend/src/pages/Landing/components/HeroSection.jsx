import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import heroVideo from '../../../assets/Video/hero.mp4';
import SpotlightButton from './SpotlightButton';

const HeroSection = () => {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"]
    });

    // Deep parallax for the background video: moves down slightly slower than the scroll
    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
    
    // Fade out and scale down the content to softly transition into the next section
    const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const contentScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
    const contentY = useTransform(scrollYProgress, [0, 0.5], ["0%", "-10%"]);

    // Snappy transitions matching the mechanical "Flock Safety" feel
    const springTransition = { type: "spring", bounce: 0, duration: 0.8 };

    return (
        <section ref={sectionRef} className="relative min-h-screen flex items-center overflow-hidden bg-[#0A192F]">
            {/* Parallax Video Background */}
            <motion.div 
                className="absolute inset-0 z-0 origin-top"
                style={{ y: bgY }}
            >
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-[120%] object-cover scale-[1.05]" /* Slightly larger to handle parallax edge bleed */
                >
                    <source src={heroVideo} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-[#0A192F]/20" /> {/* Toned down overall tint for crisp text contrast */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/30 via-transparent to-[#0A192F]" />
            </motion.div>

            {/* Content fading out intelligently on scroll */}
            <motion.div 
                className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-32 mt-16"
                style={{ opacity: contentOpacity, scale: contentScale, y: contentY }}
            >
                {/* Invisible soft ambient contrast blobl specifically protecting the text area */}
                <div className="absolute top-1/2 left-[-100px] -translate-y-1/2 w-[1000px] h-[1000px] bg-[#0A192F]/60 blur-[150px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-3xl">
                    <div className="overflow-hidden mb-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={springTransition}
                            className="flex items-center gap-3 translate-x-[2px]"
                        >
                            <div className="w-8 h-[2px] bg-blue-500" />
                            <span className="text-white/70 font-bold uppercase tracking-[0.2rem] text-[10px]">
                                Next-Gen Fleet Intelligence
                            </span>
                        </motion.div>
                    </div>

                    <div className="overflow-hidden mb-6 py-2">
                        <motion.h1
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            transition={{ ...springTransition, delay: 0.1 }}
                            className="text-5xl sm:text-6xl lg:text-7xl font-sans font-extrabold tracking-tight leading-[1.05] text-white"
                        >
                            Revolutionizing
                            <br className="hidden sm:block" />
                            <span className="text-white/90 font-medium"> Fleet Management</span>
                            <br />
                            <span className="text-blue-500">with GNB Edge</span>
                        </motion.h1>
                    </div>

                    <div className="overflow-hidden mb-10">
                        <motion.p
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            transition={{ ...springTransition, delay: 0.2 }}
                            className="text-base md:text-lg text-white/90 font-medium leading-relaxed max-w-xl"
                        >
                            From real-time GPS telemetry to automated document verification,
                            GNB Edge delivers a unified, high-precision intelligence platform 
                            that transforms enterprise fleet operations.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...springTransition, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <SpotlightButton 
                            className="bg-blue-600 text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] hover:bg-blue-500 hover:scale-[1.02] transition-transform duration-300 cursor-pointer border-none rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                            spotlightColor="rgba(255, 255, 255, 0.4)"
                        >
                            Get Started
                        </SpotlightButton>
                        <SpotlightButton 
                            className="bg-transparent border border-white/20 text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] hover:bg-white/10 transition-colors duration-300 cursor-pointer rounded-full"
                        >
                            Watch Demo
                        </SpotlightButton>
                    </motion.div>
                </div>
            </motion.div>

            {/* Bottom scroll indicator - fades out seamlessly into parallax scroll */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
                style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
            >
                <div className="overflow-hidden">
                    <motion.span 
                        className="block text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold"
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        Scroll
                    </motion.span>
                </div>
                <div className="w-px h-12 bg-gradient-to-b from-blue-500/50 to-transparent relative overflow-hidden">
                    <motion.div 
                        className="w-full h-1/2 bg-blue-400 absolute top-0"
                        animate={{ y: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </motion.div>
        </section>
    );
};

export default HeroSection;
