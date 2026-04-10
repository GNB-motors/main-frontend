import ScrollReveal from './ScrollReveal';
import SpotlightButton from './SpotlightButton';

const ContactSection = () => {
    return (
        <section id="contact" className="py-32 px-4 bg-[#F1F5F9] relative overflow-hidden">
            {/* Ambient Daylight Flare */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                
                {/* Header (Left) */}
                <ScrollReveal direction="left" className="flex-1 text-left relative z-10 w-full lg:w-auto">
                    <span className="text-blue-600 text-xs font-bold uppercase tracking-[0.4em] block mb-6">
                        Strategic Engagement
                    </span>
                    <h2 className="text-3xl sm:text-5xl lg:text-7xl text-[#0A192F] font-sans font-extrabold tracking-tight leading-[1.05] mb-8 drop-shadow-sm">
                        Partner with <br className="hidden lg:block"/>GNB Edge.
                    </h2>
                    <p className="text-slate-600 text-lg lg:text-xl font-medium leading-relaxed max-w-lg">
                        Evolve your operational landscape. Request a private demonstration of the ecosystem with our executive consultation team.
                    </p>
                    
                    {/* Daylight Security Seals */}
                    <div className="mt-16 flex items-center gap-6">
                        <div className="flex -space-x-4">
                            <div className="w-12 h-12 rounded-full border border-blue-200 bg-white flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-blue-600 text-sm">shield_locked</span>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-blue-200 bg-white flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-blue-500 text-sm">speed</span>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-blue-200 bg-[#0A192F] flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-white text-sm">verified_user</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[#0A192F] font-bold text-sm tracking-wide">Enterprise Grade</span>
                            <span className="text-blue-600/80 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">SOC 2 Type II Compliant</span>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Form Card Terminal (Right) -> Transitioned back to Light Mode Glassmorphism */}
                <ScrollReveal direction="right" delay={0.2} className="flex-[1.2] w-full bg-white/80 backdrop-blur-3xl p-10 sm:p-14 lg:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-slate-200 rounded-[2rem] lg:rounded-[3rem] relative z-10 overflow-hidden">
                    
                    {/* Inner glowing highlight corner */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[60px] pointer-events-none rounded-full" />
                    
                    <form className="relative grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-y-12 sm:gap-x-8 text-left w-full z-10">
                        
                        {/* Principal Name */}
                        <div className="relative group">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#0A192F]/40 mb-3 transition-colors group-focus-within:text-blue-500">
                                Principal Name
                            </label>
                            <input
                                placeholder="e.g. Sterling Archer"
                                type="text"
                                className="block w-full bg-transparent border-0 border-b border-slate-200 outline-none text-lg text-[#0A192F] pb-3 transition-colors focus:border-transparent placeholder:text-[#0A192F]/30 placeholder:italic placeholder:text-base font-sans"
                            />
                            {/* Glowing focus beam */}
                            <div className="absolute bottom-0 left-0 w-0 h-px bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500 group-focus-within:w-full" />
                        </div>

                        {/* Enterprise Email */}
                        <div className="relative group">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#0A192F]/40 mb-3 transition-colors group-focus-within:text-blue-500">
                                Enterprise Email
                            </label>
                            <input
                                placeholder="name@corporation.com"
                                type="email"
                                className="block w-full bg-transparent border-0 border-b border-slate-200 outline-none text-lg text-[#0A192F] pb-3 transition-colors focus:border-transparent placeholder:text-[#0A192F]/30 placeholder:italic placeholder:text-base font-sans"
                            />
                            <div className="absolute bottom-0 left-0 w-0 h-px bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500 group-focus-within:w-full" />
                        </div>

                        {/* Strategic Requirements */}
                        <div className="relative group col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#0A192F]/40 mb-3 transition-colors group-focus-within:text-blue-500">
                                Strategic Requirements
                            </label>
                            <textarea
                                placeholder="Describe your operational scale and vision..."
                                className="block w-full bg-transparent border-0 border-b border-slate-200 outline-none text-lg text-[#0A192F] pb-3 transition-colors focus:border-transparent placeholder:text-[#0A192F]/30 placeholder:italic placeholder:text-base font-sans h-24 resize-none"
                            />
                            <div className="absolute bottom-0 left-0 w-0 h-px bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500 group-focus-within:w-full" />
                        </div>

                        {/* Submit Block */}
                        <div className="pt-8 col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-8">
                            <SpotlightButton
                                type="button"
                                onClick={(e) => e.preventDefault()}
                                className="w-full sm:w-auto px-12 bg-blue-600 text-white py-4 font-bold uppercase tracking-[0.2em] text-xs hover:bg-blue-500 hover:-translate-y-0.5 shadow-[0_10px_30px_rgba(37,99,235,0.25)] transition-all block text-center rounded-xl cursor-pointer border-none"
                                spotlightColor="rgba(255, 255, 255, 0.4)"
                            >
                                REQUEST ACCESS
                            </SpotlightButton>
                            
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-2xl text-blue-500/80">lock</span>
                                <p className="text-[10px] text-[#0A192F]/40 uppercase tracking-[0.1em] font-semibold leading-[1.4]">
                                    SEC Compliant <br/> &amp; Confidential
                                </p>
                            </div>
                        </div>
                    </form>
                </ScrollReveal>
            </div>
        </section>
    );
};

export default ContactSection;
