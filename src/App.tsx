import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { InventoryModal } from './components/InventoryModal';
import { ChatContainer } from './components/ChatContainer';
import { LabContainer } from './components/LabContainer';
import { PeriodicTableModal } from './components/PeriodicTableModal';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    gameData,
    currentNode,
    playerHP,
    maxHP,
    playerStats,
    inventory,
    itemsData,
    chatLog,
    visualStack,
    currentPH,
    currentTemperature,
    currentReactionName,
    flaskActive,
    currentLabData,
    isInventoryModalOpen,
    isPeriodicTableOpen,
    periodicTableVersion,
    isOutlineOpen,
    isLabVisible,
    jumpTo,
    useItem,
    addLiquid,
    resetFlask,
    addFlaskToInventory,
    handleInput,
    restartGame,
    setIsInventoryModalOpen,
    setIsPeriodicTableOpen,
    setPeriodicTableVersion,
    setIsOutlineOpen,
    setIsLabVisible,
  } = useGameEngine();

  const outlineItems = gameData.active_narrative_outline || [];

  return (
    <div className="app-main-layout bg-dot-pattern">
      {/* Top Bar Header */}
      <Header
        playerHP={playerHP}
        maxHP={maxHP}
        playerStats={playerStats}
        isLabVisible={isLabVisible}
        onOpenInventory={() => setIsInventoryModalOpen(true)}
        onTogglePeriodicTable={() => setIsPeriodicTableOpen(prev => !prev)}
        onToggleOutline={() => setIsOutlineOpen(prev => !prev)}
        onToggleLab={() => setIsLabVisible(prev => !prev)}
        onRestartGame={restartGame}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area - Single Column or Split Screen */}
      <main className="main-container-wrapper">
        <div className={`main-content-row ${isLabVisible ? 'split-screen' : ''}`}>
          {/* Left Column: Story Chat View */}
          <div className="left-panel">
            <ChatContainer
              currentNode={currentNode}
              chatLog={chatLog}
              outlineItems={outlineItems}
              isOutlineOpen={isOutlineOpen}
              onJumpTo={jumpTo}
              onSubmitInput={handleInput}
            />
          </div>

          {/* Right Column: Lab Interactive Workspace (Shown when lab is toggled or 'lab' typed) */}
          {isLabVisible && (
            <div className="right-panel">
              <LabContainer
                visualStack={visualStack}
                currentPH={currentPH}
                currentTemperature={currentTemperature}
                currentReactionName={currentReactionName}
                flaskActive={flaskActive}
                itemsData={itemsData}
                labData={currentLabData}
                onAddLiquid={addLiquid}
                onReset={resetFlask}
                onAddToInventory={addFlaskToInventory}
                onClose={() => setIsLabVisible(false)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Inventory Overlay Modal */}
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        inventory={inventory}
        itemsData={itemsData}
        onUseItem={useItem}
      />

      {/* Periodic Table Modal */}
      <PeriodicTableModal
        isOpen={isPeriodicTableOpen}
        onClose={() => setIsPeriodicTableOpen(false)}
        version={periodicTableVersion}
        onToggleVersion={() => setPeriodicTableVersion(prev => (prev === 1 ? 2 : 1))}
      />
    </div>
  );
};

export default App;
