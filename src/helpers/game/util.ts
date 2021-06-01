import { Game } from '../../types/game'
import { chunk, negateVector, sumVector } from '../helpers'
import {
    Direction,
    edgeMovesTable,
    Marble,
    otherDirectionTable,
    otherPlayerTable,
    Reason,
    vectorTable,
} from './consts'

export const getOtherPlayer = (currentPlayer: Game.Player) => otherPlayerTable[currentPlayer]

export const getOtherDirection = (direction: Direction) => otherDirectionTable[direction]

// TODO: maybe these should return a function based on dir
export const isEdgeMove = ([pos, dir]: Game.Move) => edgeMovesTable[dir].has(pos)

export const getNext = ([pos, dir]: Game.Move) => sumVector(vectorTable[dir], pos)

export const getPrev = ([pos, dir]: Game.Move) => sumVector(negateVector(vectorTable[dir]), pos)

export const getSeries = (
    [pos, dir]: Game.Move,
    getMarble: (pos: Game.Vector) => Marble,
    res: Game.Series = []
): Game.Series => {
    const marble = getMarble(pos)
    if (marble === Marble.EMPTY) {
        return res
    } else if (isEdgeMove([pos, dir])) {
        return [pos, ...res]
    } else {
        return getSeries([getNext([pos, dir]), dir], getMarble, [pos, ...res])
    }
}

export const createBoard = () => {
    const [X, B, W, R] = [Marble.EMPTY, Marble.BLACK, Marble.WHITE, Marble.RED]
    // prettier-ignore
    return [
        W, W, X, X, X, B, B,
        W, W, X, R, X, B, B,
        X, X, R, R, R, X, X,
        X, R, R, R, R, R, X,
        X, X, R, R, R, X, X,
        B, B, X, R, X, W, W,
        B, B, X, X, X, W, W,
    ]
}

export const boardTo2D = (board: Game.BoardState) => chunk(board, 7)

export const countMoves = (moves: Game.MoveTable, player: Game.Player) =>
    Object.values(moves)
        .filter(({ color }) => color === player)
        .reduce((acc, { moves }) => {
            return (
                acc +
                Object.values(moves).reduce((acc, reason) => {
                    if (reason === Reason.NONE) return acc + 1
                    return acc
                }, 0)
            )
        }, 0)

export const countMarble = (board: Game.BoardState) => {
    return board.reduce<Game.MarbleCount>((acc, cur) => {
        if (cur === Marble.EMPTY) return acc
        return { ...acc, [cur]: acc[cur] === undefined ? 1 : acc[cur] + 1 }
    }, {})
}

export const isMarbleEmpty = (marble: Marble) => marble === Marble.EMPTY

export const boardToPieces = (board: Game.BoardState) =>
    board.reduce<Game.Piece[]>((acc, cur, i) => {
        if (!isMarbleEmpty(cur)) {
            return [...acc, { pos: i, color: cur, id: i }]
        }
        return acc
    }, [])

export const boardEqual = (b1: Game.BoardState, b2: Game.BoardState) =>
    JSON.stringify(b1) === JSON.stringify(b2)

export const initHash = (): Game.HashTable =>
    Array(49)
        .fill(0)
        .map(() => {
            const hashArray = new Uint32Array(3)
            window.crypto.getRandomValues(hashArray)
            return hashArray
        })

export const getBoardHash = (board: Game.BoardState, hashTable: any) => {
    return board.reduce((acc, cur, i) => {
        if (cur !== Marble.EMPTY) {
            return acc ^ hashTable[i][cur]
        }
        return acc
    }, 0)
}
