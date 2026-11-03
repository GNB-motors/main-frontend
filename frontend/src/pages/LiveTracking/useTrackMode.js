import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { buildTrackUrl, parseTrackParams, toIso } from './trackUrlModel';
import { MS_PER_TRACK_MINUTE, indexAtTime, timeAtIndex } from './trackPlayback';

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

  // The playhead. It starts where the URL says, or at the start of the range.
  const [playheadTime, setPlayheadTime] = useState(() => state.at);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);

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
  // The live playhead, read by the loop without putting it in the effect deps:
  // if it were a dependency the loop would tear down and restart every frame
  // (which froze the truck), so instead the loop captures it once at play.
  const playheadRef = useRef(playheadTime);
  useEffect(() => {
    playheadRef.current = playheadTime;
  }, [playheadTime]);

  useEffect(() => {
    if (!isPlaying || !points.length) return undefined;

    const onVisibility = () => {
      if (document.hidden) {
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const firstMs = new Date(points[0].t).getTime();
    const lastMs = new Date(points[points.length - 1].t).getTime();
    // Play from where the playhead sits; if it is at (or past) the end, the
    // owner pressed play on a finished drive, so start the replay over.
    let fromMs = playheadRef.current ? playheadRef.current.getTime() : firstMs;
    if (!(fromMs >= firstMs && fromMs < lastMs)) fromMs = firstMs;

    const startedAt = Date.now();

    const tick = () => {
      // 1× means one real minute of the drive plays in one second.
      const trackMs = (Date.now() - startedAt) * speed * MS_PER_TRACK_MINUTE;
      const absoluteMs = fromMs + trackMs;
      if (absoluteMs >= lastMs) {
        setPlayheadTime(new Date(lastMs));
        setIsPlaying(false);
        return;
      }
      setPlayheadTime(new Date(absoluteMs));
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isPlaying, points, speed]);

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
