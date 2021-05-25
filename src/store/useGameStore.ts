import create from 'zustand'
import { Game } from '../types/game'
import {
    getLast,
    invertVector,
    properCase,
    readWindowHash,
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
    LEFT = 0,
    RIGHT = 1,
    UP = 2,
    DOWN = 3,
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
    [Direction.LEFT]: [0, -1],
    [Direction.RIGHT]: [0, 1],
    [Direction.UP]: [-1, 0],
    [Direction.DOWN]: [1, 0],
}

export const otherPlayerTable: Record<Game.Player, Game.Player> = {
    [Marble.WHITE]: Marble.BLACK,
    [Marble.BLACK]: Marble.WHITE,
}

const toDirection = (direction: Direction) => {
    const nextPos = (pos: Game.Vector) => sumVector(vectorTable[direction], pos) as Game.Vector
    const prevPos = (pos: Game.Vector) =>
        sumVector(invertVector(vectorTable[direction]), pos) as Game.Vector
    return [nextPos, prevPos]
}

export interface GameStore {
    applySim: () => void
    boardHistory: Game.History[]
    captures: Game.Captures
    countMarble: (board: Game.BoardState) => Game.MarbleCount
    isValidMove: (move: Game.Move) => boolean
    currentBoard: Game.BoardState
    currentPlayer: Nullable<Game.Player>
    discardSim: () => void
    encodeGame: () => string
    errorMessage: { message: string; update: any } // update is used to force re-trigger alert
    findMoves: (player: Game.Player) => Game.Move
    getMarble: (pos: Game.Vector) => Marble
    init: () => void
    makeMove: (move: Game.Move) => void
    modifyCapture: (player: Game.Player, amount: number) => void
    reset: () => void
    setError: (errMessage: Error | string) => void
    setMarble: (pos: Game.Vector, marble: Marble) => void
    shiftMarble: (pos: Game.Vector, next: (arg: any) => any, prev?: Marble) => void
    simBoard: Game.BoardState
    turn: number
    undo: () => void
    pushHistory: (history: Game.History) => void
    popHistory: () => Game.History
    validateBoard: (player: Game.Player) => void
    canMakeMove: (prevPos: Game.Vector, player: Game.Player) => string | undefined
    winner: Nullable<Marble>
}

const useGameStore = create<GameStore>((set, get) => ({
    currentBoard: createBoard(),
    simBoard: createBoard(),
    boardHistory: [],
    winner: null,
    currentPlayer: null,
    errorMessage: { message: '', update: 0 },
    turn: 1,
    captures: { [Marble.BLACK]: 0, [Marble.WHITE]: 0 },
    makeMove: (move) => {
        const {
            applySim,
            canMakeMove,
            countMarble,
            currentPlayer,
            discardSim,
            encodeGame,
            getMarble,
            modifyCapture,
            pushHistory,
            setError,
            shiftMarble,
            validateBoard,
        } = get()
        const [pos, dir] = move

        const selectedColor = getMarble(pos) as Game.Player // current color should eq current player

        const [nextPos, prevPos] = toDirection(dir)

        // validate move
        const ret = canMakeMove(prevPos(pos), selectedColor)
        if (ret) {
            setError(ret)
            return
        }

        shiftMarble(pos, nextPos)

        // validate board
        try {
            validateBoard(selectedColor)
        } catch (e) {
            setError(e)
            discardSim()
            return
        }

        const opponent = otherPlayerTable[selectedColor]
        const marbleCount = countMarble(get().currentBoard)
        const newMarbleCount = countMarble(get().simBoard)

        const opponentMarbleDiff = marbleCount[opponent] - newMarbleCount[opponent]
        const redMarbleDiff = marbleCount[Marble.RED] - newMarbleCount[Marble.RED]
        const changePlayer = opponentMarbleDiff === 0 && redMarbleDiff === 0

        // save to history before applying board
        pushHistory({
            board: get().currentBoard,
            player: currentPlayer,
            marbleChange: redMarbleDiff,
        })

        // apply board
        applySim()
        modifyCapture(selectedColor, redMarbleDiff)

        if (!newMarbleCount[opponent] || get().captures[selectedColor] >= 7) {
            set({ winner: selectedColor })
        }
        set((state) => ({ turn: state.turn + 1 })) // increment turn

        // alternate player
        if (currentPlayer === null || changePlayer) {
            set({ currentPlayer: opponent })
        }

        // get().findMoves(get().currentPlayer as Game.Player)

        // encodeGame board
        setWindowHash(encodeGame())
    },
    undo: () => {
        const { turn, popHistory, modifyCapture, encodeGame } = get()
        if (turn === 1) return
        // slice instead of pop to avoid mutation
        const { board, player, marbleChange } = popHistory()
        set({
            currentPlayer: player,
            currentBoard: board,
            simBoard: board,
            turn: turn - 1,
            winner: null,
        })
        modifyCapture(player!, -marbleChange)
        setWindowHash(encodeGame())
    },
    pushHistory: (history) => {
        set((state) => ({ boardHistory: [...state.boardHistory, history] }))
    },
    popHistory: () => {
        const { boardHistory } = get()

        const pop = boardHistory.slice(-1)[0] as Game.History
        set({ boardHistory: boardHistory.slice(0, -1) })

        return pop
    },
    applySim: () => {
        set({ currentBoard: get().simBoard })
    },
    discardSim: () => {
        set({ simBoard: get().currentBoard })
    },
    shiftMarble: (pos: Game.Vector, next: any, prev = Marble.EMPTY) => {
        const { getMarble, setMarble, shiftMarble } = get()

        const marble = getMarble(pos)
        if (marble === Marble.EMPTY) {
            setMarble(pos, prev)
        } else {
            shiftMarble(next(pos), next, marble)
            setMarble(pos, prev)
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
    modifyCapture: (player, amount) => {
        const captures = get().captures
        captures[player] += amount
    },
    findMoves: (player) => {
        const { currentBoard, isValidMove } = get()

        //TODO: implement this
        currentBoard.forEach((row, i) => {
            row.forEach((marble, j) => {
                if (marble === player) {
                    Object.values(Direction).forEach((dir) => {
                        if (Number.isInteger(parseInt(dir as string))) {
                            console.log([i, j], dir, isValidMove([[i, j], dir as Direction]))
                        }
                    })
                }
            })
        })
        return [[0, 0], 0]
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
    /**
     * Pre-check if any move can be made by player
     */
    canMakeMove: (prevPos, player) => {
        const { winner, currentPlayer, getMarble } = get()

        if (winner !== null) return 'Game already over'
        if (currentPlayer !== null && player !== currentPlayer)
            return `${properCase(Marble[currentPlayer])}'s turn`
        if (getMarble(prevPos) !== Marble.EMPTY) return 'Cannot push in this direction'
    },
    /**
     * Check if a move is valid
     */
    isValidMove: ([pos, dir]) => {
        const { getMarble } = get()

        const dirVec = vectorTable[dir]
        const dest = sumVector(pos, invertVector(dirVec))
        return getMarble(dest) === Marble.EMPTY
    },
    setError: (errMessage) => {
        set({ errorMessage: { message: errMessage.toString(), update: Math.random() } })
    },
    init: () => {
        const hash = readWindowHash()
        decodeGameState(hash)
            .then(({ board, currentPlayer, turn, captures }) => {
                set({ currentBoard: board, simBoard: board, turn, currentPlayer, captures })
            })
            .catch(() => {
                // on error fallback
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
    encodeGame: () => {
        const { currentBoard, captures, turn, currentPlayer } = get()
        return encodeGameState({ board: currentBoard, captures, turn, currentPlayer })
    },
}))

export default useGameStore
