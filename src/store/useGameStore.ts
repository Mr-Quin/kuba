import create from 'zustand'
import { Game } from '../types/game'
import {
    getLast,
    getWindowHash,
    invertVector,
    properCase,
    setWindowHash,
    sumVector,
} from '../helpers/helpers'
import {
    boardToPieces,
    compareBoards,
    createBoard,
    decodeGameState,
    Direction,
    encodeGameState,
    getOtherPlayer,
    isEdgeMove,
    isEmpty,
    Marble,
    otherDirectionTable,
    Position,
    toDirection,
    vectorTable,
} from '../helpers/gameUtils'

export interface GameStore {
    currentBoard: Game.BoardState
    simBoard: Game.BoardState
    boardHistory: Game.History[]
    pieces: Game.Piece[]
    simPieces: Game.Piece[]
    winner: Nullable<Marble>
    errorMessage: { message: string; update: any } // update is used to force re-trigger alert
    turn: number
    captures: Game.Captures
    currentPlayer: Nullable<Game.Player>
    makeMove: (move: Game.Move) => void
    undo: () => void
    commitChange: () => void
    discardChange: () => void
    moveSeries: (
        pos: Game.Vector,
        next: (arg: any) => any,
        dir: Direction,
        prev?: Marble
    ) => Promise<void>
    getSeries: (
        pos: Game.Vector,
        next: (arg: any) => any,
        dir: Direction,
        res?: Game.Series
    ) => Game.Series
    getMarble: (pos: Game.Vector) => Marble
    setMarble: (pos: Game.Vector, marble: Marble) => void
    countMarble: (board: Game.Piece[]) => Game.MarbleCount
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
    pieces: [],
    simPieces: [],
    winner: null,
    errorMessage: { message: '', update: 0 },
    turn: 1,
    captures: { [Marble.BLACK]: 0, [Marble.WHITE]: 0 },
    currentPlayer: null,
    makeMove: ([pos, direction]) => {
        const {
            getMarble,
            commitChange,
            discardChange,
            currentPlayer,
            moveSeries,
            countMarble,
            boardHistory,
            validateBoard,
            validateMove,
            modifyCapture,
            encode,
            setError,
        } = get()

        const currentColor = getMarble(pos) as Game.Player // current color should eq current player

        const [nextPos] = toDirection(direction)

        // validate move
        const msg = validateMove([pos, direction], currentColor)
        if (msg !== undefined) {
            setError(msg)
            return
        }

        moveSeries(pos, nextPos, direction).then(() => {
            // console.log(get().pieces, get().simPieces)
        })

        // validate board
        try {
            validateBoard(currentColor)
        } catch (e) {
            setError(e)
            discardChange()
            return
        }

        const opponent = getOtherPlayer(currentColor)
        const marbleCount = countMarble(get().pieces)
        const newMarbleCount = countMarble(get().simPieces)

        const opponentMarbleDiff = marbleCount[opponent] - newMarbleCount[opponent]
        const redMarbleDiff = marbleCount[Marble.RED] - newMarbleCount[Marble.RED]
        const changePlayer = opponentMarbleDiff === 0 && redMarbleDiff === 0

        // save to history before applying board
        boardHistory.push({
            board: get().currentBoard,
            pieces: get().pieces,
            player: currentPlayer,
            marbleChange: redMarbleDiff,
        })

        // apply changes
        commitChange()
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
        const { board, player, pieces, marbleChange } = boardHistory.pop() as Game.History
        set({
            currentPlayer: player,
            pieces: pieces,
            currentBoard: board,
            simBoard: board,
            turn: turn - 1,
            winner: null,
        })
        modifyCapture(player!, -marbleChange)
        setWindowHash(encode())
    },
    commitChange: () => {
        set({ currentBoard: get().simBoard, pieces: get().simPieces })
    },
    discardChange: () => {
        set({ simBoard: get().currentBoard, simPieces: get().pieces })
    },
    moveOne: ([pos, dir]: Game.Move) => {
        const { getMarble, setMarble } = get()

        const edgeMove = isEdgeMove([pos, dir])

        const curMarble = getMarble(pos)
        const prevPos = sumVector(pos, vectorTable[dir])

        const pieces = get().simPieces.map((piece) => {
            if (piece.pos === pos) {
                // only update the position
                return { ...piece, pos: edgeMove ? Position.OFF_GRID : prevPos }
            }
            return piece
        })

        set({ simPieces: pieces })

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
                const newBoard = board.map((m, i) => {
                    if (i === pos) {
                        return marble
                    }
                    return m
                })
                set({ simBoard: newBoard })
            }
        } catch (e) {
            return
        }
    },
    countMarble: (board) => {
        return board.reduce<Game.MarbleCount>((acc, { color: cur, pos, id }) => {
            if (pos === Position.OFF_GRID) return acc
            return { ...acc, [cur]: acc[cur] === undefined ? 1 : acc[cur] + 1 }
        }, {})
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
        const { boardHistory, simBoard, currentBoard, countMarble, pieces, simPieces } = get()
        const currentMarble = countMarble(pieces)
        const simMarble = countMarble(simPieces)
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
                set({
                    currentBoard: board,
                    simBoard: board,
                    pieces: boardToPieces(board),
                    simPieces: boardToPieces(board),
                    turn,
                    currentPlayer,
                    captures,
                })
            })
            .catch((e) => {
                set({
                    currentBoard: createBoard(),
                    simBoard: createBoard(),
                    pieces: boardToPieces(createBoard()),
                    simPieces: boardToPieces(createBoard()),
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
