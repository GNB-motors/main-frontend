import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GNBLogo from '../../assets/animations/logo.png';
import './AuthHelpLayout.css';

const SLIDES = [
  {
    image:
      'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?q=80&w=2070&auto=format&fit=crop',
    title: '24/7 Support',
    desc: 'Round-the-clock customer support to help you with any questions or issues you may encounter.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop',
    title: 'Expert Assistance',
    desc: 'Get help from our team of logistics experts who understand your business needs.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    title: 'Quick Resolution',
    desc: 'Fast and efficient solutions to keep your operations running smoothly without delays.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?q=80&w=2072&auto=format&fit=crop',
    title: 'Reliable Partnership',
    desc: 'Building long-term relationships with reliable support and continuous improvement.',
  },
];

const ROTATE_MS = 5000;

/**
 * Split-screen shell for the signed-out help pages (Contact, Forgot Password):
 * content on the left, the same photo carousel as Sign In on the right.
 * Colours are fixed brand values, not --color-primary-*, because those carry
 * the last signed-in org's theme and these pages are shown before sign-in.
 */
export default function AuthHelpLayout({ title, subtitle, children }) {
  const [current, setCurrent] = useState(0);

  // Keyed on `current` so picking a slide by hand restarts the timer.
  useEffect(() => {
    const id = setTimeout(() => setCurrent((current + 1) % SLIDES.length), ROTATE_MS);
    return () => clearTimeout(id);
  }, [current]);

  return (
    <div className="auth-help">
      <main className="auth-help-main">
        <Link to="/login" className="auth-help-back">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to sign in
        </Link>

        <div className="auth-help-content">
          <span className="auth-help-logo" role="img" aria-label="GNB, since 1980">
            <img src={GNBLogo} alt="" />
          </span>
          <h1 className="auth-help-title">{title}</h1>
          {subtitle ? <p className="auth-help-subtitle">{subtitle}</p> : null}
          {children}
        </div>
      </main>

      <aside className="auth-help-showcase" aria-label="Why GNB">
        {SLIDES.map((slide, index) => (
          <img
            key={slide.title}
            src={slide.image}
            alt=""
            className={`auth-help-slide${index === current ? ' is-active' : ''}`}
          />
        ))}
        <div className="auth-help-tint" aria-hidden="true" />

        <div className="auth-help-glass">
          <div className="auth-help-glass-title">{SLIDES[current].title}</div>
          <p className="auth-help-glass-desc">{SLIDES[current].desc}</p>
          <div className="auth-help-dots">
            {SLIDES.map((slide, index) => (
              <button
                type="button"
                key={slide.title}
                className={`auth-help-dot${index === current ? ' is-active' : ''}`}
                aria-label={`Show ${slide.title}`}
                aria-current={index === current}
                onClick={() => setCurrent(index)}
              />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
