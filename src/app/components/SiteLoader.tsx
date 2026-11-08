import { useEffect, useRef, useState, useCallback } from 'react';
import { SPLASH_STORAGE_KEY, shouldShowSplash } from '../lib/splash';

/**
 * PLAINSYT — Ultra Precision Procedural Splash Screen
 * Exact port of splashscreen.html in 'english-only' mode (Horizontal English.png lockup)
 * Speed: 1.00x (normal speed)
 * Palette: Lime to White
 */

const PATHS = {
  unifiedP:
    "M 205 355 A 42 42 0 0 1 247 313 L 343 313 A 35 35 0 0 0 378 278 L 378 189 A 42 42 0 0 1 420 147 " +
    "L 555 147 A 258.5 258.5 0 0 1 555 664 L 404 664 A 31 31 0 0 0 373 695 L 373 795 A 32 32 0 0 1 341 827 " +
    "L 243 827 A 32 32 0 0 1 211 795 L 211 668 A 48 48 0 0 1 225.1 634.1 L 361.1 498.1 A 41 41 0 0 1 390.1 486 " +
    "L 580 486 A 86.5 86.5 0 0 0 580 313 L 434 313 A 57 57 0 0 0 377 370 L 377 445 A 42 42 0 0 1 335 487 " +
    "L 247 487 A 42 42 0 0 1 205 445 Z",
  earlySketch:
    "M 490 295 L 330 295 A 38 38 0 0 0 292 333 L 292 475 A 38 38 0 0 1 254 513 L 185 513 A 38 38 0 0 1 147 475 L 147 315 A 38 38 0 0 1 185 277 L 265 277",
};

const WORDMARK_PATHS = [
  // 1. P
  "M 205 355 A 42 42 0 0 1 247 313 L 343 313 A 35 35 0 0 0 378 278 L 378 189 A 42 42 0 0 1 420 147 L 555 147 A 258.5 258.5 0 0 1 555 664 L 404 664 A 31 31 0 0 0 373 695 L 373 755 A 32 32 0 0 1 341 787 L 243 787 A 32 32 0 0 1 211 755 L 211 668 A 48 48 0 0 1 225.1 634.1 L 361.1 498.1 A 41 41 0 0 1 390.1 486 L 580 486 A 86.5 86.5 0 0 0 580 313 L 434 313 A 57 57 0 0 0 377 370 L 377 445 A 42 42 0 0 1 335 487 L 247 487 A 42 42 0 0 1 205 445 Z",
  // 2. L
  "M 865 232 A 28 28 0 0 1 893 204 L 980 204 A 28 28 0 0 1 1008 232 L 1008 486 A 46 46 0 0 0 1054 532 L 1282 532 A 28 28 0 0 1 1310 560 L 1310 636 A 28 28 0 0 1 1282 664 L 1015 664 A 150 150 0 0 1 865 514 Z",
  // 3. A
  "M 1348 628 L 1510 282 A 142 142 0 0 1 1766 282 L 1928 628 A 26 26 0 0 1 1904 664 L 1562 664 A 18 18 0 0 1 1546 638 L 1586 550 A 22 22 0 0 1 1606 537 L 1736 537 L 1652 348 A 16 16 0 0 0 1624 348 L 1484 648 A 26 26 0 0 1 1460 664 L 1372 664 A 26 26 0 0 1 1348 628 Z",
  // 4. I
  "M 1986 232 A 28 28 0 0 1 2014 204 L 2102 204 A 28 28 0 0 1 2130 232 L 2130 636 A 28 28 0 0 1 2102 664 L 2014 664 A 28 28 0 0 1 1986 636 Z",
  // 5. N
  "M 2202 294 A 90 90 0 0 1 2362 238 L 2592 480 L 2592 232 A 28 28 0 0 1 2620 204 L 2708 204 A 28 28 0 0 1 2736 232 L 2736 574 A 90 90 0 0 1 2576 630 L 2346 388 L 2346 636 A 28 28 0 0 1 2318 664 L 2230 664 A 28 28 0 0 1 2202 636 Z",
  // 6. S
  "M 2945 204 L 3278 204 A 28 28 0 0 1 3306 232 L 3306 292 A 28 28 0 0 1 3278 320 L 2962 320 A 29 29 0 0 0 2933 349 L 2933 351 A 29 29 0 0 0 2962 380 L 3190 380 A 142 142 0 0 1 3332 522 L 3332 522 A 142 142 0 0 1 3190 664 L 2838 664 A 28 28 0 0 1 2810 636 L 2810 576 A 28 28 0 0 1 2838 548 L 3172 548 A 30 30 0 0 0 3202 518 L 3202 516 A 30 30 0 0 0 3172 486 L 2945 486 A 141 141 0 0 1 2804 345 L 2804 345 A 141 141 0 0 1 2945 204 Z",
  // 7. Y
  "M 3364 244 A 26 26 0 0 1 3388 204 L 3482 204 A 32 32 0 0 1 3508 218 L 3638 386 L 3768 218 A 32 32 0 0 1 3794 204 L 3888 204 A 26 26 0 0 1 3912 244 L 3710 492 L 3710 636 A 28 28 0 0 1 3682 664 L 3594 664 A 28 28 0 0 1 3566 636 L 3566 492 Z",
  // 8. T
  "M 3934 232 A 28 28 0 0 1 3962 204 L 4422 204 A 28 28 0 0 1 4450 232 L 4450 302 A 28 28 0 0 1 4422 330 L 4284 330 A 20 20 0 0 0 4264 350 L 4264 636 A 28 28 0 0 1 4236 664 L 4148 664 A 28 28 0 0 1 4120 636 L 4120 350 A 20 20 0 0 0 4100 330 L 3962 330 A 28 28 0 0 1 3934 302 Z",
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const invLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a), 0, 1);

const Ease = {
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

function lerpColor(hex1: string, hex2: string, t: number) {
  const c1 = parseInt(hex1.slice(1), 16);
  const c2 = parseInt(hex2.slice(1), 16);
  const r = Math.round(lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t));
  const g = Math.round(lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t));
  const b = Math.round(lerp(c1 & 255, c2 & 255, t));
  return `rgb(${r}, ${g}, ${b})`;
}

const CAD_LINES = [
  { x1: 60, y1: 799, x2: 750, y2: 109, start: 0.05, end: 1.1, hasDot: true, dotStart: 0.1 },
  { x1: 410, y1: 147, x2: 1120, y2: 640, start: 0.0, end: 0.95, hasDot: true, dotStart: 0.0 },
  { x1: 205, y1: -200, x2: 205, y2: 1150, start: 0.35, end: 1.25, hasDot: false },
  { x1: 378, y1: -150, x2: 378, y2: 1100, start: 0.45, end: 1.35, hasDot: false },
  { x1: -250, y1: 664, x2: 1250, y2: 664, start: 0.5, end: 1.4, hasDot: true, dotStart: 0.55 },
  { x1: -200, y1: 147, x2: 1150, y2: 147, start: 0.55, end: 1.45, hasDot: false },
  { x1: 220, y1: 890, x2: 980, y2: 490, start: 0.25, end: 1.2, hasDot: true, dotStart: 0.3 },
];

const AMBIENT_DOTS = [
  { x: 185, y: 220, r: 2.8, t0: 0.0 },
  { x: 140, y: 580, r: 2.5, t0: 0.1 },
  { x: 860, y: 495, r: 5.0, t0: 0.0, arcTrail: true },
  { x: 560, y: 920, r: 4.2, t0: 0.05, tail: { dx: 45, dy: 12 } },
  { x: 265, y: 125, r: 4.0, t0: 0.0, greenTail: { dx: 65, dy: -18 } },
];

export function SiteLoader({ onComplete }: { onComplete?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shouldShow] = useState(() => shouldShowSplash());
  const [visible, setVisible] = useState(() => shouldShow);
  const dismissedRef = useRef(!shouldShow);

  // SVG Elements Refs
  const cameraRigRef = useRef<SVGGElement>(null);
  const pIconGroupRef = useRef<SVGGElement>(null);
  const pFilledBodyRef = useRef<SVGGElement>(null);
  const pBevelOverlayRef = useRef<SVGPathElement>(null);
  const iconBackGlowRef = useRef<SVGCircleElement>(null);
  const pTraceMainRef = useRef<SVGPathElement>(null);
  const pTraceEarlyRef = useRef<SVGPathElement>(null);
  const travellingSquareGroupRef = useRef<SVGGElement>(null);
  const travellingSquareRef = useRef<SVGRectElement>(null);
  const squareOuterHaloRef = useRef<SVGRectElement>(null);
  const wordmarkGroupRef = useRef<SVGGElement>(null);
  const wmLettersRef = useRef<SVGPathElement[]>([]);
  const mottoGroupRef = useRef<SVGGElement>(null);
  const mottoTextRef = useRef<SVGTextElement>(null);
  const mottoLineLeftRef = useRef<SVGLineElement>(null);
  const mottoLineRightRef = useRef<SVGLineElement>(null);
  const dynStop1Ref = useRef<SVGStopElement>(null);
  const dynStop2Ref = useRef<SVGStopElement>(null);
  const dynStop3Ref = useRef<SVGStopElement>(null);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    if (containerRef.current) {
      containerRef.current.style.transition = 'opacity 0.4s ease-out';
      containerRef.current.style.opacity = '0';
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 400);
    } else {
      setVisible(false);
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    if (!shouldShow) {
      onComplete?.();
      return;
    }

    try {
      localStorage.setItem(SPLASH_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let canvasW = window.innerWidth;
    let canvasH = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resizeCanvas() {
      if (!canvas) return;
      canvasW = window.innerWidth;
      canvasH = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvasW * dpr;
      canvas.height = canvasH * dpr;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial SVG stroke lengths
    const traceMainLength = 2800;
    const traceEarlyLength = 900;
    if (pTraceMainRef.current) pTraceMainRef.current.style.strokeDasharray = `${traceMainLength}`;
    if (pTraceEarlyRef.current) pTraceEarlyRef.current.style.strokeDasharray = `${traceEarlyLength}`;

    // Animation state: speed is 1.00x (normal speed), duration 4.8s
    const speed = 1.00;
    const duration = 4.8;
    let time = 0;
    let lastTime = performance.now();
    let animId: number;

    function renderCanvas(t: number, camState: { scale: number; rotate: number; panX: number; panY: number; sqX: number; sqY: number }, lightProgress: number) {
      if (!ctx) return;
      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Dynamic Background: Starts vibrant Lime gradient -> transitions to Crisp White
      const startBgCenter = '#a6f232';
      const startBgEdge = '#39a828';
      const endBgCenter = '#ffffff';
      const endBgEdge = '#f3f6f0';

      const bgCenter = lerpColor(startBgCenter, endBgCenter, lightProgress);
      const bgEdge = lerpColor(startBgEdge, endBgEdge, lightProgress);

      const bgGrad = ctx.createRadialGradient(
        canvasW * 0.5,
        canvasH * 0.45,
        10,
        canvasW * 0.5,
        canvasH * 0.5,
        Math.max(canvasW, canvasH) * 0.72,
      );
      bgGrad.addColorStop(0, bgCenter);
      bgGrad.addColorStop(1, bgEdge);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Coordinate mapping 1000x1000 onto canvas
      const svgSize = Math.min(canvasW, canvasH) * 0.88;
      const scaleFactor = svgSize / 1000;
      const offsetX = (canvasW - svgSize) / 2;
      const offsetY = (canvasH - svgSize) / 2;

      ctx.translate(offsetX + 500 * scaleFactor, offsetY + 500 * scaleFactor);
      ctx.scale(scaleFactor * camState.scale, scaleFactor * camState.scale);
      ctx.rotate((camState.rotate * Math.PI) / 180);
      ctx.translate(-500 + camState.panX, -500 + camState.panY);

      const cadAlpha = clamp(1 - invLerp(2.3, 2.8, t), 0, 1);

      if (cadAlpha > 0.005) {
        // Volumetric aura behind travelling square
        const auraGlow = ctx.createRadialGradient(camState.sqX, camState.sqY, 10, camState.sqX, camState.sqY, 350);
        auraGlow.addColorStop(0, `rgba(255, 255, 255, ${0.42 * cadAlpha})`);
        auraGlow.addColorStop(0.45, `rgba(235, 255, 195, ${0.18 * cadAlpha})`);
        auraGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = auraGlow;
        ctx.beginPath();
        ctx.arc(camState.sqX, camState.sqY, 350, 0, Math.PI * 2);
        ctx.fill();

        // Concentric compass circles
        const circleProgress = Ease.outCubic(invLerp(0.32, 1.55, t));
        if (circleProgress > 0) {
          const cx = 555;
          const cy = 405.5;
          const radii = [
            { r: 258.5, alpha: 0.48, startAngle: -Math.PI * 0.65, sweep: Math.PI * 1.9 },
            { r: 445, alpha: 0.55, startAngle: -Math.PI * 0.85, sweep: Math.PI * 2.0 },
            { r: 482, alpha: 0.35, startAngle: -Math.PI * 0.4, sweep: Math.PI * 1.85 },
          ];

          radii.forEach((c, i) => {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${c.alpha * cadAlpha})`;
            ctx.lineWidth = 1.7;
            ctx.beginPath();
            ctx.arc(cx, cy, c.r, c.startAngle, c.startAngle + c.sweep * circleProgress);
            ctx.stroke();

            if (i < 2) {
              const nodeAngle = c.startAngle + c.sweep * circleProgress;
              const nx = cx + Math.cos(nodeAngle) * c.r;
              const ny = cy + Math.sin(nodeAngle) * c.r;
              ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * cadAlpha})`;
              ctx.beginPath();
              ctx.arc(nx, ny, 4.6, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          });

          // Fixed compass nodes
          const fixedNodes = [
            { angle: 2.88, r: 445 },
            { angle: 0.14, r: 445 },
            { angle: 2.35, r: 482 },
          ];
          fixedNodes.forEach((fn) => {
            const fnAlpha = invLerp(0.65, 1.1, t) * cadAlpha;
            if (fnAlpha > 0) {
              const x = cx + Math.cos(fn.angle) * fn.r;
              const y = cy + Math.sin(fn.angle) * fn.r;
              ctx.fillStyle = `rgba(255, 255, 255, ${0.96 * fnAlpha})`;
              ctx.beginPath();
              ctx.arc(x, y, 4.8, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }

        // CAD tangent straight lines
        CAD_LINES.forEach((line) => {
          const p = Ease.outCubic(invLerp(line.start, line.end, t));
          if (p <= 0) return;
          const curX = lerp(line.x1, line.x2, p);
          const curY = lerp(line.y1, line.y2, p);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.46 * cadAlpha})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(line.x1, line.y1);
          ctx.lineTo(curX, curY);
          ctx.stroke();

          if (line.hasDot) {
            const dp = Ease.outQuart(invLerp(line.dotStart ?? 0, line.end + 0.2, t));
            const dx = lerp(line.x1, line.x2, dp * 0.72);
            const dy = lerp(line.y1, line.y2, dp * 0.72);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.96 * cadAlpha})`;
            ctx.beginPath();
            ctx.arc(dx, dy, 4.8, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Top-left circuit feed line
        const circuitP = Ease.outCubic(invLerp(0.45, 1.35, t));
        if (circuitP > 0) {
          ctx.save();
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * cadAlpha})`;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(-350, 217);
          const feedX = lerp(-350, 205, circuitP);
          ctx.lineTo(feedX, 217);
          ctx.stroke();

          const branchP = Ease.outCubic(invLerp(0.6, 1.5, t));
          if (branchP > 0) {
            ctx.beginPath();
            ctx.moveTo(205, 147);
            ctx.lineTo(-45, 147);
            ctx.arcTo(-85, 147, -85, 107, 40);
            ctx.lineTo(-85, lerp(107, -220, branchP));
            ctx.stroke();

            const branchNodeY = lerp(80, 15, branchP);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * cadAlpha})`;
            ctx.beginPath();
            ctx.arc(-85, branchNodeY, 5.0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Ambient comets
        const earlyAlpha = clamp(1 - invLerp(0.75, 1.35, t), 0, 1) * cadAlpha;
        if (earlyAlpha > 0) {
          AMBIENT_DOTS.forEach((dot) => {
            const dp = Ease.outCubic(invLerp(dot.t0, dot.t0 + 0.85, t));
            if (dp <= 0) return;
            const x = dot.x + dp * 28;
            const y = dot.y - dp * 18;

            if (dot.greenTail) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * earlyAlpha})`;
              ctx.lineWidth = 3.2;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + dot.greenTail.dx * (1 - dp * 0.4), y + dot.greenTail.dy * (1 - dp * 0.4));
              ctx.stroke();
            }
            if (dot.tail) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * earlyAlpha})`;
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + dot.tail.dx, y + dot.tail.dy);
              ctx.stroke();
            }
            if (dot.arcTrail) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 * earlyAlpha})`;
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.quadraticCurveTo(x + 8, y - 45, x - 5, y - 95);
              ctx.stroke();
            }
            ctx.fillStyle = `rgba(255, 255, 255, ${earlyAlpha})`;
            ctx.beginPath();
            ctx.arc(x, y, dot.r, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }

      ctx.restore();
    }

    function evaluate(t: number) {
      const lightProgress = Ease.inOutCubic(invLerp(2.38, 3.0, t));

      // Dynamic Logo Gradient Stops (White -> Vibrant Lime)
      if (dynStop1Ref.current) dynStop1Ref.current.setAttribute('stop-color', lerpColor('#ffffff', '#b4f535', lightProgress));
      if (dynStop2Ref.current) dynStop2Ref.current.setAttribute('stop-color', lerpColor('#ffffff', '#7ed928', lightProgress));
      if (dynStop3Ref.current) dynStop3Ref.current.setAttribute('stop-color', lerpColor('#f2ffe6', '#36a628', lightProgress));

      // Camera Rig Choreography
      const camIntroP = Ease.outQuart(invLerp(0.0, 1.55, t));
      let camScale = lerp(1.36, 1.0, camIntroP);
      const camRotate = lerp(-22, 0, camIntroP);
      const camPanX = lerp(-15, 0, camIntroP);
      let camPanY = lerp(-35, 0, camIntroP);

      // In 'english-only' (Horizontal English.png lockup):
      const resolveP = Ease.inOutQuart(invLerp(2.35, 3.2, t));
      camScale = lerp(camScale, 0.92, resolveP);
      camPanY = lerp(camPanY, -30, resolveP);

      if (cameraRigRef.current) {
        cameraRigRef.current.setAttribute(
          'transform',
          `translate(500, 500) scale(${camScale.toFixed(4)}) rotate(${camRotate.toFixed(3)}) translate(${camPanX.toFixed(2)}, ${camPanY.toFixed(2)})`,
        );
      }

      // Travelling Square Flight
      const sqFlightP = Ease.inOutCubic(invLerp(0.0, 1.2, t));
      const dockMergeP = Ease.inOutCubic(invLerp(1.12, 1.72, t));
      const targetSqY = lerp(217, 400, dockMergeP);
      const arcLift = Math.sin(sqFlightP * Math.PI) * -65;
      const sqX = lerp(495, 275, sqFlightP) + arcLift * 0.35;
      const sqY = lerp(465, targetSqY, sqFlightP) + arcLift;
      const sqRot = lerp(32, 0, sqFlightP);
      const sqScale = lerp(0.76, 1.0, sqFlightP);

      if (travellingSquareGroupRef.current) {
        travellingSquareGroupRef.current.setAttribute(
          'transform',
          `translate(${sqX.toFixed(2)}, ${sqY.toFixed(2)}) rotate(${sqRot.toFixed(2)}) scale(${sqScale.toFixed(3)})`,
        );
      }

      const haloAlpha = Math.sin(invLerp(0.55, 1.65, t) * Math.PI);
      if (squareOuterHaloRef.current) squareOuterHaloRef.current.setAttribute('opacity', (haloAlpha * 0.9).toFixed(3));

      const sqFadeOut = 1 - invLerp(1.65, 2.02, t);
      if (travellingSquareRef.current) travellingSquareRef.current.setAttribute('opacity', sqFadeOut.toFixed(3));

      // Neon Trace Contours
      const earlyDraw = Ease.outCubic(invLerp(0.0, 0.55, t));
      const earlyFade = 1 - Ease.inOutCubic(invLerp(0.45, 0.95, t));
      if (pTraceEarlyRef.current) {
        pTraceEarlyRef.current.style.strokeDashoffset = `${traceEarlyLength * (1 - earlyDraw)}`;
        pTraceEarlyRef.current.setAttribute('opacity', earlyFade.toFixed(3));
      }

      const mainDraw = Ease.inOutCubic(invLerp(0.28, 1.55, t));
      const mainTraceFade = 1 - invLerp(2.1, 2.58, t);
      if (pTraceMainRef.current) {
        pTraceMainRef.current.style.strokeDashoffset = `${traceMainLength * (1 - mainDraw)}`;
        pTraceMainRef.current.setAttribute('opacity', mainTraceFade.toFixed(3));
      }

      // P Logo Body Fill
      const fillInP = Ease.inOutCubic(invLerp(1.48, 2.08, t));
      if (pFilledBodyRef.current) pFilledBodyRef.current.setAttribute('opacity', fillInP.toFixed(3));

      const backGlowAlpha = fillInP * (1 - lightProgress * 0.9) * 0.55;
      if (iconBackGlowRef.current) iconBackGlowRef.current.setAttribute('opacity', backGlowAlpha.toFixed(3));

      if (pBevelOverlayRef.current) pBevelOverlayRef.current.setAttribute('opacity', (lightProgress * 0.92).toFixed(3));
      if (pIconGroupRef.current) {
        if (lightProgress > 0.35) {
          pIconGroupRef.current.setAttribute('filter', 'url(#loader-studio-shadow)');
        } else {
          pIconGroupRef.current.removeAttribute('filter');
        }
      }

      // In 'english-only' mode: Hero P dissolves while Full Horizontal English.png Wordmark Resolves
      const horizP = Ease.inOutQuart(invLerp(2.35, 3.15, t));
      if (pIconGroupRef.current) pIconGroupRef.current.setAttribute('opacity', (1 - horizP).toFixed(3));

      const wmGlobalP = invLerp(2.45, 3.4, t);
      if (wordmarkGroupRef.current) {
        wordmarkGroupRef.current.setAttribute(
          'transform',
          'translate(500, 465) scale(0.215) translate(-2325, -460)',
        );
        wordmarkGroupRef.current.setAttribute('opacity', clamp(wmGlobalP * 2.2, 0, 1).toFixed(3));
      }

      // Staggered letters entrance
      wmLettersRef.current.forEach((el, idx) => {
        if (!el) return;
        const lStart = 2.45 + idx * 0.052;
        const lEnd = lStart + 0.44;
        const lp = Ease.outBack(invLerp(lStart, lEnd, t));
        const lAlpha = Ease.outCubic(invLerp(lStart, lStart + 0.25, t));
        const dy = (1 - lp) * 65;
        const scaleY = lerp(0.75, 1.0, lp);
        el.setAttribute('opacity', lAlpha.toFixed(3));
        el.setAttribute('transform', `translate(0, ${dy.toFixed(1)}) scale(1, ${scaleY.toFixed(3)})`);
        el.setAttribute('fill', 'url(#loader-plainsyt-green-grad)');
      });

      // Motto Reveal: "insight hidden in plain sight"
      const mottoP = Ease.outQuart(invLerp(2.85, 3.7, t));
      const mottoAlpha = Ease.outCubic(invLerp(2.85, 3.45, t));
      const mottoY = lerp(635, 600, mottoP);

      if (mottoGroupRef.current) {
        mottoGroupRef.current.setAttribute('transform', `translate(500, ${mottoY.toFixed(2)}) scale(0.95)`);
        mottoGroupRef.current.setAttribute('opacity', mottoAlpha.toFixed(3));
      }
      if (mottoTextRef.current) {
        const trackingEm = lerp(0.12, 0.34, mottoP);
        mottoTextRef.current.setAttribute('letter-spacing', `${trackingEm.toFixed(3)}em`);
      }
      if (mottoLineLeftRef.current && mottoLineRightRef.current) {
        const lineSpan = lerp(255, 385, mottoP);
        mottoLineLeftRef.current.setAttribute('x1', (-lineSpan).toFixed(1));
        mottoLineRightRef.current.setAttribute('x2', lineSpan.toFixed(1));
      }

      // Render Canvas
      renderCanvas(
        t,
        {
          scale: camScale,
          rotate: camRotate,
          panX: camPanX,
          panY: camPanY,
          sqX,
          sqY,
        },
        lightProgress,
      );
    }

    function tick(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      time += dt * speed;

      if (time >= duration) {
        dismiss();
        return;
      }

      evaluate(time);
      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);

    // Safety fallback: auto-dismiss after 5.5s (duration is 4.8s at 1.00x normal speed)
    const safetyTimer = setTimeout(() => {
      dismiss();
    }, 5500);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(safetyTimer);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [dismiss, onComplete, shouldShow]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      onClick={dismiss}
      title="ট্যাপ করে সরাসরি প্রবেশ করুন"
      className="fixed inset-0 z-[999] w-screen h-screen overflow-hidden flex items-center justify-center bg-[#5ec428] select-none cursor-pointer"
      style={{ touchAction: 'none' }}
    >
      {/* High-DPI Canvas for Geometric CAD Construction Lines, Nodes, Circles & Volumetric Light */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* Vector SVG Stage for infinite-resolution Logo Geometry */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-20 flex items-center justify-center">
        <svg
          viewBox="0 0 1000 1000"
          className="w-[min(88vw,88vh)] h-[min(88vw,88vh)] overflow-visible will-change-transform"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="loader-plainsyt-green-grad" x1="10%" y1="5%" x2="90%" y2="95%">
              <stop offset="0%" stopColor="#b4f535" />
              <stop offset="45%" stopColor="#7ed928" />
              <stop offset="100%" stopColor="#36a628" />
            </linearGradient>

            <linearGradient id="loader-dynamic-logo-grad" x1="12%" y1="8%" x2="88%" y2="92%">
              <stop ref={dynStop1Ref} offset="0%" stopColor="#ffffff" />
              <stop ref={dynStop2Ref} offset="48%" stopColor="#ffffff" />
              <stop ref={dynStop3Ref} offset="100%" stopColor="#f2ffe6" />
            </linearGradient>

            <linearGradient id="loader-plainsyt-bevel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="35%" stopColor="#e2ff99" stopOpacity="0.25" />
              <stop offset="65%" stopColor="#2c8a20" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>

            <radialGradient id="loader-core-white-glow" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#eaffd0" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="loader-motto-lime-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ab82b" />
              <stop offset="50%" stopColor="#76d327" />
              <stop offset="100%" stopColor="#38a126" />
            </linearGradient>

            <filter id="loader-neon-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" result="blur1" />
              <feGaussianBlur stdDeviation="20" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="loader-studio-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#48b828" floodOpacity="0.22" />
            </filter>

            <filter id="loader-inner-bevel" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
              <feOffset dx="-4" dy="-4" result="offsetBlur" />
              <feComposite in="blur" in2="offsetBlur" operator="out" result="specOut" />
              <feFlood floodColor="#ffffff" floodOpacity="0.5" result="specColor" />
              <feComposite in="specColor" in2="specOut" operator="in" result="specFinal" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="specFinal" />
              </feMerge>
            </filter>
          </defs>

          {/* Master Camera Rig Group */}
          <g ref={cameraRigRef} transform="translate(500, 500)">
            <g transform="translate(-500, -500)">
              {/* HERO P ICON GROUP */}
              <g ref={pIconGroupRef}>
                <circle
                  ref={iconBackGlowRef}
                  cx="480"
                  cy="440"
                  r="250"
                  fill="url(#loader-core-white-glow)"
                  opacity="0"
                  style={{ filter: 'blur(45px)' }}
                />

                <g ref={pFilledBodyRef} opacity="0">
                  <path
                    fill="url(#loader-dynamic-logo-grad)"
                    filter="url(#loader-inner-bevel)"
                    d={PATHS.unifiedP}
                  />
                  <path
                    ref={pBevelOverlayRef}
                    fill="none"
                    stroke="url(#loader-plainsyt-bevel-grad)"
                    strokeWidth="10"
                    opacity="0"
                    d={PATHS.unifiedP}
                    style={{ filter: 'blur(3px)' }}
                  />
                </g>

                <g filter="url(#loader-neon-glow)">
                  <path
                    ref={pTraceMainRef}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={PATHS.unifiedP}
                  />
                  <path
                    ref={pTraceEarlyRef}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="5"
                    strokeLinecap="round"
                    d={PATHS.earlySketch}
                  />
                </g>

                <g ref={travellingSquareGroupRef}>
                  <rect
                    ref={squareOuterHaloRef}
                    x="-82"
                    y="-82"
                    width="164"
                    height="164"
                    rx="38"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="4.5"
                    opacity="0"
                  />
                  <rect
                    ref={travellingSquareRef}
                    x="-68"
                    y="-68"
                    width="136"
                    height="136"
                    rx="32"
                    fill="url(#loader-dynamic-logo-grad)"
                    stroke="#ffffff"
                    strokeWidth="3"
                    filter="url(#loader-neon-glow)"
                  />
                </g>
              </g>

              {/* HORIZONTAL ENGLISH.PNG WORDMARK GROUP */}
              <g
                ref={wordmarkGroupRef}
                transform="translate(500, 465) scale(0.215) translate(-2325, -460)"
                opacity="0"
                filter="url(#loader-studio-shadow)"
              >
                {WORDMARK_PATHS.map((d, idx) => (
                  <path
                    key={idx}
                    ref={(el) => {
                      if (el) wmLettersRef.current[idx] = el;
                    }}
                    fill="url(#loader-plainsyt-green-grad)"
                    d={d}
                  />
                ))}
              </g>

              {/* MOTTO GROUP: "insight hidden in plain sight" */}
              <g ref={mottoGroupRef} transform="translate(500, 600) scale(0.95)" opacity="0">
                <line
                  ref={mottoLineLeftRef}
                  x1="-360"
                  y1="-8"
                  x2="-255"
                  y2="-8"
                  stroke="url(#loader-plainsyt-green-grad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.55"
                />
                <line
                  ref={mottoLineRightRef}
                  x1="255"
                  y1="-8"
                  x2="360"
                  y2="-8"
                  stroke="url(#loader-plainsyt-green-grad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.55"
                />
                <text
                  ref={mottoTextRef}
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fill="url(#loader-motto-lime-grad)"
                  fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                  fontSize="25"
                  fontWeight="600"
                  letterSpacing="0.32em"
                  style={{ textTransform: 'uppercase' }}
                >
                  insight hidden in plain sight
                </text>
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* Broadcast polish vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-25"
        style={{ background: 'radial-gradient(circle at center, transparent 62%, rgba(0, 0, 0, 0.08) 100%)' }}
      />
    </div>
  );
}
