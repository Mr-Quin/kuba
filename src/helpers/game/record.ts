import { Game } from '../../types/game'
import { chunk } from '../helpers'
import { boardTo2D } from './util'
import { Marble, marbleStrTable, marbleStrTableReverse } from './consts'

const nullChar = '-'

// encode state in the form 'board-capture turnCount currentPlayer'. Player is nullable
export const encodeGameState = (gameState: Game.GameState) => {
    const { board, captures, currentPlayer, turn } = gameState

    const boardStr = encodeBoard(board)
    const capStr = encodeCapture(captures)
    const playerStr = currentPlayer !== null ? marbleStrTable[currentPlayer as Marble] : nullChar
    const turnStr = turn.toString()
    const gameStr = [boardStr, capStr, turnStr, playerStr].join(' ')

    console.log(gameStr)

    return btoa(gameStr)
}

// TODO: refactor into functional
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

const encodeCapture = (captures: Game.Captures) =>
    Object.entries(captures)
        .map(([player, capCount]) => {
            return marbleStrTable[parseInt(player) as Marble] + capCount.toString()
        })
        .join('')

export const decodeGameState = (gameString: string) =>
    new Promise<Game.GameState>((res, rej) => {
        const decodedStr = atob(gameString)

        if (!decodedStr) rej('Empty string')

        const [boardStr, capStr, turnStr, playerStr] = decodedStr.split(' ')

        const currentPlayer =
            playerStr === nullChar ? null : (marbleStrTableReverse[playerStr] as Game.Player)
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

// TODO: refactor into functional
const decodeBoard = (boardString: string): Promise<Game.BoardState> =>
    new Promise((res, rej) => {
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

const decodeCapture = (capStr: string) =>
    new Promise<Game.Captures>((res, rej) => {
        if (capStr.length !== 4) rej('Capture: Incorrect notation')
        const capture = Object.fromEntries(
            chunk(capStr.split(''), 2).map((entry) => {
                return [marbleStrTableReverse[entry[0]], parseInt(entry[1])]
            })
        )
        res(capture as Game.Captures)
    })
