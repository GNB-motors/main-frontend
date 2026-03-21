import ScrollReveal from './ScrollReveal';

const ContactSection = () => {
    return (
        <section id="contact" className="py-32 px-4 bg-[#0A192F] relative overflow-hidden">
            <div className="max-w-4xl mx-auto relative flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                {/* Header */}
                <ScrollReveal direction="left" className="flex-1 text-left">
                    <span className="text-[#F5F3EF] text-xs font-bold uppercase tracking-[0.3em] block mb-8">
                        Strategic Engagement
                    </span>
                    <h2
                        style={{ fontFamily: "'Playfair Display', serif" }}
                        className="text-5xl lg:text-6xl text-[#F5F3EF] mb-8 leading-[1.15]"
                    >
                        Partner with <br />GNB Edge
                    </h2>
                    <p
                        className="text-lg text-[#E8E6E1] font-light leading-relaxed"
                    >
                        Evolve your operational landscape. Request a private demonstration of the ecosystem
                        with our executive consultation team.
                    </p>
                </ScrollReveal>

                {/* Card */}
                <ScrollReveal direction="right" delay={0.2} className="flex-[1.25] bg-white p-12 sm:p-16 shadow-2xl border border-black/5 rounded">
                    <form className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-y-12 sm:gap-x-8 text-left w-full">
                        {/* Principal Name */}
                        <div className="relative group">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#0A192F]/40 mb-3 transition-colors group-focus-within:text-[#FF8C00]">
                                Principal Name
                            </label>
                            <input
                                placeholder="e.g. Sterling Archer"
                                type="text"
                                className="block w-full bg-transparent border-0 border-b border-[#0A192F]/20 outline-none text-lg text-[#0A192F] pb-2 transition-colors focus:border-transparent placeholder:text-[#0A192F]/15 placeholder:italic placeholder:text-base font-sans"
                            />
                            <div className="absolute bottom-0 left-0 w-0 h-px bg-[#FF8C00] transition-all duration-400 group-focus-within:w-full" />
                        </div>

                        {/* Enterprise Email */}
                        <div className="relative group">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#0A192F]/40 mb-3 transition-colors group-focus-within:text-[#FF8C00]">
                                Enterprise Email
                            </label>
                            <input
                                placeholder="name@corporation.com"
                                type="email"
                                className="block w-full bg-transparent border-0 border-b border-[#0A192F]/20 outline-none text-lg text-[#0A192F] pb-2 transition-colors focus:border-transparent placeholder:text-[#0A192F]/15 placeholder:italic placeholder:text-base font-sans"
                            />
                            <div className="absolute bottom-0 left-0 w-0 h-px bg-[#FF8C00] transition-all duration-400 group-focus-within:w-full" />
                        </div>

                        {/* Strategic Requirements */}
                        <div className="relative group col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#0A192F]/40 mb-3 transition-colors group-focus-within:text-[#FF8C00]">
                                Strategic Requirements
                            </label>
                            <textarea
                                placeholder="Describe your operational scale and vision..."
                                className="block w-full bg-transparent border-0 border-b border-[#0A192F]/20 outline-none text-lg text-[#0A192F] pb-2 transition-colors focus:border-transparent placeholder:text-[#0A192F]/15 placeholder:italic placeholder:text-base font-sans h-24 resize-none"
                            />
                            <div className="absolute bottom-0 left-0 w-0 h-px bg-[#FF8C00] transition-all duration-400 group-focus-within:w-full" />
                        </div>

                        {/* Submit */}
                        <div className="pt-6 col-span-1 sm:col-span-2">
                            <button
                                type="button"
                                onClick={(e) => e.preventDefault()}
                                className="w-4/5 max-w-96 bg-[#FF8C00] text-white py-4 font-bold uppercase tracking-[0.25em] text-xs hover:brightness-110 hover:-translate-y-0.5 transition-all block text-center rounded-sm cursor-pointer border-none"
                            >
                                SUBMIT
                            </button>
                            <div className="flex items-center gap-2 mt-8">
                                <span className="material-symbols-outlined text-xl text-[#0A192F]/30">lock</span>
                                <p className="text-[10px] text-[#0A192F]/40 uppercase tracking-[0.1em] font-semibold leading-[1.4]">
                                    SEC Compliant &amp; Confidential
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
