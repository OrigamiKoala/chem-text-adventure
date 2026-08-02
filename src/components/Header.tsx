import React from 'react';
import { PlayerStats } from '../types/game';
import { Theme } from '../hooks/useTheme';

interface HeaderProps {
  playerHP: number;
  maxHP: number;
  playerStats: PlayerStats;
  isLabVisible: boolean;
  onOpenInventory: () => void;
  onTogglePeriodicTable: () => void;
  onToggleOutline: () => void;
  onToggleLab: () => void;
  onRestartGame?: () => void;
  theme?: Theme;
  onToggleTheme?: () => void;
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
  onRestartGame,
  theme = 'light',
  onToggleTheme,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (playerHP / maxHP) * 100));

  return (
    <header className="glass-header" id="app-header">
      <div className="header-inner">
        {/* Brand Lockup */}
        <button
          type="button"
          className="header-brand"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Chemistry Text Adventure"
        >
          <div
            className="w-10 h-10 rounded-full bg-[#E4F5DA] text-[#2E7D46] flex items-center justify-center text-xl shrink-0 font-display"
            style={{ width: '40px', height: '40px' }}
          >
            🧪
          </div>
          <div className="brand-text-group">
            <h1>Chem CYOA</h1>
            <p>Interactive Text Adventure</p>
          </div>
        </button>

        {/* Status Bar Group: HP Heart Bar & Stats Chips */}
        <div className="status-bar-group">
          {/* HP Bar */}
          <div className="hp-pill" title={`Health Points: ${playerHP} / ${maxHP}`}>
            <span className="hp-heart">❤️</span>
            <div className="hp-track">
              <div
                className="hp-fill"
                style={{
                  width: `${hpPercent}%`,
                  backgroundColor:
                    playerHP < 30 ? '#E4574B' : playerHP < 60 ? '#F2C94C' : '#6CC24A',
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
              <div key={stat} className="stat-chip" title={`${stat}: ${playerStats[stat]}`}>
                <span className="stat-name">{stat}</span>
                <span className="stat-value">{playerStats[stat]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Navigation Buttons */}
        <div className="header-actions">
          <button
            type="button"
            className={isLabVisible ? 'btn-brand-primary' : 'btn-brand-secondary'}
            onClick={onToggleLab}
            title="Toggle Virtual Chemistry Lab Simulator"
          >
            🧪 Lab
          </button>

          <button
            type="button"
            className="btn-brand-secondary"
            onClick={onOpenInventory}
            title="Open Inventory Modal"
          >
            🎒 Inventory
          </button>

          <button
            type="button"
            className="btn-brand-secondary"
            onClick={onTogglePeriodicTable}
            title="Toggle Periodic Table of Elements"
          >
            ⚛️ Periodic Table
          </button>

          <button
            type="button"
            className="btn-brand-secondary"
            onClick={onToggleOutline}
            title="Toggle Story Outline Drawer"
          >
            📜 Outline
          </button>

          {onRestartGame && (
            <button
              type="button"
              className="btn-brand-secondary"
              onClick={onRestartGame}
              title="Reset progress and restart game"
            >
              🔄 Restart
            </button>
          )}

          {onToggleTheme && (
            <button
              type="button"
              id="theme-toggle-btn"
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
