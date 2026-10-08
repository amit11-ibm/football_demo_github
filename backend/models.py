from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)


class Competition(Base):
    __tablename__ = "competitions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    country = Column(String, nullable=False)
    seasons = relationship("Season", back_populates="competition")


class Season(Base):
    __tablename__ = "seasons"
    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id"), nullable=False)
    name = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    competition = relationship("Competition", back_populates="seasons")
    teams = relationship("Team", back_populates="season")
    matches = relationship("Match", back_populates="season")
    stats = relationship("StatsSummary", back_populates="season")


class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=False)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    season = relationship("Season", back_populates="teams")
    players = relationship("Player", back_populates="team")
    home_matches = relationship("Match", foreign_keys="Match.home_team_id", back_populates="home_team")
    away_matches = relationship("Match", foreign_keys="Match.away_team_id", back_populates="away_team")
    lineups = relationship("Lineup", back_populates="team")


class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    dob = Column(String, nullable=False)
    nationality = Column(String, nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    team = relationship("Team", back_populates="players")
    events = relationship("Event", back_populates="player")
    lineups = relationship("Lineup", back_populates="player")
    stats = relationship("StatsSummary", back_populates="player")


class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    date = Column(String, nullable=False)
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    season = relationship("Season", back_populates="matches")
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_matches")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_matches")
    events = relationship("Event", back_populates="match")
    lineups = relationship("Lineup", back_populates="match")


class Lineup(Base):
    __tablename__ = "lineups"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    starting_xi = Column(Boolean, default=True)
    match = relationship("Match", back_populates="lineups")
    player = relationship("Player", back_populates="lineups")
    team = relationship("Team", back_populates="lineups")


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    type = Column(String, nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    end_x = Column(Float, nullable=True)
    end_y = Column(Float, nullable=True)
    minute = Column(Integer, nullable=False)
    outcome = Column(String, nullable=True)
    metadata_json = Column(Text, nullable=True)
    match = relationship("Match", back_populates="events")
    player = relationship("Player", back_populates="events")


class StatsSummary(Base):
    __tablename__ = "stats_summary"
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    goals = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    shots = Column(Integer, default=0)
    shots_on_target = Column(Integer, default=0)
    passes = Column(Integer, default=0)
    pass_accuracy = Column(Float, default=0.0)
    minutes_played = Column(Integer, default=0)
    matches_played = Column(Integer, default=0)
    distance_covered = Column(Float, default=0.0)
    player = relationship("Player", back_populates="stats")
    season = relationship("Season", back_populates="stats")
