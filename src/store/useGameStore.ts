import create from 'zustand'
import { Game } from '../types/game'
import { getLast, getWindowHash, properCase, setWindowHash, sumVector } from '../helpers/helpers'
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
    validateBoard: () => Voidable<string>
    validateMove: (move: Game.Move, series: Game.Series) => Voidable<string>
    setError: (errMessage: Error | string) => void
    reset: () => void
    init: () => void
    encode: () => string
    moveOneTowards: (dir: Direction) => (pos: Game.Vector) => void
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
            currentPlayer,
            moveSeries,
            countMarble,
            boardHistory,
            modifyCapture,
            encode,
            setError,
        } = get()

        const currentColor = getMarble(pos) as Game.Player // current color should eq current player

        const [nextPos] = toDirection(direction)

        moveSeries(pos, nextPos, direction)
            .then(() => {
                const opponent = getOtherPlayer(currentColor)
                const marbleCount = countMarble(get().pieces)
                const newMarbleCount = countMarble(get().simPieces)

                const opponentMarbleDiff = marbleCount[opponent] - newMarbleCount[opponent]
                const redMarbleDiff = marbleCount[Marble.RED] - newMarbleCount[Marble.RED]
                const changePlayer = opponentMarbleDiff === 0 && redMarbleDiff === 0

                // save to history before committing board
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
            })
            .catch((e) => {
                setError(e)
            })
    },
    undo: () => {
        const { turn, boardHistory, modifyCapture, encode } = get()
        if (turn <= 1) return
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
        set((state) => ({ currentBoard: state.simBoard, pieces: state.simPieces }))
    },
    discardChange: () => {
        set((state) => ({ simBoard: state.currentBoard, simPieces: state.pieces }))
    },
    moveOneTowards: (dir) => (pos) => {
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
    getSeries: (pos, next, dir, res = []) => {
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
            const {
                getSeries,
                moveOneTowards,
                setMarble,
                validateMove,
                validateBoard,
                discardChange,
            } = get()

            const marbleSeries = getSeries(pos, next, dir)

            const preMsg = validateMove([pos, dir], marbleSeries)
            if (preMsg) {
                rej(preMsg)
                return
            }

            const moveOne = moveOneTowards(dir)
            marbleSeries.forEach(moveOne)
            setMarble(getLast(marbleSeries), Marble.EMPTY)

            const postMsg = validateBoard()
            if (postMsg) {
                rej(postMsg)
                discardChange()
                return
            }
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
                const newBoard = board.map((prevMarble, i) => {
                    if (i === pos) {
                        return marble
                    }
                    return prevMarble
                })
                set({ simBoard: newBoard })
            }
        } catch (e) {
            return
        }
    },
    countMarble: (marbles) => {
        return marbles.reduce<Game.MarbleCount>((acc, { color: cur, pos }) => {
            if (pos === Position.OFF_GRID) return acc
            return { ...acc, [cur]: acc[cur] === undefined ? 1 : acc[cur] + 1 }
        }, {})
    },
    modifyCapture: (player, amount) => {
        const captures = get().captures
        const val = captures[player] + amount

        set({ captures: { ...captures, [player]: val } })
    },
    findMoves: () => {
        return []
    },
    validateBoard: () => {
        const { boardHistory, simBoard } = get()
        // player cannot undo opponent's move
        if (boardHistory.length < 2) return
        if (!compareBoards(simBoard, getLast(boardHistory).board))
            return "Cannot revert opponent's move"
    },
    validateMove: ([pos, dir], series) => {
        const { winner, currentPlayer, getMarble } = get()
        const oppoDir = otherDirectionTable[dir]
        const oppoDirVec = vectorTable[oppoDir]
        const last = series[0]

        if (winner !== null) {
            return 'Game is already over'
        } else if (
            !(isEmpty(getMarble(sumVector(pos, oppoDirVec))) || isEdgeMove([pos, oppoDir]))
        ) {
            return 'Cannot push in this direction'
        } else if (isEdgeMove([last, dir])) {
            return 'Cannot push off own marble'
        } else if (currentPlayer !== null && getMarble(pos) !== currentPlayer)
            return `${properCase(Marble[currentPlayer])}'s turn`
    },
    setError: (errMessage) => {
        // randomized update number to trigger error component re-render
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
            .catch(() => {
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
