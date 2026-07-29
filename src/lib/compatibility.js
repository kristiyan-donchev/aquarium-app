import { species, getSpeciesById } from '../data/species.js';

// Intersect a list of [min, max] ranges. Returns null if any pair fails to overlap.
function intersectRanges(ranges) {
  const valid = ranges.filter((r) => r && r[0] != null && r[1] != null);
  if (valid.length === 0) return null;
  const lo = Math.max(...valid.map((r) => r[0]));
  const hi = Math.min(...valid.map((r) => r[1]));
  if (lo > hi) return 'conflict'; // stocked species themselves don't overlap
  return [lo, hi];
}

function rangesOverlap(a, b) {
  if (!a || !b) return true; // unconstrained
  return a[0] <= b[1] && b[0] <= a[1];
}

/**
 * Determine the tank's target water parameters, either from explicit user-set values
 * or inferred as the overlap of everything currently stocked. Per-field: custom wins,
 * otherwise infer, otherwise unconstrained (null).
 */
export function getTargetParams(tank) {
  const stocked = tank.stockedIds.map(getSpeciesById).filter(Boolean);
  const custom = tank.customParams || {};

  const fieldPairs = {
    temp: ['tempMin', 'tempMax'],
    ph: ['phMin', 'phMax'],
    gh: ['ghMin', 'ghMax'],
    kh: ['khMin', 'khMax'],
  };

  const result = {};
  const fieldSource = {};

  for (const [key, [minKey, maxKey]] of Object.entries(fieldPairs)) {
    if (custom[minKey] != null && custom[maxKey] != null) {
      result[key] = [custom[minKey], custom[maxKey]];
      fieldSource[key] = 'custom';
    } else if (stocked.length > 0) {
      const inferred = intersectRanges(stocked.map((s) => [s[minKey], s[maxKey]]));
      result[key] = inferred === 'conflict' ? 'conflict' : inferred;
      fieldSource[key] = 'inferred';
    } else {
      result[key] = null;
      fieldSource[key] = 'none';
    }
  }

  // Water type: explicit setting wins; otherwise inferred from stocked species (must be consistent).
  if (custom.waterType) {
    result.waterType = custom.waterType;
    fieldSource.waterType = 'custom';
  } else {
    const waterTypes = new Set(stocked.map((s) => s.waterType));
    result.waterType = waterTypes.size === 1 ? [...waterTypes][0] : waterTypes.size > 1 ? 'conflict' : null;
    fieldSource.waterType = stocked.length > 0 ? 'inferred' : 'none';
  }

  result.sizeGallons = custom.sizeGallons != null ? custom.sizeGallons : null;
  result.lighting = custom.lighting != null ? custom.lighting : null;
  result.suggestedMinSize = stocked.length > 0 ? Math.max(...stocked.map((s) => s.tankSizeMinGallons)) : null;

  result._source = fieldSource;
  result._stockedCount = stocked.length;
  return result;
}

const LIGHT_LEVEL = { low: 1, medium: 2, high: 3 };

/**
 * Evaluate one candidate species against the current tank + target params.
 * Returns { status: 'compatible' | 'caution' | 'incompatible', reasons: [{severity, message}] }
 */
export function evaluateCandidate(candidate, tank, target) {
  const reasons = [];
  const stocked = tank.stockedIds.map(getSpeciesById).filter(Boolean);

  // Water type
  if (target.waterType && target.waterType !== 'conflict' && candidate.waterType !== target.waterType) {
    reasons.push({
      severity: 'block',
      message: `Water type mismatch: tank is ${target.waterType}, ${candidate.name} needs ${candidate.waterType}.`,
    });
  }

  // Temp / pH / GH / KH overlap
  const paramChecks = [
    { key: 'temp', label: 'Temperature', unit: '°F', min: candidate.tempMin, max: candidate.tempMax },
    { key: 'ph', label: 'pH', unit: '', min: candidate.phMin, max: candidate.phMax },
    { key: 'gh', label: 'GH (hardness)', unit: 'dGH', min: candidate.ghMin, max: candidate.ghMax },
    { key: 'kh', label: 'KH (carbonate hardness)', unit: 'dKH', min: candidate.khMin, max: candidate.khMax },
  ];
  for (const check of paramChecks) {
    const tRange = target[check.key];
    if (!tRange || tRange === 'conflict') continue;
    const overlap = rangesOverlap(tRange, [check.min, check.max]);
    if (!overlap) {
      reasons.push({
        severity: 'block',
        message: `${check.label} doesn't overlap: tank needs ${tRange[0]}–${tRange[1]}${check.unit}, ${candidate.name} needs ${check.min}–${check.max}${check.unit}.`,
      });
    }
  }

  // Tank size
  if (target.sizeGallons != null && candidate.tankSizeMinGallons > target.sizeGallons) {
    reasons.push({
      severity: 'block',
      message: `Needs at least ${candidate.tankSizeMinGallons} gal, tank is set to ${target.sizeGallons} gal.`,
    });
  }

  // Lighting (plants only, and only if the tank's lighting is set)
  if (candidate.category === 'plant' && target.lighting && candidate.lightingNeed) {
    if (LIGHT_LEVEL[candidate.lightingNeed] > LIGHT_LEVEL[target.lighting]) {
      reasons.push({
        severity: 'caution',
        message: `Wants ${candidate.lightingNeed} light, tank is set to ${target.lighting} — likely to grow slowly or fail to thrive.`,
      });
    }
  }

  // Conspecific restriction (e.g. bettas)
  if (candidate.noConspecifics && stocked.some((s) => s.id === candidate.id)) {
    reasons.push({
      severity: 'block',
      message: `${candidate.name} should be kept singly — your tank already has one, and a second will likely fight.`,
    });
  }

  // Predation: candidate eats existing shrimp
  if (candidate.eatsShrimp && stocked.some((s) => s.category === 'shrimp')) {
    const victims = stocked.filter((s) => s.category === 'shrimp').map((s) => s.name).join(', ');
    reasons.push({
      severity: 'block',
      message: `${candidate.name} is known to eat shrimp — your tank has ${victims}.`,
    });
  }
  // Predation: existing tankmate eats this candidate (if candidate is shrimp)
  if (candidate.category === 'shrimp' && stocked.some((s) => s.eatsShrimp)) {
    const predators = stocked.filter((s) => s.eatsShrimp).map((s) => s.name).join(', ');
    reasons.push({
      severity: 'block',
      message: `${predators} in your tank are known to eat shrimp like ${candidate.name}.`,
    });
  }

  // Predation: candidate eats small fish
  const isSmallFish = (s) => s.category === 'fish' && (s.schoolingMin || s.tankSizeMinGallons <= 10);
  if (candidate.eatsSmallFish && stocked.some(isSmallFish)) {
    const victims = stocked.filter(isSmallFish).map((s) => s.name).join(', ');
    reasons.push({
      severity: 'caution',
      message: `${candidate.name} may eat small fish once grown — your tank has ${victims}.`,
    });
  }
  if (isSmallFish(candidate) && stocked.some((s) => s.eatsSmallFish)) {
    const predators = stocked.filter((s) => s.eatsSmallFish).map((s) => s.name).join(', ');
    reasons.push({
      severity: 'caution',
      message: `${predators} in your tank may eat small fish like ${candidate.name} once grown.`,
    });
  }

  // Fin-nipping
  if (candidate.finNipper && stocked.some((s) => s.longFin)) {
    const victims = stocked.filter((s) => s.longFin).map((s) => s.name).join(', ');
    reasons.push({
      severity: 'caution',
      message: `${candidate.name} is a known fin-nipper — your tank has long-finned ${victims}.`,
    });
  }
  if (candidate.longFin && stocked.some((s) => s.finNipper)) {
    const nippers = stocked.filter((s) => s.finNipper).map((s) => s.name).join(', ');
    reasons.push({
      severity: 'caution',
      message: `${nippers} in your tank are known fin-nippers, and ${candidate.name} has long, vulnerable fins.`,
    });
  }

  // General temperament mismatch (aggressive/semi-aggressive candidate vs. established peaceful nano tank)
  if (
    (candidate.temperament === 'aggressive' || candidate.temperament === 'semi-aggressive') &&
    stocked.some((s) => s.temperament === 'peaceful' && s.category === 'fish')
  ) {
    reasons.push({
      severity: 'caution',
      message: `${candidate.name} is ${candidate.temperament} and may bully more peaceful tankmates.`,
    });
  }

  // Schooling requirement — informational only, never blocks
  if (candidate.schoolingMin) {
    reasons.push({
      severity: 'info',
      message: `Best kept in a group of ${candidate.schoolingMin}+ — plan to add that many together.`,
    });
  }

  const hasBlock = reasons.some((r) => r.severity === 'block');
  const hasCaution = reasons.some((r) => r.severity === 'caution');
  const status = hasBlock ? 'incompatible' : hasCaution ? 'caution' : 'compatible';

  return { status, reasons };
}

export function getRecommendations(tank) {
  const target = getTargetParams(tank);
  const stockedSet = new Set(tank.stockedIds);
  return species
    .filter((s) => !stockedSet.has(s.id))
    .map((s) => ({ species: s, ...evaluateCandidate(s, tank, target) }))
    .sort((a, b) => {
      const order = { compatible: 0, caution: 1, incompatible: 2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return a.species.name.localeCompare(b.species.name);
    });
}
