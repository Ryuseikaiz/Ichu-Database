import React from 'react';
import { cn } from '../lib/utils';

export const StatsTable = ({ stats }) => {
  const formatVal = (val) => val || "-";

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
      <div className="grid grid-cols-[100px_1fr] divide-x divide-gray-200">
        {/* Unidolized Section */}
        <div className="bg-sky-400 text-white font-bold flex items-center justify-center p-2">
          Un-idolized
        </div>
        <div className="divide-y divide-gray-200">
          {/* Initial */}
          <div className="bg-sky-300 text-white font-bold text-center py-1 text-xs">Initial</div>
          <div className="grid grid-cols-3 gap-1 p-2 bg-white">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">W</div>
              <span>{formatVal(stats?.unidolized?.initial?.wild)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-white">P</div>
              <span>{formatVal(stats?.unidolized?.initial?.pop)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">C</div>
              <span>{formatVal(stats?.unidolized?.initial?.cool)}</span>
            </div>
          </div>
          
          {/* Max Lv */}
          <div className="bg-sky-300 text-white font-bold text-center py-1 text-xs">Max Lv.</div>
          <div className="grid grid-cols-3 gap-1 p-2 bg-white">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">W</div>
              <span>{formatVal(stats?.unidolized?.max_lv?.wild)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-white">P</div>
              <span>{formatVal(stats?.unidolized?.max_lv?.pop)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">C</div>
              <span>{formatVal(stats?.unidolized?.max_lv?.cool)}</span>
            </div>
          </div>
        </div>

        {/* Idolized Section */}
        <div className="bg-sky-400 text-white font-bold flex items-center justify-center p-2 border-t border-gray-200 col-span-2 sm:col-span-1 sm:border-t-0 sm:border-l">
          Idolized
        </div>
        <div className="divide-y divide-gray-200 border-t border-gray-200 sm:border-t-0">
          {/* Initial */}
          <div className="bg-sky-300 text-white font-bold text-center py-1 text-xs">Initial</div>
          <div className="grid grid-cols-3 gap-1 p-2 bg-white">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">W</div>
              <span>{formatVal(stats?.idolized?.initial?.wild)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-white">P</div>
              <span>{formatVal(stats?.idolized?.initial?.pop)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">C</div>
              <span>{formatVal(stats?.idolized?.initial?.cool)}</span>
            </div>
          </div>

          {/* Max Lv */}
          <div className="bg-sky-300 text-white font-bold text-center py-1 text-xs">Max Lv.</div>
          <div className="grid grid-cols-3 gap-1 p-2 bg-white">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">W</div>
              <span>{formatVal(stats?.idolized?.max_lv?.wild)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-white">P</div>
              <span>{formatVal(stats?.idolized?.max_lv?.pop)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">C</div>
              <span>{formatVal(stats?.idolized?.max_lv?.cool)}</span>
            </div>
          </div>

          {/* Etoile */}
          <div className="bg-sky-300 text-white font-bold text-center py-1 text-xs">Etoile +5</div>
          <div className="grid grid-cols-3 gap-1 p-2 bg-white">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">W</div>
              <span>{formatVal(stats?.idolized?.etoile?.wild)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-white">P</div>
              <span>{formatVal(stats?.idolized?.etoile?.pop)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">C</div>
              <span>{formatVal(stats?.idolized?.etoile?.cool)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
