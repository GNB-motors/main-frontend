import ukoLogo from '../../../assets/uko-logo.png';

const Footer = ({ onLoginClick }) => {
    return (
        <footer className="bg-[#F1F5F9] text-[#0A192F] py-16 border-t border-[#0A192F]/5">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
                    {/* Brand */}
                    <div className="flex items-center gap-4">
                        <img src={ukoLogo} alt="Logo" className="h-8 w-auto object-contain opacity-90" />
                        <span className="text-xl tracking-[0.2em] font-sans font-extrabold uppercase text-[#0A192F]/90">
                            GNB Edge
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap items-center gap-8 text-xs font-bold uppercase tracking-[0.1em]">
                        <button
                            type="button"
                            onClick={onLoginClick}
                            className="text-[#0A192F]/50 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                            Executive Login
                        </button>
                        <a href="#" className="text-[#0A192F]/50 hover:text-blue-600 transition-colors">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-[#0A192F]/50 hover:text-blue-600 transition-colors">
                            Compliance
                        </a>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 border-t border-[#0A192F]/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-[#0A192F]/40 font-bold tracking-wide">
                        © {new Date().getFullYear()} GNB Edge Logistics. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse" />
                        <span className="text-[10px] text-blue-600 uppercase tracking-[0.2em] font-extrabold">Systems Operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
