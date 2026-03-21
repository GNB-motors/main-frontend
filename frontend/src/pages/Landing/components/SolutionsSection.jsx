import { useEffect, useRef, useState } from 'react';
import dashboardImg from '../../../assets/Landingpage/Total dashboard.png';
import payrollImg from '../../../assets/Landingpage/payroll.png';
import reportsImg from '../../../assets/Landingpage/Reports.png';

const slides = [
    {
        image: dashboardImg,
        tag: 'The gnbedge Ecosystem',
        title: 'Intelligence at Scale.',
        subtitle: 'Profitability, Automated.',
        body: "We don't just track your trucks; we harmonize your entire logistical operation. gnbedge is the single, powerful ecosystem that turns chaotic fleet data into precise, automated intelligence. Welcome to the future of logistics.",
    },
    {
        image: payrollImg,
        tag: 'Financial Intelligence',
        title: 'Logistics meets your bottom line.',
        subtitle: 'Full financial intelligence, powered by your data.',
        body: 'gnbedge seamlessly integrates trip data with financial metrics. Automate driver payroll, track vehicle-specific ROI, and instantly access dynamic, real-time insurance tracking.',
    },
    {
        image: reportsImg,
        tag: 'Special Reports',
        title: 'Custom Intelligence for Complex Operations.',
        subtitle: null,
        body: '"Standard reporting doesn\'t tell the whole story. With gnbedge Special Reports, you can ask conversational questions like \'Which region has the highest fuel cost-per-mile?\' or \'Show me the ROI of my electric vehicle transition.\' Get granular insights tailored to your specific business needs."',
        isQuote: true,
    },
];

const SolutionsSection = () => {
    const sectionRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        // body is the scroll container (html+body have height:100%, body has overflow-y:auto)
        // so scroll events fire on document.body, not window
        const scrollContainer = document.body;

        const handleScroll = () => {
            const section = sectionRef.current;
            if (!section) return;

            const rect = section.getBoundingClientRect();
            const sectionHeight = section.offsetHeight;
            const viewportHeight = window.innerHeight;

            const scrolled = -rect.top;
            const total = sectionHeight - viewportHeight;
            const ratio = Math.max(0, Math.min(1, scrolled / total));

            const idx = Math.min(
                slides.length - 1,
                Math.floor(ratio * slides.length)
            );
            setActiveIndex(idx);
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section
            ref={sectionRef}
            id="solutions"
            style={{ height: `${(slides.length + 1) * 100}vh` }}
            className="relative"
        >
            {/* Sticky container — sticky works because body is the scroll container */}
            <div className="sticky top-0 h-screen overflow-hidden bg-[#0A192F] flex">

                {/* Left — text */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center px-10 lg:px-20 py-16 z-10">

                    {/* Wrap ALL changing text in a single keyed div so React fully remounts it,
                        which restarts the CSS animation on every slide change */}
                    <div
                        key={activeIndex}
                        style={{ animation: 'fadeSlideUp 0.5s ease both' }}
                    >
                        <span className="text-[#FF8C00] text-xs uppercase tracking-[0.15em] font-bold mb-4 block">
                            {slides[activeIndex].tag}
                        </span>

                        <h2
                            style={{ fontFamily: "'Playfair Display', serif" }}
                            className="text-4xl lg:text-6xl text-white leading-tight mb-4"
                        >
                            {slides[activeIndex].title}
                        </h2>

                        {slides[activeIndex].subtitle && (
                            <p
                                className="text-[#FF8C00] text-lg font-semibold mb-6"
                                style={{ animation: 'fadeSlideUp 0.5s ease 60ms both' }}
                            >
                                {slides[activeIndex].subtitle}
                            </p>
                        )}

                        <p
                            className={`text-white/60 leading-relaxed text-base lg:text-lg ${slides[activeIndex].isQuote ? 'italic' : ''}`}
                            style={{ animation: 'fadeSlideUp 0.5s ease 120ms both' }}
                        >
                            {slides[activeIndex].body}
                        </p>
                    </div>

                    {/* Dot indicators */}
                    <div className="flex gap-3 mt-12">
                        {slides.map((_, i) => (
                            <div
                                key={i}
                                className={`h-0.5 transition-all duration-500 ${
                                    i === activeIndex
                                        ? 'w-10 bg-[#FF8C00]'
                                        : 'w-4 bg-white/20'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Right — images (all rendered, active one fades in) */}
                <div className="hidden lg:block w-1/2 relative overflow-hidden">
                    {slides.map((s, i) => (
                        <img
                            key={i}
                            src={s.image}
                            alt={s.title}
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                                i === activeIndex
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-105'
                            }`}
                        />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F]/60 to-transparent pointer-events-none" />
                </div>
            </div>
        </section>
    );
};

export default SolutionsSection;
