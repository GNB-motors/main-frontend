import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { buildTrackUrl, parseTrackParams, toIso } from './trackUrlModel';
import { indexAtTime, playbackPosition, timeAtIndex } from './trackPlayback';

/**
 * useTrackMode — the state of Track mode.
 *
 * Track mode is driven by the URL, so every link in the product can open
 * it: the Track button, the digest, an issue's "see the 6 times", a
 * detour. This hook reads the URL, fetches the truck's path for the range,
 * and runs the playhead.
 */
export default function useTrackMode({ searchParams, setSearchParams }) {
  const state = useMemo(() => parseTrackParams(searchParams), [searchParams]);
  const isTrackMode = Boolean(state.reg);

  const { data, loading, error } = useApi(
    (signal) =>
      fleetViewService.getVehicleTrack(state.reg, {
        from: toIso(state.from),
        to: toIso(state.to),
        signal,
      }),
    [state.reg, state.from?.getTime(), state.to?.getTime()],
    { enabled: isTrackMode },
  );

  const track = data?.held === true ? null : (data ?? null);
  const points = useMemo(() => (Array.isArray(track?.points) ? track.points : []), [track]);

  // The playhead. It starts where the URL says, or at the end of the range.
  const [playheadTime, setPlayheadTime] = useState(() => state.at);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // A new truck or a new range puts the playhead back where the URL says.
  const urlAt = state.at;
  const urlReg = state.reg;
  useEffect(() => {
    setPlayheadTime(urlAt);
    setIsPlaying(false);
  }, [urlReg, urlAt]);

  // The animation. requestAnimationFrame, paused when the tab is hidden —
  // a background tab must not burn the owner's battery.
  const frameRef = useRef(null);
  const startedAtRef = useRef(null);
  const startPlayheadRef = useRef(null);

  useEffect(() => {
    if (!isPlaying || !points.length) return undefined;

    const onVisibility = () => {
      if (document.hidden) {
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    startedAtRef.current = Date.now();
    startPlayheadRef.current = playheadTime;

    const tick = () => {
      const elapsed = Date.now() - startedAtRef.current;
      const position = playbackPosition(points, elapsed, speed);
      if (!position) {
        setIsPlaying(false);
        return;
      }
      const absolute = new Date(startPlayheadRef.current.getTime() + (position.at.getTime() - new Date(points[0].t).getTime()));
      setPlayheadTime(absolute);
      if (position.finished) {
        setIsPlaying(false);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isPlaying, points, speed, playheadTime]);

  const seekToTime = useCallback((time) => {
    setIsPlaying(false);
    setPlayheadTime(time instanceof Date ? time : new Date(time));
  }, []);

  const seekToIndex = useCallback(
    (index) => {
      const time = timeAtIndex(points, index);
      if (time) seekToTime(time);
    },
    [points, seekToTime],
  );

  /**
   * Write the range back into the URL.
   * `replace: true` — the owner's range choice is not a history entry, it
   * is the same screen with a different range.
   */
  const applyRange = useCallback(
    ({ from, to, at = null }) => {
      const next = buildTrackUrl({
        reg: state.reg,
        from,
        to,
        at: at ?? to,
      });
      setSearchParams?.(new URLSearchParams(next.split('?')[1] || ''), { replace: true });
    },
    [state.reg, setSearchParams],
  );

  const exitTrackMode = useCallback(() => {
    setSearchParams?.(new URLSearchParams(''), { replace: true });
  }, [setSearchParams]);

  const playheadIndex = points.length ? indexAtTime(points, playheadTime) : 0;

  return {
    isTrackMode,
    reg: state.reg,
    from: state.from,
    to: state.to,
    at: state.at,
    isDefaultRange: state.isDefaultRange,
    correctedRange: state.correctedRange,
    track,
    points,
    loading,
    error,
    notDeployed: error?.status === 404,
    held: data?.held === true,
    playheadTime,
    playheadIndex,
    isPlaying,
    speed,
    setSpeed,
    setIsPlaying,
    seekToTime,
    seekToIndex,
    applyRange,
    exitTrackMode,
  };
}
