import { useEffect, useRef } from 'react';

const config = {
  name: "Lemniscate Bloom",
  tag: "Bernoulli Lemniscate",
  rotate: false,
  particleCount: 70,
  trailSpan: 0.4,
  durationMs: 5600,
  rotationDurationMs: 34000,
  pulseDurationMs: 5000,
  strokeWidth: 4.8,
  lemniscateA: 20,
  lemniscateBoost: 7,
  point(progress: number, detailScale: number, cfg: any) {
    const t = progress * Math.PI * 2;
    const scale = cfg.lemniscateA + detailScale * cfg.lemniscateBoost;
    const denom = 1 + Math.sin(t) ** 2;
    return {
      x: 50 + (scale * Math.cos(t)) / denom,
      y: 50 + (scale * Math.sin(t) * Math.cos(t)) / denom,
    };
  },
};

function normalizeProgress(progress: number) {
  return ((progress % 1) + 1) % 1;
}

function getDetailScale(time: number) {
  const pulseProgress = (time % config.pulseDurationMs) / config.pulseDurationMs;
  const pulseAngle = pulseProgress * Math.PI * 2;
  return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
}

function getRotation(time: number) {
  if (!config.rotate) return 0;
  return -((time % config.rotationDurationMs) / config.rotationDurationMs) * 360;
}

function buildPath(detailScale: number, steps = 480) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const point = config.point(index / steps, detailScale, config);
    return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }).join(' ');
}

function getParticle(index: number, progress: number, detailScale: number) {
  const tailOffset = index / (config.particleCount - 1);
  const point = config.point(normalizeProgress(progress - tailOffset * config.trailSpan), detailScale, config);
  const fade = Math.pow(1 - tailOffset, 0.56);
  return {
    x: point.x,
    y: point.y,
    radius: 0.9 + fade * 2.7,
    opacity: 0.04 + fade * 0.96,
  };
}

export default function Loader({ className = '' }: { className?: string }) {
  const groupRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const particlesRef = useRef<(SVGCircleElement | null)[]>([]);

  useEffect(() => {
    const group = groupRef.current;
    const path = pathRef.current;
    const particles = particlesRef.current;
    if (!group || !path) return;

    path.setAttribute('stroke-width', String(config.strokeWidth));
    const startedAt = performance.now();
    let animationFrame: number;

    function render(now: number) {
      if (!group || !path) return;
      const time = now - startedAt;
      const progress = (time % config.durationMs) / config.durationMs;
      const detailScale = getDetailScale(time);
      
      group.setAttribute('transform', `rotate(${getRotation(time)} 50 50)`);
      path.setAttribute('d', buildPath(detailScale));
      
      particles.forEach((node, index) => {
        if (!node) return;
        const particle = getParticle(index, progress, detailScale);
        node.setAttribute('cx', particle.x.toFixed(2));
        node.setAttribute('cy', particle.y.toFixed(2));
        node.setAttribute('r', particle.radius.toFixed(2));
        node.setAttribute('opacity', particle.opacity.toFixed(3));
      });
      
      animationFrame = requestAnimationFrame(render);
    }
    
    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="w-24 h-24 sm:w-32 sm:h-32">
        <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className="w-full h-full overflow-visible">
          <g ref={groupRef}>
            <path
              ref={pathRef}
              stroke="var(--primary)"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.1"
            ></path>
            {Array.from({ length: config.particleCount }).map((_, i) => (
              <circle
                key={i}
                ref={(el) => { particlesRef.current[i] = el; }}
                fill="var(--primary)"
              ></circle>
            ))}
          </g>
        </svg>
      </div>
      <div className="mt-6 flex flex-col items-center gap-1">
        <div className="text-sm font-bold text-white tracking-widest uppercase">Igra Studios</div>
        <div className="text-[10px] tracking-[0.2em] uppercase text-white/40">Loading...</div>
      </div>
    </div>
  );
}
