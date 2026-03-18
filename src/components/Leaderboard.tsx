import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setEntries(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin text-4xl">🏆</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-stone-800 flex items-center gap-2">
        <Trophy className="text-amber-500" /> SIRALAMA
      </h2>
      <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 overflow-hidden">
        {entries.length > 0 ? (
          entries.map((entry, i) => (
            <div key={entry.uid || i} className="flex items-center justify-between p-5 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 flex items-center justify-center font-black rounded-full text-sm ${
                  i === 0 ? 'bg-amber-400 text-white' : 
                  i === 1 ? 'bg-stone-300 text-white' : 
                  i === 2 ? 'bg-amber-600 text-white' : 'text-stone-400'
                }`}>
                  {i + 1}
                </span>
                <img src={entry.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.uid}`} className="w-10 h-10 rounded-full border-2 border-stone-100" alt="" />
                <div className="flex flex-col">
                  <span className="font-bold text-stone-700">{entry.displayName}</span>
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Seviye {entry.level || 1}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <span className="font-black text-emerald-600">{entry.score.toLocaleString()}</span>
                  <span className="text-xs font-bold text-stone-400">💰</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-stone-400 font-medium">
            Henüz kimse sıralamaya girmemiş!
          </div>
        )}
      </div>
    </div>
  );
}
