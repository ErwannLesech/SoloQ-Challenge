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


// Endpoint pour ajouter un joueur
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


// Endpoint pour récupérer tous les joueurs
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

// Endpoint pour mettre à jour les joueurs
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
        
        const summonerStatusRes = await axios.get(
          `${RIOT_API}/lol/spectator/v5/active-games/by-summoner/${p.puuid}?api_key=${process.env.RIOT_API_KEY}`,
          { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
        ).catch(err => {
          if (err.response && err.response.status === 404) {
            return { data: null }; // Le joueur n'est pas en partie
          }
          throw err;
        });

        console.log(summonerStatusRes.data);

        const isInGame = summonerStatusRes.data !== null; // && summonerStatusRes.data.gameType === 'RANKED_SOLO_5x5';

        const last_online = isInGame ? new Date().toISOString() : p.last_online;

        console.log(`Mise à jour joueur ${p.summoner_name} - en jeu: ${isInGame}, dernier en ligne: ${last_online}`);

        await pool.query(`
          UPDATE players SET 
            in_game = $1,
            last_online = $3
          WHERE puuid = $2
        `, [isInGame, p.puuid, last_online]);

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

// Endpoint pour récupérer les matchs récents
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

// Endpoint pour récupérer les 20 derniers matchs récents
app.get('/api/recent_matches_extended', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM recent_matches 
      ORDER BY game_datetime DESC 
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des matchs récents.' });
  }
});

// Endpoint pour récupérer les joueurs en game avec détails
app.get('/api/live_games', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ag.game_id,
                ag.game_start_time,
                ag.game_duration,
                json_agg(
                    json_build_object(
                        'summoner_name', p.summoner_name,
                        'team', p.team,
                        'champion_name', gp.champion_name,
                        'kills', gp.kills,
                        'deaths', gp.deaths,
                        'assists', gp.assists,
                        'gold', gp.gold_earned,
                        'items', gp.items
                    )
                ) as participants,
                json_build_object(
                    'team1', (SELECT json_build_object(
                        'objectives', json_build_object(
                            'towers', gt1.towers_destroyed,
                            'inhibitors', gt1.inhibitors_destroyed,
                            'dragons', gt1.dragons_killed,
                            'barons', gt1.barons_killed
                        ),
                        'gold', gt1.total_gold
                    ) FROM game_teams gt1 WHERE gt1.game_id = ag.game_id AND gt1.team_id = 100),
                    'team2', (SELECT json_build_object(
                        'objectives', json_build_object(
                            'towers', gt2.towers_destroyed,
                            'inhibitors', gt2.inhibitors_destroyed,
                            'dragons', gt2.dragons_killed,
                            'barons', gt2.barons_killed
                        ),
                        'gold', gt2.total_gold
                    ) FROM game_teams gt2 WHERE gt2.game_id = ag.game_id AND gt2.team_id = 200)
                ) as teams
            FROM active_games ag
            JOIN game_participants gp ON ag.game_id = gp.game_id
            JOIN players p ON gp.puuid = p.puuid
            WHERE ag.game_start_time > NOW() - INTERVAL '1 hour'
            GROUP BY ag.game_id
            ORDER BY ag.game_start_time DESC
        `);

        console.log('Live games:', result.rows);

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur lors de la récupération des parties en cours.' });
    }
});
// Endpoint pour récupérer les joueurs en game
// L'objectif est de récupérer juste le nom du joueur en game
app.get('/api/players_in_game', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        puuid, 
        summoner_name, 
        team, 
        in_game, 
        last_online,
        (last_online > NOW() - INTERVAL '10 minutes') as is_online
      FROM players
      ORDER BY in_game DESC, last_online DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des joueurs en game.' });
  }
});

// Endpoint pour mettre à jour les parties en cours (à appeler périodiquement)
app.post('/api/insert_live_games', async (req, res) => {
try {
    // Récupère uniquement les joueurs marqués comme "en game"
    const playersInGame = await pool.query(`
        SELECT p.* FROM players p 
        WHERE p.in_game = true
    `);

    const updatedGames = [];

    for (const player of playersInGame.rows) {
        try {
            // Délai pour respecter les limites de l'API
            await delay(100); // ~6 req/sec

            // Récupère les infos de la partie en cours
            const liveGameRes = await axios.get(
                `${RIOT_API}/lol/spectator/v5/active-games/by-summoner/${player.puuid}?api_key=${process.env.RIOT_API_KEY}`,
                { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
            );

            const liveGame = liveGameRes.data;

            console.log("game en cours", liveGame);
            const gameId = liveGame.gameId;

            // Vérifie si le jeu est déjà en base
            const existingGame = await pool.query(
                'SELECT 1 FROM active_games WHERE game_id = $1',
                [gameId]
            );


            console.log(existingGame.rows);

            if (existingGame.rows.length === 0) {
                // Insère le jeu

                await pool.query(`
                    INSERT INTO active_games (
                        game_id, game_start_time, game_mode, 
                        game_duration, map_id, platform_id
                    ) VALUES ($1, to_timestamp(CAST($2 AS BIGINT)/1000.0), $3, $4, $5, $6)
                `, [
                    gameId,
                    liveGame.gameStartTime,
                    liveGame.gameMode,
                    liveGame.gameLength,
                    liveGame.mapId,
                    liveGame.platformId
                ]);

                // Insère les participants
                for (const participant of liveGame.participants) {
                    await pool.query(`
                        INSERT INTO game_participants (
                            game_id, puuid, team_id, champion_id, champion_name,
                            summoner_name, summoner_spell1, summoner_spell2
                        ) VALUES (
                            $1, $2, $3, $4, $5,
                            $6, $7, $8
                        )
                    `, [
                        gameId,
                        participant.puuid,
                        participant.teamId,
                        participant.championId,
                        participant.championName,
                        participant.summonerName,
                        participant.spell1Id,
                        participant.spell2Id
                    ]);

                    console.log(`INSERT INTO game_participants: (
                      game_id: ${gameId},
                      puuid: ${participant.puuid},
                      team_id: ${participant.teamId},
                      champion_id: ${participant.championId},
                      champion_name: ${participant.championName},
                      summoner_name: ${participant.summonerName},
                      summoner_spell1: ${participant.spell1Id},
                      summoner_spell2: ${participant.spell2Id}
                    )`);
                }

                // Insère les stats des équipes
                for (const team of liveGame.teams) {
                    await pool.query(`
                        INSERT INTO game_teams (
                            game_id, team_id, towers_destroyed,
                            inhibitors_destroyed, dragons_killed,
                            barons_killed, heralds_killed, total_gold
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [
                        gameId,
                        team.teamId,
                        team.towerKills,
                        team.inhibitorKills,
                        team.dragonKills,
                        team.baronKills,
                        team.riftHeraldKills,
                        team.totalGold
                    ]);
                }

                updatedGames.push(gameId);
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                // Le joueur n'est plus en game
                await pool.query(`
                    UPDATE players SET in_game = false WHERE puuid = $1
                `, [player.puuid]);
            } else {
                console.error(`Erreur lors de la mise à jour de la partie pour ${player.summoner_name}:`, err.message);
            }
        }
    }

      res.json({ updated_games: updatedGames.length });
  } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des parties en cours.' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
