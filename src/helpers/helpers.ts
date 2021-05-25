import { Game } from '../types/game'

export const getLast = <t>(arr: t[]): t => {
    return arr[arr.length - 1]
}
export const invertVector = (vector: Game.Vector) => -vector

export const sumVector = (vector1: Game.Vector, vector2: Game.Vector) => vector1 + vector2

export const setHash = (path?: string) => {
    window.location.hash = path ?? ''
}

export const readHash = () => {
    return window.location.hash.slice(1)
}

export const chunk = <t>(arr: t[], size: number): t[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    )

export const properCase = (str: string) => {
    const lower = str.toLowerCase()
    return lower.charAt(0).toUpperCase() + lower.slice(1)
}
