import React, { useEffect, useState } from 'react';
import { getSpeciesById } from '../data/species.js';
import { getTargetParams } from '../lib/compatibility.js';
import { defaultCustomParams } from '../lib/storage.js';
import SpeciesCard from './SpeciesCard.jsx';

function numOrNull(v) {
  if (v === '' || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export default function MyTank({ tank, setTank, onRemove }) {
  const stocked = tank.stockedIds.map(getSpeciesById).filter(Boolean);
  const target = getTargetParams(tank);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tank.customParams);

  // Close the editor if the active tank changes underneath it (e.g. via the tank switcher),
  // so a stale draft can't get saved onto the wrong tank.
  useEffect(() => {
    setEditing(false);
  }, [tank.id]);

  function updateDraft(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function openEditor() {
    setDraft(tank.customParams);
    setEditing(true);
  }

  function handleSave() {
    setTank((prev) => ({ ...prev, useCustomParams: true, customParams: draft }));
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleClear() {
    setTank((prev) => ({ ...prev, useCustomParams: false, customParams: structuredClone(defaultCustomParams) }));
    setEditing(false);
  }

  function fmtRange(r, unit = '') {
    if (!r) return 'not set';
    return `${r[0]}–${r[1]}${unit}`;
  }

  return (
    <div className="panel">
      <h2>{tank.name}</h2>

      <section>
        <h3>Stocked species ({stocked.length})</h3>
        {stocked.length === 0 ? (
          <p className="empty-state">
            Nothing added yet. Go to the Catalog tab and click "Add to My Tank" on any species.
          </p>
        ) : (
          <div className="species-grid">
            {stocked.map((sp) => (
              <SpeciesCard key={sp.id} sp={sp} inTank onAdd={() => {}} onRemove={onRemove} />
            ))}
          </div>
        )}
      </section>

      <section className="tank-params-section">
        <h3>Tank parameters</h3>

        {!editing && (
          <div className="tank-params-toggle-row">
            <button type="button" className="secondary-button" onClick={openEditor}>
              {tank.useCustomParams ? 'Edit tank parameters' : "Set my tank's parameters"}
            </button>
            {tank.useCustomParams && (
              <button type="button" className="link-button" onClick={handleClear}>
                Clear parameters
              </button>
            )}
          </div>
        )}

        {editing && (
          <div className="tank-params-editor">
            <div className="tank-params-form">
              <label>
                <span>Water type</span>
                <select
                  value={draft.waterType ?? ''}
                  onChange={(e) => updateDraft('waterType', e.target.value || null)}
                >
                  <option value="">Not set</option>
                  <option value="freshwater">Freshwater</option>
                  <option value="saltwater">Saltwater</option>
                </select>
              </label>
              <label>
                <span>Temp min (°F)</span>
                <input
                  type="number"
                  value={draft.tempMin ?? ''}
                  onChange={(e) => updateDraft('tempMin', numOrNull(e.target.value))}
                />
              </label>
              <label>
                <span>Temp max (°F)</span>
                <input
                  type="number"
                  value={draft.tempMax ?? ''}
                  onChange={(e) => updateDraft('tempMax', numOrNull(e.target.value))}
                />
              </label>
              <label>
                <span>pH min</span>
                <input
                  type="number"
                  step="0.1"
                  value={draft.phMin ?? ''}
                  onChange={(e) => updateDraft('phMin', numOrNull(e.target.value))}
                />
              </label>
              <label>
                <span>pH max</span>
                <input
                  type="number"
                  step="0.1"
                  value={draft.phMax ?? ''}
                  onChange={(e) => updateDraft('phMax', numOrNull(e.target.value))}
                />
              </label>
              <label>
                <span>GH min (dGH)</span>
                <input
                  type="number"
                  value={draft.ghMin ?? ''}
                  onChange={(e) => updateDraft('ghMin', numOrNull(e.target.value))}
                />
              </label>
              <label>
                <span>GH max (dGH)</span>
                <input
                  type="number"
                  value={draft.ghMax ?? ''}
                  onChange={(e) => updateDraft('ghMax', numOrNull(e.target.value))}
                />
              </label>
              <label>
                <span>KH min (dKH)</span>
                <input
                  type="number"
                  value={draft.khMin ?? ''}
                  onChange={(e) => updateDraft('khMin', numOrNull(e.target.value))}
                />
              </label>
              <label>
                <span>KH max (dKH)</span>
                <input
                  type="number"
                  value={draft.khMax ?? ''}
                  onChange={(e) => updateDraft('khMax', numOrNull(e.target.value))}
                />
              </label>
              <label>
                <span>Tank size (gal)</span>
                <input
                  type="number"
                  value={draft.sizeGallons ?? ''}
                  onChange={(e) => updateDraft('sizeGallons', numOrNull(e.target.value))}
                />
              </label>
              <label>
                <span>Lighting</span>
                <select
                  value={draft.lighting ?? ''}
                  onChange={(e) => updateDraft('lighting', e.target.value || null)}
                >
                  <option value="">Not set</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <div className="tank-params-actions">
              <button type="button" className="primary-button" onClick={handleSave}>
                Save
              </button>
              <button type="button" className="secondary-button" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="target-summary">
          <h4>Current target parameters</h4>
          <dl className="species-params">
            <div>
              <dt>Temp</dt>
              <dd>{fmtRange(target.temp, '°F')}</dd>
            </div>
            <div>
              <dt>pH</dt>
              <dd>{fmtRange(target.ph)}</dd>
            </div>
            <div>
              <dt>GH</dt>
              <dd>{fmtRange(target.gh, ' dGH')}</dd>
            </div>
            <div>
              <dt>KH</dt>
              <dd>{fmtRange(target.kh, ' dKH')}</dd>
            </div>
            <div>
              <dt>Water type</dt>
              <dd>{target.waterType || 'unconstrained'}</dd>
            </div>
            <div>
              <dt>Tank size</dt>
              <dd>
                {target.sizeGallons != null
                  ? `${target.sizeGallons} gal`
                  : target.suggestedMinSize
                  ? `not set (stocked species suggest ≥${target.suggestedMinSize} gal)`
                  : 'not set'}
              </dd>
            </div>
          </dl>
          <p className="hint">
            These are the parameters used on the Recommendations tab. A field left blank is treated as
            unconstrained — set it above if you want compatibility checks to enforce it.
          </p>
        </div>
      </section>
    </div>
  );
}
