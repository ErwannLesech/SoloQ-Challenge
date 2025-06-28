import React, { useEffect, useState } from 'react';

function App() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/players')
      .then(res => res.json())
      .then(setPlayers);
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Classement SoloQ</h1>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Équipe</th>
            <th>Tier</th>
            <th>LP</th>
            <th>W/L</th>
            <th>Winrate</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => (
            <tr key={p.puuid}>
              <td>{p.summoner_name}</td>
              <td>{p.team}</td>
              <td>{p.tier} {p.rank}</td>
              <td>{p.lp}</td>
              <td>{p.wins}/{p.losses}</td>
              <td>{p.winrate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
