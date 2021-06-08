# Kuba

A React implementation of the [Kuba board game](https://boardgamegeek.com/boardgame/1337/kuba)

## Rules implemented:
- [x] Cannot push if opposite direction is not empty
- [x] Cannot push off one's own marble from the board
- [x] Pushing off an opposing or neutral marble grants an extra turn
  - Toggleable
- [x] Cannot undo the opponent's move (Ko rule)
- [x] Any player can start
- [x] The player that has no legal moves left loses
- [ ] Up to six marbles can be pushed by your one marble on your turn
  
[All rules](https://sites.google.com/site/boardandpieces/list-of-games/kuba)

## Notation
The import/export feature is implemented using a custom notation similar to the [Forsyth–Edwards Notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)

This notation uses 4 fields, separated by space:
- Pieces
  - w: white marble
  - b: black marble
  - r: red marble
  - number: number of empty spaces
  - each row is split by a forward slash `/`
- Captures
  - amount of red marbles captured by each player
- Turn: current turn number, starts at 1 and increments each time player changes
- Next player: determines which player's turn it is, either b or w

Null fields are represented by a dash `-`

Notation for the initial game state:

`ww3bb/ww1r1bb/2rrr2/1rrrrr1/2rrr2/bb1r1ww/bb3ww w0b0 1 -`

Base64 encoded:

`d3czYmIvd3cxcjFiYi8ycnJyMi8xcnJycnIxLzJycnIyL2JiMXIxd3cvYmIzd3cgdzBiMCAxIC0=`

This notation is calculated after each move and encoded in base64. The encoded notation is set as the url hash.

Importing works by decoding the url hash and parsing the notation. Invalid notations are treated as the initial state.

## Ko rule
The Ko rule is implemented using [Zobrist hashing](https://en.wikipedia.org/wiki/Zobrist_hashing)

## Running locally
In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

