import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import CatalogBrowser from './components/CatalogBrowser.jsx';
import MyTank from './components/MyTank.jsx';
import Recommendations from './components/Recommendations.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import TankSwitcher from './components/TankSwitcher.jsx';
import Credits from './components/Credits.jsx';
import Forum from './components/Forum.jsx';
import Profile from './components/Profile.jsx';
import Settings from './components/Settings.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { listTanks, createTank, renameTank, deleteTank, saveTank } from './lib/storage.js';
import { syncUserProfile } from './lib/users.js';

const TABS = [
  { id: 'catalog', label: 'Catalog' },
  { id: 'tank', label: 'My Tank' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'forum', label: 'Forum' },
  { id: 'credits', label: 'Credits' },
];

export default function App() {
  const { user, authLoading } = useAuth();
  const [tab, setTab] = useState('catalog');
  const [tanks, setTanks] = useState([]);
  const [activeTankId, setActiveTankId] = useState(null);
  const [tanksLoading, setTanksLoading] = useState(true);
  const [viewingProfileUid, setViewingProfileUid] = useState(null);
  const [viewingSettings, setViewingSettings] = useState(false);
  const saveTimers = useRef({});

  useEffect(() => {
    if (!user) return;
    syncUserProfile(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setTanksLoading(true);
    (async () => {
      let list = await listTanks(user.uid);
      if (list.length === 0) {
        const created = await createTank(user.uid, 'My Tank');
        list = [created];
      }
      if (cancelled) return;
      setTanks(list);
      setActiveTankId(list[0].id);
      setTanksLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  function scheduleSave(tankId, tankData) {
    clearTimeout(saveTimers.current[tankId]);
    saveTimers.current[tankId] = setTimeout(() => {
      saveTank(user.uid, tankId, tankData);
    }, 500);
  }

  function updateActiveTank(updater) {
    setTanks((prev) =>
      prev.map((t) => {
        if (t.id !== activeTankId) return t;
        const updated = updater(t);
        if (updated !== t) scheduleSave(t.id, updated);
        return updated;
      })
    );
  }

  function addToTank(speciesId) {
    updateActiveTank((prev) =>
      prev.stockedIds.includes(speciesId)
        ? prev
        : { ...prev, stockedIds: [...prev.stockedIds, speciesId] }
    );
  }

  function removeFromTank(speciesId) {
    updateActiveTank((prev) => ({ ...prev, stockedIds: prev.stockedIds.filter((id) => id !== speciesId) }));
  }

  async function handleCreateTank(name) {
    const created = await createTank(user.uid, name);
    setTanks((prev) => [...prev, created]);
    setActiveTankId(created.id);
  }

  async function handleRenameTank(tankId, name) {
    await renameTank(user.uid, tankId, name);
    setTanks((prev) => prev.map((t) => (t.id === tankId ? { ...t, name } : t)));
  }

  async function handleDeleteTank(tankId) {
    if (tanks.length <= 1) return;
    await deleteTank(user.uid, tankId);
    const next = tanks.filter((t) => t.id !== tankId);
    setTanks(next);
    if (activeTankId === tankId) setActiveTankId(next[0]?.id ?? null);
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

  if (tanksLoading) {
    return (
      <div className="app">
        <Header />
        <p className="empty-state">Loading your tanks…</p>
      </div>
    );
  }

  if (viewingSettings) {
    return (
      <div className="app">
        <Header
          onViewProfile={() => {
            setViewingSettings(false);
            setViewingProfileUid(user.uid);
          }}
          onViewSettings={() => setViewingSettings(true)}
        />
        <Settings user={user} onBack={() => setViewingSettings(false)} />
      </div>
    );
  }

  if (viewingProfileUid) {
    return (
      <div className="app">
        <Header
          onViewProfile={() => setViewingProfileUid(user.uid)}
          onViewSettings={() => {
            setViewingProfileUid(null);
            setViewingSettings(true);
          }}
        />
        <Profile uid={viewingProfileUid} onBack={() => setViewingProfileUid(null)} />
      </div>
    );
  }

  const activeTank = tanks.find((t) => t.id === activeTankId);

  return (
    <div className="app">
      <Header
        onViewProfile={() => setViewingProfileUid(user.uid)}
        onViewSettings={() => setViewingSettings(true)}
      />
      <TankSwitcher
        tanks={tanks}
        activeTankId={activeTankId}
        onSwitch={setActiveTankId}
        onCreate={handleCreateTank}
        onRename={handleRenameTank}
        onDelete={handleDeleteTank}
      />
      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-button${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.id === 'tank' ? activeTank.name : t.label}
            {t.id === 'tank' && activeTank.stockedIds.length > 0 ? ` (${activeTank.stockedIds.length})` : ''}
          </button>
        ))}
      </nav>

      {tab === 'catalog' && <CatalogBrowser tank={activeTank} onAdd={addToTank} onRemove={removeFromTank} />}
      {tab === 'tank' && <MyTank tank={activeTank} setTank={updateActiveTank} onRemove={removeFromTank} />}
      {tab === 'recommendations' && <Recommendations tank={activeTank} onAdd={addToTank} />}
      {tab === 'forum' && <Forum user={user} onViewProfile={setViewingProfileUid} />}
      {tab === 'credits' && <Credits />}

      <footer className="app-footer">
        <p>
          Parameter ranges are general freshwater-hobby guidelines, not species-exact data for every
          strain/locale — always research a species further before stocking your tank.
        </p>
      </footer>
    </div>
  );
}
