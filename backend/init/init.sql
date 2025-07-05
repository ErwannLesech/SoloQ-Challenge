-- Drop tables in correct order to respect foreign key constraints
DROP TABLE IF EXISTS game_participants;
DROP TABLE IF EXISTS game_teams;
DROP TABLE IF EXISTS active_games;
DROP TABLE IF EXISTS recent_matches;
DROP TABLE IF EXISTS players;


CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL,
    summoner_name VARCHAR(50),
    profileIconId INT,
    summoner_level INT,
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

-- Active games with queue info
CREATE TABLE IF NOT EXISTS active_games (
    game_id BIGINT PRIMARY KEY,
    game_start_time TIMESTAMP,
    game_mode VARCHAR(50),
    game_type VARCHAR(50),
    game_queue_config_id INT,
    game_duration INT, -- in seconds
    map_id INT,
    platform_id VARCHAR(20),
    banned_champions JSONB,
    updated_at TIMESTAMP DEFAULT NOW(),
    player_puuid VARCHAR(100)
);

-- Game participants with comprehensive data
CREATE TABLE IF NOT EXISTS game_participants (
    game_id BIGINT,
    puuid VARCHAR(100),
    riot_id VARCHAR(100),
    team_id INT,
    champion_id INT,
    champion_name VARCHAR(50),
    profile_icon_id INT,
    summoner_spell1 INT,
    summoner_spell2 INT,
    perks JSONB,
    PRIMARY KEY (game_id, puuid)
);

-- Game participants players outside of challenge
CREATE TABLE IF NOT EXISTS summoner_rank_info (
    puuid VARCHAR(100) PRIMARY KEY,
    summoner_id VARCHAR(100),
    summoner_level INT,
    last_updated TIMESTAMP,
    soloq_tier VARCHAR(20),
    soloq_rank VARCHAR(5),
    soloq_league_points INT,
    soloq_wins INT,
    soloq_losses INT,
    flexq_tier VARCHAR(20),
    flexq_rank VARCHAR(5),
    flexq_league_points INT,
    flexq_wins INT,
    flexq_losses INT
);