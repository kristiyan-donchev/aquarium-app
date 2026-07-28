import React, { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import CatalogBrowser from './components/CatalogBrowser.jsx';
import MyTank from './components/MyTank.jsx';
import Recommendations from './components/Recommendations.jsx';
import { loadTank, saveTank } from './lib/storage.js';

const TABS = [
  { id: 'catalog', label: 'Catalog' },
  { id: 'tank', label: 'My Tank' },
  { id: 'recommendations', label: 'Recommendations' },
];

export default function App() {
  const [tab, setTab] = useState('catalog');
  const [tank, setTank] = useState(() => loadTank());

  useEffect(() => {
    saveTank(tank);
  }, [tank]);

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
