import NamePlaceDialog from '../../components/places/NamePlaceDialog';
import { useState } from 'react';
import { ArrowUpRight, Check, MapPin, Pencil } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  PLACE_CATEGORIES,
  placeCategory,
  placeCategoryLabel,
  suggestedPlaceAnswer,
} from './placeQuestionCategories';
import { questionHeadline, kmAtStakeText, questionSuspicious } from '@/utils/placeQuestions';
import { toMeasured } from '@/utils/measured';
import { formatNum } from '../../utils/formatters';
import './PlaceQuestions.css';

const SOURCES = {
  OSM: 'OpenStreetMap',
  GOOGLE: 'Google Maps',
  ADDRESS: 'the nearby address',
  REGISTER: 'your trip register',
};

/** Help the owner identify a GPS stop and understand which trips the answer affects. */
export default function PlaceQuestionCard({ question, canAnswer = true, onAnswer, busy = false }) {
  const location = useLocation();
  const [mode, setMode] = useState(null);
  if (!question) return null;

  const suggest = question.suggestion;
  const alternatives = Array.isArray(question.alternatives) ? question.alternatives : [];
  const samples = Array.isArray(question.sampleTrips) ? question.sampleTrips : [];
  const headline = questionHeadline(question);
  const kmAtStake = kmAtStakeText(question);
  const suspicious = questionSuspicious(question);
  const affected = toMeasured(question.tripsAffected);
  const trucks = toMeasured(question.trucks);
  const answer = (value) => onAnswer?.(question.id, value);
  const hasPoint = Number.isFinite(question.point?.lat) && Number.isFinite(question.point?.lng);

  return (
    <article className="atx-place-question" aria-label={suggest?.name || 'Unnamed stop'}>
      <header className="atx-place-question-head">
        <span className="atx-place-question-icon">
          <MapPin size={20} aria-hidden="true" />
        </span>
        <div className="atx-place-question-name">
          <span className="atx-place-question-eyebrow">Place to review</span>
          <h3>{suggest?.name || 'Unnamed stop'}</h3>
          {suggest ? (
            <span className="atx-place-question-type">
              {placeCategoryLabel(suggest.category)} · Suggested from{' '}
              {SOURCES[suggest.source] || 'nearby place data'}
            </span>
          ) : null}
        </div>
        <div className="atx-place-question-counts">
          <span>{affected == null ? '—' : formatNum(affected)} trips</span>
          <span>{trucks == null ? '—' : formatNum(trucks)} trucks</span>
        </div>
      </header>

      <div className="atx-place-question-evidence">
        <p className="atx-place-question-prompt">
          {headline || 'What is this place where the trucks stopped?'}
        </p>
        {question.why?.text ? <p>{question.why.text}</p> : null}
        {kmAtStake ? <p>{kmAtStake}</p> : null}
        {suspicious ? (
          <p className="atx-place-question-watch">
            {suspicious} {suspicious === 1 ? 'trip here looks' : 'trips here look'} unusual — worth
            a look
          </p>
        ) : null}
        <div className="atx-place-question-links">
          {hasPoint ? (
            <a
              href={`https://www.google.com/maps?q=${question.point.lat},${question.point.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              View location <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          ) : null}
          {samples.map((sample, index) => {
            const targetUrl = sample.to?.startsWith('/trips/')
              ? sample.to.replace('/trips/', '/auto-trips/')
              : sample.to || '/auto-trips';
            const displayLabel =
              sample.label && sample.label !== 'Open trip'
                ? sample.label
                : samples.length > 1
                  ? `Sample trip ${index + 1}`
                  : sample.label || 'Open sample trip';

            return (
              <Link
                key={`${targetUrl}-${index}`}
                to={targetUrl}
                state={{ tripsReturnTo: `${location.pathname}${location.search}` }}
              >
                {displayLabel} <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
        {alternatives.length ? (
          <p className="atx-place-question-alternatives">
            Other nearby names: {alternatives.map((alt) => alt.name).join(' · ')}
          </p>
        ) : null}
      </div>

      {canAnswer ? (
        <div className="atx-place-question-answer">
          <strong>Your answer</strong>
          <p>
            Confirming this place applies across your organisation and may update matching trips.
          </p>
          <div className="atx-place-question-actions">
            {suggest?.name?.trim() ? (
              <button
                type="button"
                className="atx-place-action atx-place-action--primary"
                disabled={busy}
                onClick={() => answer(suggestedPlaceAnswer(question))}
              >
                <Check size={15} aria-hidden="true" />
                {busy ? 'Saving…' : 'Confirm place'}
              </button>
            ) : null}
            <button
              type="button"
              className="atx-place-action"
              disabled={busy}
              onClick={() => setMode('rename')}
            >
              <Pencil size={14} aria-hidden="true" />
              {suggest?.name?.trim() ? 'Edit name or type' : 'Name this place'}
            </button>
            <button
              type="button"
              className="atx-place-action atx-place-action--quiet"
              disabled={busy}
              onClick={() => answer({ answer: 'NOT_A_PLACE' })}
            >
              Not a place
            </button>
            <button
              type="button"
              className="atx-place-action atx-place-action--quiet"
              disabled={busy}
              onClick={() => answer({ answer: 'SKIP' })}
            >
              Skip for now
            </button>
          </div>
        </div>
      ) : (
        <p className="atx-place-question-readonly">Ask your manager to answer this.</p>
      )}
      {canAnswer && mode === 'rename' ? (
        <NamePlaceDialog
          title={suggest?.name?.trim() ? 'Edit place' : 'Name this place'}
          description="Save this name and type across your organisation. Matching delivery trips may update, including outside this period."
          initialName={suggest?.name ?? ''}
          initialType={suggest?.category ? placeCategory(suggest.category) : ''}
          options={PLACE_CATEGORIES}
          maxLength={120}
          onClose={() => setMode(null)}
          onSave={async ({ name, type }) => {
            const result = await answer({ answer: 'RENAME', name, category: type });
            if (result?.error) throw new Error(result.error);
          }}
        />
      ) : null}
    </article>
  );
}
