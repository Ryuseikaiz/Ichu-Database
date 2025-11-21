import React from 'react';
import { cn } from '../lib/utils';

export const StatsTable = ({ stats }) => {
  const formatVal = (val) => val || "-";
  
  // Determine which stats to show (Etoile or fallback to Max Lv)
  // Stats are flattened in DB
  let displayStats = stats || { wild: "0", pop: "0", cool: "0" };
  let label = "Etoile +5";
  
  if (displayStats.wild === "0" && displayStats.pop === "0" && displayStats.cool === "0") {
      label = "Etoile +5 (Missing)";
  }

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden text-sm bg-white">
      <div className="bg-purple-600 text-white font-bold text-center py-2">
        {label} Stats
      </div>
      <div className="grid grid-cols-3 gap-4 p-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-xs text-white font-bold">W</div>
          <span className="font-medium text-lg">{formatVal(displayStats?.wild)}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-xs text-white font-bold">P</div>
          <span className="font-medium text-lg">{formatVal(displayStats?.pop)}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-bold">C</div>
          <span className="font-medium text-lg">{formatVal(displayStats?.cool)}</span>
        </div>
      </div>
    </div>
  );
};
