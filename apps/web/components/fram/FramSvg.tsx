import type { CSSProperties, MouseEventHandler, Ref } from 'react';

/** Values that drive Fram's face. Produced by useFram / useHomeFram. */
export interface FramFace {
  eyeX: string;
  eyeY: string;
  headX: string;
  headY: string;
  mouthX: string;
  mouthY: string;
  eyeScale: number;
  blinkMs: number;
  mouth: string;
  armClass: string;
}

export const FRAM_MOUTHS = {
  smile: 'M424,614 Q480,646 536,614 Q546,612 540,628 Q480,690 420,628 Q414,612 424,614 Z',
  grin: 'M414,600 Q480,628 546,600 Q558,598 550,622 Q480,722 410,622 Q402,598 414,600 Z',
  o: 'M458,624 Q480,604 502,624 Q512,646 502,668 Q480,690 458,668 Q448,646 458,624 Z',
  flat: 'M432,628 Q480,640 528,628 Q538,628 532,640 Q480,664 428,640 Q422,628 432,628 Z',
} as const;

export type FramMood = keyof typeof FRAM_MOUTHS;

interface Props {
  f: FramFace;
  label: string;
  className?: string;
  style?: CSSProperties;
  svgRef?: Ref<SVGSVGElement>;
  onMouseDown?: MouseEventHandler<SVGSVGElement>;
  /** Gentle idle bob (homepage). */
  bob?: boolean;
}

/** Fram, the Fremwork character. Geometry is copied 1:1 from the design canvas. */
export function FramSvg({ f, label, className, style, svgRef, onMouseDown, bob }: Props) {
  const eye: CSSProperties = {
    transform: `scaleY(${f.eyeScale})`,
    transformBox: 'fill-box',
    transformOrigin: 'center',
    transition: `transform ${f.blinkMs}ms ease-in-out`,
  };
  const body = (
    <>
      <g className={f.armClass} style={{ transformBox: 'view-box', transformOrigin: '228px 582px' }}>
        <polyline points="228,582 168,578 140,470" fill="none" stroke="#0A0A0A" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="228,582 168,578 140,470" fill="none" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="138" cy="468" r="32" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="13" />
      </g>
      <polyline points="712,632 760,668 796,696" fill="none" stroke="#0A0A0A" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="712,632 760,668 796,696" fill="none" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="798" cy="698" r="32" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="13" />
      <rect x="358" y="812" width="76" height="58" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="13" />
      <rect x="532" y="812" width="76" height="58" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="13" />
      <rect x="338" y="860" width="124" height="38" rx="19" fill="#0A0A0A" />
      <rect x="512" y="860" width="124" height="38" rx="19" fill="#0A0A0A" />
      <path d="M230,340 H525 V430 H320 V740 H625 V530 H715 V825 H230 Z" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="14" strokeLinejoin="round" />
      <g className="fram-live" style={{ transform: `translate(${f.headX}px, ${f.headY}px)`, transition: 'transform 260ms cubic-bezier(.2,.8,.2,1)' }}>
        <rect x="344" y="454" width="278" height="268" rx="30" fill="#0A0A0A" />
        <g className="fram-live" style={{ transform: `translate(${f.eyeX}px, ${f.eyeY}px)`, transition: 'transform 160ms cubic-bezier(.2,.8,.2,1)' }}>
          <rect x="419" y="498" width="34" height="66" rx="17" fill="#C6F432" style={eye} />
          <rect x="504" y="498" width="34" height="66" rx="17" fill="#C6F432" style={eye} />
        </g>
        <path
          className="fram-live"
          d={f.mouth}
          fill="#C6F432"
          style={
            {
              d: `path('${f.mouth}')`,
              transform: `translate(${f.mouthX}px, ${f.mouthY}px)`,
              transition: 'd 240ms cubic-bezier(.2,.8,.2,1), transform 200ms ease-out',
            } as CSSProperties
          }
        />
      </g>
      <rect x="561" y="311" width="183" height="183" fill="#C6F432" stroke="#0A0A0A" strokeWidth="14" strokeLinejoin="round" />
    </>
  );
  return (
    <svg
      ref={svgRef}
      className={className}
      onMouseDown={onMouseDown}
      viewBox="90 296 760 612"
      role="img"
      aria-label={label}
      style={style}
    >
      {bob ? <g className="fram-bob fram-live">{body}</g> : body}
    </svg>
  );
}
