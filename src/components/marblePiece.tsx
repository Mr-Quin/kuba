import Paper from '@material-ui/core/Paper'
import React, { memo, useCallback, useEffect, useState } from 'react'
import useDisplayStore, { DisplayStore } from '../store/useDisplayStore'
import useGameStore, { GameStore } from '../store/useGameStore'
import { createStyles, makeStyles } from '@material-ui/core/styles'
import { Direction } from '../helpers/gameUtils'
import { Game } from '../types/game'
import { useDrag } from 'react-use-gesture'
import { useSpring, animated } from 'react-spring'

interface Props {
    color: 'red' | 'black' | 'white' | 'empty'
    pos: Game.Vector
}

const useStyles = makeStyles(() =>
    createStyles({
        root: {
            background: (props: Props) => {
                switch (props.color) {
                    case 'red':
                        return 'linear-gradient(135deg, #FE5B55 30%, #CC1E23 90%)'
                    case 'black':
                        return 'linear-gradient(135deg, black 30%, #666 90%)'
                    case 'white':
                        return 'linear-gradient(135deg, white 30%, #ddd 90%)'
                    default:
                        return 'none'
                }
            },
            border: 0,
            borderRadius: '50%',
            aspectRatio: '1',
            touchAction: 'none',
            position: 'absolute',
            cursor: (props: Props) =>
                props.color === 'empty' || props.color === 'red' ? 'default' : 'pointer',
            boxShadow: (props: Props) => {
                switch (props.color) {
                    case 'red':
                        return '0 3px 5px 2px rgba(255, 105, 135, .3)'
                    case 'black':
                        return '0 3px 5px 2px rgba(25, 0, 10, .3)'
                    case 'white':
                        return '0 3px 5px 2px rgba(0, 0, 0, .3)'
                    default:
                        return 'none'
                }
            },
            userSelect: 'none',
        },
    })
)

const mapDir = (xyDir: [number, number]) => {
    const [x, y] = xyDir
    if (x === 0) {
        if (y > 0) return Direction.DOWN
        return Direction.UP
    } else {
        if (x > 0) return Direction.RIGHT
        return Direction.LEFT
    }
}

const gameStoreSelector = (state: GameStore) => state.makeMove

const AnimatedPaper = animated(Paper)

const MarblePiece = memo((props: Props) => {
    const { color, pos } = props
    const classes = useStyles(props)
    const makeMove = useGameStore(gameStoreSelector)
    const [gridSize, calc] = useDisplayStore(
        useCallback((state: DisplayStore) => [state.gridSize, state.calcPos], [])
    )
    const [position, setPosition] = useState(calc(pos))

    const handleDrag = useCallback(
        (dir: Direction) => {
            makeMove([pos, dir])
        },
        [pos, makeMove]
    )

    const [{ x, y }, setSpring] = useSpring(() => calc(pos))

    useEffect(() => {
        const newPos = calc(pos)
        setSpring(newPos)
        setPosition(newPos)
    }, [pos, calc, setSpring])

    const bind = useDrag(
        ({ down, movement: [mx, my], distance }) => {
            if (!(color === 'black' || color === 'white')) return
            const trigger = distance > 30
            const dir = mapDir([mx, my])
            setSpring({
                x: down ? position.x + mx : position.x,
                y: down ? position.y + my : position.y,
            })
            if (!down && trigger) handleDrag(dir)
        },
        { lockDirection: true }
    )

    return (
        <AnimatedPaper className={classes.root} {...bind()} style={{ x, y, width: gridSize * 0.8 }}>
            {/*{pos}*/}
        </AnimatedPaper>
    )
})

export default MarblePiece
