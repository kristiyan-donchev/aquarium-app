import React, { useState } from 'react';

export default function TankSwitcher({ tanks, activeTankId, onSwitch, onCreate, onRename, onDelete }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const activeTank = tanks.find((t) => t.id === activeTankId);

  function startRename() {
    setRenameValue(activeTank?.name || '');
    setRenaming(true);
  }

  function submitRename(e) {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (trimmed) onRename(activeTankId, trimmed);
    setRenaming(false);
  }

  function submitCreate(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (trimmed) onCreate(trimmed);
    setNewName('');
    setCreating(false);
  }

  function handleDelete() {
    if (tanks.length <= 1) return;
    if (window.confirm(`Delete "${activeTank?.name}"? This can't be undone.`)) {
      onDelete(activeTankId);
    }
  }

  return (
    <div className="tank-switcher">
      <span className="tank-switcher-label">Tank</span>

      {renaming ? (
        <form onSubmit={submitRename} className="tank-switcher-form">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          <button type="submit" className="link-button">
            Save
          </button>
          <button type="button" className="link-button" onClick={() => setRenaming(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <select
          className="tank-select"
          value={activeTankId ?? ''}
          onChange={(e) => onSwitch(e.target.value)}
        >
          {tanks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      {!renaming && (
        <>
          <button type="button" className="link-button" onClick={startRename}>
            Rename
          </button>
          <button
            type="button"
            className="link-button"
            onClick={handleDelete}
            disabled={tanks.length <= 1}
            title={tanks.length <= 1 ? "Can't delete your only tank" : undefined}
          >
            Delete
          </button>
        </>
      )}

      {creating ? (
        <form onSubmit={submitCreate} className="tank-switcher-form">
          <input
            autoFocus
            placeholder="New tank name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="link-button">
            Add
          </button>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setNewName('');
              setCreating(false);
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button type="button" className="link-button tank-switcher-new" onClick={() => setCreating(true)}>
          + New tank
        </button>
      )}
    </div>
  );
}
