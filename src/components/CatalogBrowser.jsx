import React, { useMemo, useState } from 'react';
import { species, categoryLabels } from '../data/species.js';
import SpeciesCard from './SpeciesCard.jsx';

const CATEGORIES = ['fish', 'shrimp', 'snail', 'plant'];
const WATER_TYPES = ['freshwater', 'brackish', 'saltwater'];
const TEMPERAMENTS = ['peaceful', 'semi-aggressive', 'aggressive'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export default function CatalogBrowser({ tank, onAdd, onRemove }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [waterType, setWaterType] = useState('all');
  const [temperament, setTemperament] = useState('all');
  const [difficulty, setDifficulty] = useState('all');

  const stockedSet = useMemo(() => new Set(tank.stockedIds), [tank.stockedIds]);

  const filtered = species.filter((s) => {
    if (category !== 'all' && s.category !== category) return false;
    if (waterType !== 'all' && s.waterType !== waterType) return false;
    if (temperament !== 'all' && s.temperament !== temperament) return false;
    if (difficulty !== 'all' && s.difficulty !== difficulty) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.scientificName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="panel">
      <h2>Catalog</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="filters-bar">
        <label>
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Water type</span>
          <select value={waterType} onChange={(e) => setWaterType(e.target.value)}>
            <option value="all">All</option>
            {WATER_TYPES.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Temperament</span>
          <select value={temperament} onChange={(e) => setTemperament(e.target.value)}>
            <option value="all">All</option>
            {TEMPERAMENTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Difficulty</span>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="all">All</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="result-count">
        {filtered.length} of {species.length} species
      </p>

      <div className="species-grid">
        {filtered.map((sp) => (
          <SpeciesCard key={sp.id} sp={sp} inTank={stockedSet.has(sp.id)} onAdd={onAdd} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
