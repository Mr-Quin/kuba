import create, { PartialState } from 'zustand'
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
    getSeries,
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
    allowExtraTurns: boolean
    board: Game.BoardState
    boardHistory: Game.History[]
    captures: Game.Captures
    checkMove: (move: Game.Move, series: Game.Series, player?: Game.Player) => Reason
    currentPlayer: Nullable<Game.Player>
    encode: () => string
    endTurn: () => void
    errorMessage: { message: string; update: any } // update is used to force re-trigger alert
    getMarble: (pos: Game.Vector) => Marble
    hash: Game.Hash
    hashMove: (dir: Direction) => (series: Game.Series) => Game.Hash
    hashTable: Game.HashTable
    init: () => void
    makeMove: (move: Game.Move) => void
    moveTable: Nullable<Game.MoveTable>
    pieces: Game.Piece[]
    preCheckMove: (move: Game.Move) => Promise<Game.Move>
    propagateMove: (
        dir: Direction
    ) => (series: Game.Series) => Promise<Pick<GameStore, 'hash' | 'board' | 'pieces'>>
    pushHistory: () => void
    reset: () => void
    searchMoves: () => Game.MoveTable
    setError: (errMessage: Error | string) => void
    toggleExtraTurn: () => void
    tryMove: (move: Game.Move) => (series: Game.Series) => Promise<Game.Series>
    turn: number
    undo: () => void
    updateRoute: () => Promise<void>
    updateState: (
        player: Game.Player
    ) => (state: Pick<GameStore, 'hash' | 'board' | 'pieces'>) => Promise<PartialStore>
    winner: Nullable<Game.Player>
}

type PartialStore = PartialState<GameStore, keyof GameStore>

const gameInitState = {
    allowExtraTurns: true,
    board: [],
    boardHistory: [],
    captures: { [Marble.BLACK]: 0, [Marble.WHITE]: 0 },
    currentPlayer: null,
    errorMessage: { message: '', update: 0 },
    hash: 0,
    hashTable: initHash(),
    moveTable: null,
    pieces: [],
    turn: 1,
    winner: null,
}

const useGameStore = create<GameStore>((set, get) => ({
    ...gameInitState,
    makeMove: (move) => {
        const {
            getMarble,
            tryMove,
            preCheckMove,
            setError,
            updateRoute,
            updateState,
            propagateMove,
        } = get()

        const [pos, dir] = move

        const player = getMarble(pos) as Game.Player // current color should eq current player

        preCheckMove(move)
            .then(() => getSeries(move, getMarble))
            .then(tryMove(move))
            .then(propagateMove(dir))
            .then(updateState(player))
            .then(set)
            .then(updateRoute)
            .catch(setError)
    },
    tryMove:
        ([pos, dir]) =>
        (series) => {
            const { getMarble, moveTable, checkMove, currentPlayer } = get()

            // manually check move is player or table is null
            // if reason is not none, the move is invalid
            const reason =
                currentPlayer === null || moveTable === null
                    ? checkMove([pos, dir], series, getMarble(pos) as Game.Player)
                    : moveTable[pos]?.moves[dir] ?? Reason.WRONG_TURN

            if (reason !== Reason.NONE) {
                return Promise.reject(reasonTable[reason])
            }

            return Promise.resolve(series)
        },
    propagateMove: (dir) => (series) => {
        const { hashMove, board, pieces, pushHistory } = get()

        // save to history before modifying anything
        pushHistory()

        const firstPos = getLast(series)
        const simHash = hashMove(dir)(series)

        // TODO: no mutation?
        const newBoard = [...board]
        const newPieces = [...pieces]

        series.forEach((pos) => {
            const edgeMove = isEdgeMove([pos, dir])
            const curMarble = newBoard[pos] ?? Marble.EMPTY
            const toPos = sumVector(pos, vectorTable[dir])

            const piecePos = newPieces.findIndex((piece) => piece.pos === pos)

            if (edgeMove) {
                newPieces[piecePos] = { ...newPieces[piecePos], pos: Position.OFF_GRID }
            } else {
                newPieces[piecePos] = { ...newPieces[piecePos], pos: toPos }
                newBoard[toPos] = curMarble
            }
        })
        // manually set first pos
        newBoard[firstPos] = Marble.EMPTY

        return Promise.resolve({ hash: simHash, board: newBoard, pieces: newPieces })
    },
    hashMove: (dir) => (series) => {
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
    getMarble: (pos) => {
        const board = get().board
        return board[pos] ?? Marble.EMPTY
    },
    searchMoves: () => {
        const { pieces, checkMove, getMarble } = get()
        // this only works if Direction enum has string values
        const directions = Object.values(Direction)
        return pieces
            .filter((piece) => piece.color !== Marble.RED && piece.pos !== Position.OFF_GRID)
            .reduce<Game.MoveTable>((acc, { pos, color }) => {
                const moves = directions.reduce((acc, dir) => {
                    const series = getSeries([pos, dir], getMarble)
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
        const { getMarble, hashMove, boardHistory } = get()
        const oppoDir = getOtherDirection(dir)
        const prevPos = getPrev([pos, dir])
        const last = series[0]
        const first = getLast(series)

        if (!(isMarbleEmpty(getMarble(prevPos)) || isEdgeMove([pos, oppoDir]))) {
            return Reason.WRONG_DIRECTION
        } else if (isEdgeMove([last, dir]) && getMarble(last) === getMarble(first)) {
            return Reason.OWN_MARBLE
        } else if (boardHistory.length > 1) {
            const simHash = hashMove(dir)(series)
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

        decodeGameState(hashRoute)
            .then(({ board, currentPlayer, turn, captures }) => {
                set({
                    board: board,
                    pieces: boardToPieces(board),
                    turn,
                    currentPlayer,
                    captures,
                })
                // TODO: redo the finding winner part
                set((state) => ({ moveTable: state.searchMoves() }))
                if (currentPlayer !== null) {
                    const moves = get().searchMoves()
                    set({ moveTable: moves })

                    const opponent = getOtherPlayer(currentPlayer)
                    const opponentMoves = countMoves(moves, opponent)
                    const myMoves = countMoves(moves, currentPlayer)

                    if (myMoves === 0) {
                        set({ winner: opponent })
                    } else if (opponentMoves === 0) {
                        set({ winner: currentPlayer })
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
                set((state) => {
                    return {
                        moveTable: state.searchMoves(),
                        hash: getBoardHash(state.board, state.hashTable),
                        errorMessage: { message: '', update: 0 },
                    }
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
    updateState: (player) => (state) => {
        const {
            boardHistory,
            allowExtraTurns,
            captures: prevCaptures,
            currentPlayer,
            searchMoves,
            turn,
        } = get()

        const nextMoves = searchMoves()

        const opponent = getOtherPlayer(player)
        const curMarbleCount = countMarble(state.board)
        const prevMarbleCount = countMarble(getLast(boardHistory)?.board ?? createBoard())

        const opponentMarbleDiff = prevMarbleCount[opponent] - curMarbleCount[opponent]
        const redMarbleDiff = prevMarbleCount[Marble.RED] - curMarbleCount[Marble.RED]
        const newPlayerCaptures = prevCaptures[player] + redMarbleDiff
        const changePlayer = allowExtraTurns
            ? currentPlayer === null || (opponentMarbleDiff === 0 && redMarbleDiff === 0)
            : true

        const nextPlayer = changePlayer ? opponent : currentPlayer

        const opponentMovesAmt = countMoves(nextMoves, opponent)

        // wins if opponent has 0 marble or if captured 7 red marble or if opponent has no moves
        const playerWins =
            prevMarbleCount[opponent] === 0 || newPlayerCaptures >= 7 || opponentMovesAmt === 0

        return Promise.resolve({
            currentPlayer: nextPlayer,
            moveTable: playerWins ? null : nextMoves,
            winner: playerWins ? player : null,
            turn: changePlayer ? turn + 1 : turn,
            captures: { ...prevCaptures, [player]: newPlayerCaptures },
            ...state,
        } as PartialStore)
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
                moveTable: null, // recalculate move table when a move is made
                turn: currentPlayer !== state.currentPlayer ? state.turn - 1 : state.turn,
            }
        })

        setWindowHash(encode())
    },
    reset: () => {
        setWindowHash()
        get().init()
    },
    updateRoute: () => {
        setWindowHash(get().encode())
        return Promise.resolve()
    },
    encode: () => {
        const { board, captures, turn, currentPlayer } = get()
        return encodeGameState({ board: board, captures, turn, currentPlayer })
    },
}))

export default useGameStore
