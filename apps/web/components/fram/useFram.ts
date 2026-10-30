'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { MouseEvent } from 'react';
import { FRAM_MOUTHS, type FramFace, type FramMood } from './FramSvg';
import { useMergeState } from './useMergeState';

const mm = (q: string) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false);

/** Blinking (random, sometimes double) and the 2.3s wave, shared by every Fram. */
export function useBlinkWave(opts: { waveOnMount?: boolean } = {}) {
  const [s, set] = useMergeState({ blink: false, wave: false });
  const t = useRef<{ blink?: number; blink2?: number; wave?: number; wave0?: number }>({});
  const env = useRef({ fine: false, reduced: false, waving: false, lastWave: 0 });

  const wave = useCallback(() => {
    const e = env.current;
    if (e.reduced || e.waving) return;
    e.waving = true;
    e.lastWave = Date.now();
    set({ wave: true });
    t.current.wave = window.setTimeout(() => {
      e.waving = false;
      set({ wave: false });
    }, 2300);
  }, [set]);

  useEffect(() => {
    env.current.fine = mm('(hover: hover) and (pointer: fine)');
    env.current.reduced = mm('(prefers-reduced-motion: reduce)');
    const timers = t.current;
    const queueBlink = () => {
      timers.blink = window.setTimeout(() => {
        set({ blink: true });
        timers.blink2 = window.setTimeout(() => {
          set({ blink: false });
          if (Math.random() < 0.22) {
            timers.blink2 = window.setTimeout(() => {
              set({ blink: true });
              timers.blink2 = window.setTimeout(() => set({ blink: false }), 110);
            }, 170);
          }
        }, 120);
        queueBlink();
      }, 2400 + Math.random() * 3200);
    };
    queueBlink();
    if (opts.waveOnMount) timers.wave0 = window.setTimeout(wave, 500);
    return () => Object.values(timers).forEach((id) => clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { blink: s.blink, wave: s.wave, triggerWave: wave, env };
}

export function faceFrom(p: { ex: number; ey: number; mood: FramMood; squint: boolean; blink: boolean; wave: boolean }): FramFace {
  return {
    eyeX: p.ex.toFixed(2),
    eyeY: p.ey.toFixed(2),
    headX: (p.ex * 0.28).toFixed(2),
    headY: (p.ey * 0.28).toFixed(2),
    mouthX: (p.ex * 0.35).toFixed(2),
    mouthY: (p.ey * 0.25).toFixed(2),
    eyeScale: p.blink ? 0.08 : p.squint ? 0.6 : p.mood === 'o' ? 1.15 : 1,
    blinkMs: p.blink ? 70 : 140,
    mouth: FRAM_MOUTHS[p.mood] || FRAM_MOUTHS.smile,
    armClass: p.wave ? 'fram-wave' : '',
  };
}

/**
 * Fram on the auth, events and 404 screens: eyes follow the pointer, waves on enter,
 * says "o" when poked. `formMood` overrides the mouth (grin on success, o on error).
 * `scan` makes him look around while idle (404).
 */
export function useFram(formMood: FramMood | '' = '', opts: { scan?: boolean } = {}) {
  const { blink, wave, triggerWave, env } = useBlinkWave({ waveOnMount: true });
  const [s, set] = useMergeState({ ex: 0, ey: 0, pmood: 'smile' as FramMood, squint: false });
  const el = useRef<SVGSVGElement | null>(null);
  const r = useRef({ raf: 0, pending: null as null | (() => void), idle: 0, poke: 0, hold: false, lastPointer: 0, scan: 0, step: 0 });

  useEffect(() => {
    const st = r.current;
    if (opts.scan) {
      const xs = [-22, 0, 22, 0];
      const ys = [-6, 4, -6, 4];
      st.scan = window.setInterval(() => {
        if (Date.now() - st.lastPointer < 3500) return;
        st.step = (st.step + 1) % 4;
        set({ ex: xs[st.step], ey: ys[st.step], pmood: 'flat', squint: false });
      }, 1300);
    }
    return () => {
      clearTimeout(st.idle);
      clearTimeout(st.poke);
      clearInterval(st.scan);
      if (st.raf) cancelAnimationFrame(st.raf);
    };
  }, [opts.scan, set]);

  const fromPointer = useCallback(
    (x: number, y: number) => {
      r.current.lastPointer = Date.now();
      const node = el.current;
      if (!node) return;
      const b = node.getBoundingClientRect();
      const dx = x - (b.left + b.width * 0.517);
      const dy = y - (b.top + b.height * 0.477);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const m = Math.min(1, dist / 280);
      let pm: FramMood = 'smile';
      let squint = false;
      if (dist < b.width * 0.22) {
        pm = 'grin';
        squint = true;
      } else if (dist > 900) pm = 'flat';
      if (r.current.hold) {
        pm = 'o';
        squint = false;
      }
      set({ ex: (dx / dist) * 24 * m, ey: (dy / dist) * 20 * m, pmood: pm, squint });
    },
    [set],
  );

  const frame = (fn: () => void) => {
    const st = r.current;
    st.pending = fn;
    if (st.raf) return;
    st.raf = requestAnimationFrame(() => {
      st.raf = 0;
      const p = st.pending;
      st.pending = null;
      p?.();
    });
  };

  const rest = { ex: 0, ey: 0, pmood: 'smile' as FramMood, squint: false };
  const handlers = {
    setFram: (node: SVGSVGElement | null) => {
      el.current = node;
    },
    onMove: (e: MouseEvent) => {
      if (!env.current.fine) return;
      const { clientX: x, clientY: y } = e;
      frame(() => fromPointer(x, y));
      clearTimeout(r.current.idle);
      r.current.idle = window.setTimeout(() => set(rest), 3500);
    },
    onEnter: () => {
      if (!env.current.fine) return;
      if (Date.now() - env.current.lastWave > 6000) triggerWave();
    },
    onLeave: () => {
      if (!env.current.fine) return;
      clearTimeout(r.current.idle);
      r.current.pending = null;
      set(rest);
    },
    onPoke: (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      r.current.hold = true;
      set({ pmood: 'o', squint: false });
      clearTimeout(r.current.poke);
      r.current.poke = window.setTimeout(() => {
        r.current.hold = false;
        if (env.current.fine) fromPointer(x, y);
        else set({ pmood: 'smile' });
      }, 520);
    },
  };

  const mood: FramMood = r.current.hold ? 'o' : formMood || s.pmood || 'smile';
  let squint = !formMood && s.squint;
  if (formMood === 'grin') squint = true;
  const face = useMemo(
    () => faceFrom({ ex: s.ex, ey: s.ey, mood, squint, blink, wave }),
    [s.ex, s.ey, mood, squint, blink, wave],
  );

  return { ...face, ...handlers };
}
