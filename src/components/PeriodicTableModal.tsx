import React from 'react';

interface PeriodicTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: number;
  onToggleVersion: () => void;
}

export const PeriodicTableModal: React.FC<PeriodicTableModalProps> = ({
  isOpen,
  onClose,
  version,
  onToggleVersion,
}) => {
  if (!isOpen) return null;

  const elements = [
    { num: 1, symbol: 'H', name: 'Hydrogen', mass: '1.008', cat: 'nonmetal' },
    { num: 2, symbol: 'He', name: 'Helium', mass: '4.0026', cat: 'noblegas' },
    { num: 3, symbol: 'Li', name: 'Lithium', mass: '6.94', cat: 'alkali' },
    { num: 4, symbol: 'Be', name: 'Beryllium', mass: '9.0122', cat: 'alkaline' },
    { num: 5, symbol: 'B', name: 'Boron', mass: '10.81', cat: 'metalloid' },
    { num: 6, symbol: 'C', name: 'Carbon', mass: '12.011', cat: 'nonmetal' },
    { num: 7, symbol: 'N', name: 'Nitrogen', mass: '14.007', cat: 'nonmetal' },
    { num: 8, symbol: 'O', name: 'Oxygen', mass: '15.999', cat: 'nonmetal' },
    { num: 9, symbol: 'F', name: 'Fluorine', mass: '18.998', cat: 'halogen' },
    { num: 10, symbol: 'Ne', name: 'Neon', mass: '20.180', cat: 'noblegas' },
    { num: 11, symbol: 'Na', name: 'Sodium', mass: '22.990', cat: 'alkali' },
    { num: 12, symbol: 'Mg', name: 'Magnesium', mass: '24.305', cat: 'alkaline' },
    { num: 13, symbol: 'Al', name: 'Aluminium', mass: '26.982', cat: 'posttransition' },
    { num: 14, symbol: 'Si', name: 'Silicon', mass: '28.085', cat: 'metalloid' },
    { num: 15, symbol: 'P', name: 'Phosphorus', mass: '30.974', cat: 'nonmetal' },
    { num: 16, symbol: 'S', name: 'Sulfur', mass: '32.06', cat: 'nonmetal' },
    { num: 17, symbol: 'Cl', name: 'Chlorine', mass: '35.45', cat: 'halogen' },
    { num: 18, symbol: 'Ar', name: 'Argon', mass: '39.948', cat: 'noblegas' },
    { num: 19, symbol: 'K', name: 'Potassium', mass: '39.098', cat: 'alkali' },
    { num: 20, symbol: 'Ca', name: 'Calcium', mass: '40.078', cat: 'alkaline' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>⚛️ Periodic Table of Elements</h3>
            <span className="modal-subtitle">Version {version}</span>
          </div>
          <div className="header-controls">
            <button type="button" className="btn-glass" onClick={onToggleVersion}>
              Switch to V{version === 1 ? 2 : 1}
            </button>
            <button type="button" className="btn-close" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        <div className="elements-grid">
          {elements.map(el => (
            <div key={el.symbol} className={`element-card cat-${el.cat}`}>
              <div className="el-num">{el.num}</div>
              <div className="el-symbol">{el.symbol}</div>
              <div className="el-name">{el.name}</div>
              <div className="el-mass">{el.mass}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
