import { Direction, Marble } from '../store/useGameStore'

export declare namespace Game {
    type BoardState = number[]
    type History = { board: Game.BoardState; player: Nullable<Game.Player>; marbleChange: number }
    type Captures = { [Marble.BLACK]: number; [Marble.WHITE]: number }
    type Player = Marble.BLACK | Marble.WHITE
    type Vector = number
    type MarbleCount = { [key: number]: number }
    type Move = [Game.Vector, Direction]
    type GameState = {
        board: Game.BoardState
        captures: Captures
        turn: number
        currentPlayer: Nullable<Game.Player>
    }
}
