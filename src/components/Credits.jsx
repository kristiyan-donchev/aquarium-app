import React from 'react';
import { species } from '../data/species.js';
import { imageCredits } from '../data/imageCredits.js';

export default function Credits() {
  const rows = species
    .map((sp) => ({ sp, credit: imageCredits[sp.id] }))
    .filter((r) => r.credit);

  return (
    <div className="panel">
      <h2>Image credits</h2>
      <p className="hint">
        Every species photo in this catalog comes from{' '}
        <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">
          Wikimedia Commons
        </a>
        , used under the Creative Commons or public-domain license shown for each photo below.
        None of these images were created for this app — full credit belongs to the original
        photographers/contributors linked here.
      </p>
      <table className="credits-table">
        <thead>
          <tr>
            <th>Species</th>
            <th>Author</th>
            <th>License</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ sp, credit }) => (
            <tr key={sp.id}>
              <td>{sp.name}</td>
              <td>{credit.author}</td>
              <td>
                {credit.licenseUrl ? (
                  <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer">
                    {credit.license}
                  </a>
                ) : (
                  credit.license
                )}
              </td>
              <td>
                <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">
                  File page
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
