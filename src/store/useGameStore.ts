import create from 'zustand'
import { Game } from '../types/game'
import { getLast, getWindowHash, setWindowHash, sumVector } from '../helpers/helpers'
import {
    boardToPieces,
    countMoves,
    createBoard,
    getBoardHash,
    getNext,
    getOtherDirection,
    getOtherPlayer,
    initHash,
    isEdgeMove,
    isEmpty,
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
    countMarble: (board: Game.Piece[]) => Game.MarbleCount
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
    moveOneTowards: (dir: Direction) => (pos: Game.Vector) => void
    moveTable: Nullable<Game.MoveTable>
    pieces: Game.Piece[]
    recalculateHash: () => void
    reset: () => void
    searchMoves: (player: Game.Player) => Game.MoveTable
    setError: (errMessage: Error | string) => void
    setMarble: (pos: Game.Vector, marble: Marble) => void
    shiftMarbles: (pos: Game.Vector, dir: Direction) => Promise<Game.Hash>
    simulateHash: (dir: Direction) => (series: Game.Series) => Game.Hash
    turn: number
    undo: () => void
    winner: Nullable<Marble>
}

const useGameStore = create<GameStore>((set, get) => ({
    board: [],
    simBoard: [],
    boardHistory: [],
    pieces: [],
    simPieces: [],
    turn: 1,
    moveTable: null,
    winner: null,
    currentPlayer: null,
    captures: { [Marble.BLACK]: 0, [Marble.WHITE]: 0 },
    hashTable: initHash(),
    hash: 0,
    errorMessage: { message: '', update: 0 },
    makeMove: ([pos, direction]) => {
        const {
            getMarble,
            currentPlayer,
            shiftMarbles,
            countMarble,
            boardHistory,
            modifyCapture,
            modifyTurn,
            encode,
            setError,
            searchMoves,
        } = get()

        const player = getMarble(pos) as Game.Player // current color should eq current player

        shiftMarbles(pos, direction)
            .then((hash) => {
                // the board has been successfully modified
                const opponent = getOtherPlayer(player)
                const curMarbleCount = countMarble(get().pieces)
                const prevMarbleCount = countMarble(
                    getLast(boardHistory)?.pieces ?? boardToPieces(createBoard())
                )

                const opponentMarbleDiff = curMarbleCount[opponent] - prevMarbleCount[opponent]
                const redMarbleDiff = curMarbleCount[Marble.RED] - prevMarbleCount[Marble.RED]
                const changePlayer = opponentMarbleDiff === 0 && redMarbleDiff === 0

                // save to history before committing board
                boardHistory.push({
                    board: get().board,
                    pieces: get().pieces,
                    player: currentPlayer,
                    marbleChange: redMarbleDiff,
                    hash: get().hash,
                })

                set({ hash })

                // apply changes
                modifyCapture(player, redMarbleDiff)

                const opponentMoves = searchMoves(opponent)
                const myMoves = searchMoves(player)
                const opponentMovesAmt = countMoves(opponentMoves, opponent)

                if (
                    !prevMarbleCount[opponent] ||
                    get().captures[player] >= 7 ||
                    opponentMovesAmt === 0
                ) {
                    set({ winner: player })
                }
                modifyTurn(1)

                // alternate player
                if (currentPlayer === null || changePlayer) {
                    set({ currentPlayer: opponent, moveTable: opponentMoves })
                } else {
                    set({ moveTable: myMoves })
                }

                // encode board
                setWindowHash(encode())
            })
            .catch((e) => {
                setError(e)
            })
    },
    undo: () => {
        const { turn, boardHistory, modifyCapture, modifyTurn, searchMoves, encode } = get()
        if (turn <= 1) return
        const { board, player, pieces, marbleChange, hash } = boardHistory.pop() as Game.History
        set({
            currentPlayer: player,
            pieces: pieces,
            board: board,
            winner: null,
            hash,
        })
        if (player !== null) {
            const moves = searchMoves(player)
            set({ moveTable: moves })
        }
        modifyTurn(-1)
        modifyCapture(player!, -marbleChange)
        setWindowHash(encode())
    },
    moveOneTowards: (dir) => (pos) => {
        const { getMarble, setMarble } = get()

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
    },
    simulateHash: (dir) => (series) => {
        const { hashTable, getMarble, hash } = get()

        const table = series.map<[Game.Vector, Marble]>((pos) => [pos, getMarble(pos)])

        // series cannot contain empty marble
        return table.reduce((acc, [fromPos, marble], i) => {
            const toPos = sumVector(fromPos, vectorTable[dir])

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
    shiftMarbles: (pos, dir) => {
        return new Promise<Game.Hash>((res, rej) => {
            const {
                getSeries,
                moveOneTowards,
                setMarble,
                getMarble,
                moveTable,
                checkMove,
                simulateHash,
            } = get()

            const marbleSeries = getSeries(pos, dir)
            const simHash = simulateHash(dir)(marbleSeries)

            // moveTable is null on first turn
            // if reason is not none, the move is invalid
            const preReason =
                moveTable === null
                    ? checkMove([pos, dir], marbleSeries, getMarble(pos) as Game.Player)
                    : moveTable[pos]?.moves[dir] ?? Reason.NONE

            if (preReason !== Reason.NONE) {
                rej(reasonTable[preReason])
                return
            }

            const moveOne = moveOneTowards(dir)
            // propagate moves
            marbleSeries.forEach(moveOne)
            // manually place empty on last space
            setMarble(getLast(marbleSeries), Marble.EMPTY)
            res(simHash)
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
    modifyTurn: (amount) => {
        set((state) => ({ turn: state.turn + amount }))
    },
    searchMoves: (player) => {
        const { pieces, checkMove, getSeries } = get()

        // this only works if Direction enum has string values
        const directions = Object.values(Direction)

        return (
            pieces
                // .filter((piece) => piece.color === player)
                .reduce<Game.MoveTable>((acc, { pos, color }) => {
                    const moves = directions.reduce((acc, dir) => {
                        const series = getSeries(pos, dir)
                        const move = [pos, dir] as Game.Move
                        return { ...acc, [dir]: checkMove(move, series, player) }
                    }, {} as Record<Direction, Reason>)
                    return { ...acc, [pos]: { color, moves } }
                }, {})
        )
    },
    checkMove: ([pos, dir], series, player) => {
        const { winner, currentPlayer, getMarble, simulateHash, boardHistory } = get()
        const oppoDir = getOtherDirection(dir)
        const oppoDirVec = vectorTable[oppoDir]
        const prevPos = sumVector(pos, oppoDirVec)
        const last = series[0]
        const curPlayer = player ?? currentPlayer

        if (winner !== null) {
            return Reason.GAME_OVER
        } else if (curPlayer !== null && getMarble(pos) !== curPlayer) {
            return Reason.WRONG_TURN
        } else if (!(isEmpty(getMarble(prevPos)) || isEdgeMove([pos, oppoDir]))) {
            return Reason.WRONG_DIRECTION
        } else if (isEdgeMove([last, dir]) && getMarble(last) === curPlayer) {
            return Reason.OWN_MARBLE
        } else if (boardHistory.length >= 2) {
            if (simulateHash(dir)(series) === getLast(boardHistory).hash) return Reason.NO_UNDO
        }
        return Reason.NONE
    },
    setError: (errMessage) => {
        // randomized update number to force error component re-render
        set({ errorMessage: { message: errMessage.toString(), update: Math.random() } })
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
                    const moves = get().searchMoves(currentPlayer)
                    set({ moveTable: moves })
                    if (countMoves(moves, currentPlayer) === 0) {
                        set({ winner: getOtherPlayer(currentPlayer) })
                    }
                }
            })
            .catch(() => {
                // create new board
                const board = createBoard()
                const hash = getBoardHash(board, hashTable)
                set({
                    board: board,
                    pieces: boardToPieces(board),
                    turn: 1,
                    winner: null,
                    moveTable: null,
                    currentPlayer: null,
                    captures: { [Marble.BLACK]: 0, [Marble.WHITE]: 0 },
                    hashTable,
                    hash,
                })
            })
            .finally(() => {
                set({
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
        const { board, captures, turn, currentPlayer } = get()
        return encodeGameState({ board: board, captures, turn, currentPlayer })
    },
    recalculateHash: () => {
        const { board, hashTable } = get()
        set({ hash: getBoardHash(board, hashTable) })
    },
}))

export default useGameStore
