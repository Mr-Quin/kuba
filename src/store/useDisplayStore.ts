import create from 'zustand'

export interface DisplayStore {
    gridSize: number
    setGridSize: (gridSize: number) => void
}

const useDisplayStore = create<DisplayStore>((set, get) => ({
    gridSize: 0,
    setGridSize: (gridSize) => set({ gridSize }),
}))

export default useDisplayStore
