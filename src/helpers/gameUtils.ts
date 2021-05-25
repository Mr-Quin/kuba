import { Game } from '../types/game'
import { Marble, marbleStrTable, marbleStrTableReverse } from '../store/useGameStore'
import { chunk } from './helpers'

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

export const boardTo2D = (board: Game.BoardState) => chunk(board, 7)

export const compareBoards = (b1: Game.BoardState, b2: Game.BoardState) => {
    return JSON.stringify(b1) !== JSON.stringify(b2)
}

export const decodeGameState = (gameString: string) => {
    return new Promise<Game.GameState>((res, rej) => {
        const decodedStr = atob(gameString)
        const [boardStr, otherStr] = decodedStr.split('-')
        const [capStr, turnStr, playerStr] = otherStr.split(' ')

        const currentPlayer =
            playerStr === undefined ? null : (marbleStrTableReverse[playerStr] as Game.Player)
        const turn = parseInt(turnStr)

        Promise.all([decodeBoard(boardStr), decodeCap(capStr)])
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
    const capStr = encodeCap(captures)
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

const encodeCap = (captures: Game.Captures) => {
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
            const rowState: number[] = []
            row.split('').forEach((char) => {
                if (Number.isInteger(parseInt(char))) {
                    const emptyArr = new Array(parseInt(char)).fill(Marble.EMPTY)
                    rowState.push(...emptyArr)
                } else {
                    rowState.push(marbleStrTableReverse[char])
                }
            })
            if (rowState.length !== 7) rej('Board: Incorrect notation')
            // board.push(rowState)
        })
        if (board.length !== 7) rej('Board: Incorrect notation')
        res(board)
    })
}

const decodeCap = (capStr: string) => {
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
