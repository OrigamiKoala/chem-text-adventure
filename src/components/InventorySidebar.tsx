import React, { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const itemKeys = Object.keys(inventory);

  const filteredKeys = itemKeys.filter(itemId => {
    const itemDef = findItem(itemsData, itemId);
    const name = itemDef ? stripHtml(itemDef.name) : itemId;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <aside className="inventory-sidebar desktop-only">
      <div className="sidebar-header">
        <h3>🎒 Inventory</h3>
        <span className="item-count-badge">{itemKeys.length} items</span>
      </div>

      {itemKeys.length > 3 && (
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '2px solid var(--border-input)',
              fontSize: '0.8rem',
              backgroundColor: 'var(--bg-page)',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
      )}

      <div className="inventory-items-list">
        {filteredKeys.length === 0 ? (
          <p className="empty-inventory-msg">
            {searchTerm ? 'No matching items found.' : 'Your inventory is currently empty.'}
          </p>
        ) : (
          filteredKeys.map(itemId => {
            const count = inventory[itemId];
            const itemDef = findItem(itemsData, itemId);
            const name = itemDef ? stripHtml(itemDef.name) : itemId;
            const desc = itemDef?.description || '';

            return (
              <div
                key={itemId}
                className="inventory-card"
                onClick={() => onUseItem && onUseItem(itemId)}
                title={onUseItem ? `Use ${name}` : name}
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
