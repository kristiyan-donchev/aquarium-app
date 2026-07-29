import React from 'react';
import { getSpeciesById } from '../data/species.js';
import { getTargetParams } from '../lib/compatibility.js';
import SpeciesCard from './SpeciesCard.jsx';

function numOrNull(v) {
  if (v === '' || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export default function MyTank({ tank, setTank, onRemove }) {
  const stocked = tank.stockedIds.map(getSpeciesById).filter(Boolean);
  const target = getTargetParams(tank);

  function updateCustom(field, value) {
    setTank((prev) => ({
      ...prev,
      customParams: { ...prev.customParams, [field]: value },
    }));
  }

  function toggleUseCustom(checked) {
    setTank((prev) => ({ ...prev, useCustomParams: checked }));
  }

  function fmtRange(r, unit = '') {
    if (!r) return 'unconstrained (no species stocked yet)';
    if (r === 'conflict') return 'conflict — stocked species don\'t actually overlap!';
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
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={tank.useCustomParams}
            onChange={(e) => toggleUseCustom(e.target.checked)}
          />
          Set my tank's parameters explicitly (otherwise inferred from what's stocked)
        </label>

        {tank.useCustomParams && (
          <div className="tank-params-form">
            <label>
              <span>Temp min (°F)</span>
              <input
                type="number"
                value={tank.customParams.tempMin ?? ''}
                onChange={(e) => updateCustom('tempMin', numOrNull(e.target.value))}
              />
            </label>
            <label>
              <span>Temp max (°F)</span>
              <input
                type="number"
                value={tank.customParams.tempMax ?? ''}
                onChange={(e) => updateCustom('tempMax', numOrNull(e.target.value))}
              />
            </label>
            <label>
              <span>pH min</span>
              <input
                type="number"
                step="0.1"
                value={tank.customParams.phMin ?? ''}
                onChange={(e) => updateCustom('phMin', numOrNull(e.target.value))}
              />
            </label>
            <label>
              <span>pH max</span>
              <input
                type="number"
                step="0.1"
                value={tank.customParams.phMax ?? ''}
                onChange={(e) => updateCustom('phMax', numOrNull(e.target.value))}
              />
            </label>
            <label>
              <span>GH min (dGH)</span>
              <input
                type="number"
                value={tank.customParams.ghMin ?? ''}
                onChange={(e) => updateCustom('ghMin', numOrNull(e.target.value))}
              />
            </label>
            <label>
              <span>GH max (dGH)</span>
              <input
                type="number"
                value={tank.customParams.ghMax ?? ''}
                onChange={(e) => updateCustom('ghMax', numOrNull(e.target.value))}
              />
            </label>
            <label>
              <span>KH min (dKH)</span>
              <input
                type="number"
                value={tank.customParams.khMin ?? ''}
                onChange={(e) => updateCustom('khMin', numOrNull(e.target.value))}
              />
            </label>
            <label>
              <span>KH max (dKH)</span>
              <input
                type="number"
                value={tank.customParams.khMax ?? ''}
                onChange={(e) => updateCustom('khMax', numOrNull(e.target.value))}
              />
            </label>
            <label>
              <span>Tank size (gal)</span>
              <input
                type="number"
                value={tank.customParams.sizeGallons ?? ''}
                onChange={(e) => updateCustom('sizeGallons', numOrNull(e.target.value))}
              />
            </label>
            <label>
              <span>Lighting</span>
              <select
                value={tank.customParams.lighting ?? ''}
                onChange={(e) => updateCustom('lighting', e.target.value || null)}
              >
                <option value="">Not set</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
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
            These are the parameters used on the Recommendations tab: explicit values you set above,
            or — for any field you leave blank — the overlap of ranges across everything currently
            stocked.
          </p>
        </div>
      </section>
    </div>
  );
}
