import React, { useState, useEffect, useRef } from 'react';

interface GpsPosition {
  lat: number;
  lng: number;
}

interface TreeHeightEstimatorProps {
  onClose: () => void;
  onApply: (heightMetres: number) => void;
}

/** Haversine distance between two GPS coordinates, in metres. */
function haversineDistance(a: GpsPosition, b: GpsPosition): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const EYE_LEVEL_M = 1.6; // metres — average eye height

type Step = 'intro' | 'base' | 'aim' | 'result';

export const TreeHeightEstimator: React.FC<TreeHeightEstimatorProps> = ({
  onClose,
  onApply,
}) => {
  const [step, setStep] = useState<Step>('intro');
  const [basePos, setBasePos] = useState<GpsPosition | null>(null);
  const [tipPos, setTipPos] = useState<GpsPosition | null>(null);
  const [liveAngle, setLiveAngle] = useState(0); // degrees above horizontal, live
  const [capturedAngle, setCapturedAngle] = useState(0);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [orientationAvailable, setOrientationAvailable] = useState(true);
  const [manualAngle, setManualAngle] = useState(0);
  const [result, setResult] = useState<{ height: number; distance: number } | null>(null);
  const orientationListenerRef = useRef(false);

  // ── Device orientation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'aim') return;
    if (orientationListenerRef.current) return;

    const attach = () => {
      orientationListenerRef.current = true;
      window.addEventListener('deviceorientation', handleOrientation);
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null) return;
      // beta: 0 = face-up flat, 90 = upright portrait (horizon), >90 = tilting back/up
      const elev = Math.max(0, Math.min(89, e.beta - 90));
      setLiveAngle(elev);
    };

    // iOS 13+ requires explicit permission
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };

    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission()
        .then((result) => {
          if (result === 'granted') {
            attach();
          } else {
            setOrientationAvailable(false);
          }
        })
        .catch(() => setOrientationAvailable(false));
    } else {
      attach();
    }

    return () => {
      if (orientationListenerRef.current) {
        window.removeEventListener('deviceorientation', handleOrientation as EventListener);
        orientationListenerRef.current = false;
      }
    };
  }, [step]);

  // ── GPS helper ─────────────────────────────────────────────────────────────
  const getGPS = (onSuccess: (pos: GpsPosition) => void) => {
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(`GPS unavailable: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15_000 }
    );
  };

  // ── Step handlers ──────────────────────────────────────────────────────────
  const captureBase = () => {
    getGPS((pos) => {
      setBasePos(pos);
      setStep('aim');
    });
  };

  const captureTip = () => {
    const angle = orientationAvailable ? liveAngle : manualAngle;
    getGPS((pos) => {
      if (!basePos) return;
      setTipPos(pos);
      setCapturedAngle(angle);
      const distance = haversineDistance(basePos, pos);
      const angleRad = (angle * Math.PI) / 180;
      const height = Math.round((distance * Math.tan(angleRad) + EYE_LEVEL_M) * 10) / 10;
      setResult({ height, distance: Math.round(distance * 10) / 10 });
      setStep('result');
    });
  };

  const reset = () => {
    setStep('intro');
    setBasePos(null);
    setTipPos(null);
    setLiveAngle(0);
    setCapturedAngle(0);
    setResult(null);
    setGpsError(null);
    orientationListenerRef.current = false;
  };

  const displayAngle = orientationAvailable ? liveAngle : manualAngle;

  // ── Angle bar height (0–89° maps to 0–100% upward from centre) ────────────
  const angleFraction = displayAngle / 89;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50">
      <div className="bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Estimate Tree Height</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-overlay)] text-[var(--text-secondary)] text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">

          {/* ── Intro ── */}
          {step === 'intro' && (
            <div className="space-y-5">
              <p className="text-sm text-[var(--text-secondary)]">
                Uses GPS distance and phone tilt to calculate tree height — no
                equipment needed. Works best outdoors with a clear line of sight.
              </p>
              <div className="space-y-3">
                {[
                  {
                    n: '1',
                    title: 'Stand at the tree base',
                    desc: 'Position yourself right next to the trunk.',
                  },
                  {
                    n: '2',
                    title: 'Capture your position',
                    desc: 'App records your GPS coordinates.',
                  },
                  {
                    n: '3',
                    title: 'Walk back until the full tree is visible',
                    desc: 'Move 10–30 m away from the trunk.',
                  },
                  {
                    n: '4',
                    title: 'Aim the crosshair at the treetop',
                    desc: 'Tilt your phone upward and align it with the very tip.',
                  },
                  {
                    n: '5',
                    title: 'Capture the angle',
                    desc: 'App uses GPS distance + tilt to calculate height.',
                  },
                ].map((s) => (
                  <div key={s.n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-green-600 text-white text-sm flex items-center justify-center flex-shrink-0 font-semibold">
                      {s.n}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{s.title}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep('base')}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          )}

          {/* ── Step 1: Base ── */}
          {step === 'base' && (
            <div className="space-y-6 text-center">
              <div className="text-7xl">🌳</div>
              <div>
                <h3 className="font-semibold text-lg">Stand at the tree base</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Get as close to the trunk as possible, then tap the button to
                  record your GPS position.
                </p>
              </div>
              {gpsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-left">
                  {gpsError}
                </div>
              )}
              <button
                onClick={captureBase}
                disabled={gpsLoading}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {gpsLoading ? 'Getting GPS…' : 'Capture Base Position'}
              </button>
            </div>
          )}

          {/* ── Step 2: Aim ── */}
          {step === 'aim' && (
            <div className="space-y-5">
              <div className="text-center">
                <h3 className="font-semibold text-lg">Aim at the treetop</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Walk back until the full tree is visible. Tilt your phone
                  upward and line the crosshair up with the very tip of the tree.
                </p>
              </div>

              {/* Viewfinder */}
              <div
                className="relative bg-gray-900 rounded-2xl overflow-hidden select-none"
                style={{ aspectRatio: '3/4' }}
              >
                {/* Sky gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-gray-900/60" />

                {/* Horizon line */}
                <div className="absolute left-0 right-0 h-px bg-white/20" style={{ top: '50%' }} />
                <span className="absolute right-3 text-white/30 text-xs" style={{ top: 'calc(50% + 4px)' }}>
                  horizon
                </span>

                {/* Angle indicator line */}
                <div
                  className="absolute left-0 right-0 h-px bg-green-400/70 transition-all duration-100"
                  style={{ top: `${50 - angleFraction * 48}%` }}
                />

                {/* Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-white/90" />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-white/90" />
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-white/90 rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Live angle readout */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="bg-black/70 rounded-full px-5 py-2 text-white font-mono text-sm">
                    {displayAngle.toFixed(1)}° above horizontal
                  </div>
                </div>
              </div>

              {/* Manual angle fallback */}
              {!orientationAvailable && (
                <div className="space-y-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    Automatic tilt unavailable. Use a clinometer app to measure
                    the angle, then enter it below.
                  </div>
                  <label className="block text-sm font-medium text-[var(--text-primary)]">
                    Elevation angle (degrees above horizontal)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={89}
                    step={0.5}
                    value={manualAngle}
                    onChange={(e) => setManualAngle(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg"
                  />
                </div>
              )}

              {gpsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {gpsError}
                </div>
              )}

              <button
                onClick={captureTip}
                disabled={gpsLoading || displayAngle < 1}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {gpsLoading ? 'Getting GPS…' : 'Capture Treetop Angle'}
              </button>
              {displayAngle < 1 && (
                <p className="text-xs text-center text-[var(--text-secondary)]">
                  Tilt your phone upward until the angle reads at least 1°
                </p>
              )}
            </div>
          )}

          {/* ── Result ── */}
          {step === 'result' && result !== null && (
            <div className="space-y-6 text-center">
              <div className="text-7xl">📏</div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Estimated tree height</p>
                <div className="text-6xl font-bold text-green-600 mt-2 tabular-nums">
                  {result.height}
                  <span className="text-3xl ml-1 text-[var(--text-secondary)] font-normal">m</span>
                </div>
              </div>

              {/* Measurement breakdown */}
              <div className="bg-[var(--surface-overlay)] rounded-xl p-4 text-left space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Horizontal distance</span>
                  <span className="font-medium">{result.distance} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Elevation angle</span>
                  <span className="font-medium">{capturedAngle.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Eye level offset</span>
                  <span className="font-medium">{EYE_LEVEL_M} m</span>
                </div>
                <div className="border-t border-[var(--border)] pt-2 flex justify-between font-semibold">
                  <span>Calculated height</span>
                  <span className="text-green-600">{result.height} m</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-xl font-medium hover:bg-[var(--surface-overlay)] transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => {
                    onApply(result.height);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Apply to Tree
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
