import React, { useRef, useEffect, useMemo, useState } from 'react';
import { ItemData, LabData, FlaskToken } from '../types/game';
import { getAttributes, resolveId } from '../engine/reactionEngine';
import { cleanTeX, stripHtml, safeTypeset } from '../engine/textParser';

interface LabContainerProps {
  visualStack: FlaskToken[];
  currentPH: number;
  currentTemperature: number;
  currentReactionName: string;
  flaskActive: boolean;
  itemsData: ItemData[];
  labData?: LabData;
  onAddLiquid: (id: string | number) => void;
  onReset: () => void;
  onAddToInventory: () => void;
  onClose: () => void;
}

// SVG "outlined cloud" visual for gas products — faithful port of createCloudVisual().
const CloudSvg: React.FC<{ color: string; style?: React.CSSProperties; animation?: string }> = ({
  color,
  style,
  animation,
}) => {
  const filterId = useMemo(() => `outline-${Math.floor(Math.random() * 100000)}`, []);
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible', ...style, animation }}>
      <defs>
        <filter id={filterId}>
          <feMorphology operator="dilate" radius="2" in="SourceAlpha" result="dilated" />
          <feComposite in="dilated" in2="SourceAlpha" operator="out" result="outline" />
          <feFlood floodColor={color || 'white'} result="floodColor" />
          <feComposite in="floodColor" in2="outline" operator="in" result="coloredOutline" />
        </filter>
      </defs>
      <image href="/images/gas.png" width={100} height={100} filter={`url(#${filterId})`} />
    </svg>
  );
};

export const LabContainer: React.FC<LabContainerProps> = ({
  visualStack,
  currentPH,
  currentTemperature,
  currentReactionName,
  flaskActive,
  itemsData,
  labData,
  onAddLiquid,
  onReset,
  onAddToInventory,
  onClose,
}) => {
  const liquidClipperRef = useRef<HTMLDivElement>(null);
  const liquidWrapperRef = useRef<HTMLDivElement>(null);
  const gasRef = useRef<HTMLDivElement>(null);
  const [showTemp, setShowTemp] = useState(false);
  const [showPH, setShowPH] = useState(false);
  const [showReactionName, setShowReactionName] = useState(false);
  const reactionNameRef = useRef<HTMLDivElement>(null);

  // --- Derive visual layers from visualStack (mirrors renderVisualStack()) ---
  const trueLiquids = visualStack.filter(v => v.type === 'liquid' || !v.type);
  const inheritedColor = trueLiquids.length > 0 ? trueLiquids[0].color : '#A0D0FF';
  const liquidColors = visualStack
    .filter(v => v.type === 'liquid' || !v.type || v.type === 'aq' || v.type === 'aqueous')
    .map(v => (v.type === 'aq' || v.type === 'aqueous' ? inheritedColor : v.color));

  const solidItem = visualStack.find(v => v.type === 'solid');
  const gasProd = visualStack.find(v => (v.type === 'gas' || v.type === 'trapped_gas') && v.isProduct);
  const gasReact = visualStack.find(v => (v.type === 'gas' || v.type === 'trapped_gas') && !v.isProduct);
  const bubbleColor = gasReact ? gasReact.color : null;

  // Liquid layer: stacked colored bands, bottom-to-top, 12.5% height each (capped at 100%).
  useEffect(() => {
    const wrapper = liquidWrapperRef.current;
    const clipper = liquidClipperRef.current;
    if (!wrapper || !clipper) return;

    if (liquidColors.length === 0) {
      wrapper.style.opacity = '0';
      return;
    }

    const heightPerLiquid = 12.5;
    const fillPerc = Math.min(liquidColors.length * heightPerLiquid, 100);
    clipper.style.transition = 'clip-path 2s ease-out';
    clipper.style.clipPath = `inset(${100 - fillPerc}% 0 0 0)`;

    const currentLayers = Array.from(clipper.children) as HTMLDivElement[];
    const layerHeight = heightPerLiquid + '%';

    liquidColors.forEach((color, i) => {
      let layer = currentLayers[i];
      if (layer) {
        layer.style.height = layerHeight;
        layer.style.backgroundColor = color;
      } else {
        layer = document.createElement('div');
        layer.style.width = '100%';
        layer.style.flexShrink = '0';
        layer.style.height = layerHeight;
        layer.style.backgroundColor = color;
        layer.style.transition = 'background-color 2s ease, height 1s ease';
        clipper.appendChild(layer);
      }
    });

    while (clipper.children.length > liquidColors.length) {
      clipper.removeChild(clipper.lastChild as Node);
    }

    wrapper.style.opacity = '0.7';
  }, [liquidColors.join(',')]);

  // Gas layer: cloud (product) or bubbles (reactant)
  useEffect(() => {
    const el = gasRef.current;
    if (!el) return;
    el.querySelectorAll('.bubble-container').forEach(b => b.remove());

    if (bubbleColor) {
      const container = document.createElement('div');
      container.className = 'bubble-container';
      container.style.cssText = 'position:absolute;bottom:10%;left:10%;width:80%;height:80%;pointer-events:none;';
      for (let b = 0; b < 20; b++) {
        const bubble = document.createElement('div');
        const size = Math.random() * 12 + 4 + 'px';
        bubble.style.cssText = `
          position:absolute;width:${size};height:${size};
          left:${Math.random() * 40 + 30}%;
          bottom:${Math.random() * 10 + 15}%;
          animation-delay:${Math.random() * 2}s;
          animation-duration:${Math.random() * 3 + 2}s;
          background-color:transparent;
          border:2px solid ${bubbleColor};
          border-radius:50%;
        `;
        bubble.className = 'bubble';
        container.appendChild(bubble);
      }
      el.appendChild(container);
    }
  }, [bubbleColor]);

  useEffect(() => {
    if (showReactionName && reactionNameRef.current) {
      safeTypeset([reactionNameRef.current]);
    }
  }, [showReactionName, currentReactionName]);

  const hasContents = visualStack.length > 0;

  // --- Measurement bars: exact port of updateMeasurementBars() math ---
  const measurementBars = useMemo(() => {
    const currentFlaskIds: { [id: string]: number } = {};
    const flaskTypes: { [id: string]: string } = {};

    visualStack.forEach(v => {
      if (v.toRemove) return;
      if (v.type === 'gas' && !v.type.includes('trapped') && !v.isProduct) return;
      const qty = v.quantity !== undefined ? v.quantity : 1.0;
      const id = String(resolveId(v.id, labData, itemsData));
      if (id) {
        currentFlaskIds[id] = (currentFlaskIds[id] || 0) + qty;
        if (v.type && v.type !== 'liquid') flaskTypes[id] = v.type;
      }
    });

    let totalLiquidVolume_L = 0;
    const itemDataCache: { [id: string]: { type: string; mass: number; moles: number; molarMass: number } } = {};
    const totalMolesByType: { [type: string]: number } = {};

    Object.keys(currentFlaskIds).forEach(label => {
      const moles = currentFlaskIds[label];
      let itemDef = itemsData.find(i => i.id === label);
      if (!itemDef) {
        const cleanId = cleanTeX(label);
        const cleanName = stripHtml(label);
        itemDef = itemsData.find(i => {
          const iId = i.id;
          const iName = stripHtml(i.name);
          return iId === label || iName === label || cleanTeX(iId) === cleanId || iName === cleanName;
        });
      }
      const def = itemDef || ({} as ItemData);
      const molarMass = def.M ? parseFloat(String(def.M)) : 10.0;
      let type = flaskTypes[label] || 'liquid';

      if (def.attributes && type === 'liquid') {
        const attr: any = def.attributes;
        if (attr.type) type = attr.type;
      }

      if (labData) {
        for (let i = 1; i <= 4; i++) {
          if (labData['beaker' + i] === label) {
            const attrStr = labData['attributes' + i];
            if (attrStr) {
              try {
                const parsed = typeof attrStr === 'string' ? JSON.parse(attrStr) : attrStr;
                if (parsed.type) type = parsed.type;
              } catch (e) { }
            }
            break;
          }
        }
      }

      const mass = moles * molarMass;
      totalMolesByType[type] = (totalMolesByType[type] || 0) + moles;
      if (type === 'liquid') totalLiquidVolume_L += mass / 1000;

      itemDataCache[label] = { type, mass, moles, molarMass };
    });

    if (totalLiquidVolume_L === 0) totalLiquidVolume_L = 1.0;

    return Object.keys(currentFlaskIds).map(label => {
      const cache = itemDataCache[label] || { type: 'liquid', mass: 0, moles: 0, molarMass: 10.0 };
      const typeTotalMoles = totalMolesByType[cache.type] || 0;
      const targetPercent = typeTotalMoles > 0 ? (cache.moles / typeTotalMoles) * 100 : 0;

      let displayRaw = '';
      if (cache.type === 'solid') {
        displayRaw = `${cache.mass.toFixed(2)} g`;
      } else if (cache.type === 'liquid') {
        displayRaw = `${cache.mass.toFixed(2)} mL`;
      } else if (cache.type === 'aqueous' || cache.type === 'aq') {
        const M = cache.moles / totalLiquidVolume_L;
        displayRaw = `${M.toFixed(2)} M`;
      } else if (cache.type === 'gas' || cache.type === 'trapped_gas') {
        const T = currentTemperature || 298;
        const atm = (cache.moles * 0.08206 * T) / 1.0;
        displayRaw = `${atm.toFixed(2)} atm`;
      } else {
        displayRaw = `${cache.moles.toFixed(2)} units`;
      }

      const itemDef = itemsData.find(i => i.id === label);
      const color = (itemDef?.attributes as any)?.color || itemDef?.color || '#38bdf8';

      return {
        id: label,
        label,
        color,
        percent: targetPercent,
        valueText: `${displayRaw} (${Math.round(targetPercent)}%)`,
      };
    });
  }, [visualStack, itemsData, labData, currentTemperature]);

  // --- Beakers: built from labData.beaker1..4 / attributesN (skip 3/4 if absent, per original) ---
  const beakers = useMemo(() => {
    const list: { idx: number; trueId: string; color: string; type: string; label: string }[] = [];
    for (let i = 1; i <= 4; i++) {
      if (i > 2 && labData && !labData['beaker' + i]) continue;
      const attr = getAttributes(i, labData, itemsData);
      const color = attr && attr.color ? attr.color : 'rgba(255, 255, 255, 0.2)';
      const type = attr && attr.type ? attr.type : 'liquid';
      let label = (labData && labData['beaker' + i]) || `Beaker ${i}`;
      if (attr && attr.concentration) label = `${attr.concentration} ${label}`;
      list.push({ idx: i, trueId: (labData && labData['beaker' + i]) || String(i), color, type, label });
    }
    return list;
  }, [labData, itemsData]);

  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (rootRef.current) safeTypeset([rootRef.current]);
  }, [beakers, measurementBars]);

  return (
    <section className="lab-host-card" ref={rootRef}>
      <div className="lab-header-strip">
        <div>
          <h3 className="lab-title">
            <span>🧪</span> Lab
          </h3>
        </div>
        <div className="lab-close-btn" onClick={onClose} title="Close Lab">
          &#10006;
        </div>
      </div>

      <div className="lab-table">
        <div className={`lab-item flask ${flaskActive ? 'flask-active' : ''}`}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Solid layer */}
            <div
              style={{
                position: 'absolute',
                bottom: '14.5%',
                left: solidItem ? '25%' : 0,
                width: solidItem ? '50%' : 0,
                height: solidItem ? '15%' : 0,
                borderRadius: 0,
                clipPath: solidItem
                  ? 'polygon(5% 100%, 10% 85%, 18% 80%, 25% 70%, 32% 65%, 40% 55%, 50% 50%, 60% 55%, 68% 65%, 75% 70%, 82% 80%, 90% 85%, 95% 100%)'
                  : undefined,
                background: solidItem ? solidItem.color : 'transparent',
                zIndex: 1,
                opacity: solidItem ? 1 : 0,
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
                zIndex: 1,
                opacity: gasProd || bubbleColor ? 1 : 0,
                transition: 'all 2s ease-in-out',
              }}
            >
              {gasProd && (
                <div style={{ position: 'absolute', bottom: '60%', left: '-20%', width: '140%', pointerEvents: 'none' }}>
                  <CloudSvg
                    color={gasProd.color}
                    style={{ width: '100%', height: 150, opacity: 0.9 }}
                    animation={gasProd.type === 'trapped_gas' ? 'float-and-stay 5s ease-out forwards' : 'float-away 10s ease-out forwards'}
                  />
                </div>
              )}
            </div>
            {/* Liquid layer */}
            <div
              ref={liquidWrapperRef}
              style={{
                position: 'absolute',
                bottom: '14.5%',
                left: '13%',
                width: '74%',
                height: '82.5%',
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
            >
              <div
                ref={liquidClipperRef}
                style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column-reverse' }}
              />
            </div>
            <img src="/images/flask.png" alt="Erlenmeyer Flask" style={{ position: 'relative', zIndex: 3 }} />
          </div>

          {showTemp && (
            <div id="temp-display" style={{ marginTop: 10, fontWeight: 'bold', textAlign: 'center' }}>
              Temperature: {currentTemperature.toFixed(1)} K
            </div>
          )}
          {showPH && (
            <div id="ph-display" style={{ marginTop: 5, fontWeight: 'bold', textAlign: 'center' }}>
              {hasContents ? `pH: ${currentPH.toFixed(1)}` : 'pH: n/a'}
            </div>
          )}
        </div>

        <div className="beakers-container">
          {beakers.map(b => (
            <div
              key={b.idx}
              className="lab-item beaker"
              onClick={() => onAddLiquid(b.idx)}
              title={`Add ${b.label} to flask`}
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: 120, width: '100%' }}>
                {b.type === 'solid' && (
                  <div className="lab-item solid-block" style={{ backgroundColor: b.color }} />
                )}
                {(b.type === 'gas' || b.type === 'trapped_gas') && (
                  <CloudSvg
                    color={b.color}
                    style={{ position: 'absolute', bottom: '50%', left: '-10%', width: '120%', height: 140, zIndex: 3, opacity: 0.9, pointerEvents: 'none' }}
                  />
                )}
                {b.type !== 'solid' && b.type !== 'gas' && b.type !== 'trapped_gas' && (
                  <>
                    {b.color && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '15%',
                          left: '15%',
                          width: '70%',
                          height: '50%',
                          backgroundColor: b.color,
                          zIndex: 1,
                          borderRadius: '0 0 10% 10%',
                        }}
                      />
                    )}
                    <img src="/images/beaker.png" alt={b.label} style={{ position: 'relative', zIndex: 2 }} />
                  </>
                )}
              </div>
              <div className="beaker-label" dangerouslySetInnerHTML={{ __html: b.label }} />
            </div>
          ))}
        </div>
      </div>

      <div id="reaction-info-container" style={{ textAlign: 'center', marginTop: 10 }}>
        <button
          type="button"
          className="lab-item tool"
          onClick={() => setShowReactionName(prev => !prev)}
        >
          Show Reaction
        </button>
        {showReactionName && (
          <div ref={reactionNameRef} style={{ marginTop: 10, fontWeight: 'bold', minHeight: '1.2em' }}>
            Reaction: {currentReactionName || 'None'}
          </div>
        )}

        <div id="measurement-container" style={{ marginTop: 15, width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {measurementBars.map(bar => (
            <div key={bar.id} className="measure-row" data-label={bar.label}>
              <div className="measure-label" title={bar.label} dangerouslySetInnerHTML={{ __html: bar.label }} />
              <div className="measure-bar-bg">
                <div className="measure-bar-fill" style={{ width: `${bar.percent}%`, background: bar.color, transition: 'width 1s ease-in-out' }} />
              </div>
              <div className="measure-value">{bar.valueText}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="toolbox">
        <div className="lab-item tool" onClick={onAddToInventory}>
          Add to 🎒
        </div>
        <div className="lab-item tool" onClick={() => setShowTemp(prev => !prev)}>
          Thermometer
        </div>
        <div className="lab-item tool" onClick={() => setShowPH(prev => !prev)}>
          pH Meter
        </div>
        <div className="lab-item tool" onClick={onReset}>
          Reset
        </div>
      </div>
    </section>
  );
};
