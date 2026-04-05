import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

const InnovationSection = () => {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start center", "end end"]
    });

    // --- Dynamic Text Color Transition (White to High-Contrast Navy) ---
    const headingColor = useTransform(scrollYProgress, [0.4, 0.95], ["#FFFFFF", "#0A192F"]);
    const pColor = useTransform(scrollYProgress, [0.4, 0.95], ["rgba(255,255,255,0.6)", "rgba(10,25,47,0.7)"]);
    const iconColor = useTransform(scrollYProgress, [0.4, 0.95], ["#60A5FA", "#2563EB"]);
    const labelColor = useTransform(scrollYProgress, [0.4, 0.95], ["#FFFFFF", "#0A192F"]);

    // --- Dynamic Orb Animation ---
    const orbScale = useTransform(scrollYProgress, [0.3, 1], [0.3, 1.8]);
    const orbOpacity = useTransform(scrollYProgress, [0.4, 0.9], [0, 1]);

    return (
        <section ref={sectionRef} id="innovation" className="relative bg-[#0A192F] pt-0 pb-40 overflow-hidden">
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
                
                {/* --- Central Glowing Pipeline (Continues from Solutions) --- */}
                <div className="relative w-full h-32 flex justify-center lg:justify-center mb-16 lg:mb-24 scale-x-[-1] lg:scale-x-100">
                    <div className="absolute left-[31px] lg:left-1/2 top-0 bottom-0 w-px -translate-x-1/2 overflow-visible z-0">
                        <div className="absolute inset-0 bg-blue-500/10 w-px h-full" />
                        
                        <motion.div 
                            initial={{ height: "0%" }}
                            whileInView={{ height: "100%" }}
                            viewport={{ once: false, margin: "-10%" }}
                            transition={{ duration: 1.0, ease: "linear" }}
                            className="w-px bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)]"
                        />
                        
                        <motion.div 
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: false, margin: "-10%" }}
                            transition={{ duration: 0.6, delay: 0.8, type: "spring", bounce: 0.6 }}
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-[4px] border-blue-500 shadow-[0_0_40px_rgba(255,255,255,0.8),0_0_20px_rgba(59,130,246,1)] z-10 flex items-center justify-center"
                        >
                            <div className="w-2 h-2 bg-[#0A192F] rounded-full animate-ping" />
                        </motion.div>
                    </div>
                </div>

                <ScrollReveal>
                    <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto relative z-20">

                        <span className="text-blue-500 text-xs font-bold uppercase tracking-[0.4em] block mb-8 relative z-20 drop-shadow-sm">
                            The Destination
                        </span>
                        
                        <motion.h2 style={{ color: headingColor }} className="text-5xl lg:text-7xl font-sans font-extrabold tracking-tight leading-[1.05] mb-8 relative z-20 transition-colors duration-100">
                            Architected for <br className="hidden lg:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                                Absolute Integrity.
                            </span>
                        </motion.h2>

                        <div className="flex justify-center items-center w-full px-4 mb-20 relative z-20">
                            <motion.p style={{ color: pColor }} className="leading-relaxed text-xl max-w-2xl transition-colors duration-100">
                                Every feature of GNB Edge flows directly into our core operating dashboard. A single, immutable source of truth for your entire logistical fleet.
                            </motion.p>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 text-left w-full justify-center relative z-20">
                            {[
                                {
                                    label: 'The Atomic Pattern',
                                    text: 'Our refactored Single Submission flow eliminates data fragmentation, ensuring every journey is an immutable, complete record from the moment of intake.',
                                    icon: 'texture'
                                },
                                {
                                    label: 'AI Verification',
                                    text: 'Python-based OCR microservices translate physical complexity into digital precision, allowing your staff to manage by exception rather than entry.',
                                    icon: 'policy'
                                },
                            ].map((item, index) => (
                                <motion.div 
                                    key={item.label}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: false, margin: "-10%" }}
                                    transition={{ duration: 0.6, delay: index * 0.2 }}
                                    className="flex-1 max-w-md"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                            <motion.span style={{ color: iconColor }} className="material-symbols-outlined transition-colors duration-100">{item.icon}</motion.span>
                                        </div>
                                        <motion.span style={{ color: labelColor }} className="text-sm uppercase tracking-[0.1em] font-bold transition-colors duration-100">
                                            {item.label}
                                        </motion.span>
                                    </div>
                                    <motion.p style={{ color: pColor }} className="font-medium leading-relaxed transition-colors duration-100">{item.text}</motion.p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </ScrollReveal>
            </div>
            
            {/* The Animated Blazing White Orb Transition */}
            {/* Restored the giant glowing epicenter, but animated securely so it builds on scroll */}
            <motion.div 
                style={{ opacity: orbOpacity, scale: orbScale, transformOrigin: 'bottom center' }}
                className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-white blur-[120px] pointer-events-none z-0" 
            />
            {/* Hard bottom edge base to smoothly connect to ContactSection's exact #F1F5F9 hex */}
            <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-b from-transparent to-[#F1F5F9] pointer-events-none z-0" />
            
        </section>
    );
};

export default InnovationSection;
