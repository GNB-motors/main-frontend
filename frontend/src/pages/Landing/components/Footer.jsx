import ukoLogo from '../../../assets/uko-logo.png';

const Footer = ({ onLoginClick }) => {
    return (
        <footer className="bg-[#0F172A] text-white py-12 border-t border-white/5">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <img src={ukoLogo} alt="Logo" className="h-8 w-auto object-contain" />
                        <span
                            style={{ fontFamily: "'Playfair Display', serif" }}
                            className="text-xl tracking-tight text-white"
                        >
                            GNB Edge
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <button
                            type="button"
                            onClick={onLoginClick}
                            className="text-white/80 hover:text-[#006039] transition-colors font-medium"
                        >
                            Login
                        </button>
                        <a href="#" className="text-white/60 hover:text-white transition-colors">
                            Privacy
                        </a>
                        <a href="#" className="text-white/60 hover:text-white transition-colors">
                            Governance
                        </a>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-xs text-white/30">
                        © 2024 GNB Edge. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
