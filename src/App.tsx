import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { Header } from './components/Header';
import { InventorySidebar } from './components/InventorySidebar';
import { InventoryModal } from './components/InventoryModal';
import { ChatContainer } from './components/ChatContainer';
import { LabContainer } from './components/LabContainer';
import { PeriodicTableModal } from './components/PeriodicTableModal';

export const App: React.FC = () => {
  const {
    gameData,
    currentNode,
    playerHP,
    maxHP,
    playerStats,
    inventory,
    itemsData,
    chatLog,
    flaskContents,
    labFlaskState,
    isInventoryModalOpen,
    isPeriodicTableOpen,
    periodicTableVersion,
    isOutlineOpen,
    isLabVisible,
    jumpTo,
    addLiquidToFlask,
    resetFlask,
    mixFlask,
    heatFlask,
    coolFlask,
    handleInput,
    setIsInventoryModalOpen,
    setIsPeriodicTableOpen,
    setPeriodicTableVersion,
    setIsOutlineOpen,
    setIsLabVisible,
  } = useGameEngine();

  const outlineItems = gameData.active_narrative_outline || [];

  return (
    <div className="app-main-layout">
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
      />

      {/* Main Content Area - Single Column or Split Screen */}
      <div className={`main-content-row ${isLabVisible ? 'split-screen' : ''}`}>
        {/* Left Column: Desktop Inventory Sidebar & Chat View */}
        <div className="left-panel">
          <InventorySidebar inventory={inventory} itemsData={itemsData} />
          <ChatContainer
            currentNode={currentNode}
            chatLog={chatLog}
            outlineItems={outlineItems}
            isOutlineOpen={isOutlineOpen}
            onJumpTo={jumpTo}
            onSubmitInput={handleInput}
          />
        </div>

        {/* Right Column: Lab Interactive Workspace (Shown only when 'lab' is typed or toggled) */}
        {isLabVisible && (
          <div className="right-panel">
            <LabContainer
              flaskState={labFlaskState}
              contents={flaskContents}
              itemsData={itemsData}
              onAddLiquid={addLiquidToFlask}
              onReset={resetFlask}
              onMix={mixFlask}
              onHeat={heatFlask}
              onCool={coolFlask}
            />
          </div>
        )}
      </div>

      {/* Mobile Inventory Overlay Modal */}
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        inventory={inventory}
        itemsData={itemsData}
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
