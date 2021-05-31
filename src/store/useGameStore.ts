import create from 'zustand'
import { Game } from '../types/game'
import { getLast, getWindowHash, setWindowHash, sumVector } from '../helpers/helpers'
import {
    boardToPieces,
    countMarble,
    countMoves,
    createBoard,
    getBoardHash,
    getNext,
    getOtherDirection,
    getOtherPlayer,
    getPrev,
    initHash,
    isEdgeMove,
    isMarbleEmpty,
} from '../helpers/game/util'
import { decodeGameState, encodeGameState } from '../helpers/game/record'
import {
    Direction,
    Marble,
    Position,
    Reason,
    reasonTable,
    vectorTable,
} from '../helpers/game/consts'

export interface GameStore {
    board: Game.BoardState
    boardHistory: Game.History[]
    captures: Game.Captures
    checkMove: (move: Game.Move, series: Game.Series, player?: Game.Player) => Reason
    currentPlayer: Nullable<Game.Player>
    encode: () => string
    errorMessage: { message: string; update: any } // update is used to force re-trigger alert
    getMarble: (pos: Game.Vector) => Marble
    getSeries: (pos: Game.Vector, dir: Direction, res?: Game.Series) => Game.Series
    hash: Game.Hash
    hashTable: Game.HashTable
    init: () => void
    makeMove: (move: Game.Move) => void
    modifyCapture: (player: Game.Player, amount: number) => void
    modifyTurn: (amount: number) => void
    propagateMove: (dir: Direction) => (series: Game.Series) => void
    moveTable: Nullable<Game.MoveTable>
    pieces: Game.Piece[]
    reset: () => void
    searchMoves: () => Game.MoveTable
    setError: (errMessage: Error | string) => void
    setMarble: (pos: Game.Vector, marble: Marble) => void
    tryMove: (move: Game.Move) => Promise<Game.Hash>
    simulateMove: (dir: Direction) => (series: Game.Series) => Game.Hash
    turn: number
    undo: () => void
    preCheckMove: (move: Game.Move) => Promise<Game.Move>
    pushHistory: () => void
    allowExtraTurns: boolean
    toggleExtraTurn: () => void
    endTurn: () => void
    winner: Nullable<Game.Player>
}

const gameInitState = {
    board: [],
    boardHistory: [],
    pieces: [],
    turn: 1,
    moveTable: null,
    winner: null,
    currentPlayer: null,
    captures: { [Marble.BLACK]: 0, [Marble.WHITE]: 0 },
    hashTable: initHash(),
    hash: 0,
    allowExtraTurns: true,
    errorMessage: { message: '', update: 0 },
}

const useGameStore = create<GameStore>((set, get) => ({
    ...gameInitState,
    makeMove: ([pos, direction]) => {
        const {
            getMarble,
            currentPlayer,
            tryMove,
            boardHistory,
            encode,
            searchMoves,
            preCheckMove,
            allowExtraTurns,
        } = get()

        // TODO: player should be returned by shiftMarble
        const player = getMarble(pos) as Game.Player // current color should eq current player

        preCheckMove([pos, direction])
            .then(tryMove)
            .then((hash) => {
                set({ hash })
                // the board has been successfully modified
                const opponent = getOtherPlayer(player)
                const curMarbleCount = countMarble(get().board)
                const prevMarbleCount = countMarble(getLast(boardHistory)?.board ?? createBoard())

                const opponentMarbleDiff = prevMarbleCount[opponent] - curMarbleCount[opponent]
                const redMarbleDiff = prevMarbleCount[Marble.RED] - curMarbleCount[Marble.RED]
                const changePlayer = allowExtraTurns
                    ? currentPlayer === null || (opponentMarbleDiff === 0 && redMarbleDiff === 0)
                    : true

                const nextPlayer = changePlayer ? opponent : currentPlayer
                const nextMoves = searchMoves()
                const opponentMovesAmt = countMoves(nextMoves, opponent)

                const playerWins =
                    prevMarbleCount[opponent] === 0 ||
                    get().captures[player] >= 7 ||
                    opponentMovesAmt === 0

                // apply changes
                set((state) => {
                    const newCapAmt = state.captures[player] + redMarbleDiff
                    return {
                        currentPlayer: nextPlayer,
                        moveTable: playerWins ? null : nextMoves,
                        winner: playerWins ? player : null,
                        turn: changePlayer ? state.turn + 1 : state.turn,
                        captures: { ...state.captures, [player]: newCapAmt },
                    }
                })

                // encode board
                setWindowHash(encode())
            })
            .catch(get().setError)
    },
    undo: () => {
        const { turn, boardHistory, encode } = get()
        if (turn <= 1) return

        const {
            board,
            player: currentPlayer,
            pieces,
            captures,
            hash,
        } = boardHistory.pop() as Game.History
        set((state) => {
            return {
                currentPlayer,
                captures,
                pieces,
                board,
                hash,
                winner: null,
                moveTable: state.searchMoves(),
                turn: currentPlayer !== state.currentPlayer ? state.turn - 1 : state.turn,
            }
        })

        setWindowHash(encode())
    },
    propagateMove: (dir) => (series) => {
        const { getMarble, setMarble } = get()

        // TODO: put into setMarble
        series.forEach((pos) => {
            const edgeMove = isEdgeMove([pos, dir])
            const curMarble = getMarble(pos)
            const toPos = sumVector(pos, vectorTable[dir])

            const pieces = get().pieces.map((piece) => {
                if (piece.pos === pos) {
                    // only update the position
                    return { ...piece, pos: edgeMove ? Position.OFF_GRID : toPos }
                }
                return piece
            })
            set({ pieces: pieces })

            if (!edgeMove) {
                setMarble(toPos, curMarble)
            }
        })
        setMarble(getLast(series), Marble.EMPTY)
    },
    simulateMove: (dir) => (series) => {
        const { hashTable, getMarble, hash } = get()

        // series cannot contain empty marble
        return series.reduce((acc, fromPos, i) => {
            const marble = getMarble(fromPos)
            const toPos = getNext([fromPos, dir])
            // edge move can only happen on idx = 1
            if (i === 0 && isEdgeMove([fromPos, dir])) {
                return acc ^ hashTable[fromPos][marble]
            }
            return acc ^ hashTable[fromPos][marble] ^ hashTable[toPos][marble]
        }, hash)
    },
    getSeries: (pos, dir, res = []) => {
        const { getMarble, getSeries } = get()
        const marble = getMarble(pos)
        if (marble === Marble.EMPTY) {
            return res
        } else if (isEdgeMove([pos, dir])) {
            return [pos, ...res]
        } else {
            return getSeries(getNext([pos, dir]), dir, [pos, ...res])
        }
    },
    tryMove: ([pos, dir]) => {
        return new Promise<Game.Hash>((res, rej) => {
            const {
                getSeries,
                propagateMove,
                getMarble,
                moveTable,
                checkMove,
                simulateMove,
                currentPlayer,
                pushHistory,
            } = get()

            const marbleSeries = getSeries(pos, dir)

            // manually check move is player or table is null
            // if reason is not none, the move is invalid
            const reason =
                currentPlayer === null || moveTable === null
                    ? checkMove([pos, dir], marbleSeries, getMarble(pos) as Game.Player)
                    : moveTable[pos]?.moves[dir] ?? Reason.WRONG_TURN

            if (reason !== Reason.NONE) {
                rej(reasonTable[reason])
                return
            }

            // save to history before committing board
            pushHistory()
            propagateMove(dir)(marbleSeries)
            res(simulateMove(dir)(marbleSeries))
        })
    },
    getMarble: (pos) => {
        const board = get().board
        try {
            return board[pos] ?? Marble.EMPTY
        } catch (e) {
            return Marble.EMPTY
        }
    },
    setMarble: (pos, marble) => {
        const board = get().board
        try {
            if (board[pos] !== undefined) {
                const newBoard = [...board]
                newBoard[pos] = marble
                set({ board: newBoard })
            }
        } catch (e) {
            return
        }
    },
    modifyCapture: (player, amount) => {
        const captures = get().captures
        const val = captures[player] + amount

        set({ captures: { ...captures, [player]: val } })
    },
    modifyTurn: (amount) => {
        set((state) => ({ turn: state.turn + amount }))
    },
    searchMoves: () => {
        const { pieces, checkMove, getSeries } = get()

        // this only works if Direction enum has string values
        const directions = Object.values(Direction)

        return pieces
            .filter((piece) => piece.color !== Marble.RED && piece.pos !== Position.OFF_GRID)
            .reduce<Game.MoveTable>((acc, { pos, color }) => {
                const moves = directions.reduce((acc, dir) => {
                    const series = getSeries(pos, dir)
                    const move = [pos, dir] as Game.Move
                    return { ...acc, [dir]: checkMove(move, series) }
                }, {} as Record<Direction, Reason>)
                return { ...acc, [pos]: { color: color as Game.Player, moves } }
            }, {})
    },
    preCheckMove: (move) => {
        const { getMarble, currentPlayer, winner } = get()
        if (winner === null) {
            if (currentPlayer === null || getMarble(move[0]) === currentPlayer) {
                return Promise.resolve(move)
            } else {
                return Promise.reject(reasonTable[Reason.WRONG_TURN])
            }
        } else {
            return Promise.reject(reasonTable[Reason.GAME_OVER])
        }
    },
    checkMove: ([pos, dir], series) => {
        const { getMarble, simulateMove, boardHistory } = get()
        const oppoDir = getOtherDirection(dir)
        const prevPos = getPrev([pos, dir])
        const last = series[0]
        const first = getLast(series)

        if (!(isMarbleEmpty(getMarble(prevPos)) || isEdgeMove([pos, oppoDir]))) {
            return Reason.WRONG_DIRECTION
        } else if (isEdgeMove([last, dir]) && getMarble(last) === getMarble(first)) {
            return Reason.OWN_MARBLE
        } else if (boardHistory.length > 1) {
            const simHash = simulateMove(dir)(series)
            const prevHash = getLast(boardHistory).hash
            if (simHash === prevHash) return Reason.NO_UNDO
        }
        return Reason.NONE
    },
    pushHistory: () => {
        const { boardHistory, board, pieces, currentPlayer: player, captures, hash } = get()
        boardHistory.push({
            board,
            pieces,
            player,
            captures,
            hash,
        })
    },
    init: () => {
        const hashRoute = getWindowHash()
        const hashTable = get().hashTable

        decodeGameState(hashRoute)
            .then(({ board, currentPlayer, turn, captures }) => {
                set({
                    board: board,
                    pieces: boardToPieces(board),
                    turn,
                    currentPlayer,
                    captures,
                })
                if (currentPlayer !== null) {
                    const moves = get().searchMoves()
                    set({ moveTable: moves })
                    if (countMoves(moves, currentPlayer) === 0) {
                        set({ winner: getOtherPlayer(currentPlayer) })
                    }
                }
            })
            .catch(() => {
                // create new board
                const board = createBoard()
                set({
                    ...gameInitState,
                    board: board,
                    pieces: boardToPieces(board),
                })
            })
            .finally(() => {
                const board = get().board
                const hash = getBoardHash(board, hashTable)
                set({
                    hash,
                    errorMessage: { message: '', update: 0 },
                })
            })
    },
    setError: (errMessage) => {
        // randomized update number to force error component re-render
        set({ errorMessage: { message: errMessage.toString(), update: Math.random() } })
    },
    toggleExtraTurn: () => {
        set((state) => ({ allowExtraTurns: !state.allowExtraTurns }))
    },
    endTurn: () => {
        const { currentPlayer } = get()
        if (currentPlayer === null) return
        set({ currentPlayer: getOtherPlayer(currentPlayer) })
    },
    reset: () => {
        setWindowHash()
        get().init()
    },
    encode: () => {
        const { board, captures, turn, currentPlayer } = get()
        return encodeGameState({ board: board, captures, turn, currentPlayer })
    },
}))

export default useGameStore
