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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
