import create from 'zustand'

export enum Marble {
    EMPTY = -1,
    RED,
    WHITE,
    BLACK,
}

interface GameStore {
    currentBoard: number[][]
}

const createBoard = () => {
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

const gameStore = create<GameStore>(() => ({ currentBoard: createBoard() }))

export default gameStore
