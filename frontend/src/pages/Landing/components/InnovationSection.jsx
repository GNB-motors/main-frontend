import ScrollReveal from './ScrollReveal';
import gnbSolutionImg from '../../../assets/Gnbsolution.png';

const InnovationSection = () => {
    return (
        <section id="innovation" className="py-32 bg-[#F8FAFC] border-t border-b border-[#0A192F]/5">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
                <ScrollReveal>
                    <div className="flex flex-col lg:flex-row shadow-2xl">
                        {/* Image */}
                        <div className="relative min-h-[500px] flex-1">
                            <img
                                alt="High-tech logistics control center with professionals monitoring real-time data on large displays"
                                src={gnbSolutionImg}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-[#0A192F] p-12 lg:p-24 flex flex-col justify-center">
                            <span className="text-[#FF8C00] text-xs font-bold uppercase tracking-[0.3em] block mb-8">
                                Technical Superiority
                            </span>
                            <h2
                                style={{ fontFamily: "'Playfair Display', serif" }}
                                className="text-4xl lg:text-5xl text-white mb-10 leading-tight"
                            >
                                Architected for <br />Absolute Integrity.
                            </h2>
                            <div className="flex flex-col gap-12">
                                {[
                                    {
                                        label: 'The Atomic Pattern',
                                        text: '"Our refactored Single Submission flow eliminates data fragmentation, ensuring every journey is an immutable, complete record from the moment of intake."',
                                    },
                                    {
                                        label: 'AI Verification',
                                        text: '"Python-based OCR microservices translate physical complexity into digital precision, allowing your staff to manage by exception rather than entry."',
                                    },
                                ].map((item) => (
                                    <div key={item.label} className="group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-px w-12 bg-[#FF8C00] transition-all duration-300 group-hover:w-20" />
                                            <span className="text-[#FF8C00] text-[10px] uppercase tracking-[0.1em] font-bold">
                                                {item.label}
                                            </span>
                                        </div>
                                        <p className="text-white/70 italic font-light leading-relaxed">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};

export default InnovationSection;
