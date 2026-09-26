import React from 'react';
import { InventoryItem } from '../types/game';
import { Key, KeyRound, FileText, Compass, Sparkles, Gem, Eye } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface InventoryBarProps {
  inventory: InventoryItem[];
  selectedItem: InventoryItem | null;
  onSelectItem: (item: InventoryItem | null) => void;
  onExamineItem: (item: InventoryItem) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Key,
  KeyRound,
  FileText,
  Compass,
  Sparkles,
  Gem,
  Eye,
};

export const InventoryBar: React.FC<InventoryBarProps> = ({
  inventory,
  selectedItem,
  onSelectItem,
  onExamineItem,
}) => {
  if (inventory.length === 0) {
    return (
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="px-4 py-1.5 rounded-full bg-neutral-950/50 border border-neutral-900/60 backdrop-blur-sm text-[11px] font-mono tracking-widest text-neutral-600">
          INVENTORY EMPTY
        </div>
      </footer>
    );
  }

  return (
    <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-2 p-1.5 bg-neutral-950/85 border border-neutral-800/90 rounded-xl backdrop-blur-md shadow-2xl shadow-black/80">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 px-2 select-none">
          ITEMS
        </span>
        {inventory.map((item) => {
          const isSelected = selectedItem?.id === item.id;
          const IconComponent = ICON_MAP[item.iconName] || Key;

          return (
            <button
              key={item.id}
              onClick={() => {
                sound.playClick();
                onSelectItem(isSelected ? null : item);
              }}
              onDoubleClick={() => {
                onExamineItem(item);
              }}
              title={`${item.name} (Click to select, double click to examine)`}
              className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isSelected
                  ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 shadow-sm shadow-cyan-500/30'
                  : 'bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800/80 text-neutral-300'
              }`}
            >
              <IconComponent className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-medium max-w-[100px] truncate">
                {item.name}
              </span>

              {isSelected && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </footer>
  );
};
