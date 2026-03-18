import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Plot, CROPS, KANGAL_PRICE, PLOT_PRICE, LUCK_PACK_PRICE, WATERING_PACK_PRICE, BRONZE_PACK_PRICE, GOLD_PACK_PRICE, LIGHTNING_ROD_PRICE, FERTILIZER_PRICE, WeatherType } from '../types';
import { User } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Shield, Flame, Trash2, TrendingUp, ShoppingBag, Save, PlusCircle, Sparkles, Droplets, Gift, Zap, Sun, CloudRain, CloudLightning, ShieldCheck, Sprout, Trophy } from 'lucide-react';

interface GameProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  user: User;
  view: 'game' | 'leaderboard' | 'market';
}

export default function Game({ gameState, setGameState, user, view }: GameProps) {
  const [arsonists, setArsonists] = useState<{ id: number; x: number; y: number; isChased: boolean }[]>([]);
  const [notifications, setNotifications] = useState<{ id: number; text: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Save game state to Firestore
  const saveGame = useCallback(async (state: GameState) => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        coins: state.coins,
        highScore: state.highScore,
        xp: state.xp,
        level: state.level,
        lastSaved: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'gardens', user.uid), {
        plots: state.plots,
        kangals: state.kangals,
        weather: state.weather,
        hasLightningRod: state.hasLightningRod,
        xp: state.xp,
        level: state.level,
        stats: state.stats,
        claimedQuests: state.claimedQuests,
        lastDailyReward: state.lastDailyReward,
      });
      // Update leaderboard
      await setDoc(doc(db, 'leaderboard', user.uid), {
        uid: user.uid,
        displayName: user.displayName || 'İsimsiz Çiftçi',
        score: state.highScore,
        level: state.level,
        photoURL: user.photoURL,
      });
      addNotification("✅ Oyun Kaydedildi!");
    } catch (e) {
      console.error("Save error:", e);
      addNotification("❌ Kayıt Başarısız!");
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const addNotification = (text: string) => {
    const id = Math.random().toString(36).substring(2, 11) + Date.now();
    setNotifications(prev => [...prev, { id: id as any, text }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id as any));
    }, 3000);
  };

  // Buy new plot
  const buyPlot = () => {
    if (gameState.coins < PLOT_PRICE) return;
    const newPlot: Plot = {
      id: gameState.plots.length,
      cropType: null,
      plantedAt: null,
      isReady: false,
      multiplier: 1,
      isFertilized: false,
    };
    const newState = {
      ...gameState,
      coins: gameState.coins - PLOT_PRICE,
      plots: [...gameState.plots, newPlot],
    };
    setGameState(newState);
    saveGame(newState);
    addNotification("🚜 Yeni bir arsa açıldı!");
  };

  // Buy luck pack
  const buyLuckPack = (plotId: number) => {
    if (gameState.coins < LUCK_PACK_PRICE) return;
    const newPlots = [...gameState.plots];
    const luck = 1.5 + Math.random() * 2; // 1.5x to 3.5x multiplier
    newPlots[plotId] = {
      ...newPlots[plotId],
      multiplier: luck,
    };
    const newState = {
      ...gameState,
      coins: gameState.coins - LUCK_PACK_PRICE,
      plots: newPlots,
    };
    setGameState(newState);
    saveGame(newState);
    addNotification(`✨ Şans Paketi: ${luck.toFixed(1)}x Çarpan!`);
  };

  // Buy Watering Pack
  const buyWateringPack = () => {
    if (gameState.coins < WATERING_PACK_PRICE) return;
    
    let affected = 0;
    const newPlots = gameState.plots.map(plot => {
      if (plot.cropType && !plot.isReady && plot.plantedAt) {
        affected++;
        const crop = CROPS.find(c => c.id === plot.cropType);
        if (crop) {
          // Reduce remaining time by 50%
          const elapsed = (Date.now() - plot.plantedAt) / 1000;
          const remaining = crop.growTime - elapsed;
          const newPlantedAt = Date.now() - (elapsed + (remaining / 2)) * 1000;
          return { ...plot, plantedAt: newPlantedAt };
        }
      }
      return plot;
    });

    if (affected === 0) {
      addNotification("💧 Ekili ürün yok!");
      return;
    }

    const newState = {
      ...gameState,
      coins: gameState.coins - WATERING_PACK_PRICE,
      plots: newPlots,
    };
    setGameState(newState);
    saveGame(newState);
    addNotification("💧 Sulama Paketi: Ürünler %50 hızlandı!");
  };

  // Buy Farmer Pack (Gacha)
  const buyFarmerPack = (type: 'bronze' | 'gold') => {
    const price = type === 'bronze' ? BRONZE_PACK_PRICE : GOLD_PACK_PRICE;
    if (gameState.coins < price) return;

    let rewardText = "";
    let newCoins = gameState.coins - price;
    let newKangals = gameState.kangals;

    if (type === 'bronze') {
      const roll = Math.random();
      if (roll < 0.1) {
        newKangals += 1;
        rewardText = "🎁 PAKETTEN 1 KANGAL ÇIKTI!";
      } else {
        const win = Math.floor(50 + Math.random() * 450);
        newCoins += win;
        rewardText = `🎁 PAKETTEN ${win} 💰 ÇIKTI!`;
      }
    } else {
      const roll = Math.random();
      if (roll < 0.2) {
        newKangals += 3;
        rewardText = "🌟 EFSANEVİ! 3 KANGAL ÇIKTI!";
      } else {
        const win = Math.floor(500 + Math.random() * 4500);
        newCoins += win;
        rewardText = `🌟 PAKETTEN ${win} 💰 ÇIKTI!`;
      }
    }

    const newState = {
      ...gameState,
      coins: newCoins,
      kangals: newKangals,
      highScore: Math.max(gameState.highScore, newCoins),
    };
    setGameState(newState);
    saveGame(newState);
    addNotification(rewardText);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const buyLightningRod = () => {
    if (gameState.hasLightningRod) {
      addNotification("🛡️ Zaten bir paratonerin var!");
      return;
    }
    if (gameState.coins < LIGHTNING_ROD_PRICE) {
      addNotification("❌ Yetersiz bakiye!");
      return;
    }
    const newState = {
      ...gameState,
      coins: gameState.coins - LIGHTNING_ROD_PRICE,
      hasLightningRod: true,
    };
    setGameState(newState);
    saveGame(newState);
    addNotification("🛡️ Paratoner kuruldu! Fırtınalar artık zarar veremez.");
  };

  const buyFertilizer = (plotId: number) => {
    const plot = gameState.plots[plotId];
    if (plot.isFertilized) {
      addNotification("🌱 Bu tarla zaten gübreli!");
      return;
    }
    if (gameState.coins < FERTILIZER_PRICE) {
      addNotification("❌ Yetersiz bakiye!");
      return;
    }
    const newPlots = [...gameState.plots];
    newPlots[plotId] = { ...newPlots[plotId], isFertilized: true };
    const newState = {
      ...gameState,
      coins: gameState.coins - FERTILIZER_PRICE,
      plots: newPlots,
    };
    setGameState(newState);
    saveGame(newState);
    addNotification("🌱 Tarla gübrelendi! Verim %50 arttı.");
  };

  // Plant crop
  const plantCrop = (plotId: number, cropId: string) => {
    const crop = CROPS.find(c => c.id === cropId);
    if (!crop || gameState.coins < crop.price) return;

    const newPlots = [...gameState.plots];
    newPlots[plotId] = {
      ...newPlots[plotId],
      cropType: cropId,
      plantedAt: Date.now(),
      isReady: false,
    };

    const newState = {
      ...gameState,
      coins: gameState.coins - crop.price,
      plots: newPlots,
    };
    setGameState(newState);
    saveGame(newState);
  };

  // Harvest crop
  const harvestCrop = (plotId: number) => {
    const plot = gameState.plots[plotId];
    if (!plot.isReady || !plot.cropType) return;

    const crop = CROPS.find(c => c.id === plot.cropType);
    if (!crop) return;

    const newPlots = [...gameState.plots];
    const multiplier = plot.multiplier || 1;
    const fertilizerBonus = plot.isFertilized ? 1.5 : 1;
    const earned = Math.floor(crop.sellValue * multiplier * fertilizerBonus);
    newPlots[plotId] = {
      ...newPlots[plotId],
      cropType: null,
      plantedAt: null,
      isReady: false,
      multiplier: 1, // Reset multiplier after harvest
    };

    const newCoins = gameState.coins + earned;
    const newHighScore = Math.max(gameState.highScore, newCoins);
    const newStats = {
      totalHarvests: gameState.stats.totalHarvests + 1,
      totalCoinsEarned: gameState.stats.totalCoinsEarned + earned,
    };

    // XP Logic: 1 XP for every 10 coins earned (min 1)
    const xpGained = Math.max(1, Math.floor(earned / 10));
    let newXp = gameState.xp + xpGained;
    let newLevel = gameState.level;
    let bonusCoins = 0;
    
    // Level Up Logic: level * 100 XP needed
    const xpNeeded = newLevel * 100;
    if (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel += 1;
      bonusCoins = newLevel * 500; // Reward for leveling up
      addNotification(`🎉 SEVİYE ATLADIN! Seviye ${newLevel} (+${bonusCoins} 💰)`);
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.3 }
      });
    }

    const newState = {
      ...gameState,
      coins: newCoins + bonusCoins,
      highScore: Math.max(newHighScore, newCoins + bonusCoins),
      plots: newPlots,
      xp: newXp,
      level: newLevel,
      stats: newStats,
    };
    setGameState(newState);
    saveGame(newState);
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 }
    });
    addNotification(`+${earned} Altın! (${multiplier.toFixed(1)}x)`);
  };

  // Defense & Growth & Weather Logic
  useEffect(() => {
    const interval = setInterval(() => {
      // Check growth
      const now = Date.now();
      let changed = false;
      const newPlots = gameState.plots.map(plot => {
        if (plot.cropType && !plot.isReady && plot.plantedAt) {
          const crop = CROPS.find(c => c.id === plot.cropType);
          if (crop) {
            const elapsed = (now - plot.plantedAt) / 1000;
            // Rain speeds up growth by 2x
            const weatherMultiplier = gameState.weather === 'RAINY' ? 2 : 1;
            const effectiveElapsed = elapsed * weatherMultiplier;
            
            if (effectiveElapsed >= crop.growTime) {
              changed = true;
              return { ...plot, isReady: true };
            }
          }
        }
        return plot;
      });

      // Weather Cycle (1% chance to change every second)
      let newWeather = gameState.weather;
      if (Math.random() < 0.01) {
        const rand = Math.random();
        if (rand > 0.7) newWeather = 'RAINY';
        else if (rand > 0.9) newWeather = 'STORMY';
        else newWeather = 'SUNNY';
        
        if (newWeather !== gameState.weather) {
          changed = true;
          addNotification(`Hava durumu değişti: ${newWeather === 'SUNNY' ? '☀️ Güneşli' : newWeather === 'RAINY' ? '🌧️ Yağmurlu (2x Hız)' : '⛈️ Fırtınalı'}`);
        }
      }

      // Lightning strike during storm
      if (gameState.weather === 'STORMY' && Math.random() < 0.05) {
        if (gameState.hasLightningRod) {
          addNotification("🛡️ Paratoner yıldırımdan korudu!");
        } else {
          const occupiedPlots = gameState.plots.filter(p => p.cropType !== null);
          if (occupiedPlots.length > 0) {
            const target = occupiedPlots[Math.floor(Math.random() * occupiedPlots.length)];
            newPlots[target.id] = { ...newPlots[target.id], cropType: null, plantedAt: null, isReady: false, multiplier: 1 };
            changed = true;
            addNotification("⛈️ Yıldırım bir tarlayı vurdu!");
          }
        }
      }

      if (changed) {
        setGameState(prev => prev ? { ...prev, plots: newPlots, weather: newWeather } : null);
      }

      // Arsonist attack chance
      if (Math.random() < 0.05 && arsonists.length === 0) {
        const id = Math.random().toString(36).substring(2, 11) + Date.now();
        setArsonists([{ id: id as any, x: -50, y: Math.random() * 200, isChased: false }]);
        addNotification("⚠️ KUNDAKÇI SALDIRISI!");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, arsonists]);

  // Arsonist movement and Kangal defense
  useEffect(() => {
    if (arsonists.length === 0) return;

    const moveInterval = setInterval(() => {
      setArsonists(prev => {
        if (prev.length === 0) return [];
        const arsonist = prev[0];
        
        // If arsonist reaches the garden (x > 100)
        if (arsonist.x > 150 && !arsonist.isChased) {
          // Attack!
          const activePlots = gameState.plots.filter(p => p.cropType !== null);
          if (activePlots.length > 0) {
            const randomPlot = activePlots[Math.floor(Math.random() * activePlots.length)];
            const newPlots = [...gameState.plots];
            newPlots[randomPlot.id] = { ...newPlots[randomPlot.id], cropType: null, plantedAt: null, isReady: false, multiplier: 1 };
            setGameState(prev => prev ? { ...prev, plots: newPlots } : null);
            addNotification("🔥 BİR ÜRÜNÜN YANDI!");
          }
          return [];
        }

        // Kangal defense
        if (!arsonist.isChased && gameState.kangals > 0 && Math.random() < 0.15 * gameState.kangals) {
          addNotification("🐕 KANGAL KUNDAKÇIYI KOVALADI!");
          return [{ ...arsonist, isChased: true }];
        }

        // If being chased, move faster and exit
        if (arsonist.isChased) {
          if (arsonist.x < -100) return [];
          return [{ ...arsonist, x: arsonist.x - 20 }];
        }

        return [{ ...arsonist, x: arsonist.x + 10 }];
      });
    }, 500);

    return () => clearInterval(moveInterval);
  }, [arsonists, gameState.kangals, gameState.plots]);

  const claimQuest = (questId: number, reward: number) => {
    if (gameState.claimedQuests.includes(questId)) return;
    
    const newState = {
      ...gameState,
      coins: gameState.coins + reward,
      claimedQuests: [...gameState.claimedQuests, questId],
    };
    setGameState(newState);
    saveGame(newState);
    addNotification(`🎁 Görev Ödülü: +${reward} 💰`);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const claimDailyReward = () => {
    const now = new Date();
    const last = gameState.lastDailyReward ? new Date(gameState.lastDailyReward) : null;
    
    if (last && now.toDateString() === last.toDateString()) {
      addNotification("📅 Günlük ödülünü zaten aldın!");
      return;
    }

    const reward = 500 + (gameState.level * 100);
    const newState = {
      ...gameState,
      coins: gameState.coins + reward,
      lastDailyReward: now.toISOString(),
    };
    setGameState(newState);
    saveGame(newState);
    addNotification(`📅 Günlük Ödül: +${reward} 💰`);
    confetti({
      particleCount: 100,
      spread: 50,
      origin: { y: 0.8 }
    });
  };

  const getRank = (level: number) => {
    if (level >= 51) return { name: 'Efsanevi Çiftçi', color: 'text-purple-600', icon: '👑' };
    if (level >= 36) return { name: 'Kangal Kralı', color: 'text-red-600', icon: '🐕' };
    if (level >= 21) return { name: 'Toprak Ağası', color: 'text-amber-600', icon: '🏰' };
    if (level >= 11) return { name: 'Uzman Çiftçi', color: 'text-blue-600', icon: '👨‍🌾' };
    if (level >= 6) return { name: 'Kalfa Çiftçi', color: 'text-emerald-600', icon: '🌱' };
    return { name: 'Acemi Çiftçi', color: 'text-stone-500', icon: '🐣' };
  };

  const QUESTS = [
    { id: 1, name: 'Acemi Hasatçı', target: 50, current: gameState.stats.totalHarvests, reward: 1000, icon: '🌾' },
    { id: 2, name: 'Kangal Sever', target: 10, current: gameState.kangals, reward: 2500, icon: '🐕' },
    { id: 3, name: 'Zengin Çiftçi', target: 50000, current: gameState.stats.totalCoinsEarned, reward: 5000, icon: '💰' },
    { id: 4, name: 'Usta Çiftçi', target: 20, current: gameState.level, reward: 10000, icon: '🏆' },
  ];

  const canClaimDaily = () => {
    const now = new Date();
    const last = gameState.lastDailyReward ? new Date(gameState.lastDailyReward) : null;
    return !last || now.toDateString() !== last.toDateString();
  };

  if (view === 'market') {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-black text-stone-800 flex items-center gap-2">
          <ShoppingBag className="text-emerald-600" /> PAZAR
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="text-blue-500" /> Savunma & Arsa
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🐕</span>
                  <div>
                    <p className="font-bold">Kangal Köpeği</p>
                    <p className="text-xs text-stone-400">Bahçeyi kundakçılardan korur.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (gameState.coins >= KANGAL_PRICE) {
                      const newState = { ...gameState, coins: gameState.coins - KANGAL_PRICE, kangals: gameState.kangals + 1 };
                      setGameState(newState);
                      saveGame(newState);
                      addNotification("🐕 Yeni bir Kangal sahiplendin!");
                    }
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                  disabled={gameState.coins < KANGAL_PRICE}
                >
                  {KANGAL_PRICE} 💰
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🚜</span>
                  <div>
                    <p className="font-bold">Yeni Arsa Slotu</p>
                    <p className="text-xs text-stone-400">Daha fazla ürün ekmek için alan aç.</p>
                  </div>
                </div>
                <button 
                  onClick={buyPlot}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                  disabled={gameState.coins < PLOT_PRICE}
                >
                  {PLOT_PRICE} 💰
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">✨</span>
                  <div>
                    <p className="font-bold">Şans Paketi</p>
                    <p className="text-xs text-stone-400">Ekilmiş ürüne rastgele çarpan ekler.</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-stone-400">Bahçede Ürüne Tıkla</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" /> Tohumlar
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {CROPS.map(crop => (
                <div key={crop.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{crop.icon}</span>
                    <div>
                      <p className="font-bold text-sm">{crop.name}</p>
                      <p className="text-[10px] text-stone-400">Büyüme: {crop.growTime}s | Satış: {crop.sellValue}💰</p>
                    </div>
                  </div>
                  <div className="text-emerald-600 font-black text-sm">{crop.price} 💰</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Notifications */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="bg-stone-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl text-sm whitespace-nowrap"
            >
              {n.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Weather & Defense Status & Save */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Weather Card */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                gameState.weather === 'SUNNY' ? 'bg-yellow-100' : 
                gameState.weather === 'RAINY' ? 'bg-blue-100' : 
                'bg-purple-100'
              }`}>
                {gameState.weather === 'SUNNY' ? '☀️' : gameState.weather === 'RAINY' ? '🌧️' : '⛈️'}
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Hava Durumu</p>
                <p className="font-black text-stone-800">
                  {gameState.weather === 'SUNNY' ? 'Güneşli' : gameState.weather === 'RAINY' ? 'Yağmurlu (2x Hız)' : 'Fırtınalı'}
                </p>
              </div>
            </div>
            {gameState.hasLightningRod && (
              <div className="text-emerald-600" title="Paratoner Aktif">
                <ShieldCheck size={24} />
              </div>
            )}
          </div>

          {/* Defense Card */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                {getRank(gameState.level).icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Rütbe</p>
                <p className={`font-black text-sm ${getRank(gameState.level).color}`}>
                  {getRank(gameState.level).name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Savunma</p>
                <p className="font-black text-stone-800">{gameState.kangals} Kangal</p>
              </div>
              <button 
                onClick={() => saveGame(gameState)}
                disabled={isSaving}
                className="bg-stone-100 hover:bg-stone-200 p-3 rounded-2xl transition-all text-stone-600 disabled:opacity-50"
              >
                <Save size={24} className={isSaving ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Farmer Quick Market */}
        <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 flex flex-wrap gap-3 items-center justify-center sm:justify-start">
          <div className="flex items-center gap-2 mr-2">
            <Zap className="text-emerald-600" size={20} />
            <span className="font-black text-xs text-emerald-800 uppercase tracking-tighter">HIZLI MARKET</span>
          </div>
          
          <button 
            onClick={buyWateringPack}
            className="bg-white hover:bg-blue-50 border border-blue-100 px-4 py-2 rounded-2xl flex items-center gap-2 transition-all shadow-sm group"
          >
            <Droplets className="text-blue-500 group-hover:scale-110 transition-transform" size={18} />
            <div className="text-left">
              <p className="text-[10px] font-bold text-stone-400 leading-none">SULAMA</p>
              <p className="font-black text-blue-800 text-xs">{WATERING_PACK_PRICE} 💰</p>
            </div>
          </button>

          <button 
            onClick={() => buyFarmerPack('bronze')}
            className="bg-white hover:bg-stone-50 border border-stone-200 px-4 py-2 rounded-2xl flex items-center gap-2 transition-all shadow-sm group"
          >
            <Gift className="text-stone-400 group-hover:scale-110 transition-transform" size={18} />
            <div className="text-left">
              <p className="text-[10px] font-bold text-stone-400 leading-none">BRONZ PAKET</p>
              <p className="font-black text-stone-600 text-xs">{BRONZE_PACK_PRICE} 💰</p>
            </div>
          </button>

          <button 
            onClick={() => buyFarmerPack('gold')}
            className="bg-white hover:bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl flex items-center gap-2 transition-all shadow-sm group"
          >
            <Sparkles className="text-amber-500 group-hover:scale-110 transition-transform" size={18} />
            <div className="text-left">
              <p className="text-[10px] font-bold text-stone-400 leading-none">ALTIN PAKET</p>
              <p className="font-black text-amber-600 text-xs">{GOLD_PACK_PRICE} 💰</p>
            </div>
          </button>

          <button 
            onClick={buyLightningRod}
            disabled={gameState.hasLightningRod}
            className={`bg-white hover:bg-purple-50 border border-purple-200 px-4 py-2 rounded-2xl flex items-center gap-2 transition-all shadow-sm group ${gameState.hasLightningRod ? 'opacity-50 grayscale' : ''}`}
          >
            <ShieldCheck className="text-purple-500 group-hover:scale-110 transition-transform" size={18} />
            <div className="text-left">
              <p className="text-[10px] font-bold text-stone-400 leading-none">PARATONER</p>
              <p className="font-black text-purple-600 text-xs">{LIGHTNING_ROD_PRICE} 💰</p>
            </div>
          </button>
        </div>

        {/* Quests Card */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">
              <Trophy className="text-amber-500" size={20} /> AKTİF GÖREVLER
            </h3>
            <button 
              onClick={claimDailyReward}
              className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
                canClaimDaily() ? 'bg-amber-400 text-white shadow-lg shadow-amber-100 hover:scale-105' : 'bg-stone-100 text-stone-400'
              }`}
            >
              📅 {canClaimDaily() ? 'Günlük Ödülü Al' : 'Yarın Tekrar Gel'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUESTS.map(quest => {
              const isCompleted = quest.current >= quest.target;
              const isClaimed = gameState.claimedQuests.includes(quest.id);
              
              return (
                <div key={quest.id} className="bg-stone-50 p-4 rounded-3xl border border-stone-100 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{quest.icon}</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">+{quest.reward} 💰</span>
                  </div>
                  <p className="font-bold text-xs text-stone-700 mb-1">{quest.name}</p>
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 mb-2">
                    <span>İlerleme</span>
                    <span>{quest.current} / {quest.target}</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}
                    />
                  </div>
                  
                  {isCompleted && !isClaimed && (
                    <button 
                      onClick={() => claimQuest(quest.id, quest.reward)}
                      className="absolute inset-0 bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <div className="bg-white text-emerald-600 text-xs font-black px-4 py-2 rounded-full shadow-xl">ÖDÜLÜ AL!</div>
                    </button>
                  )}
                  
                  {isClaimed && (
                    <div className="absolute inset-0 bg-stone-200/50 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="bg-stone-400 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">ALINDI</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Garden Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {gameState.plots.map((plot) => (
          <div key={plot.id} className="relative group">
            <div 
              className={`aspect-square rounded-[2rem] border-4 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden
                ${plot.cropType 
                  ? plot.isReady 
                    ? 'bg-emerald-50 border-emerald-200 hover:scale-105' 
                    : 'bg-stone-200 border-stone-300' 
                  : 'bg-stone-100 border-dashed border-stone-300 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              onClick={() => plot.isReady && harvestCrop(plot.id)}
            >
              {plot.cropType ? (
                <div className="text-center relative w-full h-full flex flex-col items-center justify-center">
                  {(plot.multiplier || 1) > 1 && (
                    <div className="absolute top-4 right-4 bg-amber-400 text-white text-[10px] font-black px-2 py-1 rounded-full animate-pulse">
                      {(plot.multiplier || 1).toFixed(1)}x
                    </div>
                  )}
                  
                  <motion.div 
                    animate={plot.isReady ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-6xl mb-2"
                  >
                    {CROPS.find(c => c.id === plot.cropType)?.icon}
                  </motion.div>
                  
                  {plot.isReady ? (
                    <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">TOPLA</span>
                  ) : (
                    <div className="w-12 h-1.5 bg-stone-300 rounded-full overflow-hidden mx-auto">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: CROPS.find(c => c.id === plot.cropType)?.growTime || 10 }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                  )}

                  {/* Luck Pack Button */}
                  {plot.multiplier === 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        buyLuckPack(plot.id);
                      }}
                      className="absolute bottom-2 right-2 bg-amber-100 hover:bg-amber-200 p-2 rounded-full text-amber-600 transition-all opacity-0 group-hover:opacity-100"
                      title="Şans Paketi Uygula"
                    >
                      <Sparkles size={16} />
                    </button>
                  )}

                  {/* Fertilizer Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      buyFertilizer(plot.id);
                    }}
                    className={`absolute bottom-2 left-2 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                      plot.isFertilized ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 hover:bg-stone-200 text-stone-400'
                    }`}
                    title={plot.isFertilized ? "Gübreli Tarla (+50% Verim)" : "Gübre Satın Al"}
                  >
                    <Sprout size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-stone-300 group-hover:text-emerald-400 transition-colors">
                  <TrendingUp size={40} />
                </div>
              )}

              {/* Plant Menu Overlay */}
              {!plot.cropType && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-2 flex flex-col gap-1 justify-center overflow-y-auto">
                  {CROPS.map(crop => (
                    <button
                      key={crop.id}
                      disabled={gameState.coins < crop.price}
                      onClick={(e) => {
                        e.stopPropagation();
                        plantCrop(plot.id, crop.id);
                      }}
                      className="flex items-center justify-between bg-white border border-stone-200 p-1 rounded-xl hover:bg-emerald-50 disabled:opacity-50 text-[10px] font-bold"
                    >
                      <span>{crop.icon} {crop.name}</span>
                      <span className="text-emerald-600">{crop.price}💰</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Buy Plot Shortcut */}
        <button 
          onClick={buyPlot}
          disabled={gameState.coins < PLOT_PRICE}
          className="aspect-square rounded-[2rem] border-4 border-dashed border-blue-200 bg-blue-50/30 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-all group disabled:opacity-50"
        >
          <PlusCircle size={40} className="text-blue-300 group-hover:text-blue-500" />
          <span className="text-xs font-bold text-blue-400">{PLOT_PRICE} 💰</span>
          <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Yeni Arsa</span>
        </button>
      </div>

      {/* Arsonist & Kangal Animation Layer */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        <AnimatePresence>
          {arsonists.map(a => (
            <React.Fragment key={a.id}>
              <motion.div
                initial={{ x: -100, y: 300 }}
                animate={a.isChased ? { x: -200, y: 300 } : { x: 800, y: 300 }}
                exit={{ opacity: 0 }}
                transition={{ duration: a.isChased ? 2 : 10, ease: "linear" }}
                className="absolute text-5xl"
              >
                🏃‍♂️🔥
              </motion.div>
              
              {a.isChased && (
                <motion.div
                  initial={{ x: 0, y: 300 }}
                  animate={{ x: -200, y: 300 }}
                  transition={{ duration: 2, ease: "linear" }}
                  className="absolute text-5xl"
                >
                  🐕💨
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
