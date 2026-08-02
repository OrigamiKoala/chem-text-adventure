import React from 'react';
import { LabFlaskState, ItemData } from '../types/game';

interface LabContainerProps {
  flaskState: LabFlaskState;
  contents: string[];
  itemsData: ItemData[];
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
  onAddLiquid,
  onReset,
  onMix,
  onHeat,
  onCool,
}) => {
  const defaultBeakers = [
    { id: 'water', name: 'H₂O Water', color: 'rgba(56, 189, 248, 0.4)' },
    { id: 'hcl', name: 'HCl Acid', color: 'rgba(239, 68, 68, 0.5)' },
    { id: 'naoh', name: 'NaOH Base', color: 'rgba(59, 130, 246, 0.5)' },
    { id: 'agno3', name: 'AgNO₃ Nitrate', color: 'rgba(234, 179, 8, 0.5)' },
    { id: 'nacl', name: 'NaCl Salt', color: 'rgba(168, 85, 247, 0.4)' },
  ];

  const getPhColor = (ph: number) => {
    if (ph < 6.5) return '#ef4444'; // Red acidic
    if (ph > 7.5) return '#3b82f6'; // Blue basic
    return '#10b981'; // Green neutral
  };

  return (
    <section className="lab-console">
      <div className="lab-header">
        <h3 className="lab-title">
          <span>🧪</span> Virtual Chemistry Lab
        </h3>
        <span className="lab-subtitle">Interactive reaction & equilibrium simulator</span>
      </div>

      {/* Reagent Beakers Toolbar */}
      <div className="beakers-bar">
        <span className="bar-label">Reagents:</span>
        <div className="beaker-buttons">
          {defaultBeakers.map(b => (
            <button
              key={b.id}
              type="button"
              className="btn-reagent"
              onClick={() => onAddLiquid(b.id)}
              style={{ borderLeftColor: b.color }}
            >
              + {b.name}
            </button>
          ))}
        </div>

        <div className="lab-action-buttons">
          <button type="button" className="btn-action heat" onClick={onHeat}>
            🔥 Heat
          </button>
          <button type="button" className="btn-action cool" onClick={onCool}>
            ❄️ Cool
          </button>
          <button type="button" className="btn-action mix" onClick={onMix}>
            🔄 Mix
          </button>
          <button type="button" className="btn-action reset" onClick={onReset}>
            🧹 Reset Flask
          </button>
        </div>
      </div>

      {/* Main Flask & Instrumentation Display */}
      <div className="flask-instrument-workspace">
        {/* Erlenmeyer Flask Simulation Container */}
        <div className="flask-viewport">
          <div className="flask-neck" />
          <div className="flask-body">
            {/* Solid Precipitate Layer */}
            {flaskState.solid && (
              <div
                className="flask-solid-layer"
                style={{ backgroundColor: flaskState.solid.color || '#ffffff' }}
                title={`Solid precipitate: ${flaskState.solid.name || 'Solid'}`}
              />
            )}

            {/* Liquid Layers Stack */}
            {flaskState.liquids.map((layer, idx) => (
              <div
                key={idx}
                className="flask-liquid-layer"
                style={{
                  bottom: `${(idx * 100) / Math.max(1, flaskState.liquids.length)}%`,
                  height: `${100 / Math.max(1, flaskState.liquids.length)}%`,
                  background: layer.color,
                }}
              />
            ))}

            {/* Gas Cloud Layer */}
            {flaskState.gas && <div className="flask-gas-cloud" />}
          </div>
        </div>

        {/* Digital Readout Meters */}
        <div className="digital-meters">
          <div className="meter-card">
            <span className="meter-label">pH Level</span>
            <div className="meter-value-row">
              <span
                className="meter-value"
                style={{ color: getPhColor(flaskState.pH) }}
              >
                {flaskState.pH.toFixed(2)}
              </span>
              <span className="meter-unit">
                {flaskState.pH < 6.5 ? 'Acidic' : flaskState.pH > 7.5 ? 'Basic' : 'Neutral'}
              </span>
            </div>
            <div className="meter-gauge">
              <div
                className="meter-gauge-fill"
                style={{
                  width: `${(flaskState.pH / 14) * 100}%`,
                  backgroundColor: getPhColor(flaskState.pH),
                }}
              />
            </div>
          </div>

          <div className="meter-card">
            <span className="meter-label">Temperature</span>
            <div className="meter-value-row">
              <span className="meter-value">{flaskState.temperature.toFixed(1)}</span>
              <span className="meter-unit">K ({(flaskState.temperature - 273.15).toFixed(1)} °C)</span>
            </div>
          </div>

          <div className="meter-card">
            <span className="meter-label">Pressure</span>
            <div className="meter-value-row">
              <span className="meter-value">{flaskState.pressure.toFixed(2)}</span>
              <span className="meter-unit">atm</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
