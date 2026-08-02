import React, { useEffect } from 'react';
import { InventoryMap, ItemData } from '../types/game';
import { findItem, stripHtml } from '../engine/textParser';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryMap;
  itemsData: ItemData[];
  onUseItem?: (itemId: string) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  itemsData,
  onUseItem,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const itemKeys = Object.keys(inventory);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>🎒 Inventory</h3>
            <span className="modal-subtitle">{itemKeys.length} items total</span>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="inventory-items-list" style={{ padding: '20px' }}>
          {itemKeys.length === 0 ? (
            <p className="empty-inventory-msg">Your inventory is currently empty.</p>
          ) : (
            itemKeys.map(itemId => {
              const count = inventory[itemId];
              const itemDef = findItem(itemsData, itemId);
              const name = itemDef ? stripHtml(itemDef.name) : itemId;
              const desc = itemDef?.description || '';

              return (
                <div
                  key={itemId}
                  className="inventory-card"
                  onClick={() => {
                    if (onUseItem) onUseItem(itemId);
                    onClose();
                  }}
                  title={`Use ${name}`}
                >
                  <div className="inventory-card-header">
                    <span className="item-title">{name}</span>
                    {count > 1 && <span className="item-qty">x{count}</span>}
                  </div>
                  {desc && <p className="item-desc">{desc}</p>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
