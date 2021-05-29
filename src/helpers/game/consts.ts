import { Game } from '../../types/game'

export enum Marble {
    EMPTY = -1,
    WHITE = 0,
    BLACK = 1,
    RED = 2,
}

// string enum is easier to iterate
export enum Direction {
    LEFT = 'l',
    RIGHT = 'r',
    UP = 'u',
    DOWN = 'd',
}

export enum Reason {
    NONE = -1,
    GAME_OVER,
    WRONG_TURN,
    WRONG_DIRECTION,
    OWN_MARBLE,
    NO_UNDO,
}

export enum Position {
    OFF_GRID = -1,
}

export const reasonTable = {
    [Reason.GAME_OVER]: 'Game is already over',
    [Reason.WRONG_TURN]: "Opponent's turn",
    [Reason.WRONG_DIRECTION]: 'Invalid direction',
    [Reason.OWN_MARBLE]: 'Cannot push off own marble',
    [Reason.NO_UNDO]: "Cannot undo opponent's move",
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
    [Direction.DOWN]: new Set([42, 43, 44, 45, 46, 47, 48]),
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
