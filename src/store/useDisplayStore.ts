import create from 'zustand'
import { Game } from '../types/game'

export interface DisplayStore {
    gridSize: number
    setGridSize: (gridSize: number) => void
    calcPos: (pos: Game.Vector) => Record<'x' | 'y', number>
}

const sizeOffset = 0.8

const useDisplayStore = create<DisplayStore>((set, get) => ({
    gridSize: 0,
    setGridSize: (gridSize) => set({ gridSize }),
    calcPos: (pos) => {
        const { gridSize } = get()
        const offset = (gridSize * (1 - sizeOffset)) / 2
        return {
            x: gridSize * (pos % 7) + offset,
            y: gridSize * Math.floor(pos / 7) + offset,
        }
    },
}))

export default useDisplayStore
