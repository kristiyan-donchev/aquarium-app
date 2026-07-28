import React from 'react';
import { getRecommendations, getTargetParams } from '../lib/compatibility.js';
import SpeciesCard from './SpeciesCard.jsx';

const SECTIONS = [
  { status: 'compatible', title: 'Compatible additions', empty: 'No fully compatible species found.' },
  { status: 'caution', title: 'Compatible with caution', empty: 'Nothing in this category.' },
  { status: 'incompatible', title: 'Not compatible', empty: 'Nothing in this category.' },
];

export default function Recommendations({ tank, onAdd }) {
  const target = getTargetParams(tank);
  const results = getRecommendations(tank);

  if (tank.stockedIds.length === 0) {
    return (
      <div className="panel">
        <h2>Recommendations</h2>
        <p className="empty-state">
          Add species to My Tank first — recommendations are computed against your tank's current
          contents (or explicit parameters, if you set them on the My Tank tab).
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Recommendations</h2>
      <p className="hint">
        Based on {tank.stockedIds.length} species currently in your tank
        {target._source && Object.values(target._source).includes('custom') ? ' and your custom tank parameters' : ''}.
        See the My Tank tab for the exact target ranges being used.
      </p>

      {SECTIONS.map((section) => {
        const items = results.filter((r) => r.status === section.status);
        return (
          <section key={section.status} className="rec-section">
            <h3>
              {section.title} ({items.length})
            </h3>
            {items.length === 0 ? (
              <p className="empty-state">{section.empty}</p>
            ) : (
              <div className="species-grid">
                {items.map(({ species: sp, status, reasons }) => (
                  <SpeciesCard
                    key={sp.id}
                    sp={sp}
                    status={status}
                    reasons={reasons}
                    onAdd={onAdd}
                    onRemove={() => {}}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
