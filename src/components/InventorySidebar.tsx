import React from 'react';
import { InventoryMap, ItemData } from '../types/game';
import { findItem, stripHtml } from '../engine/textParser';

interface InventoryProps {
  inventory: InventoryMap;
  itemsData: ItemData[];
  onUseItem?: (itemId: string) => void;
}

export const InventorySidebar: React.FC<InventoryProps> = ({
  inventory,
  itemsData,
  onUseItem,
}) => {
  const itemKeys = Object.keys(inventory);

  return (
    <aside className="inventory-sidebar desktop-only">
      <div className="sidebar-header">
        <h3>🎒 Inventory</h3>
        <span className="item-count-badge">{itemKeys.length}</span>
      </div>
      <div className="inventory-items-list">
        {itemKeys.length === 0 ? (
          <p className="empty-inventory-msg">Your inventory is empty.</p>
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
                onClick={() => onUseItem && onUseItem(itemId)}
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
    </aside>
  );
};
