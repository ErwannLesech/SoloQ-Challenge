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

// Utility function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ======================================
// PLAYER-RELATED ENDPOINTS
// ======================================

/**
 * Player Controller - Handles all player-related operations
 */
const playerController = {
  // Tier and rank ordering for sorting
  tierOrder: {
    "IRON": 1, "BRONZE": 2, "SILVER": 3, "GOLD": 4, 
    "PLATINUM": 5, "EMERALD": 6, "DIAMOND": 7, 
    "MASTER": 8, "GRANDMASTER": 9, "CHALLENGER": 10,
    "UNRANKED": 0
  },
  rankOrder: {
    "IV": 1, "III": 2, "II": 3, "I": 4, "": 0
  },

  /**
   * Get the sorting value for a tier
   */
  getTierValue(tier) {
    return this.tierOrder[tier?.toUpperCase()] || 0;
  },

  /**
   * Get the sorting value for a rank
   */
  getRankValue(rank) {
    return this.rankOrder[rank?.toUpperCase()] || 0;
  },

  /**
   * Add a new player to the system
   */
  async addPlayer(req, res) {
    const { playerName, summonerName, userTag, team } = req.body;

    try {
      // 1. Get summoner info from Riot API
      const summonerRes = await axios.get(
        `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${userTag}`,
        { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
      );
      const summoner = summonerRes.data;

      // 2. Get ranked info
      const rankedRes = await axios.get(
        `${RIOT_API}/lol/league/v4/entries/by-puuid/${summoner.puuid}`,
        { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
      );
      const soloQ = rankedRes.data.find(e => e.queueType === "RANKED_SOLO_5x5");

      const summonerInfo = await axios.get(
        `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${summoner.puuid}?api_key=${process.env.RIOT_API_KEY}`,
        { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
      );

      const profileIconId = summonerInfo.data.profileIconId || 0;
      const summonerLevel = summonerInfo.data.summonerLevel || 0;

      // 3. Insert or update player in database
      await pool.query(`
        INSERT INTO players (
          player_name, summoner_name, puuid, tag, team, tier, rank, lp, 
          total_games, wins, losses, win_rate, opgg, updated_at, profileIconId, summoner_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
          'https://euw.op.gg/summoners/euw/${encodeURIComponent(summoner.gameName)}-${encodeURIComponent(summoner.tagLine)}', 
          $13, $14, $15)
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
          opgg = EXCLUDED.opgg,
          updated_at = EXCLUDED.updated_at,
          profileIconId = EXCLUDED.profileIconId,
          summoner_level = EXCLUDED.summoner_level;
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
        new Date().toISOString(),
        profileIconId,
        summonerLevel
      ]);

      res.json({ success: true });
    } catch (err) {
      console.error('Error adding player:', err.message);
      res.status(500).json({ error: 'Error adding player to the system.' });
    }
  },

  /**
   * Get all players with proper sorting by rank
   */
  async getAllPlayers(req, res) {
    try {
      const result = await pool.query('SELECT * FROM players');
      const players = result.rows.map(p => ({
        ...p,
        winrate: ((p.wins / (p.wins + p.losses)) * 100).toFixed(1),
        tierValue: playerController.tierOrder[p.tier.toUpperCase()] || 0,
        rankValue: playerController.rankOrder[p.rank.toUpperCase()] || 0,
      }));

      // Sort by tier, then rank, then LP
      players.sort((a, b) => {
        if (b.tierValue !== a.tierValue) return b.tierValue - a.tierValue;
        if (b.rankValue !== a.rankValue) return b.rankValue - a.rankValue;
        return b.lp - a.lp;
      });

      res.json(players);
    } catch (err) {
      console.error('Error fetching players:', err.message);
      res.status(500).json({ error: 'Error retrieving player data.' });
    }
  },

  /**
   * Update all players' information from Riot API
   */
  async updateAllPlayers(req, res) {
    try {
      const result = await pool.query('SELECT * FROM players');
      const players = result.rows;
      const updatedPlayers = [];

      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        try {
          // Rate limiting
          if (i > 0) await delay(100);

          // Get ranked info
          const rankedRes = await axios.get(
            `${RIOT_API}/lol/league/v4/entries/by-puuid/${p.puuid}`,
            { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
          );
          const soloQ = rankedRes.data.find(e => e.queueType === "RANKED_SOLO_5x5");

          // Get recent matches (IDs only)
          const matchesRes = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${p.puuid}/ids?type=ranked&count=5`,
            { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
          );
          const matchIds = matchesRes.data;

          // Process each match with delay
          const matchResults = [];
          for (let j = 0; j < matchIds.length; j++) {
            if (j > 0) await delay(100);
            
            const matchDetailRes = await axios.get(
              `https://europe.api.riotgames.com/lol/match/v5/matches/${matchIds[j]}`,
              { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
            );
            const match = matchDetailRes.data;
            const participantIndex = match.metadata.participants.findIndex(puuid => puuid === p.puuid);
            const participant = match.info.participants[participantIndex];
            matchResults.push(participant.win);

            // Store match details
            await playerController.storeMatchDetails(match, p, participant);
          }

          const summonerInfo = await axios.get(
            `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${p.puuid}?api_key=${process.env.RIOT_API_KEY}`,
            { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
          );

          // Update player's ranked info
          await playerController.updatePlayerRankedInfo(p.puuid, soloQ, matchResults, summonerInfo.data);

          // Check if player is in game
          await playerController.checkPlayerInGameStatus(p);

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
          console.error(`Error updating player ${p.summoner_name}:`, err.message);
          updatedPlayers.push({ ...p, recentMatches: [] });
        }
      }

      res.json(updatedPlayers);
    } catch (err) {
      console.error('Error in mass player update:', err.message);
      res.status(500).json({ error: 'Error updating player data.' });
    }
  },

  /**
   * Helper: Store match details in database
   */
  async storeMatchDetails(match, player, participant) {
    const playerRole = participant.teamPosition || participant.lane;
    const playerTeamId = participant.teamId;

    // Find opponent in same role/lane
    const opponent = match.info.participants.find(other =>
      other.teamId !== playerTeamId &&
      (other.teamPosition === playerRole || other.lane === playerRole)
    );

    await pool.query(`
      INSERT INTO recent_matches (
        match_id, game_datetime, team, puuid, summoner_name, win, 
        champion_name, opponent_champion, kills, deaths, assists
      ) VALUES ($1, to_timestamp($2 / 1000.0), $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (match_id) DO NOTHING;
    `, [
      match.metadata.matchId,
      match.info.gameStartTimestamp,
      player.team,
      player.puuid,
      player.player_name,
      participant.win,
      participant.championName,
      opponent?.championName || null,
      participant.kills,
      participant.deaths,
      participant.assists
    ]);
  },

  /**
   * Helper: Update player's ranked information
   */
  async updatePlayerRankedInfo(puuid, soloQ, matchResults, summonerInfo) {
    await pool.query(`
      UPDATE players SET 
        profileIconId = $10,
        summoner_level = $11,
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
      puuid,
      summonerInfo.profileIconId || 0,
      summonerInfo.summonerLevel || 0
    ]);
  },

  /**
   * Helper: Check and update if player is in game
   */
  async checkPlayerInGameStatus(player) {
    try {
      const summonerStatusRes = await axios.get(
        `${RIOT_API}/lol/spectator/v5/active-games/by-summoner/${player.puuid}`,
        { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
      ).catch(err => {
        if (err.response?.status === 404) return { data: null };
        throw err;
      });

      const isInGame = summonerStatusRes.data !== null;
      const last_online = isInGame ? new Date().toISOString() : player.last_online;

      await pool.query(`
        UPDATE players SET 
          in_game = $1,
          last_online = $3
        WHERE puuid = $2
      `, [isInGame, player.puuid, last_online]);

    } catch (err) {
      console.error(`Error checking in-game status for ${player.summoner_name}:`, err.message);
    }
  },

  /**
   * Get recent matches for players
   */
  async getRecentMatches(req, res) {
    try {
      const limit = req.query.limit || 3;
      const result = await pool.query(`
        SELECT * FROM recent_matches 
        ORDER BY game_datetime DESC 
        LIMIT $1
      `, [limit]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching recent matches:', err.message);
      res.status(500).json({ error: 'Error retrieving recent matches.' });
    }
  },

  /**
   * Get players currently in game
   */
  async getPlayersInGame(req, res) {
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
        WHERE in_game = true
        ORDER BY last_online DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching players in game:', err.message);
      res.status(500).json({ error: 'Error retrieving in-game players.' });
    }
  }
};

// ======================================
// ACTIVE GAME ENDPOINTS
// ======================================

/**
 * Game Controller - Handles all active game operations
 */
const gameController = {
  /**
   * Get detailed info about live games
   */
  async getLiveGames(req, res) {
    try {
      // Get all active games with participants and aggregated team stats
      const result = await pool.query(`
        SELECT 
          ag.game_id,
          ag.game_mode,
          ag.game_start_time,
          ag.game_queue_config_id,
          ag.player_puuid AS player_ref,
          EXTRACT(EPOCH FROM (NOW() - ag.game_start_time)) as game_duration,
          (
            SELECT json_agg(
              json_build_object(
                'puuid', gp.puuid,
                'summoner_name', COALESCE(p.summoner_name, gp.riot_id),
                'riot_id', gp.riot_id,
                'team_id', gp.team_id,
                'champion_id', gp.champion_id,
                'champion_name', gp.champion_name,
                'profile_icon_id', gp.profile_icon_id,
                'summoner_spell1', gp.summoner_spell1,
                'summoner_spell2', gp.summoner_spell2,
                'perks', gp.perks
              )
            )
            FROM game_participants gp
            LEFT JOIN players p ON gp.puuid = p.puuid
            WHERE gp.game_id = ag.game_id
          ) as participants
        FROM active_games ag
        WHERE ag.game_start_time > NOW() - INTERVAL '1 hours'
        AND ag.game_mode IN ('CLASSIC', 'ARAM', 'URF', 'RANKED_SOLO_5x5', 'RANKED_FLEX_SR')
        ORDER BY ag.game_start_time DESC
      `);

      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching live games:', err.message);
      res.status(500).json({ error: 'Error retrieving live game data.' });
    }
  },

  /**
   * Update active games in the database
   */
  async updateLiveGames(req, res) {

    console.log('Updating live games...');

    try {
      // Get players marked as in-game
      /*const playersInGame = await pool.query(`
        SELECT p.* FROM players p 
        WHERE p.in_game = true
      `);*/

      const playersInGame = await pool.query(`
        SELECT p.* FROM players p
      `);

      const updatedGames = [];

      for (const player of playersInGame.rows) {
        try {
          await delay(100); // Rate limiting

          // Get active game info
          const liveGameRes = await axios.get(
            `${RIOT_API}/lol/spectator/v5/active-games/by-summoner/${player.puuid}`,
            { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
          );
          const liveGame = liveGameRes.data;

          // Check if game already exists in DB
          const existingGame = await pool.query(
            'SELECT 1 FROM active_games WHERE game_id = $1',
            [liveGame.gameId]
          );

          /*if (existingGame.rows.length === 0) {
            // Insert new game
            await gameController.insertNewGame(liveGame, player.puuid);
            updatedGames.push(liveGame.gameId);
          }*/
          await gameController.insertNewGame(liveGame, player.puuid);
          updatedGames.push(liveGame.gameId);
            
          await pool.query(
            `DELETE FROM active_games
            WHERE player_puuid = $1
              AND game_id <> $2
              AND game_duration > $3`,
            [
              player.puuid,
              liveGame.gameId,
              liveGame.gameLength
            ]
          );
        } catch (err) {
          if (err.response?.status === 404) {
            // Player is no longer in game
            await pool.query(
              'UPDATE players SET in_game = false WHERE puuid = $1',
              [player.puuid]
            );

             // Clean up any related game data
            await pool.query(
              'DELETE FROM active_games WHERE player_puuid = $1',
              [player.puuid]
            );

            await pool.query(
              'DELETE FROM game_participants WHERE game_id IN (SELECT game_id FROM active_games WHERE player_puuid = $1)',
              [player.puuid]
            );
            
          } else {
            console.error(`Error updating game for ${player.summoner_name}:`, err.message);
          }
        }
      }
      res.json({ updated_games: updatedGames.length });
    } catch (err) {
      console.error('Error in live game update:', err.message);
      res.status(500).json({ error: 'Error updating live games.' });
    }
  },

  /**
   * Helper: Insert a new game with all related data
   */
  async insertNewGame(gameData, puuid_player_ref) {
    try {
        // Insert game metadata
        await pool.query(`
            INSERT INTO active_games (
                game_id, game_start_time, game_mode, 
                game_type, game_queue_config_id, game_duration, 
                map_id, platform_id, banned_champions, updated_at, player_puuid
            ) VALUES ($1, to_timestamp($2/1000.0), $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
            ON CONFLICT (game_id) DO UPDATE SET
                game_duration = EXCLUDED.game_duration
        `, [
            gameData.gameId,
            gameData.gameStartTime,
            gameData.gameMode,
            gameData.gameType,
            gameData.gameQueueConfigId,
            gameData.gameLength,
            gameData.mapId,
            gameData.platformId,
            JSON.stringify(gameData.bannedChampions), // Store banned champions as JSON
            puuid_player_ref // Use the first participant's puuid as player_puuid
        ]);

        // Insert participants with their perks
        for (const participant of gameData.participants) {
            await pool.query(`
                INSERT INTO game_participants (
                    game_id, puuid, team_id, champion_id, 
                    riot_id, summoner_spell1, summoner_spell2,
                    profile_icon_id, perks
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (game_id, puuid) DO UPDATE SET
                    team_id = EXCLUDED.team_id,
                    champion_id = EXCLUDED.champion_id,
                    summoner_spell1 = EXCLUDED.summoner_spell1,
                    summoner_spell2 = EXCLUDED.summoner_spell2,
                    perks = EXCLUDED.perks
            `, [
                gameData.gameId,
                participant.puuid,
                participant.teamId,
                participant.championId,
                participant.riotId, // Using riotId which includes both name and tag
                participant.spell1Id,
                participant.spell2Id,
                participant.profileIconId,
                JSON.stringify(participant.perks) // Store perks as JSON
            ]);

            // Update summoner rank info (if not already exists)
            try {
              delay(300); // Rate limiting
              // First try to get summoner's ranked info from Riot API
              const rankedRes = await axios.get(
                `${RIOT_API}/lol/league/v4/entries/by-puuid/${participant.puuid}?api_key=${process.env.RIOT_API_KEY}`,
                { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
              );

              console.log(rankedRes.data);
              
              const soloQ = rankedRes.data.find(e => e.queueType === "RANKED_SOLO_5x5");
              const flexQ = rankedRes.data.find(e => e.queueType === "RANKED_FLEX_SR");

              await pool.query(`
                INSERT INTO summoner_rank_info (
                  puuid, summoner_id, summoner_level, last_updated,
                  soloq_tier, soloq_rank, soloq_league_points, soloq_wins, soloq_losses,
                  flexq_tier, flexq_rank, flexq_league_points, flexq_wins, flexq_losses
                ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (puuid) DO UPDATE SET
                  summoner_id = EXCLUDED.summoner_id,
                  summoner_level = EXCLUDED.summoner_level,
                  last_updated = NOW(),
                  soloq_tier = EXCLUDED.soloq_tier,
                  soloq_rank = EXCLUDED.soloq_rank,
                  soloq_league_points = EXCLUDED.soloq_league_points,
                  soloq_wins = EXCLUDED.soloq_wins,
                  soloq_losses = EXCLUDED.soloq_losses,
                  flexq_tier = EXCLUDED.flexq_tier,
                  flexq_rank = EXCLUDED.flexq_rank,
                  flexq_league_points = EXCLUDED.flexq_league_points,
                  flexq_wins = EXCLUDED.flexq_wins,
                  flexq_losses = EXCLUDED.flexq_losses
              `, [
                participant.puuid,
                participant.summonerId,
                participant.summonerLevel || 0,
                soloQ?.tier || 'UNRANKED',
                soloQ?.rank || '',
                soloQ?.leaguePoints || 0,
                soloQ?.wins || 0,
                soloQ?.losses || 0,
                flexQ?.tier || 'UNRANKED',
                flexQ?.rank || '',
                flexQ?.leaguePoints || 0,
                flexQ?.wins || 0,
                flexQ?.losses || 0
              ]);
            } catch (rankErr) {
              console.error(`Error updating rank info for ${participant.puuid}:`, rankErr.message);
              // Insert basic info if rank fetch fails
              await pool.query(`
                INSERT INTO summoner_rank_info (
                  puuid, summoner_id, summoner_level, last_updated
                ) VALUES ($1, $2, $3, NOW())
                ON CONFLICT (puuid) DO UPDATE SET
                  summoner_id = EXCLUDED.summoner_id,
                  summoner_level = EXCLUDED.summoner_level,
                  last_updated = NOW()
              `, [
                participant.puuid,
                participant.summonerId,
                participant.summonerLevel || 0
              ]);
            }
          }
        
        console.log(`Successfully inserted game ${gameData.gameId}`);
    } catch (error) {
        console.error(`Error inserting game ${gameData.gameId}:`, error);
        throw error;
    }
  },

  async getSummonerRankInfo(req, res) {
    try {
      const { puuids } = req.query;
      const puuidList = puuids.split(',');
      
      const result = await pool.query(`
        SELECT * FROM summoner_rank_info
        WHERE puuid = ANY($1)
      `, [puuidList]);

      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching summoner rank info:', err.message);
      res.status(500).json({ error: 'Error retrieving summoner rank data.' });
    }
  }
};

// ======================================
// ROUTE SETUP
// ======================================

// Player routes
app.post('/api/player', playerController.addPlayer);
app.get('/api/players', playerController.getAllPlayers);
app.get('/api/update_players', playerController.updateAllPlayers);
app.get('/api/recent_matches', (req, res) => playerController.getRecentMatches(req, res, 3));
app.get('/api/recent_matches_extended', (req, res) => playerController.getRecentMatches(req, res, 20));
app.get('/api/players_in_game', playerController.getPlayersInGame);

// Active game routes
app.get('/api/live_games', gameController.getLiveGames);
app.post('/api/insert_live_games', gameController.updateLiveGames);
app.get('/api/summoner_rank_info', gameController.getSummonerRankInfo);

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});