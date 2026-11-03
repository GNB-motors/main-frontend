import { Link } from 'react-router-dom';

/**
 * WhyPopover — the body of an explanation.
 *
 * It prints the plain sentence first ("This truck idles 2.1 h a day"), then
 * the evidence underneath it, then a link to the exact moments. An
 * explanation without evidence is just an opinion, so `basis` is the point.
 */
export default function WhyPopover({ why = null, link = null }) {
  if (!why && !link) return null;

  return (
    <div className="flex max-w-[280px] flex-col gap-1.5">
      {why?.text ? <p className="m-0 text-[13px] leading-relaxed text-[var(--rd-ink-2)]">{why.text}</p> : null}
      {why?.basis ? (
        <p className="m-0 text-[12px] leading-relaxed text-[var(--rd-ink-3)]">{why.basis}</p>
      ) : null}
      {link?.to ? (
        <Link
          to={link.to}
          className="text-[12px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
        >
          {`→ ${link.label}`}
        </Link>
      ) : null}
    </div>
  );
}
