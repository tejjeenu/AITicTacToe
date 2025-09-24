from flask import Flask, jsonify, request
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)  # This will allow all cross-origin requests

import math

highlightlist = []
aipos = 0

# Define the board
def print_board(board):
    for row in board:
        print("|".join(row))
        print("-" * 5)

# Check if the game has been won
def check_winner(board, player):
    global highlightlist
    # Check rows, columns, and diagonals
    for i in range(3):
        if all([board[i][j] == player for j in range(3)]):#horizontal checks done here
            highlightlist = [(0 + (i * 3)), (1 + (i * 3)), (2 + (i * 3))]
            return True
        if all([board[j][i] == player for j in range(3)]):#vertical checks done here
            highlightlist = [(i + 0), (i + 3), (i + 6)]
            return True

    if all([board[i][i] == player for i in range(3)]):
        highlightlist = [0,4,8]
        return True
    if all([board[i][2 - i] == player for i in range(3)]):
        highlightlist = [2,4,6]
        return True

    return False

# Check for a tie
def check_tie(board):
    for row in board:
        if " " in row:
            return False
    return True

# Minimax algorithm for AI
def minimax(board, is_maximizing):
    if check_winner(board, "O"):
        return 1  # AI wins
    if check_winner(board, "X"):
        return -1  # Human wins
    if check_tie(board):
        return 0  # Tie

    if is_maximizing:
        best_score = -math.inf
        for i in range(3):
            for j in range(3):
                if board[i][j] == " ":
                    board[i][j] = "O"
                    score = minimax(board, False)
                    board[i][j] = " "
                    best_score = max(score, best_score)
        return best_score
    else:
        best_score = math.inf
        for i in range(3):
            for j in range(3):
                if board[i][j] == " ":
                    board[i][j] = "X"
                    score = minimax(board, True)
                    board[i][j] = " "
                    best_score = min(score, best_score)
        return best_score

# AI move
def ai_move(board):
    global aipos 
    best_score = -math.inf
    move = None
    for i in range(3):
        for j in range(3):
            if board[i][j] == " ":
                board[i][j] = "O"
                score = minimax(board, False)
                board[i][j] = " "
                if score > best_score:
                    best_score = score
                    move = (i, j)
    board[move[0]][move[1]] = "O"
    aipos = move[1] + (move[0] * 3)

# Main game loop
def play_game():
    board = [[" " for _ in range(3)] for _ in range(3)]
    print("Welcome to Tic-Tac-Toe!")
    print("You are X, AI is O")

    while True:
        print_board(board)

        # Human move
        while True:
            row = int(input("Enter row (0, 1, 2): "))
            col = int(input("Enter column (0, 1, 2): "))
            if board[row][col] == " ":
                board[row][col] = "X"
                break
            else:
                print("That spot is already taken!")

        if check_winner(board, "X"):
            print_board(board)
            print("You win!")
            print(check_winner(board, "X"))
            break
        if check_tie(board):
            print_board(board)
            print("It's a tie!")
            break

        # AI move
        aipos = ai_move(board)
        print('ai move: ' + str(aipos))

        if check_winner(board, "O"):
            print_board(board)
            print("AI wins!")
            print(check_winner(board, "O"))
            break
        if check_tie(board):
            print_board(board)
            print("It's a tie!")
            break

@app.route('/')
def home():
    return 'Hello, your using a minmax api!'

@app.route('/api/data', methods=['GET'])
def get_data():
    data = {"message": "Hello from Flask!"}
    return jsonify(data)


@app.route('/api/postdata', methods=['POST'])
def post_data():
    status = "ongoing"
    received_data = request.json  # Get the JSON data sent by React

    top = str(received_data['top']).split('|')
    middle = str(received_data['middle']).split('|')
    bottom = str(received_data['bottom']).split('|')

    board = [top,middle,bottom]

    print_board(board)

    if check_winner(board, "X"):
        status = "you won!"
        print(highlightlist)
    elif check_tie(board):
        status = "it's a tie!"

    if(status == "ongoing"):
        ai_move(board)
        print("ai move: " + str(aipos))

        if check_winner(board, "O"):
            status = "AI wins!"
            print(highlightlist)
        elif check_tie(board):
            status = "it's a tie!"
    
    time.sleep(1)

    print_board(board)
    # Process data and send a response back to React
    response = {
        "top":board[0][0] + "|" + board[0][1] + "|" + board[0][2],
        "middle":board[1][0] + "|" + board[1][1] + "|" + board[1][2],
        "bottom":board[2][0] + "|" + board[2][1] + "|" + board[2][2],
        "aipos":str(aipos),
        "highlightred":str(highlightlist[0]) + "|" + str(highlightlist[1]) + "|" + str(highlightlist[2]),
        "status": status
    }
    return jsonify(response)


if __name__ == '__main__':
    app.run(debug=True, threaded=True)
