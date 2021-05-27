import { Game } from '../types/game'
import { chunk, invertVector, sumVector } from './helpers'

export enum Marble {
    EMPTY = -1,
    WHITE,
    BLACK,
    RED,
}

export enum Direction {
    LEFT = 'l',
    RIGHT = 'r',
    UP = 'u',
    DOWN = 'd',
}

export enum Position {
    OFF_GRID = -1,
}

export const marbleStrTable: Record<Marble, string> = {
    [Marble.WHITE]: 'w',
    [Marble.BLACK]: 'b',
    [Marble.RED]: 'r',
    [Marble.EMPTY]: '',
}

export const marbleStrTableReverse: Record<string, Marble> = {
    w: Marble.WHITE,
    b: Marble.BLACK,
    r: Marble.RED,
}

export const vectorTable: Record<Direction, Game.Vector> = {
    [Direction.LEFT]: -1,
    [Direction.RIGHT]: 1,
    [Direction.UP]: -7,
    [Direction.DOWN]: 7,
}

export const edgeMovesTable: Record<Direction, Set<Game.Vector>> = {
    [Direction.LEFT]: new Set([0, 7, 14, 21, 28, 35, 42]),
    [Direction.RIGHT]: new Set([6, 13, 20, 27, 34, 41, 48]),
    [Direction.UP]: new Set([0, 1, 2, 3, 4, 5, 6]),
    [Direction.DOWN]: new Set([42, 43, 44, 45, 46, 47, 48]),
}

export const otherPlayerTable: Record<Game.Player, Game.Player> = {
    [Marble.WHITE]: Marble.BLACK,
    [Marble.BLACK]: Marble.WHITE,
}

export const otherDirectionTable: Record<Direction, Direction> = {
    [Direction.UP]: Direction.DOWN,
    [Direction.DOWN]: Direction.UP,
    [Direction.LEFT]: Direction.RIGHT,
    [Direction.RIGHT]: Direction.LEFT,
}

/**
 * Determine if move will push piece off of board
 */
export const isEdgeMove = ([pos, dir]: Game.Move) => {
    return edgeMovesTable[dir].has(pos)
}

export const getOtherPlayer = (currentPlayer: Game.Player) => {
    return otherPlayerTable[currentPlayer]
}

export const toDirection = (direction: Direction) => {
    const getNextPos = (pos: Game.Vector) => sumVector(vectorTable[direction], pos) as Game.Vector
    const getPrevPos = (pos: Game.Vector) =>
        sumVector(invertVector(vectorTable[direction]), pos) as Game.Vector
    return [getNextPos, getPrevPos]
}

export const createBoard = () => {
    const [X, B, W, R] = [Marble.EMPTY, Marble.BLACK, Marble.WHITE, Marble.RED]
    // prettier-ignore
    return [
        W, W, X, X, X, B, B,
        W, W, X, R, X, B, B,
        X, X, R, R, R, X, X,
        X, R, R, R, R, R, X,
        X, X, R, R, R, X, X,
        B, B, X, R, X, W, W,
        B, B, X, X, X, W, W,
    ]
}

export const isEmpty = (marble: Marble) => marble === Marble.EMPTY

export const boardTo2D = (board: Game.BoardState) => chunk(board, 7)

export const boardToPieces = (board: Game.BoardState) => {
    return board.reduce<Game.Piece[]>((acc, cur, i) => {
        if (!isEmpty(cur)) {
            return [...acc, { pos: i, color: cur, id: i }]
        }
        return acc
    }, [])
}

export const compareBoards = (b1: Game.BoardState, b2: Game.BoardState) => {
    return JSON.stringify(b1) !== JSON.stringify(b2)
}

export const decodeGameState = (gameString: string) => {
    return new Promise<Game.GameState>((res, rej) => {
        const decodedStr = atob(gameString)

        if (!decodedStr) rej('Empty string')

        const [boardStr, otherStr] = decodedStr.split('-')
        const [capStr, turnStr, playerStr] = otherStr.split(' ')

        const currentPlayer =
            playerStr === undefined ? null : (marbleStrTableReverse[playerStr] as Game.Player)
        const turn = parseInt(turnStr)

        Promise.all([decodeBoard(boardStr), decodeCapture(capStr)])
            .then(([board, captures]) => {
                res({
                    board,
                    captures,
                    turn,
                    currentPlayer,
                })
            })
            .catch(rej)
    })
}

// encode state in the form 'board-capture-turnCount-player'. Player is nullable
export const encodeGameState = (gameState: Game.GameState) => {
    const { board, captures, currentPlayer, turn } = gameState

    const boardStr = encodeBoard(board)
    const capStr = encodeCapture(captures)
    const playerStr = marbleStrTable[currentPlayer as Marble]
    const turnStr = turn.toString()
    const otherData = [capStr, turnStr, playerStr].join(' ')
    const gameStr = [boardStr, otherData].join('-')

    return btoa(gameStr)
}

const encodeBoard = (gameBoard: Game.BoardState) => {
    let boardStr = ''
    let spaceCount = 0

    for (const row of boardTo2D(gameBoard)) {
        for (const cell of row) {
            if (cell === Marble.EMPTY) {
                spaceCount += 1
            } else if (spaceCount > 0) {
                boardStr += spaceCount.toString()
                boardStr += marbleStrTable[cell as Marble]
                spaceCount = 0
            } else {
                boardStr += marbleStrTable[cell as Marble]
            }
        }
        if (spaceCount > 0) {
            boardStr += spaceCount.toString()
            spaceCount = 0
        }
        boardStr += '/'
    }
    return boardStr.slice(0, -1)
}

const encodeCapture = (captures: Game.Captures) => {
    return Object.entries(captures)
        .map(([player, capCount]) => {
            return marbleStrTable[parseInt(player) as Marble] + capCount.toString()
        })
        .join('')
}

const decodeBoard = (boardString: string): Promise<Game.BoardState> => {
    return new Promise((res, rej) => {
        const board: Game.BoardState = []
        boardString.split('/').forEach((row) => {
            row.split('').forEach((char) => {
                if (Number.isInteger(parseInt(char))) {
                    const emptyArr = new Array(parseInt(char)).fill(Marble.EMPTY)
                    board.push(...emptyArr)
                } else {
                    board.push(marbleStrTableReverse[char])
                }
            })
        })
        if (board.length !== 49) rej('Board: Incorrect notation')
        res(board)
    })
}

const decodeCapture = (capStr: string) => {
    return new Promise<Game.Captures>((res, rej) => {
        if (capStr.length !== 4) rej('Capture: Incorrect notation')
        const capture = Object.fromEntries(
            chunk(capStr.split(''), 2).map((entry) => {
                return [marbleStrTableReverse[entry[0]], parseInt(entry[1])]
            })
        )
        res(capture as Game.Captures)
    })
}
