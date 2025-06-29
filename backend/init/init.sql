-- DROP TABLE IF EXISTS players;
-- DROP TABLE IF EXISTS recent_matches;

CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL,
    summoner_name VARCHAR(50),
    puuid VARCHAR(100) UNIQUE,
    tag VARCHAR(100),
    team VARCHAR(50),
    tier VARCHAR(20),
    rank VARCHAR(5),
    lp INT,
    total_games INT,
    wins INT,
    losses INT,
    win_rate FLOAT,
    last_games VARCHAR(255),
    opgg VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_online TIMESTAMP,
    in_game BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS recent_matches (
  match_id VARCHAR(100) PRIMARY KEY,
  game_datetime TIMESTAMP,
  team VARCHAR(50),
  puuid VARCHAR(100),
  summoner_name VARCHAR(100),
  win BOOLEAN,
  champion_name VARCHAR(100),
  opponent_champion VARCHAR(100),
  kills INT,
  deaths INT,
  assists INT
);

CREATE TABLE IF NOT EXISTS active_games (
    game_id BIGINT PRIMARY KEY,
    game_start_time TIMESTAMP,
    game_mode VARCHAR(50),
    game_duration INT, -- en secondes
    map_id INT,
    platform_id VARCHAR(20),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_participants (
    game_id BIGINT REFERENCES active_games(game_id),
    puuid VARCHAR(100) REFERENCES players(puuid),
    team_id INT,
    champion_id INT,
    champion_name VARCHAR(50),
    summoner_name VARCHAR(100),
    summoner_spell1 INT,
    summoner_spell2 INT,
    runes JSONB,
    kills INT,
    deaths INT,
    assists INT,
    gold_earned INT,
    creep_score INT,
    vision_score INT,
    PRIMARY KEY (game_id, puuid)
);

CREATE TABLE IF NOT EXISTS game_teams (
    game_id BIGINT REFERENCES active_games(game_id),
    team_id INT,
    towers_destroyed INT,
    inhibitors_destroyed INT,
    dragons_killed INT,
    barons_killed INT,
    heralds_killed INT,
    total_gold INT,
    PRIMARY KEY (game_id, team_id)
);