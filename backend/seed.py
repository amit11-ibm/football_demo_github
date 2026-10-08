"""
Seed script — populates the SQLite database with realistic mock data.
Run from the backend/ directory:   python seed.py
Idempotent: clears all rows and re-seeds on every run.
"""
import random
import sys
import os

# Ensure we resolve modules from the backend directory
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import models
from auth import get_password_hash

models.Base.metadata.create_all(bind=engine)

# ── Constants ─────────────────────────────────────────────────────────────────

POSITIONS = ["GK", "CB", "CB", "LB", "RB", "CDM", "CDM", "CM", "CAM", "LW", "RW", "ST",
             "CB", "LB", "RB", "CM", "CM", "LW", "ST", "ST", "GK", "CB"]

NATIONALITIES = [
    "English", "Spanish", "French", "German", "Brazilian", "Argentine",
    "Portuguese", "Italian", "Dutch", "Belgian", "Colombian", "Senegalese",
    "Nigerian", "Moroccan", "Egyptian", "Ghanaian", "Ivorian", "Japanese",
]

TEAM_DATA = [
    ("Manchester City FC", "MCI"),
    ("Arsenal FC", "ARS"),
    ("Liverpool FC", "LIV"),
    ("Chelsea FC", "CHE"),
]

FIRST_NAMES = [
    "James", "Thomas", "Harry", "Oliver", "Jack", "George", "Noah",
    "Liam", "Lucas", "Mason", "Ethan", "Logan", "Aiden", "Jackson",
    "Sebastian", "Muhammad", "Mateo", "Carlos", "Diego", "Luis",
    "Marco", "Andrea", "Luca", "Kai", "Finn",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Wilson", "Taylor", "Martinez", "Anderson", "Thomas", "Jackson",
    "White", "Harris", "Martin", "Thompson", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Scott",
]


def rand_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def rand_dob():
    year = random.randint(1992, 2003)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{year}-{month:02d}-{day:02d}"


def rand_coord(axis: str) -> float:
    return round(random.uniform(0, 120 if axis == "x" else 80), 2)


def seed():
    db = SessionLocal()

    # ── Wipe existing data (order matters for FK constraints) ────────────────
    db.query(models.StatsSummary).delete()
    db.query(models.Event).delete()
    db.query(models.Lineup).delete()
    db.query(models.Match).delete()
    db.query(models.Player).delete()
    db.query(models.Team).delete()
    db.query(models.Season).delete()
    db.query(models.Competition).delete()
    db.query(models.User).delete()
    db.commit()

    # ── Admin user ────────────────────────────────────────────────────────────
    admin = models.User(username="admin", hashed_password=get_password_hash("password"))
    db.add(admin)
    db.flush()

    # ── Competition + Season ──────────────────────────────────────────────────
    comp = models.Competition(name="Premier League", country="England")
    db.add(comp)
    db.flush()

    season = models.Season(competition_id=comp.id, name="2023/24", year=2023)
    db.add(season)
    db.flush()

    # ── Teams ─────────────────────────────────────────────────────────────────
    teams = []
    for name, short in TEAM_DATA:
        team = models.Team(name=name, short_name=short, season_id=season.id)
        db.add(team)
        teams.append(team)
    db.flush()

    # ── Players (~22 per team) ────────────────────────────────────────────────
    all_players = []
    for team in teams:
        for i, position in enumerate(POSITIONS):
            player = models.Player(
                name=rand_name(),
                position=position,
                dob=rand_dob(),
                nationality=random.choice(NATIONALITIES),
                team_id=team.id,
            )
            db.add(player)
            all_players.append((team, player))
    db.flush()

    # ── Matches (10 matches between teams) ───────────────────────────────────
    match_pairs = [
        (teams[0], teams[1]),
        (teams[2], teams[3]),
        (teams[0], teams[2]),
        (teams[1], teams[3]),
        (teams[3], teams[0]),
        (teams[2], teams[1]),
        (teams[1], teams[0]),
        (teams[3], teams[2]),
        (teams[0], teams[3]),
        (teams[1], teams[2]),
    ]

    matches = []
    for idx, (home, away) in enumerate(match_pairs):
        month = (idx % 9) + 8  # Aug–Apr
        day = random.randint(1, 28)
        home_score = random.randint(0, 4)
        away_score = random.randint(0, 3)
        match = models.Match(
            season_id=season.id,
            home_team_id=home.id,
            away_team_id=away.id,
            date=f"2023-{month:02d}-{day:02d}",
            home_score=home_score,
            away_score=away_score,
        )
        db.add(match)
        matches.append((match, home, away, home_score, away_score))
    db.flush()

    # ── Players indexed by team ───────────────────────────────────────────────
    team_players: dict = {t.id: [] for t in teams}
    for team, player in all_players:
        team_players[team.id].append(player)

    # ── Lineups ───────────────────────────────────────────────────────────────
    for match, home, away, _, _ in matches:
        for team in [home, away]:
            players_for_team = team_players[team.id]
            starters = players_for_team[:11]
            subs = players_for_team[11:16]
            for player in starters:
                db.add(models.Lineup(
                    match_id=match.id, player_id=player.id,
                    team_id=team.id, starting_xi=True,
                ))
            for player in subs:
                db.add(models.Lineup(
                    match_id=match.id, player_id=player.id,
                    team_id=team.id, starting_xi=False,
                ))
    db.flush()

    # ── Events + Stats accumulator ────────────────────────────────────────────
    # stats_acc[player_id] = {goals, assists, shots, shots_on_target, passes, pass_complete, touches, minutes, matches, distance}
    stats_acc: dict = {}
    for _, player in all_players:
        stats_acc[player.id] = dict(
            goals=0, assists=0, shots=0, shots_on_target=0,
            passes=0, pass_complete=0, touches=0,
            minutes=0, matches=0, distance=0.0,
        )

    shot_outcomes = ["goal", "saved", "off_target", "blocked"]
    shot_outcome_weights = [0.12, 0.35, 0.35, 0.18]
    pass_outcomes = ["complete", "incomplete"]

    for match, home, away, home_score, away_score in matches:
        for team in [home, away]:
            players_for_team = team_players[team.id][:11]
            is_home = team.id == home.id
            goals_to_distribute = home_score if is_home else away_score

            # Assign goal-scorers and assist providers
            attackers = [p for p in players_for_team if p.position in ("ST", "LW", "RW", "CAM")]
            if not attackers:
                attackers = players_for_team

            goal_events = []
            for _ in range(goals_to_distribute):
                scorer = random.choice(attackers)
                goal_events.append(scorer.id)
                stats_acc[scorer.id]["goals"] += 1
                assister_candidates = [p for p in players_for_team if p.id != scorer.id]
                if assister_candidates and random.random() > 0.2:
                    assister = random.choice(assister_candidates)
                    stats_acc[assister.id]["assists"] += 1

            for player in players_for_team:
                stats_acc[player.id]["matches"] += 1
                minutes = random.randint(60, 90)
                stats_acc[player.id]["minutes"] += minutes
                stats_acc[player.id]["distance"] += round(random.uniform(6.0, 13.0), 2)

                # Passes
                num_passes = random.randint(30, 80)
                for _ in range(num_passes):
                    x, y = rand_coord("x"), rand_coord("y")
                    end_x = round(min(120, x + random.uniform(-20, 20)), 2)
                    end_y = round(max(0, min(80, y + random.uniform(-15, 15))), 2)
                    outcome = random.choices(pass_outcomes, weights=[0.82, 0.18])[0]
                    db.add(models.Event(
                        match_id=match.id, player_id=player.id,
                        type="pass", x=x, y=y,
                        end_x=end_x, end_y=end_y,
                        minute=random.randint(1, 90),
                        outcome=outcome,
                    ))
                    stats_acc[player.id]["passes"] += 1
                    if outcome == "complete":
                        stats_acc[player.id]["pass_complete"] += 1

                # Shots
                num_shots = random.randint(1, 8) if player.position in ("ST", "LW", "RW", "CAM") else random.randint(0, 3)
                for i in range(num_shots):
                    # Shots are in attacking half (x > 60)
                    x = round(random.uniform(80, 118), 2)
                    y = round(random.uniform(15, 65), 2)
                    outcome = random.choices(shot_outcomes, weights=shot_outcome_weights)[0]
                    # Override: if this player scored, make one shot a goal
                    if player.id in goal_events and i == 0:
                        outcome = "goal"
                        goal_events.remove(player.id)
                    db.add(models.Event(
                        match_id=match.id, player_id=player.id,
                        type="shot", x=x, y=y,
                        minute=random.randint(1, 90),
                        outcome=outcome,
                    ))
                    stats_acc[player.id]["shots"] += 1
                    if outcome in ("goal", "saved"):
                        stats_acc[player.id]["shots_on_target"] += 1

                # Touches
                num_touches = random.randint(20, 50)
                for _ in range(num_touches):
                    db.add(models.Event(
                        match_id=match.id, player_id=player.id,
                        type="touch", x=rand_coord("x"), y=rand_coord("y"),
                        minute=random.randint(1, 90),
                        outcome=None,
                    ))
                    stats_acc[player.id]["touches"] += 1

                # Tackles / dribbles (lighter)
                for etype in ["tackle", "dribble"]:
                    for _ in range(random.randint(0, 5)):
                        db.add(models.Event(
                            match_id=match.id, player_id=player.id,
                            type=etype, x=rand_coord("x"), y=rand_coord("y"),
                            minute=random.randint(1, 90),
                            outcome=random.choice(["success", "fail"]),
                        ))

    db.flush()

    # ── Stats Summary ─────────────────────────────────────────────────────────
    for _, player in all_players:
        acc = stats_acc[player.id]
        pass_acc = (
            round(acc["pass_complete"] / acc["passes"] * 100, 1)
            if acc["passes"] > 0 else 0.0
        )
        db.add(models.StatsSummary(
            player_id=player.id,
            season_id=season.id,
            goals=acc["goals"],
            assists=acc["assists"],
            shots=acc["shots"],
            shots_on_target=acc["shots_on_target"],
            passes=acc["passes"],
            pass_accuracy=pass_acc,
            minutes_played=acc["minutes"],
            matches_played=acc["matches"],
            distance_covered=round(acc["distance"], 2),
        ))

    db.commit()
    db.close()
    print("Database seeded successfully.")
    print(f"   Competition: 1 | Season: 1 | Teams: {len(teams)} | Players: {len(all_players)}")
    print(f"   Matches: {len(matches)} | Events: many")


if __name__ == "__main__":
    seed()
