import create from 'zustand'
import { Game } from '../types/game'
import {
    getLast,
    invertVector,
    properCase,
    getWindowHash,
    setWindowHash,
    sumVector,
} from '../helpers/helpers'
import { compareBoards, createBoard, decodeGameState, encodeGameState } from '../helpers/gameUtils'

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
    [Direction.DOWN]: new Set([43, 44, 45, 46, 47, 48]),
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
const isEdgeMove = ([pos, dir]: Game.Move) => {
    return edgeMovesTable[dir].has(pos)
}

const isEmpty = (marble: Marble) => marble === Marble.EMPTY

const getOtherPlayer = (currentPlayer: Game.Player) => {
    return otherPlayerTable[currentPlayer]
}

const toDirection = (direction: Direction) => {
    const getNextPos = (pos: Game.Vector) => sumVector(vectorTable[direction], pos) as Game.Vector
    const getPrevPos = (pos: Game.Vector) =>
        sumVector(invertVector(vectorTable[direction]), pos) as Game.Vector
    return [getNextPos, getPrevPos]
}

export interface GameStore {
    currentBoard: Game.BoardState
    simBoard: Game.BoardState
    boardHistory: Game.History[]
    winner: Nullable<Marble>
    errorMessage: { message: string; update: any } // update is used to force re-trigger alert
    turn: number
    captures: Game.Captures
    currentPlayer: Nullable<Game.Player>
    makeMove: (move: Game.Move) => void
    undo: () => void
    applySim: () => void
    discardSim: () => void
    moveSeries: (pos: Game.Vector, next: (arg: any) => any, dir: Direction, prev?: Marble) => void
    getSeries: (
        pos: Game.Vector,
        next: (arg: any) => any,
        dir: Direction,
        res?: Game.Series
    ) => Game.Series
    getMarble: (pos: Game.Vector) => Marble
    setMarble: (pos: Game.Vector, marble: Marble) => void
    countMarble: (board: Game.BoardState) => Game.MarbleCount
    findMoves: (player: Game.Player) => Game.Move[]
    modifyCapture: (player: Game.Player, amount: number) => void
    validateBoard: (player: Game.Player) => void
    validateMove: (move: Game.Move, player: Game.Player) => string | undefined
    setError: (errMessage: Error | string) => void
    reset: () => void
    init: () => void
    encode: () => string
    moveOne: (move: Game.Move) => void
}

const useGameStore = create<GameStore>((set, get) => ({
    currentBoard: [],
    simBoard: [],
    boardHistory: [],
    winner: null,
    errorMessage: { message: '', update: 0 },
    turn: 1,
    captures: { [Marble.BLACK]: 0, [Marble.WHITE]: 0 },
    currentPlayer: null,
    makeMove: ([pos, direction]) => {
        const {
            getMarble,
            applySim,
            discardSim,
            currentPlayer,
            moveSeries,
            countMarble,
            boardHistory,
            validateBoard,
            validateMove,
            getSeries,
            modifyCapture,
            encode,
            setError,
        } = get()

        const currentColor = getMarble(pos) as Game.Player // current color should eq current player

        const [nextPos, prevPos] = toDirection(direction)

        // validate move
        const msg = validateMove([pos, direction], currentColor)
        if (msg !== undefined) {
            setError(msg)
            return
        }

        moveSeries(pos, nextPos, direction)

        // validate board
        try {
            validateBoard(currentColor)
        } catch (e) {
            setError(e)
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

        // apply board
        applySim()
        modifyCapture(currentColor, redMarbleDiff)

        if (!newMarbleCount[opponent] || get().captures[currentColor] >= 7) {
            set({ winner: currentColor })
        }
        set((state) => ({ turn: state.turn + 1 })) // increment turn

        // alternate player
        if (currentPlayer === null || changePlayer) {
            set({ currentPlayer: opponent })
        }

        // encode board
        setWindowHash(encode())
    },
    undo: () => {
        const { turn, boardHistory, modifyCapture, encode } = get()
        if (turn === 1) return
        const { board, player, marbleChange } = boardHistory.pop() as Game.History
        set({
            currentPlayer: player,
            currentBoard: board,
            simBoard: board,
            turn: turn - 1,
            winner: null,
        })
        modifyCapture(player!, -marbleChange)
        setWindowHash(encode())
    },
    applySim: () => {
        set({ currentBoard: get().simBoard })
    },
    discardSim: () => {
        set({ simBoard: get().currentBoard })
    },
    moveOne: ([pos, dir]: Game.Move) => {
        const { getMarble, setMarble } = get()

        if (isEdgeMove([pos, dir])) return

        const curMarble = getMarble(pos)
        const prevPos = sumVector(pos, vectorTable[dir])
        console.log(`Moving ${prevPos} to ${pos}, ${Marble[curMarble]}`)
        setMarble(prevPos, curMarble)
    },
    getSeries: (pos, next, dir, res) => {
        if (res === undefined) res = []
        const { getMarble, getSeries } = get()
        const marble = getMarble(pos)
        if (marble === Marble.EMPTY) {
            return res
        } else if (isEdgeMove([pos, dir])) {
            return [pos, ...res]
        } else {
            return getSeries(next(pos), next, dir, [pos, ...res])
        }
    },
    moveSeries: (pos, next, dir) => {
        return new Promise<void>((res, rej) => {
            const { getSeries, moveOne, setMarble } = get()
            const marbleSeries = getSeries(pos, next, dir)
            marbleSeries.forEach((vec) => {
                moveOne([vec, dir])
            })
            setMarble(getLast(marbleSeries), Marble.EMPTY)
            res()
        })
    },
    getMarble: (pos) => {
        const board = get().simBoard
        try {
            return board[pos] ?? Marble.EMPTY
        } catch (e) {
            return Marble.EMPTY
        }
    },
    setMarble: (pos, marble) => {
        const board = get().simBoard
        try {
            if (board[pos] !== undefined) {
                const newBoard = [...board] // deep copy board
                newBoard[pos] = marble
                set({ simBoard: newBoard })
            }
        } catch (e) {
            return
        }
    },
    countMarble: (board) => {
        return board.reduce((acc, cur) => {
            if (acc[cur] === undefined) return { ...acc, [cur]: 1 }
            return { ...acc, [cur]: acc[cur] + 1 }
        }, {} as Game.MarbleCount)
    },
    modifyCapture: (player, amount) => {
        const captures = get().captures
        const val = captures[player] + amount

        set({ captures: { ...captures, [player]: val } })
    },
    findMoves: (player) => {
        return []
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
    validateMove: ([pos, dir], player) => {
        const { winner, currentPlayer, getMarble } = get()
        const vecDir = vectorTable[dir]
        const oppoDir = otherDirectionTable[dir]
        const oppoDirVec = invertVector(vecDir)
        if (winner !== null) return 'Game already over'
        if (!(isEmpty(getMarble(sumVector(pos, oppoDirVec))) || isEdgeMove([pos, oppoDir])))
            return 'Cannot push in this direction'
        if (currentPlayer !== null && player !== currentPlayer)
            return `${properCase(Marble[currentPlayer])}'s turn`
    },
    setError: (errMessage) => {
        set({ errorMessage: { message: errMessage.toString(), update: Math.random() } })
    },
    init: () => {
        const hash = getWindowHash()

        decodeGameState(hash)
            .then(({ board, currentPlayer, turn, captures }) => {
                set({ currentBoard: board, simBoard: board, turn, currentPlayer, captures })
            })
            .catch((e) => {
                set({
                    currentBoard: createBoard(),
                    simBoard: createBoard(),
                    turn: 1,
                    currentPlayer: null,
                    captures: { [Marble.BLACK]: 0, [Marble.WHITE]: 0 },
                })
            })
            .finally(() => {
                set({
                    winner: null,
                    boardHistory: [],
                    errorMessage: { message: '', update: 0 },
                })
            })
    },
    reset: () => {
        setWindowHash()
        get().init()
    },
    encode: () => {
        const { currentBoard, captures, turn, currentPlayer } = get()
        return encodeGameState({ board: currentBoard, captures, turn, currentPlayer })
    },
}))

export default useGameStore
