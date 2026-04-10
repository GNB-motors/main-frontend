import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import ukoLogo from '../../../assets/uko-logo.png';
import SpotlightCard from './SpotlightCard';
import SpotlightButton from './SpotlightButton';

const Navbar = ({ onLoginClick }) => {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        
        // Hide when scrolling down, show when scrolling up
        if (latest > 100 && latest > previous) {
            setHidden(true);
        } else {
            setHidden(false);
        }
        
        // Toggle pill visual state based on scroll depth
        setScrolled(latest > 50);
    });

    // Parent container orchestrates the stagger timing
    const containerVariants = {
        visible: {
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.05
            }
        },
        hidden: {
            transition: {
                staggerChildren: 0.03,
                staggerDirection: -1
            }
        }
    };

    // Children bounce up and blur out individually
    const itemVariants = {
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            filter: "blur(0px)",
            transition: { type: "spring", stiffness: 300, damping: 24 } 
        },
        hidden: { 
            opacity: 0, 
            y: -20, 
            scale: 0.95,
            filter: "blur(4px)",
            transition: { duration: 0.2 } 
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <motion.div 
                className={`pointer-events-auto w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    scrolled 
                        ? 'max-w-5xl rounded-full border bg-[#0A192F]/70 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] mt-6' 
                        : 'max-w-7xl rounded-none border border-transparent bg-transparent shadow-none mt-0'
                }`}
                variants={{
                    visible: { y: 0, opacity: 1 },
                    hidden: { y: -30, opacity: 0 }
                }}
                initial="visible"
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
                <SpotlightCard 
                    className={`w-full flex items-center justify-between transition-all duration-700 ${scrolled ? 'py-2.5 px-8 rounded-full' : 'py-8 px-4 sm:px-8 lg:px-12 rounded-none'}`}
                    spotlightColor="rgba(255, 255, 255, 0.15)"
                    isActive={scrolled}
                >
                    <motion.div 
                        className="flex items-center justify-between w-full"
                        variants={containerVariants}
                        initial="visible"
                        animate={hidden ? "hidden" : "visible"}
                    >
                        {/* Logo */}
                        <motion.div variants={itemVariants} className="flex items-center gap-3">
                            <img src={ukoLogo} alt="Logo" className="h-8 w-auto object-contain relative z-10" />
                            <span className="text-xl font-extrabold tracking-tight text-white font-sans relative z-10">
                                GNB Edge
                            </span>
                        </motion.div>

                        {/* Nav Links */}
                        <motion.nav className="hidden md:flex items-center gap-8 relative z-10">
                            {['Home', 'Ecosystem', 'Solutions', 'Contact'].map((item) => (
                                <motion.a 
                                    key={item}
                                    href={item === 'Home' ? '#' : `#${item.toLowerCase()}`}
                                    variants={itemVariants}
                                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/80 hover:text-blue-500 transition-colors"
                                >
                                    {item}
                                </motion.a>
                            ))}
                        </motion.nav>

                        {/* Actions */}
                        <motion.div className="flex gap-2 sm:gap-4 items-center relative z-10">
                            <motion.button
                                variants={itemVariants}
                                className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.1em] text-white/80 hover:text-blue-500 transition-colors cursor-pointer bg-transparent border-none"
                                onClick={onLoginClick}
                            >
                                Portal Login
                            </motion.button>
                            <motion.div variants={itemVariants} className="rounded-full" onClick={onLoginClick}>
                                <SpotlightButton
                                    className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-blue-500 transition-colors cursor-pointer border border-blue-500/50 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                                    spotlightColor="rgba(255, 255, 255, 0.4)"
                                >
                                    Get Started
                                </SpotlightButton>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </SpotlightCard>
            </motion.div>
        </header>
    );
};

export default Navbar;
