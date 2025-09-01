import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Save, Share2, Plus, Trash2, UserPlus, Cloud, CloudOff } from 'lucide-react';

export default function RijnvlietHockeyApp() {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isOnline, setIsOnline] = useState(true);

  // Team roster
  const [fullRoster, setFullRoster] = useState([
    { id: 1, name: 'Ishaya Bansie', personalNotes: 'Great communication skills', matchHistory: {}, color: '#4ade80' },
    { id: 2, name: 'Suze Bults', personalNotes: 'Fast runner, good stamina', matchHistory: {}, color: '#ef4444' },
    { id: 3, name: 'Rika Fontijn', personalNotes: 'Strong defensive instincts', matchHistory: {}, color: '#06b6d4' },
    { id: 4, name: 'Emeline van Genderen', personalNotes: 'Excellent stick skills', matchHistory: {}, color: '#d946ef' },
    { id: 5, name: 'Leine Harmsel', personalNotes: 'Natural leader on field', matchHistory: {}, color: '#eab308' },
    { id: 6, name: 'Elise Kesharie', personalNotes: 'Good at reading the game', matchHistory: {}, color: '#c084fc' },
    { id: 7, name: 'Sienna Mann', personalNotes: 'Confident with the ball', matchHistory: {}, color: '#3b82f6' },
    { id: 8, name: 'Tessa Pörtzgen', personalNotes: 'Works well in team plays', matchHistory: {}, color: '#f97316' },
    { id: 9, name: 'Quinn Schut', personalNotes: 'Improving every training', matchHistory: {}, color: '#8b5cf6' },
    { id: 10, name: 'Selah Valster-Konings', personalNotes: 'Great attitude, eager to learn', matchHistory: {}, color: '#22c55e' }
  ]);

  // Formations
  const [formations, setFormations] = useState({
    '1-3-3-1': {
      lines: {
        'Keeper': { count: 1, positions: ['GK'] },
        'Verdediging': { count: 3, positions: ['RB', 'CB', 'LB'] },
        'Middenveld': { count: 3, positions: ['RM', 'CM', 'LM'] },
        'Aanval': { count: 1, positions: ['ST'] }
      },
      defaultPositions: {
        'GK': { x: 50, y: 85 },
        'RB': { x: 75, y: 65 }, 'CB': { x: 50, y: 65 }, 'LB': { x: 25, y: 65 },
        'RM': { x: 80, y: 40 }, 'CM': { x: 50, y: 40 }, 'LM': { x: 20, y: 40 },
        'ST': { x: 50, y: 15 }
      }
    },
    '1-2-3-2': {
      lines: {
        'Keeper': { count: 1, positions: ['GK'] },
        'Verdediging': { count: 2, positions: ['RB', 'LB'] },
        'Middenveld': { count: 3, positions: ['RM', 'CM', 'LM'] },
        'Aanval': { count: 2, positions: ['RW', 'LW'] }
      },
      defaultPositions: {
        'GK': { x: 50, y: 85 },
        'RB': { x: 70, y: 65 }, 'LB': { x: 30, y: 65 },
        'RM': { x: 80, y: 40 }, 'CM': { x: 50, y: 40 }, 'LM': { x: 20, y: 40 },
        'RW': { x: 70, y: 15 }, 'LW': { x: 30, y: 15 }
      }
    }
  });

  const [activeFormation, setActiveFormation] = useState('1-3-3-1');
  const [selectedPlayers, setSelectedPlayers] = useState({
    'GK': fullRoster[0], 'RB': fullRoster[1], 'CB': fullRoster[2], 'LB': fullRoster[3],
    'RM': fullRoster[4], 'CM': fullRoster[5], 'LM': fullRoster[6], 'ST': fullRoster[7]
  });

  const [playerPositions, setPlayerPositions] = useState(
    formations[activeFormation].defaultPositions
  );

  const [matches, setMatches] = useState([
    { id: 1, date: '2025-09-01', opponent: 'Lightning FC', ourScore: 3, theirScore: 1 },
    { id: 2, date: '2025-09-08', opponent: 'Thunder United', ourScore: 1, theirScore: 2 },
    { id: 3, date: '2025-09-15', opponent: 'Storm Rangers', ourScore: null, theirScore: null }
  ]);

  const [generalNotes, setGeneralNotes] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(matches[0]);
  const [viewMode, setViewMode] = useState('matches');
  const [matchView, setMatchView] = useState('overview');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(null);
  const [showNewFormation, setShowNewFormation] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const fieldRef = useRef(null);

  const currentFormation = formations[activeFormation];
  const availablePositions = Object.values(currentFormation.lines).flatMap(line => line.positions);

  // Real Notion sync functions
  const syncToNotion = async (action, data) => {
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });
      
      if (response.ok) {
        setSyncStatus('success');
        setIsOnline(true);
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      setSyncStatus('error');
      setIsOnline(false);
      console.error('Sync error:', error);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // Auto-sync when data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fullRoster.length > 0 && isOnline) {
        syncToNotion('syncPlayers', { players: fullRoster });
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [fullRoster]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (matches.length > 0 && isOnline) {
        syncToNotion('syncMatches', { matches });
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [matches]);

  const addNewMatch = () => {
    const newMatch = {
      id: Math.max(...matches.map(m => m.id)) + 1,
      date: new Date().toISOString().split('T')[0],
      opponent: 'Nieuwe Tegenstander',
      ourScore: null,
      theirScore: null
    };
    setMatches([...matches, newMatch]);
    setSelectedMatch(newMatch);
  };

  const getMatchResult = (match) => {
    if (match.ourScore === null || match.theirScore === null) {
      return { text: 'Aankomend', color: 'bg-gray-100 text-gray-600' };
    }
    
    if (match.ourScore > match.theirScore) {
      return { text: `W ${match.ourScore}-${match.theirScore}`, color: 'bg-green-100 text-green-800' };
    } else if (match.ourScore < match.theirScore) {
      return { text: `L ${match.ourScore}-${match.theirScore}`, color: 'bg-red-100 text-red-800' };
    } else {
      return { text: `D ${match.ourScore}-${match.theirScore}`, color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const updateMatch = (matchId, updates) => {
    const updatedMatches = matches.map(m => m.id === matchId ? { ...m, ...updates } : m);
    setMatches(updatedMatches);
    
    if (selectedMatch && selectedMatch.id === matchId) {
      setSelectedMatch({ ...selectedMatch, ...updates });
    }
  };

  const deleteMatch = (matchId) => {
    const updatedMatches = matches.filter(m => m.id !== matchId);
    setMatches(updatedMatches);
    if (selectedMatch && selectedMatch.id === matchId) {
      setSelectedMatch(updatedMatches.length > 0 ? updatedMatches[0] : null);
    }
  };

  const updateRosterPlayerMatchHistory = (playerId, matchId, notes) => {
    const updated = fullRoster.map(p => 
      p.id === playerId 
        ? { ...p, matchHistory: { ...p.matchHistory, [matchId]: notes } }
        : p
    );
    setFullRoster(updated);
  };

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white shadow-lg p-4 sticky top-0 z-40">
        <h1 className="text-xl font-bold text-green-800 mb-3 flex items-center gap-2">
          🏑 Rijnvliet MO10-5 Tactiek
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Cloud size={20} className="text-green-600" />
            ) : (
              <CloudOff size={20} className="text-red-500" />
            )}
            {syncStatus === 'syncing' && (
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            )}
            {syncStatus === 'success' && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            {syncStatus === 'error' && (
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            )}
          </div>
        </h1>
        
        {/* Navigation */}
        <div className="flex gap-1 mb-3 overflow-x-auto">
          <button
            onClick={() => {
              setViewMode('matches');
              setMatchView('overview');
            }}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              viewMode === 'matches' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Wedstrijden
          </button>
          <button
            onClick={() => setViewMode('team')}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              viewMode === 'team' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Team
          </button>
        </div>
      </div>

      {/* Matches Overview */}
      {viewMode === 'matches' && matchView === 'overview' && (
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Wedstrijden Overzicht</h2>
              <button
                onClick={addNewMatch}
                className="bg-green-600 text-white px-3 py-2 rounded text-sm flex items-center gap-1"
              >
                <Plus size={16} />
                Nieuwe Wedstrijd
              </button>
            </div>

            <div className="space-y-3">
              {matches.map(match => (
                <div
                  key={match.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedMatch(match);
                    setMatchView('details');
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-bold text-lg">{match.date}</div>
                      <div className="text-gray-600 mb-1">Rijnvliet MO10-5 tegen {match.opponent}</div>
                      <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${getMatchResult(match).color}`}>
                        {getMatchResult(match).text}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMatch(match);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMatch(match.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match Details */}
      {viewMode === 'matches' && matchView === 'details' && selectedMatch && (
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <button
                  onClick={() => setMatchView('overview')}
                  className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
                >
                  ← Terug naar overzicht
                </button>
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xl font-bold">Rijnvliet MO10-5 tegen {selectedMatch.opponent}</h2>
                    <div className="text-sm text-gray-600 mb-1">{selectedMatch.date}</div>
                    {(selectedMatch.ourScore !== null && selectedMatch.theirScore !== null) && (
                      <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${getMatchResult(selectedMatch).color}`}>
                        {getMatchResult(selectedMatch).text}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingMatch(selectedMatch)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Edit3 size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Formation Selection */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Opstelling</h3>
                <button
                  onClick={() => setShowNewFormation(true)}
                  className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                >
                  <Plus size={12} />
                  Nieuwe Opstelling
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(formations).map(formation => (
                  <button
                    key={formation}
                    onClick={() => {
                      setActiveFormation(formation);
                      setPlayerPositions(formations[formation].defaultPositions);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      activeFormation === formation 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {formation}
                  </button>
                ))}
              </div>
            </div>

            {/* Field */}
            <div
              ref={fieldRef}
              className="relative bg-green-400 rounded-lg border-4 border-white overflow-hidden mx-auto mb-6"
              style={{ aspectRatio: '4/3', maxWidth: '100%', minHeight: '300px' }}
            >
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 right-0 h-1 bg-white"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white"></div>
                <div className="absolute bottom-0 left-1/2 border-2 border-white border-b-0 rounded-t-full transform -translate-x-1/2" style={{ width: '576px', height: '288px' }}></div>
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-white"></div>
                <div className="absolute top-0 bottom-0 right-0 w-1 bg-white"></div>
                <div className="absolute bottom-0 left-1/2 w-20 h-6 border-t-2 border-l-2 border-r-2 border-white transform -translate-x-1/2"></div>
              </div>

              {/* Players */}
              {availablePositions.map(position => {
                const player = selectedPlayers[position];
                const pos = playerPositions[position];
                if (!pos || !player) return null;

                return (
                  <div
                    key={position}
                    onClick={() => setShowPlayerSelect(position)}
                    className="absolute w-16 h-16 rounded-full border-3 cursor-pointer flex items-center justify-center text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 shadow-lg text-white border-gray-700"
                    style={{ 
                      left: `${pos.x}%`, 
                      top: `${pos.y}%`,
                      backgroundColor: player.color || (position === 'GK' ? '#ef4444' : '#3b82f6')
                    }}
                  >
                    <div className="text-center leading-tight">
                      <div className="text-xs">{player.name}</div>
                      <div className="text-xs">{position}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Match Notes */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">Wedstrijd Notities</h3>
                <div>
                  <h4 className="font-bold mb-2">Algemene Notities</h4>
                  <textarea
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder="Algemene observaties, tactieken, verbeterpunten..."
                    className="w-full h-24 p-3 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3">Speler Notities</h4>
                <div className="space-y-3">
                  {fullRoster.slice(0, 8).map(player => (
                    <div key={player.id} className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.name.slice(0,2)}
                        </div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <textarea
                        placeholder="Prestatie, verbeterpunten, hoogtepunten..."
                        value={player.matchHistory[selectedMatch.id] || ''}
                        onChange={(e) => updateRosterPlayerMatchHistory(player.id, selectedMatch.id, e.target.value)}
                        className="w-full p-2 border rounded text-sm h-16"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team View */}
      {viewMode === 'team' && (
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Team Selectie</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => syncToNotion('syncPlayers', { players: fullRoster })}
                  className={`px-3 py-2 rounded text-sm flex items-center gap-1 ${
                    syncStatus === 'syncing' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                  disabled={syncStatus === 'syncing'}
                >
                  <Cloud size={16} />
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Sync to Notion'}
                </button>
                <button
                  onClick={() => {
                    const newId = Math.max(...fullRoster.map(p => p.id)) + 1;
                    const newPlayer = {
                      id: newId,
                      name: `Speler ${newId}`,
                      personalNotes: '',
                      matchHistory: {},
                      color: '#6b7280'
                    };
                    setFullRoster([...fullRoster, newPlayer]);
                  }}
                  className="bg-green-600 text-white px-3 py-2 rounded text-sm flex items-center gap-1"
                >
                  <UserPlus size={16} />
                  Speler Toevoegen
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {fullRoster.map(player => (
                <div key={player.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.name.slice(0,2)}
                      </div>
                      <div>
                        <div className="font-bold">{player.name}</div>
                        <div className="text-sm text-gray-600">{player.personalNotes || 'Geen notities'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingPlayer(player)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Speler Bewerken</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Naam</label>
                <input
                  type="text"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Persoonlijke Notities</label>
                <textarea
                  value={editingPlayer.personalNotes}
                  onChange={(e) => setEditingPlayer({...editingPlayer, personalNotes: e.target.value})}
                  placeholder="Vaardigheden, persoonlijkheid, voorkeuren, notities..."
                  className="w-full p-2 border border-gray-300 rounded h-20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFullRoster(fullRoster.map(p => p.id === editingPlayer.id ? editingPlayer : p));
                    setEditingPlayer(null);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  Opslaan
                </button>
                <button
                  onClick={() => setEditingPlayer(null)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
{/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Wedstrijd Bewerken</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Datum</label>
                <input
                  type="date"
                  value={editingMatch.date}
                  onChange={(e) => setEditingMatch({...editingMatch, date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tegenstander</label>
                <input
                  type="text"
                  value={editingMatch.opponent}
                  onChange={(e) => setEditingMatch({...editingMatch, opponent: e.target.value})}
                  placeholder="Naam van de tegenstander"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Uitslag</label>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Rijnvliet MO10-5</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={editingMatch.ourScore || ''}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch, 
                        ourScore: e.target.value === '' ? null : parseInt(e.target.value)
                      })}
                      placeholder="0"
                      className="w-full p-2 border border-gray-300 rounded text-center"
                    />
                  </div>
                  <div className="text-center text-lg font-bold">-</div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{editingMatch.opponent}</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={editingMatch.theirScore || ''}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch, 
                        theirScore: e.target.value === '' ? null : parseInt(e.target.value)
                      })}
                      placeholder="0"
                      className="w-full p-2 border border-gray-300 rounded text-center"
                    />
                  </div>
                </div>
                {(editingMatch.ourScore !== null && editingMatch.theirScore !== null) && (
                  <div className="mt-2 text-center">
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getMatchResult(editingMatch).color}`}>
                      {getMatchResult(editingMatch).text}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateMatch(editingMatch.id, editingMatch);
                    setEditingMatch(null);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  Opslaan
                </button>
                <button
                  onClick={() => setEditingMatch(null)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Selection Modal */}
      {showPlayerSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Selecteer Speler voor {showPlayerSelect}</h3>
            <div className="space-y-2">
              {fullRoster.map(player => (
                <button
                  key={player.id}
                  onClick={() => {
                    setSelectedPlayers({
                      ...selectedPlayers,
                      [showPlayerSelect]: player
                    });
                    setShowPlayerSelect(null);
                  }}
                  className={`w-full p-3 text-left border rounded hover:bg-gray-50 ${
                    selectedPlayers[showPlayerSelect]?.id === player.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.slice(0,2)}
                    </div>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-600">{player.personalNotes}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPlayerSelect(null)}
              className="w-full mt-4 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Edit
