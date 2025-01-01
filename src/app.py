from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Database connection setup (adjust with your credentials)
def get_db_connection():
    conn = psycopg2.connect(
        dbname="tic_tac_toe",
        user="postgres",
        password="adminadmin",
        host="localhost",
        port="5432"
    )
    return conn

def create_players_table():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS players (
            id SERIAL PRIMARY KEY,
            player_name VARCHAR(100) UNIQUE,
            score INT
        );
    """)
    conn.commit()
    cursor.close()
    conn.close()

@app.route("/", methods=["GET"])
def home():
    return "Welcome to the Tic-Tac-Toe API! Use /scoreboard to view the scores."

# Route to fetch the scoreboard
@app.route("/scoreboard", methods=["GET"])
def get_scoreboard():
    conn = get_db_connection()
    create_players_table()
    cur = conn.cursor()
    cur.execute('SELECT player_name, score FROM players ORDER BY score DESC;')
    players = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify(players)

# Route to update the score (POST method)
@app.route("/start_game", methods=["POST"])
def start_game():
    data = request.get_json()
    player_x = data.get('player_x')
    player_o = data.get('player_o')
    winner = data.get('winner')
    loser = data.get('loser')

    # Insert players if they do not exist, else update their scores
    conn = get_db_connection()
    cur = conn.cursor()

    for player in [player_x, player_o]:
        cur.execute("SELECT * FROM players WHERE player_name = %s", (player,))
        player_data = cur.fetchone()

        if player_data:
            # Update the score based on the winner and loser
            if player == winner:
                cur.execute("UPDATE players SET score = score + 1 WHERE player_name = %s", (player,))
            elif player == loser:
                cur.execute("UPDATE players SET score = score - 1 WHERE player_name = %s", (player,))
        else:
            # Insert new player with initial score 0
            cur.execute("INSERT INTO players (player_name, score) VALUES (%s, %s)", (player, 0))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Scores updated!"})

if __name__ == "__main__":
    app.run(debug=True)