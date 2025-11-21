import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

export const EditCardModal = ({ card, onClose, onSave }) => {
  const [formData, setFormData] = useState(JSON.parse(JSON.stringify(card)));
  const [activeTab, setActiveTab] = useState('stats'); // 'general', 'stats'
  const [statMode, setStatMode] = useState('idolized.etoile');

  const handleChange = (path, value) => {
    const newData = { ...formData };
    let current = newData;
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    for (const key of keys) {
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    current[lastKey] = value;
    setFormData(newData);
  };

  const getStatValue = (mode, type) => {
    // mode: 'unidolized.initial', 'idolized.etoile', etc.
    const parts = mode.split('.');
    let current = formData.stats;
    for (const part of parts) {
      if (!current) return '';
      current = current[part];
    }
    return current ? current[type] : '';
  };

  const setStatValue = (mode, type, value) => {
    const parts = mode.split('.');
    const path = `stats.${parts[0]}.${parts[1]}.${type}`;
    handleChange(path, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Edit Card</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'general' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('general')}
          >
            General Info
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'stats' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Skill</h3>
                  <div>
                    <label className="block text-xs text-gray-500">Name</label>
                    <input
                      type="text"
                      value={formData.skill?.name || ''}
                      onChange={(e) => handleChange('skill.name', e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Description</label>
                    <textarea
                      value={formData.skill?.description || ''}
                      onChange={(e) => handleChange('skill.description', e.target.value)}
                      className="w-full p-2 border rounded text-sm h-20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Leader Skill</h3>
                  <div>
                    <label className="block text-xs text-gray-500">Name</label>
                    <input
                      type="text"
                      value={formData.leader_skill?.name || ''}
                      onChange={(e) => handleChange('leader_skill.name', e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Description</label>
                    <textarea
                      value={formData.leader_skill?.description || ''}
                      onChange={(e) => handleChange('leader_skill.description', e.target.value)}
                      className="w-full p-2 border rounded text-sm h-20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-bold text-gray-700 mb-4 capitalize">Etoile +5 Stats</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-red-500 mb-1">Wild</label>
                    <input
                      type="text"
                      value={getStatValue(statMode, 'wild')}
                      onChange={(e) => setStatValue(statMode, 'wild', e.target.value)}
                      className="w-full p-2 border rounded focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-yellow-500 mb-1">Pop</label>
                    <input
                      type="text"
                      value={getStatValue(statMode, 'pop')}
                      onChange={(e) => setStatValue(statMode, 'pop', e.target.value)}
                      className="w-full p-2 border rounded focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-500 mb-1">Cool</label>
                    <input
                      type="text"
                      value={getStatValue(statMode, 'cool')}
                      onChange={(e) => setStatValue(statMode, 'cool', e.target.value)}
                      className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
