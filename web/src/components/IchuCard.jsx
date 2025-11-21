import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Star, Heart, Zap, Music, Shield, Info, Edit2 } from 'lucide-react';
import { StatsTable } from './StatsTable';

const StatBar = ({ label, value, max = 13000, color }) => {
  const percentage = Math.min((parseInt(String(value).replace(/,/g, '')) / max) * 100, 100);
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 font-bold uppercase text-gray-500">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-10 text-right font-mono">{value}</span>
    </div>
  );
};

export const IchuCard = ({ card, onEdit }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Always use Idolized Image (or fallback to Unidolized)
  const currentImage = card.images?.idolized || card.images?.unidolized;
  
  // Always use Etoile Stats (flattened in DB)
  const stats = card.stats || { wild: "0", pop: "0", cool: "0" };
  let isEtoile = true;

  if (stats.wild === "0" && stats.pop === "0" && stats.cool === "0") {
      isEtoile = false;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col relative">
      <div className="relative aspect-[3/4] overflow-hidden group bg-gray-100">
        <img 
          src={currentImage} 
          alt={card.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 flex gap-1">
            {isEtoile && <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-sm font-bold">Etoile +5</span>}
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="bg-white/90 hover:bg-white text-gray-700 p-1 rounded-full shadow-sm transition-colors"
                title="Edit Stats"
              >
                <Edit2 size={14} />
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
              className="bg-white/90 hover:bg-white text-gray-700 p-1 rounded-full shadow-sm transition-colors"
              title="Show Full Stats"
            >
              <Info size={14} />
            </button>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
          <h3 className="text-white font-bold text-lg leading-tight">{card.name}</h3>
        </div>
      </div>

      {/* Overlay for Detailed Stats */}
      {showDetails && (
        <div className="absolute inset-0 bg-white z-10 p-4 overflow-y-auto flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-800">Full Stats</h4>
            <button 
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
          <StatsTable stats={card.stats} />
        </div>
      )}

      <div className="p-4 space-y-4 flex-1 flex flex-col">
        <div className="space-y-2">
          <StatBar label="Wild" value={stats?.wild || "0"} color="bg-red-500" />
          <StatBar label="Pop" value={stats?.pop || "0"} color="bg-yellow-500" />
          <StatBar label="Cool" value={stats?.cool || "0"} color="bg-blue-500" />
        </div>

        <div className="border-t pt-3 space-y-3 flex-1">
          {card.skill && (
            <div className="group relative">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-blue-100 rounded text-blue-600">
                  <Music size={14} />
                </div>
                <span className="font-bold text-sm text-gray-800">{card.skill.name}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 group-hover:line-clamp-none transition-all">
                {card.skill.description}
              </p>
            </div>
          )}

          {card.leader_skill && (
            <div className="group relative">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-purple-100 rounded text-purple-600">
                  <Shield size={14} />
                </div>
                <span className="font-bold text-sm text-gray-800">{card.leader_skill.name}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 group-hover:line-clamp-none transition-all">
                {card.leader_skill.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
