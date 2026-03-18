import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { GameState, Plot } from './types';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import { LogIn, LogOut, Trophy, ShoppingBag, Shield } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [view, setView] = useState<'game' | 'leaderboard' | 'market'>('game');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Load or initialize game state
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        const gardenDoc = await getDoc(doc(db, 'gardens', u.uid));

        if (userDoc.exists() && gardenDoc.exists()) {
          const userData = userDoc.data();
          const gardenData = gardenDoc.data();
          
          // Migration: Ensure all plots have a multiplier and user has a displayName
          const plots = (gardenData.plots || []).map((p: any) => ({
            ...p,
            multiplier: p.multiplier || 1
          }));

          const displayName = userData.displayName || u.displayName || 'İsimsiz Çiftçi';
          
          setGameState({
            coins: userData.coins,
            highScore: userData.highScore || 0,
            plots: plots,
            kangals: gardenData.kangals || 0,
            weather: gardenData.weather || 'SUNNY',
            hasLightningRod: gardenData.hasLightningRod || false,
            xp: userData.xp || 0,
            level: userData.level || 1,
            stats: gardenData.stats || { totalHarvests: 0, totalCoinsEarned: 0 },
            claimedQuests: gardenData.claimedQuests || [],
            lastDailyReward: gardenData.lastDailyReward || null,
          });

          // If displayName was missing, update it
          if (!userData.displayName) {
            updateDoc(doc(db, 'users', u.uid), { displayName });
          }
        } else {
          // New user initialization
          const initialState: GameState = {
            coins: 100,
            highScore: 0,
            plots: Array(6).fill(null).map((_, i) => ({
              id: i,
              cropType: null,
              plantedAt: null,
              isReady: false,
              multiplier: 1,
              isFertilized: false,
            })),
            kangals: 1,
            weather: 'SUNNY',
            hasLightningRod: false,
            xp: 0,
            level: 1,
            stats: { totalHarvests: 0, totalCoinsEarned: 0 },
            claimedQuests: [],
            lastDailyReward: null,
          };
          
          await setDoc(doc(db, 'users', u.uid), {
            uid: u.uid,
            displayName: u.displayName || 'İsimsiz Çiftçi',
            email: u.email,
            photoURL: u.photoURL,
            coins: initialState.coins,
            highScore: 0,
            xp: initialState.xp,
            level: initialState.level,
          });

          await setDoc(doc(db, 'gardens', u.uid), {
            uid: u.uid,
            plots: initialState.plots,
            kangals: initialState.kangals,
            weather: initialState.weather,
            hasLightningRod: initialState.hasLightningRod,
            xp: initialState.xp,
            level: initialState.level,
            stats: initialState.stats,
            claimedQuests: initialState.claimedQuests,
            lastDailyReward: initialState.lastDailyReward,
          });

          setGameState(initialState);
        }
      } else {
        setGameState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center font-sans">
        <div className="animate-bounce text-4xl">🐕</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 font-sans text-stone-900">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-b-8 border-stone-200">
          <h1 className="text-5xl font-black mb-2 tracking-tighter text-emerald-700">KANGAL</h1>
          <h2 className="text-3xl font-bold mb-8 tracking-tight text-stone-400 italic">GARDEN</h2>
          <div className="text-6xl mb-8">🚜</div>
          <p className="text-stone-500 mb-8 leading-relaxed">
            Bahçeni ek, biç ve kundakçılardan Kangal köpeklerinle koru!
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-200"
          >
            <LogIn size={24} />
            Google ile Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-emerald-500" alt="profile" />
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-1">Seviye {gameState?.level || 1}</p>
                <p className="font-bold text-stone-800 leading-none">{user.displayName}</p>
                <div className="w-20 h-1 bg-stone-100 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, ((gameState?.xp || 0) / ((gameState?.level || 1) * 100)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 px-4 py-2 rounded-2xl flex items-center gap-2 border-b-4 border-amber-200">
              <span className="text-xl">💰</span>
              <span className="font-black text-amber-800">{gameState?.coins || 0}</span>
            </div>
            <button onClick={logout} className="p-2 text-stone-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {view === 'leaderboard' ? (
          <Leaderboard />
        ) : gameState && (
          <Game 
            gameState={gameState} 
            setGameState={setGameState} 
            user={user}
            view={view}
          />
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-2 flex gap-2 z-50">
        <button 
          onClick={() => setView('game')}
          className={`p-4 rounded-2xl transition-all ${view === 'game' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-stone-400 hover:bg-stone-100'}`}
        >
          <Shield size={24} />
        </button>
        <button 
          onClick={() => setView('market')}
          className={`p-4 rounded-2xl transition-all ${view === 'market' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-stone-400 hover:bg-stone-100'}`}
        >
          <ShoppingBag size={24} />
        </button>
        <button 
          onClick={() => setView('leaderboard')}
          className={`p-4 rounded-2xl transition-all ${view === 'leaderboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-stone-400 hover:bg-stone-100'}`}
        >
          <Trophy size={24} />
        </button>
      </nav>
    </div>
  );
}
