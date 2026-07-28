import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import CatalogBrowser from './components/CatalogBrowser.jsx';
import MyTank from './components/MyTank.jsx';
import Recommendations from './components/Recommendations.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { loadTank, saveTank, defaultTank } from './lib/storage.js';

const TABS = [
  { id: 'catalog', label: 'Catalog' },
  { id: 'tank', label: 'My Tank' },
  { id: 'recommendations', label: 'Recommendations' },
];

export default function App() {
  const { user, authLoading } = useAuth();
  const [tab, setTab] = useState('catalog');
  const [tank, setTank] = useState(defaultTank);
  const [tankLoading, setTankLoading] = useState(true);
  const skipNextSave = useRef(false);
  const saveTimeout = useRef(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setTankLoading(true);
    loadTank(user.uid).then((loaded) => {
      if (cancelled) return;
      skipNextSave.current = true;
      setTank(loaded);
      setTankLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || tankLoading) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveTank(user.uid, tank);
    }, 500);
    return () => clearTimeout(saveTimeout.current);
  }, [tank, user, tankLoading]);

  function addToTank(speciesId) {
    setTank((prev) =>
      prev.stockedIds.includes(speciesId)
        ? prev
        : { ...prev, stockedIds: [...prev.stockedIds, speciesId] }
    );
  }

  function removeFromTank(speciesId) {
    setTank((prev) => ({ ...prev, stockedIds: prev.stockedIds.filter((id) => id !== speciesId) }));
  }

  if (authLoading) {
    return (
      <div className="app">
        <p className="empty-state">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (tankLoading) {
    return (
      <div className="app">
        <Header />
        <p className="empty-state">Loading your tank…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-button${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'tank' && tank.stockedIds.length > 0 ? ` (${tank.stockedIds.length})` : ''}
          </button>
        ))}
      </nav>

      {tab === 'catalog' && <CatalogBrowser tank={tank} onAdd={addToTank} onRemove={removeFromTank} />}
      {tab === 'tank' && <MyTank tank={tank} setTank={setTank} onRemove={removeFromTank} />}
      {tab === 'recommendations' && <Recommendations tank={tank} onAdd={addToTank} />}

      <footer className="app-footer">
        <p>
          Parameter ranges are general freshwater-hobby guidelines, not species-exact data for every
          strain/locale — always research a species further before stocking your tank.
        </p>
      </footer>
    </div>
  );
}
