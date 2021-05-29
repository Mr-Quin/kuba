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
    currentBoard: Game.BoardState
    simBoard: Game.BoardState
    boardHistory: Game.History[]
    pieces: Game.Piece[]
    simPieces: Game.Piece[]
    moveTable: Nullable<Game.MoveTable>
    winner: Nullable<Marble>
    turn: number
    hashTable: Game.HashTable
    hash: Game.Hash
    errorMessage: { message: string; update: any } // update is used to force re-trigger alert
    captures: Game.Captures
    currentPlayer: Nullable<Game.Player>
    makeMove: (move: Game.Move) => void
    undo: () => void
    commitChange: () => void
    discardChange: () => void
    shiftMarbles: (pos: Game.Vector, dir: Direction) => Promise<void>
    getSeries: (pos: Game.Vector, dir: Direction, res?: Game.Series) => Game.Series
    getMarble: (pos: Game.Vector) => Marble
    setMarble: (pos: Game.Vector, marble: Marble) => void
    countMarble: (board: Game.Piece[]) => Game.MarbleCount
    searchMoves: (player: Game.Player) => Game.MoveTable
    modifyCapture: (player: Game.Player, amount: number) => void
    modifyTurn: (amount: number) => void
    simulateHash: (dir: Direction) => (series: Game.Series) => Game.Hash
    checkBoard: () => Reason
    checkMove: (move: Game.Move, series: Game.Series, player?: Game.Player) => Reason
    setError: (errMessage: Error | string) => void
    reset: () => void
    init: () => void
    encode: () => string
    moveOneTowards: (dir: Direction) => (pos: Game.Vector) => void
    recalculateHash: () => void
}

const useGameStore = create<GameStore>((set, get) => ({
    currentBoard: [],
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
            commitChange,
            currentPlayer,
            shiftMarbles,
            countMarble,
            boardHistory,
            modifyCapture,
            modifyTurn,
            encode,
            setError,
            searchMoves,
            recalculateHash,
        } = get()

        const player = getMarble(pos) as Game.Player // current color should eq current player

        shiftMarbles(pos, direction)
            .then(() => {
                const opponent = getOtherPlayer(player)
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
                    hash: get().hash,
                })

                // apply changes
                commitChange()
                modifyCapture(player, redMarbleDiff)
                recalculateHash()

                const opponentMoves = searchMoves(opponent)
                const myMoves = searchMoves(player)
                const opponentMovesAmt = countMoves(opponentMoves)

                if (
                    !newMarbleCount[opponent] ||
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
        const { board, player, pieces, marbleChange } = boardHistory.pop() as Game.History
        set({
            currentPlayer: player,
            pieces: pieces,
            simPieces: pieces,
            currentBoard: board,
            simBoard: board,
            winner: null,
        })
        if (player !== null) {
            const moves = searchMoves(player)
            set({ moveTable: moves })
        }
        modifyTurn(-1)
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
        const toPos = sumVector(pos, vectorTable[dir])

        const pieces = get().simPieces.map((piece) => {
            if (piece.pos === pos) {
                // only update the position
                return { ...piece, pos: edgeMove ? Position.OFF_GRID : toPos }
            }
            return piece
        })

        set({ simPieces: pieces })

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
        return new Promise<void>((res, rej) => {
            const {
                getSeries,
                moveOneTowards,
                setMarble,
                getMarble,
                checkBoard,
                discardChange,
                moveTable,
                checkMove,
            } = get()

            const marbleSeries = getSeries(pos, dir)

            // Move table is null on first turn
            const preReason =
                moveTable === null
                    ? checkMove([pos, dir], marbleSeries, getMarble(pos) as Game.Player)
                    : moveTable[pos]?.[dir] ?? Reason.NONE

            if (preReason !== Reason.NONE) {
                rej(reasonTable[preReason])
                return
            }

            console.log(`Old hash: ${get().hash}`)
            console.log(`Simulated hash: ${get().simulateHash(dir)(marbleSeries)}`)

            const moveOne = moveOneTowards(dir)
            // propagate moves
            marbleSeries.forEach(moveOne)
            // manually place empty on last space
            setMarble(getLast(marbleSeries), Marble.EMPTY)

            console.log(`New hash: ${getBoardHash(get().simBoard, get().hashTable)}`)

            // const postReason = checkBoard()
            // if (postReason !== Reason.NONE) {
            //     rej(reasonTable[postReason])
            //     discardChange()
            //     return
            // }
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
                const newBoard = [...board]
                newBoard[pos] = marble
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
                .reduce<Game.MoveTable>((acc, { pos }) => {
                    // @ts-ignore
                    const moves: Record<Direction, Reason> = {}

                    directions.forEach((dir) => {
                        const series = getSeries(pos, dir)
                        const move: Game.Move = [pos, dir]
                        // checkMove returns undefined if move is valid
                        moves[dir] = checkMove(move, series, player)
                    })

                    return { ...acc, [pos]: moves }
                }, {})
        )
    },
    checkBoard: () => {
        const { boardHistory, simBoard, hashTable } = get()
        if (boardHistory.length < 2) return Reason.NONE
        // player cannot undo opponent's move
        if (getLast(boardHistory).hash === getBoardHash(simBoard, hashTable)) return Reason.NO_UNDO
        else return Reason.NONE
    },
    checkMove: ([pos, dir], series, player) => {
        const { winner, currentPlayer, getMarble, simulateHash, boardHistory } = get()
        const oppoDir = getOtherDirection(dir)
        const oppoDirVec = vectorTable[oppoDir]
        const last = series[0]
        const curPlayer = player ?? currentPlayer

        if (winner !== null) {
            return Reason.GAME_OVER
        } else if (curPlayer !== null && getMarble(pos) !== curPlayer) {
            return Reason.WRONG_TURN
        } else if (
            !(isEmpty(getMarble(sumVector(pos, oppoDirVec))) || isEdgeMove([pos, oppoDir]))
        ) {
            return Reason.WRONG_DIRECTION
        } else if (isEdgeMove([last, dir]) && getMarble(last) === curPlayer) {
            return Reason.OWN_MARBLE
        } else if (boardHistory.length >= 2) {
            if (simulateHash(dir)(series) === getLast(boardHistory).hash) return Reason.NO_UNDO
        }
        return Reason.NONE
    },
    setError: (errMessage) => {
        // randomized update number to trigger error component re-render
        set({ errorMessage: { message: errMessage.toString(), update: Math.random() } })
    },
    init: () => {
        const hashRoute = getWindowHash()
        const hashTable = get().hashTable

        decodeGameState(hashRoute)
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
                if (currentPlayer !== null) {
                    const moves = get().searchMoves(currentPlayer)
                    set({ moveTable: moves })
                    if (countMoves(moves) === 0) {
                        set({ winner: getOtherPlayer(currentPlayer) })
                    }
                }
            })
            .catch(() => {
                // create new board
                const board = createBoard()
                const hash = getBoardHash(board, hashTable)
                set({
                    currentBoard: board,
                    simBoard: createBoard(),
                    pieces: boardToPieces(board),
                    simPieces: boardToPieces(board),
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
        const { currentBoard, captures, turn, currentPlayer } = get()
        return encodeGameState({ board: currentBoard, captures, turn, currentPlayer })
    },
    recalculateHash: () => {
        const { currentBoard, hashTable } = get()
        set({ hash: getBoardHash(currentBoard, hashTable) })
    },
}))

export default useGameStore
