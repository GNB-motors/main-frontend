import ukoLogo from '../../../assets/uko-logo.png';

const TopBar = () => {
    return (
        <div className="bg-[#0F172A] text-white py-4 border-b border-white/5">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <img src={ukoLogo} alt="Logo" className="h-14 w-auto object-contain" />
                    <span style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl tracking-tight text-white">
                        GNB Edge
                    </span>
                </div>
                <div className="hidden md:flex items-center gap-12">
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#006039] font-medium mb-1">
                            Executive Advisory
                        </p>
                        <p className="text-lg font-light tracking-wide italic text-white">
                            Strategic Oversight
                        </p>
                    </div>
                    <button className="border border-[#006039]/40 px-6 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-white hover:bg-[#006039] transition-all duration-300 cursor-pointer bg-transparent">
                        Contact Partner
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
