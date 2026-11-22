import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import RoadService from '../../services/RoadService';
import { parseTrackParams, toIso } from './trackUrlModel';
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
  const regParam = searchParams?.get('v') || null;
  const contextReg = regParam || searchParams?.get('vehicle') || null;
  const fromParam = searchParams?.get('from');
  const toParam = searchParams?.get('to');
  const atParam = searchParams?.get('at');
  const state = useMemo(
    () =>
      parseTrackParams(
        new URLSearchParams({
          ...(regParam ? { v: regParam } : {}),
          ...(fromParam ? { from: fromParam } : {}),
          ...(toParam ? { to: toParam } : {}),
          ...(atParam ? { at: atParam } : {}),
        }),
      ),
    [regParam, fromParam, toParam, atParam],
  );
  const isTrackMode = Boolean(state.reg);
  const enabled = isTrackMode;
  const scopeKey = `${contextReg}:${toIso(state.from)}:${toIso(state.to)}`;

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      fleetViewService.getVehicleTrack(contextReg, {
        from: toIso(state.from),
        to: toIso(state.to),
        signal,
      }),
    [contextReg, state.from?.getTime(), state.to?.getTime()],
    { enabled, scopeKey },
  );

  const track = data?.held === true ? null : (data ?? null);
  const points = useMemo(() => (Array.isArray(track?.points) ? track.points : []), [track]);

  // The road-matched route from our self-hosted engine. When it is on and the
  // days are matched, the route follows real roads instead of cutting straight
  // across GPS gaps; a null (engine off, or no match yet) falls back to the
  // raw-point line. A map must never break on it — the service returns null on
  // any error.
  const { data: roadData } = useApi(
    (signal) =>
      RoadService.getRoadTrailIfEnabled(
        contextReg,
        { from: toIso(state.from), to: toIso(state.to) },
        signal,
      ),
    [contextReg, state.from?.getTime(), state.to?.getTime()],
    { enabled, scopeKey },
  );
  const roadTrail = roadData ?? null;

  // Independent, abortable read once per vehicle/range, never per playback frame.
  const tollScope = scopeKey;
  const {
    data: tolls,
    loading: tollsLoading,
    error: tollsError,
    refetch: retryTolls,
  } = useApi(
    (signal) =>
      fleetViewService.getVehicleTolls(contextReg, {
        from: toIso(state.from),
        to: toIso(state.to),
        signal,
      }),
    [contextReg, state.from?.getTime(), state.to?.getTime()],
    { enabled, scopeKey: tollScope },
  );

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
        // Leave the truck at its final recorded fix. Only an explicit Play
        // or rewind action should take the owner back to the start.
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

  const seekToTime = useCallback(
    (time) => {
      const target = time instanceof Date ? time : new Date(time);
      if (!Number.isFinite(target.getTime())) return;
      setIsPlaying(false);
      setPlayheadTime(target);
      if (isTrackMode)
        setSearchParams?.(
          (current) => {
            const next = new URLSearchParams(current);
            next.set('at', toIso(target));
            return next;
          },
          { replace: true },
        );
    },
    [isTrackMode, setSearchParams],
  );

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
      setSearchParams?.(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('from', toIso(from));
          next.set('to', toIso(to));
          next.set('at', toIso(at ?? from));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const exitTrackMode = useCallback(() => {
    setIsPlaying(false);
    setSearchParams?.(
      (current) => {
        const next = new URLSearchParams(current);
        const reg = next.get('v');
        if (reg) next.set('vehicle', reg);
        next.delete('v');
        next.delete('at');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (searchParams?.get('view') === 'places') setIsPlaying(false);
  }, [searchParams]);

  const playheadIndex = points.length ? indexAtTime(points, playheadTime) : 0;

  return {
    isTrackMode,
    contextReg,
    refetch,
    reg: state.reg,
    from: state.from,
    to: state.to,
    at: state.at,
    isDefaultRange: state.isDefaultRange,
    correctedRange: state.correctedRange,
    track,
    points,
    roadTrail,
    tolls,
    tollsLoading,
    tollsError,
    retryTolls,
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
