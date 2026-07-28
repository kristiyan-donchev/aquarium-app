import React, { useState } from 'react';
import { categoryLabels } from '../data/species.js';

const STATUS_LABEL = {
  compatible: 'Compatible',
  caution: 'Caution',
  incompatible: 'Not compatible',
};

export default function SpeciesCard({ sp, inTank, onAdd, onRemove, status, reasons }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`species-card${status ? ` status-${status}` : ''}`}>
      <div className="species-card-top">
        <div>
          <div className="species-name">{sp.name}</div>
          <div className="species-sci-name">{sp.scientificName}</div>
        </div>
        <span className={`badge badge-${sp.category}`}>{categoryLabels[sp.category]}</span>
      </div>

      {status && <div className={`status-pill status-pill-${status}`}>{STATUS_LABEL[status]}</div>}

      <dl className="species-params">
        <div>
          <dt>Temp</dt>
          <dd>{sp.tempMin}–{sp.tempMax}°F</dd>
        </div>
        <div>
          <dt>pH</dt>
          <dd>{sp.phMin}–{sp.phMax}</dd>
        </div>
        <div>
          <dt>GH</dt>
          <dd>{sp.ghMin}–{sp.ghMax} dGH</dd>
        </div>
        <div>
          <dt>Min tank</dt>
          <dd>{sp.tankSizeMinGallons} gal</dd>
        </div>
      </dl>

      <div className="species-tags">
        <span className="tag">{sp.waterType}</span>
        {sp.temperament && <span className="tag">{sp.temperament}</span>}
        {sp.difficulty && <span className="tag">{sp.difficulty}</span>}
        {sp.schoolingMin && <span className="tag">schools {sp.schoolingMin}+</span>}
        {sp.category === 'plant' && sp.lightingNeed && <span className="tag">{sp.lightingNeed} light</span>}
        {sp.finNipper && <span className="tag tag-warn">fin-nipper</span>}
        {sp.longFin && <span className="tag tag-warn">long fins</span>}
        {sp.eatsShrimp && <span className="tag tag-warn">eats shrimp</span>}
        {sp.eatsSmallFish && <span className="tag tag-warn">eats small fish</span>}
      </div>

      {reasons && reasons.length > 0 && (
        <ul className="reason-list">
          {reasons.map((r, i) => (
            <li key={i} className={`reason reason-${r.severity}`}>
              {r.message}
            </li>
          ))}
        </ul>
      )}

      <button className="link-button" onClick={() => setExpanded((e) => !e)}>
        {expanded ? 'Hide details' : 'Show details'}
      </button>
      {expanded && (
        <div className="species-details">
          <p>{sp.notes}</p>
          <dl className="species-params">
            <div>
              <dt>KH</dt>
              <dd>{sp.khMin}–{sp.khMax} dKH</dd>
            </div>
            {sp.diet && (
              <div>
                <dt>Diet</dt>
                <dd>{sp.diet}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="species-card-actions">
        {inTank ? (
          <button className="secondary-button" onClick={() => onRemove(sp.id)}>
            Remove from My Tank
          </button>
        ) : (
          <button className="primary-button" onClick={() => onAdd(sp.id)}>
            Add to My Tank
          </button>
        )}
      </div>
    </div>
  );
}
