import React from 'react';
import { PlayerStats } from '../types/game';

interface HeaderProps {
  playerHP: number;
  maxHP: number;
  playerStats: PlayerStats;
  isLabVisible: boolean;
  onOpenInventory: () => void;
  onTogglePeriodicTable: () => void;
  onToggleOutline: () => void;
  onToggleLab: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  playerHP,
  maxHP,
  playerStats,
  isLabVisible,
  onOpenInventory,
  onTogglePeriodicTable,
  onToggleOutline,
  onToggleLab,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (playerHP / maxHP) * 100));

  return (
    <header className="glass-header">
      <div className="header-brand">
        <span className="brand-icon">🧪</span>
        <span className="brand-title">Chem CYOA</span>
      </div>

      {/* HP Heart Bar */}
      <div className="hp-pill">
        <span className="hp-heart">❤️</span>
        <div className="hp-track">
          <div
            className="hp-fill"
            style={{
              width: `${hpPercent}%`,
              backgroundColor: playerHP < 30 ? '#ef4444' : playerHP < 60 ? '#f59e0b' : '#10b981',
            }}
          />
        </div>
        <span className="hp-text">
          {playerHP}/{maxHP}
        </span>
      </div>

      {/* Mini Player Stats Chips */}
      <div className="stats-chip-container">
        {(Object.keys(playerStats) as (keyof PlayerStats)[]).map(stat => (
          <div key={stat} className="stat-chip">
            <span className="stat-name">{stat}</span>
            <span className="stat-value">{playerStats[stat]}</span>
          </div>
        ))}
      </div>

      {/* Action Navigation Buttons */}
      <div className="header-actions">
        <button
          type="button"
          className={`btn-glass ${isLabVisible ? 'active' : ''}`}
          onClick={onToggleLab}
          title="Toggle Laboratory Split Screen (or type 'lab')"
        >
          🧪 Lab {isLabVisible ? 'ON' : 'OFF'}
        </button>

        <button
          type="button"
          className="btn-glass mobile-only"
          onClick={onOpenInventory}
          title="Open Inventory"
        >
          🎒 Inventory
        </button>

        <button
          type="button"
          className="btn-glass"
          onClick={onTogglePeriodicTable}
          title="Toggle Periodic Table"
        >
          ⚛️ Periodic Table
        </button>

        <button
          type="button"
          className="btn-glass"
          onClick={onToggleOutline}
          title="Toggle Story Outline"
        >
          📜 Outline
        </button>
      </div>
    </header>
  );
};
