import React, { useRef, useEffect } from 'react';
import { LabFlaskState, ItemData } from '../types/game';

interface LabContainerProps {
  flaskState: LabFlaskState;
  contents: string[];
  itemsData: ItemData[];
  currentLab?: string;
  onAddLiquid: (itemId: string) => void;
  onReset: () => void;
  onMix: () => void;
  onHeat: () => void;
  onCool: () => void;
}

export const LabContainer: React.FC<LabContainerProps> = ({
  flaskState,
  contents,
  itemsData,
  currentLab = 'default',
  onAddLiquid,
  onReset,
  onMix,
  onHeat,
  onCool,
}) => {
  const liquidRef = useRef<HTMLDivElement>(null);
  const solidRef = useRef<HTMLDivElement>(null);
  const gasRef = useRef<HTMLDivElement>(null);
  const flaskImgWrapperRef = useRef<HTMLDivElement>(null);

  const getLabConfig = (labKey: string) => {
    switch (labKey.toLowerCase()) {
      case 'saltvsugar':
        return {
          title: 'Salt vs. Sugar Solubility Lab',
          subtitle: 'Test solubility of Powder #1 and Powder #2 in water',
          beakers: [
            { id: 'powder1', name: 'Powder #1', color: 'rgba(244, 244, 245, 0.9)', type: 'solid' as const },
            { id: 'powder2', name: 'Powder #2', color: 'rgba(200, 200, 210, 0.9)', type: 'solid' as const },
            { id: 'water',   name: 'H₂O Water',  color: 'rgba(56, 189, 248, 0.6)',  type: 'liquid' as const },
          ],
        };
      case 'ammonia':
        return {
          title: 'Haber-Bosch Ammonia Synthesis Lab',
          subtitle: 'N₂ + 3H₂ ⇌ 2NH₃ equilibrium experiment',
          beakers: [
            { id: 'n2',    name: 'N₂ Nitrogen', color: 'rgba(147, 197, 253, 0.7)', type: 'gas' as const },
            { id: 'h2',    name: 'H₂ Hydrogen', color: 'rgba(220, 235, 255, 0.7)', type: 'gas' as const },
            { id: 'fe',    name: 'Fe Catalyst',  color: 'rgba(217, 119, 6, 0.85)',  type: 'solid' as const },
            { id: 'water', name: 'H₂O Water',   color: 'rgba(56, 189, 248, 0.6)',  type: 'liquid' as const },
          ],
        };
      case 'abeq':
        return {
          title: 'Reversible Reaction A + B ⇌ AB Lab',
          subtitle: 'Investigate chemical equilibrium & Keq constant',
          beakers: [
            { id: 'a',     name: 'Reactant A',  color: 'rgba(239, 68, 68, 0.6)',   type: 'liquid' as const },
            { id: 'b',     name: 'Reactant B',  color: 'rgba(59, 130, 246, 0.6)',  type: 'liquid' as const },
            { id: 'ab',    name: 'Product AB',  color: 'rgba(168, 85, 247, 0.6)',  type: 'liquid' as const },
            { id: 'water', name: 'H₂O Water',   color: 'rgba(56, 189, 248, 0.6)',  type: 'liquid' as const },
          ],
        };
      case 'nh3 powder':
        return {
          title: 'Ammonia Powder Reaction Lab',
          subtitle: 'React NH₃ gas with acid to precipitate solid fertilizer powder',
          beakers: [
            { id: 'nh3',     name: 'NH₃ Ammonia', color: 'rgba(167, 243, 208, 0.75)', type: 'gas' as const },
            { id: 'hcl_gas', name: 'HCl Gas',      color: 'rgba(252, 165, 165, 0.75)', type: 'gas' as const },
            { id: 'water',   name: 'H₂O Water',    color: 'rgba(56, 189, 248, 0.6)',   type: 'liquid' as const },
          ],
        };
      case 'nh4cl':
        return {
          title: 'NH₄Cl Dissolution & Hydrolysis Lab',
          subtitle: 'Observe pH and ion formation as ammonium chloride dissolves',
          beakers: [
            { id: 'nh4cl_powder', name: 'NH₄Cl Powder', color: 'rgba(224, 231, 255, 0.9)', type: 'solid' as const },
            { id: 'water',        name: 'H₂O Water',     color: 'rgba(56, 189, 248, 0.6)',  type: 'liquid' as const },
          ],
        };
      default:
        return {
          title: 'Virtual Chemistry Lab',
          subtitle: 'Interactive reaction & equilibrium simulator',
          beakers: [
            { id: 'water', name: 'H₂O Water',    color: 'rgba(56, 189, 248, 0.6)',  type: 'liquid' as const },
            { id: 'hcl',   name: 'HCl Acid',     color: 'rgba(239, 68, 68, 0.6)',   type: 'liquid' as const },
            { id: 'naoh',  name: 'NaOH Base',    color: 'rgba(59, 130, 246, 0.6)',  type: 'liquid' as const },
            { id: 'agno3', name: 'AgNO₃ Nitrate',color: 'rgba(234, 179, 8, 0.6)',   type: 'liquid' as const },
            { id: 'nacl',  name: 'NaCl Salt',    color: 'rgba(168, 85, 247, 0.5)',  type: 'solid' as const },
          ],
        };
    }
  };

  const labConfig = getLabConfig(currentLab);

  // Compute a blended liquid color from all layers
  const liquidColors = flaskState.liquids.map(l => l.color);

  // Render liquid layer inside flask image
  useEffect(() => {
    const el = liquidRef.current;
    if (!el) return;

    if (liquidColors.length === 0) {
      el.style.opacity = '0';
      el.style.height = '0%';
      return;
    }

    // Build gradient from bottom layers to top
    const gradient = liquidColors.length === 1
      ? liquidColors[0]
      : `linear-gradient(to top, ${liquidColors.join(', ')})`;

    const levelPct = Math.min(80, 20 + liquidColors.length * 15);

    // Exact flask-interior clip path from game.js
    const staticShape = `polygon(
      44% 0%, 56% 0%,
      56% 20%, 56.5% 25%, 58% 30%, 61% 35%, 61% 40%, 51% 45%,
      100% 95%,
      99.8% 97.5%, 99% 99%, 97% 99.8%, 91% 100%, 85% 100%,
      15% 100%, 9% 100%, 3% 99.8%, 1% 99%, 0.2% 97.5%, 0% 95%,
      47% 45%,
      39% 40%, 39% 35%, 42% 30%, 43.5% 25%, 44% 20%
    )`;

    el.style.width = '74%';
    el.style.left = '13%';
    el.style.bottom = '14.5%';
    el.style.height = '82.5%';
    el.style.background = 'none';
    el.style.display = 'block';
    el.style.clipPath = staticShape;
    el.style.borderRadius = '0';
    el.style.overflow = 'hidden';

    // Inner level clipper
    let clipper = el.querySelector('.level-clipper') as HTMLDivElement | null;
    if (!clipper) {
      clipper = document.createElement('div');
      clipper.className = 'level-clipper';
      clipper.style.position = 'absolute';
      clipper.style.bottom = '0';
      clipper.style.left = '0';
      clipper.style.width = '100%';
      clipper.style.transition = 'height 2s ease-in-out, background 2s ease-in-out';
      el.appendChild(clipper);
    }
    clipper.style.height = `${levelPct}%`;
    clipper.style.background = gradient;

    el.style.opacity = '0.7';
  }, [liquidColors.join(',')]);

  // Render solid layer
  useEffect(() => {
    const el = solidRef.current;
    if (!el) return;
    if (flaskState.solid) {
      el.style.width = '50%';
      el.style.height = '15%';
      el.style.bottom = '14.5%';
      el.style.left = '25%';
      el.style.borderRadius = '0';
      el.style.clipPath = 'polygon(5% 100%, 10% 85%, 18% 80%, 25% 70%, 32% 65%, 40% 55%, 50% 50%, 60% 55%, 68% 65%, 75% 70%, 82% 80%, 90% 85%, 95% 100%)';
      el.style.background = flaskState.solid.color || '#ffffff';
      el.style.opacity = '1';
    } else {
      el.style.opacity = '0';
    }
  }, [flaskState.solid]);

  // Render gas layer — bubble animation on mix
  useEffect(() => {
    const el = gasRef.current;
    if (!el) return;
    // Remove old bubbles
    el.querySelectorAll('.bubble-container').forEach(b => b.remove());

    if (flaskState.gas) {
      el.style.opacity = '1';
      // Add bubbles
      const container = document.createElement('div');
      container.className = 'bubble-container';
      container.style.cssText = 'position:absolute;bottom:10%;left:10%;width:80%;height:80%;pointer-events:none;';
      for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = (Math.random() * 10 + 4) + 'px';
        bubble.style.cssText = `
          position:absolute;
          width:${size};height:${size};
          left:${Math.random() * 60 + 20}%;
          bottom:${Math.random() * 20 + 5}%;
          animation-delay:${Math.random() * 2}s;
          animation-duration:${Math.random() * 3 + 2}s;
          background:transparent;
          border:2px solid rgba(255,255,255,0.5);
          border-radius:50%;
        `;
        container.appendChild(bubble);
      }
      el.appendChild(container);
    } else {
      el.style.opacity = '0';
    }
  }, [flaskState.gas]);

  // Flask active glow when reaction ongoing
  const hasContents = flaskState.liquids.length > 0 || flaskState.solid || flaskState.gas;
  const flaskActiveClass = hasContents ? 'flask-active' : '';

  const getPhColor = (ph: number) => {
    if (ph < 6.5) return '#E4574B'; // Alert Red (§2.1)
    if (ph > 7.5) return '#2E7D46'; // Forest (§2.1)
    return '#6CC24A';               // Club Green (§2.1)
  };

  // Resolve reagent type: itemsData attributes take priority over static config
  const resolveType = (id: string, staticType: string): 'liquid' | 'solid' | 'gas' => {
    const item = itemsData.find(i => i.id === id);
    if (item) {
      const t = item.attributes?.type || item.type;
      if (t === 'solid' || t === 'gas' || t === 'trapped_gas') return t === 'trapped_gas' ? 'gas' : t as any;
      if (t === 'liquid') return 'liquid';
    }
    return staticType as any;
  };

  // Compute component measurement bars for items in flask
  const measurementBars = React.useMemo(() => {
    if (!contents || contents.length === 0) return [];

    const counts: { [id: string]: number } = {};
    contents.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });

    const totalItems = contents.length;

    return Object.keys(counts).map(id => {
      const count = counts[id];
      const percent = (count / totalItems) * 100;

      const beaker = labConfig.beakers.find(b => b.id === id);
      const itemDef = itemsData.find(i => i.id === id || i.name === id);
      const name = beaker?.name || itemDef?.name || id;
      const color = beaker?.color || itemDef?.color || '#38bdf8';
      const staticType = (beaker as any)?.type || itemDef?.type || 'liquid';
      const type = resolveType(id, staticType);

      let valueText = '';
      if (type === 'solid') {
        const grams = count * 0.1;
        valueText = `${grams.toFixed(2)} g (${Math.round(percent)}%)`;
      } else if (type === 'gas') {
        const pAtm = (count / totalItems) * flaskState.pressure;
        valueText = `${pAtm.toFixed(2)} atm (${Math.round(percent)}%)`;
      } else {
        const mL = count * 10;
        valueText = `${mL.toFixed(1)} mL (${Math.round(percent)}%)`;
      }

      return {
        id,
        name,
        color,
        type,
        percent,
        valueText,
      };
    });
  }, [contents, flaskState.pressure, labConfig, itemsData]);


  // ── Beaker visual components per reagent type ──

  // ── Beaker & Reagent visual component ──
  const BeakerItem = ({ id, name, color, type }: { id: string; name: string; color: string; type: string }) => {
    const resolvedType = resolveType(id, type);

    return (
      <div
        className="lab-item beaker"
        onClick={() => onAddLiquid(id)}
        title={`Add ${name} to flask`}
      >
        <div style={{
          position: 'relative',
          width: 100,
          height: 110,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          margin: '0 auto',
        }}>
          {resolvedType === 'liquid' && (
            <>
              {/* Liquid fill inside beaker */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '14%',
                  left: '15%',
                  width: '70%',
                  height: '45%',
                  background: color,
                  borderRadius: '0 0 8px 8px',
                  pointerEvents: 'none',
                  zIndex: 1,
                  transition: 'background 0.3s ease',
                }}
              />
              <img
                src="/images/beaker.png"
                alt={name}
                style={{ maxHeight: 95, maxWidth: '100%', position: 'relative', zIndex: 2 }}
              />
            </>
          )}

          {resolvedType === 'solid' && (
            <div
              style={{
                width: 76,
                height: 38,
                background: color,
                clipPath: 'polygon(5% 100%, 12% 78%, 22% 62%, 35% 48%, 50% 42%, 65% 48%, 78% 62%, 88% 78%, 95% 100%)',
                borderRadius: '0 0 4px 4px',
                marginBottom: 6,
                boxShadow: `0 2px 10px ${color}88`,
                filter: 'brightness(1.1)',
              }}
              title={`${name} (solid)`}
            />
          )}

          {resolvedType === 'gas' && (
            <>
              {/* Floating cloud visual above beaker */}
              <div style={{
                position: 'absolute',
                top: -10,
                width: 80,
                height: 55,
                pointerEvents: 'none',
                zIndex: 3,
              }}>
                {[{ w: 44, h: 44, l: 18, t: 6 }, { w: 36, h: 36, l: 4, t: 14 }, { w: 36, h: 36, l: 40, t: 14 }].map((b, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    width: b.w, height: b.h,
                    left: b.l, top: b.t,
                    background: color,
                    borderRadius: '50%',
                    opacity: 0.8,
                    filter: 'blur(2px)',
                    animation: `cloud-drift ${2.5 + i * 0.5}s ease-in-out infinite alternate`,
                  }} />
                ))}
              </div>
              <img
                src="/images/beaker.png"
                alt={name}
                style={{ maxHeight: 95, maxWidth: '100%', position: 'relative', zIndex: 2, opacity: 0.5 }}
              />
            </>
          )}
        </div>
        <span className="beaker-label">{name}</span>
      </div>
    );
  };

  return (
    <section className="lab-host-card">
      <div className="lab-header-strip">
        <div>
          <h3 className="lab-title">
            <span>🧪</span> {labConfig.title}
          </h3>
          <span className="lab-subtitle">{labConfig.subtitle}</span>
        </div>
      </div>

      {/* Lab Table - main visual workspace */}
      <div className="lab-table">
        {/* Erlenmeyer Flask */}
        <div className={`lab-item flask ${flaskActiveClass}`}>
          <div ref={flaskImgWrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
            {/* Solid precipitate layer */}
            <div
              ref={solidRef}
              style={{
                position: 'absolute',
                bottom: '14.5%',
                left: 0,
                width: 0,
                height: 0,
                backgroundColor: 'transparent',
                zIndex: 1,
                borderRadius: 0,
                opacity: 0,
                transition: 'opacity 2s ease-in-out, height 2s ease-in-out, background 2s ease-in-out, clip-path 2s ease-in-out',
              }}
            />
            {/* Gas layer */}
            <div
              ref={gasRef}
              style={{
                position: 'absolute',
                bottom: '60%',
                left: '10%',
                width: '80%',
                height: '80%',
                backgroundColor: 'transparent',
                zIndex: 1,
                opacity: 0,
                transition: 'all 2s ease-in-out',
              }}
            />
            {/* Liquid layer */}
            <div
              ref={liquidRef}
              style={{
                position: 'absolute',
                bottom: '14.5%',
                left: '13%',
                width: '74%',
                height: '82.5%',
                backgroundColor: 'transparent',
                zIndex: 2,
                clipPath: `polygon(
                  44% 0%, 56% 0%,
                  56% 20%, 56.5% 25%, 58% 30%, 61% 35%, 61% 40%, 51% 45%,
                  100% 95%,
                  99.8% 97.5%, 99% 99%, 97% 99.8%, 91% 100%, 85% 100%,
                  15% 100%, 9% 100%, 3% 99.8%, 1% 99%, 0.2% 97.5%, 0% 95%,
                  47% 45%,
                  39% 40%, 39% 35%, 42% 30%, 43.5% 25%, 44% 20%
                )`,
                opacity: 0,
                overflow: 'hidden',
                transition: 'opacity 0.5s ease-in-out',
              }}
            />
            {/* Flask image on top */}
            <img

              src="/images/flask.png"
              alt="Erlenmeyer Flask"
              style={{ position: 'relative', zIndex: 3 }}
            />
          </div>

          {/* Temp & pH display under flask */}
          <div style={{ marginTop: 10, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#a1a1aa' }}>
            {flaskState.temperature.toFixed(1)} K &nbsp;|&nbsp;
            <span style={{ color: getPhColor(flaskState.pH) }}>pH {flaskState.pH.toFixed(2)}</span>
            &nbsp;|&nbsp; {flaskState.pressure.toFixed(2)} atm
          </div>
        </div>

        {/* Beakers */}
        <div className="beakers-container">
          {labConfig.beakers.map(b => (
            <BeakerItem key={b.id} id={b.id} name={b.name} color={b.color} type={(b as any).type || 'liquid'} />
          ))}
        </div>
      </div>

      {/* Toolbox / action buttons */}
      <div className="toolbox">
        <button type="button" className="lab-item tool" onClick={onHeat} title="Increase Temperature (+10K)">
          🔥 Heat
        </button>
        <button type="button" className="lab-item tool" onClick={onCool} title="Decrease Temperature (-10K)">
          ❄️ Cool
        </button>
        <button type="button" className="lab-item tool" onClick={onMix} title="Mix contents & trigger reaction">
          🔄 Mix
        </button>
        <button type="button" className="lab-item tool" onClick={onReset} title="Clear Erlenmeyer flask">
          🧹 Reset Flask
        </button>
      </div>

      {/* Reaction info strip */}
      <div id="reaction-info-container" style={{ marginTop: 16 }}>
        <div id="measurement-container">
          <div className="measure-label">Measurements</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* pH */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: '#4B6169', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>pH Level</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: getPhColor(flaskState.pH) }}>
                  {flaskState.pH.toFixed(2)}
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, color: getPhColor(flaskState.pH), background: `${getPhColor(flaskState.pH)}18`, padding: '1px 8px', borderRadius: 9999 }}>
                  {flaskState.pH < 6.5 ? 'Acidic' : flaskState.pH > 7.5 ? 'Basic' : 'Neutral'}
                </span>
              </div>
              <div style={{ height: 5, background: 'rgba(31,58,66,0.08)', borderRadius: 9999, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(flaskState.pH / 14) * 100}%`, background: getPhColor(flaskState.pH), borderRadius: 9999, transition: 'width 0.5s ease' }} />
              </div>
            </div>
            {/* Temp */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: '#4B6169', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Temperature</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: '#1F3A42' }}>{flaskState.temperature.toFixed(1)}</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#4B6169' }}>K &nbsp;({(flaskState.temperature - 273.15).toFixed(1)} °C)</span>
              </div>
            </div>
            {/* Pressure */}
            <div style={{ flex: 1, minWidth: 100 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: '#4B6169', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pressure</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: '#1F3A42' }}>{flaskState.pressure.toFixed(2)}</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#4B6169' }}>atm</span>
              </div>
            </div>
          </div>

          {/* Component Reagent Measurement Bars */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(31,58,66,0.1)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: '#4B6169', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Flask Component Quantities
            </div>
            {measurementBars.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: '#9AA6A6', fontStyle: 'italic' }}>
                Flask is empty — add reagents from the beakers above to measure quantities.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {measurementBars.map(bar => (
                  <div key={bar.id} className="measure-row" data-label={bar.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 700, color: '#1F3A42' }}>
                        {bar.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: '#4B6169' }}>
                        {bar.valueText}
                      </span>
                    </div>
                    <div className="measure-bar-bg" style={{ height: 8, background: 'rgba(31,58,66,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div
                        className="measure-bar-fill"
                        style={{
                          height: '100%',
                          width: `${bar.percent}%`,
                          background: bar.color,
                          borderRadius: 9999,
                          transition: 'width 0.6s ease-out',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
};
