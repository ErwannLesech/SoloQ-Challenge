const express = require('express');
const axios = require('axios');
const pool = require('./db');
require('dotenv').config();
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const initSQL = fs.readFileSync(path.join(__dirname, 'init/init.sql')).toString();

pool.query(initSQL)
    .then(() => console.log('Database initialized'))
    .catch(err => console.error('Error initializing database:', err));

const app = express();
app.use(cors());
app.use(express.json());

const RIOT_API = 'https://euw1.api.riotgames.com';

app.post('/api/player', async (req, res) => {
  const { playerName, summonerName, userTag, team } = req.body;

  try {
    // 1. Info joueur

    console.log(`${RIOT_API}/riot/account/v1/accounts/by-riot-id/${summonerName}/${userTag}?api_key=${process.env.RIOT_API_KEY}`);

    const summonerRes = await axios.get(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${userTag}?api_key=${process.env.RIOT_API_KEY}`, {
      headers: { "X-Riot-Token": process.env.RIOT_API_KEY }
    });

    const summoner = summonerRes.data;

    console.log('Summoner data:', summoner);

    // 2. Info ranked
    const rankedRes = await axios.get(`${RIOT_API}/lol/league/v4/entries/by-puuid/${summoner.puuid}?api_key=${process.env.RIOT_API_KEY}`, {
      headers: { "X-Riot-Token": process.env.RIOT_API_KEY }
    });

    const soloQ = rankedRes.data.find(e => e.queueType === "RANKED_SOLO_5x5");

    await pool.query(`
      INSERT INTO players (player_name, summoner_name, puuid, tag, team, tier, rank, lp, total_games, wins, losses, win_rate, opgg, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'https://euw.op.gg/summoners/euw/${encodeURIComponent(summoner.gameName)}-${encodeURIComponent(summoner.tagLine)}', $13)
      ON CONFLICT (puuid) DO UPDATE SET 
      player_name = EXCLUDED.player_name,
      summoner_name = EXCLUDED.summoner_name,
      tag = EXCLUDED.tag,
      team = EXCLUDED.team,
      tier = EXCLUDED.tier,
      rank = EXCLUDED.rank,
      lp = EXCLUDED.lp,
      total_games = EXCLUDED.total_games,
      wins = EXCLUDED.wins,
      losses = EXCLUDED.losses,
      win_rate = EXCLUDED.win_rate,
      opgg = EXCLUDED.opgg;
    `, [
      playerName,
      summoner.gameName,
      summoner.puuid,
      summoner.tagLine,
      team,
      soloQ?.tier || 'UNRANKED',
      soloQ?.rank || '',
      soloQ?.leaguePoints || 0,
      soloQ?.wins + soloQ?.losses || 0,
      soloQ?.wins || 0,
      soloQ?.losses || 0,
      soloQ ? ((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100).toFixed(1) : 0,
      new Date().toISOString()
    ]);

    res.json({ success: true });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur lors de l’ajout du joueur.' });
  }
});

app.get('/api/players', async (req, res) => {
  const tierOrder = {
    "IRON": 1,
    "BRONZE": 2,
    "SILVER": 3,
    "GOLD": 4,
    "PLATINUM": 5,
    "EMERALD": 6,
    "DIAMOND": 7,
    "MASTER": 8,
    "GRANDMASTER": 9,
    "CHALLENGER": 10,
    "UNRANKED": 0
  };

  const rankOrder = {
    "IV": 1,
    "III": 2,
    "II": 3,
    "I": 4,
    "": 0 // For unranked
  };

  try {
    const result = await pool.query('SELECT * FROM players');
    const players = result.rows.map(p => ({
      ...p,
      winrate: ((p.wins / (p.wins + p.losses)) * 100).toFixed(1),
      tierValue: tierOrder[p.tier.toUpperCase()] || 0,
      rankValue: rankOrder[p.rank.toUpperCase()] || 0,
    }));

    players.sort((a, b) => {
      // Trier du plus haut au plus bas
      if (b.tierValue !== a.tierValue) {
        return b.tierValue - a.tierValue;
      }
      if (b.rankValue !== a.rankValue) {
        return b.rankValue - a.rankValue;
      }
      return b.lp - a.lp;
    });

    res.json(players);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des joueurs.' });
  }
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/api/update_players', async (req, res) => {

  try {
    const result = await pool.query('SELECT * FROM players');
    const players = result.rows;

    const updatedPlayers = [];

    for (let i = 0; i < players.length; i++) {
      const p = players[i];

      try {
        // On attend 100ms avant chaque requête pour limiter à ~10 req/sec
        if (i > 0) await delay(100);

        // Récup infos ranked
        const rankedRes = await axios.get(
          `${RIOT_API}/lol/league/v4/entries/by-puuid/${p.puuid}`,
          { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
        );
        const soloQ = rankedRes.data.find(e => e.queueType === "RANKED_SOLO_5x5");

        // Récup dernières 10 parties
        const matchesRes = await axios.get(
          `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${p.puuid}/ids?type=ranked&count=5`,
          { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
        );
        const matchIds = matchesRes.data;

        // Pour limiter encore les appels, tu peux ne récupérer que les IDs, ou récupérer les détails en batch avec delay également
        // Ici on récupère chaque détail sans delay mais tu peux ajouter un delay dans le map si besoin.

        const matchResults = [];
        for (let j = 0; j < matchIds.length; j++) {
          // Pour éviter d’enchaîner trop vite les appels match detail, on peut mettre un petit delay aussi
          if (j > 0) await delay(100);

          const matchDetailRes = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/${matchIds[j]}`,
            { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
          );
          const match = matchDetailRes.data;
          const participantIndex = match.metadata.participants.findIndex(puuid => puuid === p.puuid);
          const participant = match.info.participants[participantIndex];
          matchResults.push(participant.win);

          const playerRole = participant.teamPosition || participant.lane;
          const playerTeamId = participant.teamId;

          // Cherche un participant dans l'autre équipe qui a le même rôle
          const opponent = match.info.participants.find(other =>
            other.teamId !== playerTeamId &&
            (other.teamPosition === playerRole || other.lane === playerRole)
          );

          // Nom du champion adverse (si trouvé)
          const opponentChampion = opponent ? opponent.championName : null;

          await pool.query(`
            INSERT INTO recent_matches (
              match_id, game_datetime, team, puuid, summoner_name, win, 
              champion_name, opponent_champion, kills, deaths, assists
            ) VALUES ($1, to_timestamp($2 / 1000.0), $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (match_id) DO NOTHING;
          `, [
            match.metadata.matchId,
            match.info.gameStartTimestamp,
            p.team,
            p.puuid,
            p.player_name,
            participant.win,
            participant.championName,
            opponentChampion,
            participant.kills,
            participant.deaths,
            participant.assists
          ]);
        }

        // Mettre à jour la DB avec les nouvelles infos
        await pool.query(`
          UPDATE players SET 
            tier = $1,
            rank = $2,
            lp = $3,
            wins = $4,
            losses = $5,
            total_games = $6,
            win_rate = $7,
            last_games = $8,
            updated_at = NOW()
          WHERE puuid = $9
        `, [
          soloQ?.tier || 'UNRANKED',
          soloQ?.rank || '',
          soloQ?.leaguePoints || 0,
          soloQ?.wins || 0,
          soloQ?.losses || 0,
          (soloQ?.wins || 0) + (soloQ?.losses || 0),
          soloQ ? ((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100).toFixed(1) : 0,
          matchResults.join(','),
          p.puuid
        ]);

        updatedPlayers.push({
          ...p,
          tier: soloQ?.tier || 'UNRANKED',
          rank: soloQ?.rank || '',
          lp: soloQ?.leaguePoints || 0,
          wins: soloQ?.wins || 0,
          losses: soloQ?.losses || 0,
          total_games: (soloQ?.wins || 0) + (soloQ?.losses || 0),
          win_rate: soloQ ? ((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100).toFixed(1) : 0,
          recentMatches: matchResults
        });

      } catch (err) {
        console.error(`Erreur mise à jour joueur ${p.summoner_name}:`, err.message);
        updatedPlayers.push({
          ...p,
          recentMatches: []
        });
      }
    }

    res.json(updatedPlayers);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération et mise à jour des joueurs.' });
  }
});

app.get('/api/recent_matches', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM recent_matches 
      ORDER BY game_datetime DESC 
      LIMIT 3
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des matchs récents.' });
  }
});


const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
