import create from 'zustand'
import { Game } from '../types/game'

export enum Marble {
    EMPTY = -1,
    WHITE,
    BLACK,
    RED,
}

export enum Direction {
    LEFT,
    RIGHT,
    UP,
    DOWN,
}

const vectorTable: Game.Vector[] = [
    [0, -1], // left
    [0, 1], //right
    [-1, 0], // up
    [1, 0], // down
]

const getOtherPlayer = (currentPlayer: Game.Player) => {
    return {
        [Marble.WHITE]: Marble.BLACK,
        [Marble.BLACK]: Marble.WHITE,
    }[currentPlayer] as Game.Player
}

const invertVector = (vector: Game.Vector) => {
    return vector.map((val) => -val) as Game.Vector
}

const sumVector = (vector1: Game.Vector, vector2: Game.Vector) => {
    return vector1.map((val, i) => val + vector2[i])
}

const toDirection = (direction: Direction) => {
    const nextPos = (pos: Game.Vector) => sumVector(vectorTable[direction], pos) as Game.Vector
    const prevPos = (pos: Game.Vector) =>
        sumVector(invertVector(vectorTable[direction]), pos) as Game.Vector
    return [nextPos, prevPos]
}

const getLast = <t>(arr: t[]): t => {
    return arr[arr.length - 1]
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

const compareBoards = (b1: Game.BoardState, b2: Game.BoardState) => {
    return JSON.stringify(b1) !== JSON.stringify(b2)
}

export interface GameStore {
    currentBoard: Game.BoardState
    simBoard: Game.BoardState
    boardHistory: Game.History[]
    winner: Nullable<Marble>
    errorMessage: { message: string; update: any }
    turns: number
    captures: Game.Captures
    currentPlayer: Nullable<Game.Player>
    makeMove: (pos: Game.Vector, direction: Direction) => void
    undo: () => void
    applySim: () => void
    discardSim: () => void
    shiftMarble: (pos: Game.Vector, next: (arg: any) => any, prev?: Marble) => void
    getMarble: (pos: Game.Vector) => Marble
    setMarble: (pos: Game.Vector, marble: Marble) => void
    countMarble: (board: Game.BoardState) => Game.MarbleCount
    increaseCapture: (player: Game.Player, amount: number) => void
    validateBoard: (player: Game.Player) => void
    validateMove: (prevPos: Game.Vector, player: Game.Player) => void
    reset: () => void
}

const useGameStore = create<GameStore>((set, get) => ({
    currentBoard: createBoard(),
    simBoard: createBoard(),
    boardHistory: [],
    winner: null,
    errorMessage: { message: '', update: 0 },
    turns: 1,
    captures: { [Marble.BLACK]: 0, [Marble.WHITE]: 0 },
    currentPlayer: null,
    makeMove: (pos, direction) => {
        const {
            getMarble,
            applySim,
            discardSim,
            currentPlayer,
            shiftMarble,
            countMarble,
            boardHistory,
            validateBoard,
            validateMove,
            increaseCapture,
        } = get()

        const currentColor = getMarble(pos) as Game.Player // current color should eq current player

        const [nextPos, prevPos] = toDirection(direction)

        // validate move
        try {
            validateMove(prevPos(pos), currentColor)
        } catch (e) {
            set({ errorMessage: { message: e.toString(), update: Math.random() } })
            return
        }

        shiftMarble(pos, nextPos)

        // validate move
        try {
            validateBoard(currentColor)
        } catch (e) {
            set({ errorMessage: { message: e.toString(), update: Math.random() } })
            discardSim()
            return
        }

        const opponent = getOtherPlayer(currentColor)
        const marbleCount = countMarble(get().currentBoard)
        const newMarbleCount = countMarble(get().simBoard)

        const opponentMarbleDiff = marbleCount[opponent] - newMarbleCount[opponent]
        const redMarbleDiff = marbleCount[Marble.RED] - newMarbleCount[Marble.RED]
        const changePlayer = opponentMarbleDiff === 0 && redMarbleDiff === 0

        // save to history before applying board
        boardHistory.push({
            board: get().currentBoard,
            player: currentPlayer,
            marbleChange: redMarbleDiff,
        })

        // apply board visuals
        applySim()

        increaseCapture(currentColor, redMarbleDiff)
        if (newMarbleCount[opponent] === 0 || get().captures[currentColor] >= 7) {
            set({ winner: currentColor })
        }
        set((state) => ({ turns: state.turns + 1, errorMessage: { message: '', update: 0 } })) // increment turn and unset error

        // alternate player
        if (currentPlayer === null || changePlayer) {
            set({ currentPlayer: opponent })
        }
    },
    undo: () => {
        const { turns, boardHistory, increaseCapture } = get()
        if (turns === 1) return
        const { board, player, marbleChange } = boardHistory.pop() as Game.History
        set({
            currentPlayer: player,
            currentBoard: board,
            simBoard: board,
            turns: turns - 1,
            winner: null,
        })
        increaseCapture(player!, -marbleChange)
    },
    applySim: () => {
        set({ currentBoard: get().simBoard })
    },
    discardSim: () => {
        set({ simBoard: get().currentBoard })
    },
    shiftMarble: (pos: Game.Vector, next: any, prev = Marble.EMPTY) => {
        const marble = get().getMarble(pos)
        if (marble === Marble.EMPTY) {
            get().setMarble(pos, prev)
        } else {
            get().shiftMarble(next(pos), next, marble)
            get().setMarble(pos, prev)
        }
    },
    getMarble: (pos) => {
        const board = get().simBoard
        try {
            return board[pos[0]][pos[1]] ?? Marble.EMPTY
        } catch (e) {
            return Marble.EMPTY
        }
    },
    setMarble: (pos, marble) => {
        const board = get().simBoard
        try {
            if (board[pos[0]][pos[1]] !== undefined) {
                const newBoard = JSON.parse(JSON.stringify(board)) // deep copy board
                newBoard[pos[0]][pos[1]] = marble
                set({ simBoard: newBoard })
            }
        } catch (e) {
            return
        }
    },
    countMarble: (board) => {
        return board.flat().reduce((acc, cur) => {
            if (acc[cur] === undefined) return { ...acc, [cur]: 1 }
            return { ...acc, [cur]: acc[cur] + 1 }
        }, {} as Game.MarbleCount)
    },
    increaseCapture: (player, amount) => {
        const captures = get().captures
        const val = captures[player] + amount

        set({ captures: { ...captures, [player]: val } })
    },
    validateBoard: (player) => {
        const { boardHistory, simBoard, currentBoard, countMarble } = get()
        const currentMarble = countMarble(currentBoard)
        const simMarble = countMarble(simBoard)
        // player cannot push off own marble
        if (simMarble[player] < currentMarble[player]) {
            throw Error('Cannot push off own marble')
        }
        // player cannot undo opponent's move
        if (boardHistory.length < 2) return
        if (!compareBoards(simBoard, getLast(boardHistory).board)) {
            throw Error("Cannot revert opponent's move")
        }
    },
    validateMove: (prevPos, player) => {
        const { winner, currentPlayer, getMarble } = get()
        if (winner !== null) throw Error('Game already over')
        if (getMarble(prevPos) !== Marble.EMPTY) throw Error('Cannot push in this direction')
        if (currentPlayer !== null && player !== currentPlayer) throw Error('Wrong color')
    },
    reset: () => {
        set({
            currentBoard: createBoard(),
            simBoard: createBoard(),
            boardHistory: [],
            winner: null,
            errorMessage: { message: '', update: 0 },
            turns: 1,
            captures: { [Marble.BLACK]: 0, [Marble.WHITE]: 0 },
            currentPlayer: null,
        })
    },
}))

export default useGameStore
