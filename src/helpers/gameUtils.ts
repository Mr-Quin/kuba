import { Game } from '../types/game'
import { Marble, marbleStrTable, marbleStrTableReverse } from '../store/useGameStore'

export const createBoard = () => {
    const [X, B, W, R] = [Marble.EMPTY, Marble.BLACK, Marble.WHITE, Marble.RED]
    return [
        [W, W, X, X, X, B, B],
        [W, W, X, R, X, B, B],
        [X, X, R, R, R, X, X],
        [X, R, R, R, R, R, X],
        [X, X, R, R, R, X, X],
        [B, B, X, R, X, W, W],
        [B, B, X, X, X, W, W],
    ]
}

export const compareBoards = (b1: Game.BoardState, b2: Game.BoardState) => {
    return JSON.stringify(b1) !== JSON.stringify(b2)
}

export const decodeGameState = (boardString: string): Promise<Game.BoardState> => {
    return new Promise((res, rej) => {
        const board: Game.BoardState = []
        atob(boardString)
            .split('-')
            .forEach((row) => {
                const rowState: number[] = []
                row.split('').forEach((char) => {
                    if (Number.isInteger(parseInt(char))) {
                        const emptyArr = new Array(parseInt(char)).fill(Marble.EMPTY)
                        rowState.push(...emptyArr)
                    } else {
                        rowState.push(marbleStrTableReverse[char])
                    }
                })
                if (rowState.length !== 7) rej('Incorrect notation')
                board.push(rowState)
            })
        if (board.length !== 7) rej('Incorrect notation')
        res(board)
    })
}

export const encodeGameState = (gameBoard: Game.BoardState) => {
    let str = ''
    let spaceCount = 0
    for (const row of gameBoard) {
        for (const cell of row) {
            if (cell === Marble.EMPTY) {
                spaceCount += 1
            } else if (spaceCount > 0) {
                str += spaceCount.toString()
                str += marbleStrTable[cell as Marble]
                spaceCount = 0
            } else {
                str += marbleStrTable[cell as Marble]
            }
        }
        if (spaceCount > 0) {
            str += spaceCount.toString()
            spaceCount = 0
        }
        str += '-'
    }
    return btoa(str.slice(0, -1))
}
