import React, { useState, useMemo, useEffect } from 'react';
// import initialCardsData from './data/ichu_cards.json'; // No longer using static JSON
import { IchuCard } from './components/IchuCard';
import { EditCardModal } from './components/EditCardModal';
import { LoginModal } from './components/LoginModal';
import { Search, Filter, ArrowUpDown, LayoutGrid, LayoutList, Star, Download, Edit2, RefreshCw, LogIn, LogOut, Trash2 } from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCard, setEditingCard] = useState(null); // { card, index }
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [skillFilter, setSkillFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const itemsPerPage = viewMode === 'table' ? 50 : 24;

  // Check for logged in user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ichu_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('ichu_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ichu_user');
  };

  // Fetch cards from API
  const fetchCards = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cards');
      if (!response.ok) throw new Error('Failed to fetch cards');
      const data = await response.json();
      setCards(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to server. Make sure the backend is running.');
      // Fallback to empty or maybe local storage if implemented later
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleUpdateCard = async (updatedCard) => {
    if (!editingCard) return;
    
    // Optimistic Update
    const originalCards = [...cards];
    const index = cards.findIndex(c => c._id === updatedCard._id);
    if (index !== -1) {
      const newCards = [...cards];
      newCards[index] = updatedCard;
      setCards(newCards);
    }
    setEditingCard(null);

    try {
      const response = await fetch(`/api/cards/${updatedCard._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user ? `Bearer ${user.token}` : '',
        },
        body: JSON.stringify(updatedCard),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized. Please login again.');
        throw new Error('Failed to update card');
      }
      
      const savedCard = await response.json();

      // Confirm update with server data
      setCards(prevCards => {
        const newCards = [...prevCards];
        const idx = newCards.findIndex(c => c._id === savedCard._id);
        if (idx !== -1) {
          newCards[idx] = savedCard;
        }
        return newCards;
      });
    } catch (err) {
      alert('Error saving card: ' + err.message);
      setCards(originalCards); // Revert on error
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    const originalCards = [...cards];
    setCards(cards.filter(c => c._id !== cardId));

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': user ? `Bearer ${user.token}` : '',
        },
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized. Please login again.');
        throw new Error('Failed to delete card');
      }
    } catch (err) {
      alert('Error deleting card: ' + err.message);
      setCards(originalCards);
    }
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cards, null, 4));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ichu_cards.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getSkillType = (skill) => {
    if (!skill || !skill.description) return 'other';
    const desc = skill.description.toLowerCase();
    
    // Score Boosters
    if (desc.includes('score boost') || 
        desc.includes('score increased') || 
        desc.includes('score value') || 
        desc.includes('total score is increased')) return 'score';
    
    // Perfect Lockers / Timing Support
    if (desc.includes('tap judgment') || 
        desc.includes('changed to perfect') || 
        desc.includes('disregarded')) return 'perfect';
    
    // Healers
    if (desc.includes('stamina is restored') || 
        desc.includes('restored by') || 
        desc.includes('restore')) return 'healer';
    
    // Attribute Boosters
    if (desc.includes('wild is increased') || desc.includes('wild attribute is boosted')) return 'wild';
    if (desc.includes('pop is increased') || desc.includes('pop attribute is boosted')) return 'pop';
    if (desc.includes('cool is increased') || desc.includes('cool attribute is boosted')) return 'cool';
    
    // Combo / EXP / Coin Boosters (often categorized as Support or Other, but let's check user request)
    // User asked to remove "Other" for specific cards.
    // Let's look at the examples provided:
    
    // 1. EXP/Coin/Bonding Boosts (Manager cards, etc.)
    // "EXP earned... increased", "Affection points... increased", "Coins... increased"
    if (desc.includes('exp earned') || 
        desc.includes('affection points') || 
        desc.includes('coins earned') ||
        desc.includes('bonding points')) return 'support';

    // 2. Attribute Boosts based on team composition (often Leader Skills, but sometimes Skills?)
    // The examples show "The Team's COOL Attribute is boosted..." as a SKILL description?
    // Wait, the user pasted "Skill" and "Leader Skill" columns.
    // Let's check the JSON structure. The `skill` object is the main skill.
    // Example: (Manager Scout) Airu Utakata LE/GR
    // Skill: Rainbow Observer (EXP earned increased) -> Should be 'support' or 'score'? Usually 'support'.
    
    // Example: (Hot Springs 2017 Scout) Mio Yamanobe LE/GR
    // Skill: Exploration party... (Restore 3 Stamina) -> Should be 'healer'.
    // My current logic checks "stamina is restored" or "restored by".
    // The description says "Restore 3 Stamina!".
    // So I need to add "restore" to the healer check.
    
    // Example: (Vacation Scout) Kokoro Hanabusa LE/GR
    // Skill: Beach Summer Princess (Restore 3 Stamina!) -> Healer.
    
    // Example: (Hello ICHU!) Mutsuki Kururugi LE/GR
    // Skill: Look up sleepy eyes (Restore 3 Stamina!) -> Healer.
    
    // Example: (Asanagi no Adagio) Li Chaoyang LE/GR
    // Skill: Refreshing morning (Restore 3 Stamina!) -> Healer.
    
    // Example: (MG9 Scout) Rintaro Kizaki LE/GR
    // Skill: Good friends smile! (Team's POP Attribute is boosted...)
    // This looks like a Leader Skill description but it's in the Skill column in the user's text?
    // Or maybe some cards have Attribute Boosts as regular skills?
    // If so, I need to catch "attribute is boosted".
    
    if (desc.includes('attribute is boosted')) {
        if (desc.includes('wild')) return 'wild';
        if (desc.includes('pop')) return 'pop';
        if (desc.includes('cool')) return 'cool';
        return 'support'; // Generic boost?
    }

    return 'other';
  };

  const filteredAndSortedCards = useMemo(() => {
    let result = [...cards];

    // Filter by Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(card => 
        card.name.toLowerCase().includes(lowerTerm) ||
        card.skill?.name?.toLowerCase().includes(lowerTerm) ||
        card.skill?.description?.toLowerCase().includes(lowerTerm) ||
        card.leader_skill?.name?.toLowerCase().includes(lowerTerm) ||
        card.leader_skill?.description?.toLowerCase().includes(lowerTerm)
      );
    }

    // Filter by Skill Type
    if (skillFilter !== 'all') {
      result = result.filter(card => getSkillType(card.skill) === skillFilter);
    }

    // Sort
    result.sort((a, b) => {
      const getStat = (card, type) => {
        const stats = card.stats || { wild: 0, pop: 0, cool: 0 };
        
        const getVal = (val) => {
          if (!val) return 0;
          return parseInt(String(val).replace(/,/g, '') || "0");
        };

        if (type === 'total') {
          return (
            getVal(stats.wild) +
            getVal(stats.pop) +
            getVal(stats.cool)
          );
        }
        return getVal(stats[type]);
      };

      const valA = getStat(a, sortConfig.key);
      const valB = getStat(b, sortConfig.key);

      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [cards, searchTerm, sortConfig, skillFilter]);

  const totalPages = Math.ceil(filteredAndSortedCards.length / itemsPerPage);
  const currentCards = filteredAndSortedCards.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getCardStats = (card) => {
    // Stats are flattened in DB (only Etoile stats are stored)
    return card.stats || { wild: "0", pop: "0", cool: "0" };
  };

  const isEtoileStats = (card) => {
    const statsObj = card.stats;
    // Check if it has non-zero values
    return statsObj && (statsObj.wild !== "0" || statsObj.pop !== "0" || statsObj.cool !== "0");
  };

  const calculateTotal = (stats) => {
    const getVal = (val) => parseInt(String(val || "0").replace(/,/g, ''));
    return (getVal(stats.wild) + getVal(stats.pop) + getVal(stats.cool)).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 text-sm text-center border-b border-red-100">
            {error}
          </div>
        )}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-pink-500 tracking-tight">I-Chu Card Database</h1>
                <div className="text-xs text-gray-500 font-medium mt-1">All cards are Étoile+5. Data from I-Chu Wiki</div>
              </div>
              <button
                onClick={fetchCards}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            
            <div className="flex flex-1 max-w-2xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search idol, skill, description..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>
              <select
                value={skillFilter}
                onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-700"
              >
                <option value="all">All Skills</option>
                <option value="score">Score Up</option>
                <option value="perfect">Perfect Lock</option>
                <option value="healer">Healer</option>
                <option value="wild">Wild Up</option>
                <option value="pop">Pop Up</option>
                <option value="cool">Cool Up</option>
                <option value="support">Support</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'table' ? "bg-white shadow text-pink-600" : "text-gray-500 hover:text-gray-700"
                  )}
                  title="Table View"
                >
                  <LayoutList size={18} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'grid' ? "bg-white shadow text-pink-600" : "text-gray-500 hover:text-gray-700"
                  )}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
              </div>

              <button
                onClick={downloadJson}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                title="Download JSON"
              >
                <Download size={20} />
                <span className="hidden sm:inline">Export</span>
              </button>

              {user ? (
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                  title="Logout"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline">Logout ({user.username})</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg flex items-center gap-2"
                  title="Login"
                >
                  <LogIn size={20} />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters & Sort */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <Filter size={16} /> Sort by:
            </span>
            {['total', 'wild', 'pop', 'cool'].map((key) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={cn(
                  "px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 capitalize",
                  sortConfig.key === key 
                    ? "bg-pink-50 border-pink-200 text-pink-700 font-medium" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {key}
                {sortConfig.key === key && (
                  <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                )}
              </button>
            ))}
            <span className="ml-auto text-gray-500">
              Found {filteredAndSortedCards.length} cards
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentCards.length > 0 ? (
          <>
            {viewMode === 'table' ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0">
                      <tr>
                        <th className="px-4 py-3 w-16">Img</th>
                        <th className="px-4 py-3 min-w-[200px]">Name</th>
                        <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 text-red-600" onClick={() => handleSort('wild')}>Wild</th>
                        <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 text-yellow-600" onClick={() => handleSort('pop')}>Pop</th>
                        <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 text-blue-600" onClick={() => handleSort('cool')}>Cool</th>
                        <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 font-bold" onClick={() => handleSort('total')}>Total</th>
                        <th className="px-4 py-3 min-w-[250px]">Skill</th>
                        <th className="px-4 py-3 min-w-[250px]">Leader Skill</th>
                        <th className="px-4 py-3 w-[80px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentCards.map((card, index) => {
                        const stats = getCardStats(card);
                        const total = calculateTotal(stats);
                        const isEtoile = isEtoileStats(card);
                        // Always use idolized image for Etoile mode
                        const imgUrl = card.images?.idolized || card.images?.unidolized;
                        
                        return (
                          <tr key={`${card.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2">
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100 relative">
                                <img src={imgUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                              </div>
                            </td>
                            <td className="px-4 py-2 font-medium text-gray-900">
                              <a href={card.url} target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 hover:underline">
                                {card.name}
                              </a>
                            </td>
                            <td className={cn("px-4 py-2 text-right font-mono", !isEtoile ? "text-gray-400" : "text-gray-600")}>{stats.wild}</td>
                            <td className={cn("px-4 py-2 text-right font-mono", !isEtoile ? "text-gray-400" : "text-gray-600")}>{stats.pop}</td>
                            <td className={cn("px-4 py-2 text-right font-mono", !isEtoile ? "text-gray-400" : "text-gray-600")}>{stats.cool}</td>
                            <td className={cn("px-4 py-2 text-right font-mono font-bold", !isEtoile ? "text-gray-500" : "text-gray-800")}>{total}</td>
                            <td className="px-4 py-2">
                              {card.skill && (
                                <div>
                                  <div className="font-semibold text-xs text-blue-600 mb-0.5">{card.skill.name}</div>
                                  <div className="text-xs text-gray-500 line-clamp-2" title={card.skill.description}>
                                    {card.skill.description}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {card.leader_skill && (
                                <div>
                                  <div className="font-semibold text-xs text-purple-600 mb-0.5">{card.leader_skill.name}</div>
                                  <div className="text-xs text-gray-500 line-clamp-2" title={card.leader_skill.description}>
                                    {card.leader_skill.description}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {user && (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => setEditingCard({ card })}
                                    className="text-gray-400 hover:text-pink-600 transition-colors"
                                    title="Edit Card"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCard(card._id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete Card"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentCards.map((card, index) => (
                  <IchuCard 
                    key={`${card.name}-${index}`} 
                    card={card} 
                    onEdit={user ? () => setEditingCard({ card }) : undefined}
                    onDelete={user ? () => handleDeleteCard(card._id) : undefined}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No cards found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {editingCard && (
        <EditCardModal
          card={editingCard.card}
          onClose={() => setEditingCard(null)}
          onSave={handleUpdateCard}
        />
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;
