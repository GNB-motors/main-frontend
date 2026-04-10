import { motion } from 'framer-motion';

// The continuous glowing pipeline segment
const NodeConnector = () => (
    <div className="absolute left-[31px] lg:left-1/2 top-0 bottom-0 w-px -translate-x-1/2 overflow-visible z-0">
        {/* Faded background track */}
        <div className="absolute inset-0 bg-blue-500/10 w-px h-full" />
        
        {/* Glowing stroke drawn continuously on scroll */}
        <motion.div 
            initial={{ height: "0%" }}
            whileInView={{ height: "100%" }}
            viewport={{ once: false, margin: "-10%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="w-px bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)]"
        />
        
        {/* Central glowing node that pulses when reached */}
        <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: false, margin: "-20%" }}
            transition={{ duration: 0.6, delay: 0.5, type: "spring", bounce: 0.6 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-400 border-[3px] border-[#0A192F] shadow-[0_0_30px_rgba(59,130,246,1)] z-10"
        />
    </div>
);

const SolutionsSection = () => {
    return (
        <section id="solutions" className="relative bg-[#0A192F] pt-24 pb-0 overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col">
                
                {/* --- NODE 1: The Ecosystem (Text Left on Desktop) --- */}
                <div className="relative flex flex-col lg:flex-row items-center w-full min-h-[60vh] py-16">
                    <NodeConnector />
                    
                    {/* Content (Left) */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, margin: "-20%" }}
                        transition={{ duration: 0.8 }}
                        className="order-2 lg:order-1 w-full lg:w-1/2 pl-12 sm:pl-20 lg:pl-0 lg:pr-32 text-left lg:text-right flex flex-col"
                    >
                        <div className="mb-6 flex justify-start lg:justify-end mt-8 lg:mt-0">
                            <span className="material-symbols-outlined text-[60px] text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]">hub</span>
                        </div>
                        <span className="text-blue-500 text-xs uppercase tracking-[0.3em] font-bold block mb-4">
                            The GNB Edge Ecosystem
                        </span>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl text-white font-sans font-extrabold tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
                            Intelligence at Scale.
                        </h2>
                        <p className="text-white/60 leading-relaxed text-lg font-medium">
                            We don't just track your trucks; we harmonize your entire logistical operation. GNB Edge is the single, powerful ecosystem that turns chaotic fleet data into precise, automated intelligence.
                        </p>
                    </motion.div>
                    
                    {/* Empty Space for symmetry (Right) */}
                    <div className="order-3 w-full lg:w-1/2 hidden lg:block" />
                </div>

                {/* --- NODE 2: Financial Intelligence (Text Right on Desktop) --- */}
                <div className="relative flex flex-col lg:flex-row items-center w-full min-h-[60vh] py-16">
                    <NodeConnector />
                    
                    {/* Empty Space for symmetry (Left) */}
                    <div className="order-1 w-full lg:w-1/2 hidden lg:block" />

                    {/* Content (Right) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, margin: "-20%" }}
                        transition={{ duration: 0.8 }}
                        className="order-2 lg:order-2 w-full lg:w-1/2 pl-12 sm:pl-20 lg:pl-32 text-left flex flex-col"
                    >
                        <div className="mb-6 mt-8 lg:mt-0">
                            <span className="material-symbols-outlined text-[60px] text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]">query_stats</span>
                        </div>
                        <span className="text-blue-500 text-xs uppercase tracking-[0.3em] font-bold block mb-4">
                            Financial Intelligence
                        </span>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl text-white font-sans font-extrabold tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
                            Logistics meets your bottom line.
                        </h2>
                        <p className="text-white/60 leading-relaxed text-lg font-medium">
                            GNB Edge seamlessly integrates trip data with financial metrics. Automate driver payroll, track vehicle-specific ROI, and instantly access dynamic, real-time insurance tracking.
                        </p>
                    </motion.div>
                </div>

                {/* --- NODE 3: Special Reports (Text Left on Desktop) --- */}
                <div className="relative flex flex-col lg:flex-row items-center w-full min-h-[60vh] py-16">
                    <NodeConnector />
                    
                    {/* Content (Left) */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, margin: "-20%" }}
                        transition={{ duration: 0.8 }}
                        className="order-2 lg:order-1 w-full lg:w-1/2 pl-12 sm:pl-20 lg:pl-0 lg:pr-32 text-left lg:text-right flex flex-col"
                    >
                        <div className="mb-6 flex justify-start lg:justify-end mt-8 lg:mt-0">
                            <span className="material-symbols-outlined text-[60px] text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]">auto_awesome</span>
                        </div>
                        <span className="text-blue-500 text-xs uppercase tracking-[0.3em] font-bold block mb-4">
                            Special Reports
                        </span>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl text-white font-sans font-extrabold tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
                            Custom Intelligence for Complex Operations.
                        </h2>
                        <p className="text-white/60 leading-relaxed text-lg font-medium">
                            "Standard reporting doesn't tell the whole story. With GNB Edge Special Reports, you can ask conversational questions like 'Which region has the highest fuel cost-per-mile?' Get granular insights tailored to your specific business needs."
                        </p>
                    </motion.div>
                    
                    {/* Empty Space for symmetry (Right) */}
                    <div className="order-3 w-full lg:w-1/2 hidden lg:block" />
                </div>

            </div>
        </section>
    );
};

export default SolutionsSection;
