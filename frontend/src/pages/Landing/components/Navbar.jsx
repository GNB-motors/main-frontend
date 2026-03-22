import ukoLogo from '../../../assets/uko-logo.png';

const Navbar = ({ onLoginClick }) => {
    return (
        <header className="bg-[#0A192F] sticky top-0 z-50 border-b border-white/5">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <img src={ukoLogo} alt="Logo" className="h-10 w-auto object-contain" />
                    <span
                        style={{ fontFamily: "'Playfair Display', serif" }}
                        className="text-xl tracking-tight text-white"
                    >
                        GNB Edge
                    </span>
                </div>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-8">
                    <a href="#" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90 hover:text-[#FF8C00] transition-colors">
                        Home
                    </a>
                    <a href="#ecosystem" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50 hover:text-[#FF8C00] transition-colors">
                        Ecosystem
                    </a>
                    <a href="#solutions" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50 hover:text-[#FF8C00] transition-colors">
                        Solutions
                    </a>
                    <a href="#contact" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50 hover:text-[#FF8C00] transition-colors">
                        Contact
                    </a>
                </nav>

                {/* Actions */}
                <div className="flex gap-4 items-center">
                    <button
                        className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/80 hover:text-[#FF8C00] transition-colors cursor-pointer bg-transparent border-none"
                        onClick={onLoginClick}
                    >
                        Portal Login
                    </button>
                    <button className="bg-[#FF8C00] text-white px-5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] hover:brightness-110 transition-all cursor-pointer border-none rounded-sm">
                        Get Started
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
