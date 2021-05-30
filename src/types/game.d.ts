import { Direction, Marble, Reason } from '../helpers/game/consts'

export declare namespace Game {
    type BoardState = Game.Vector[]
    type Captures = Record<Game.Player, number>
    type GameState = {
        board: Game.BoardState
        captures: Captures
        turn: number
        currentPlayer: Nullable<Game.Player>
    }
    type Hash = number
    type HashTable = Uint32Array[]
    type History = {
        board: Game.BoardState
        pieces: Game.Piece[]
        player: Nullable<Game.Player>
        marbleChange: number
        hash: Game.Hash
    }
    type MarbleCount = Record<number, number>
    type Move = [Game.Vector, Direction]
    type MoveTable = Record<Game.Vector, { color: Game.Player; moves: Record<Direction, Reason> }>
    type Piece = {
        pos: Game.Vector
        color: Game.Player
        id: number
    }
    type Player = Marble.BLACK | Marble.WHITE
    type Series = Game.Vector[]
    type Vector = number
}
