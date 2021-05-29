import { Direction, Marble, Reason } from '../helpers/game/consts'

export declare namespace Game {
    type BoardState = number[]
    type History = {
        board: Game.BoardState
        pieces: Game.Piece[]
        player: Nullable<Game.Player>
        marbleChange: number
        hash: Game.Hash
    }
    type Captures = { [Marble.BLACK]: number; [Marble.WHITE]: number }
    type Player = Marble.BLACK | Marble.WHITE
    type Vector = number
    type Series = Game.Vector[]
    type MarbleCount = { [key: number]: number }
    type Move = [Game.Vector, Direction]
    type MoveTable = Record<Game.Vector, Record<Direction, Reason>>
    type HashTable = Uint32Array[]
    type Hash = number
    type GameState = {
        board: Game.BoardState
        captures: Captures
        turn: number
        currentPlayer: Nullable<Game.Player>
    }
    type Piece = {
        pos: Game.Vector
        color: Marble
        id: number
    }
}
