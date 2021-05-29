import Paper from '@material-ui/core/Paper'
import React, { memo, useCallback, useEffect, useMemo } from 'react'
import useGameStore, { GameStore } from '../store/useGameStore'
import { createStyles, makeStyles } from '@material-ui/core/styles'
import { Game } from '../types/game'
import { useDrag } from 'react-use-gesture'
import { useSpring, animated } from 'react-spring'
import { Direction } from '../helpers/game/consts'

interface Props {
    color: 'red' | 'black' | 'white' | 'empty'
    pos: Game.Vector
    x: number
    y: number
    size: number
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
            touchAction: 'none',
            '&focus': {
                outline: 'none !important',
            },
        },
    })
)

const mapDir = ([x, y]: [number, number]) => {
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
    const { color, pos, size, x: locX, y: locY } = props

    const classes = useStyles(props)
    const makeMove = useGameStore(gameStoreSelector)
    const spring = useMemo(() => ({ x: locX, y: locY }), [locX, locY])

    const handleDrag = useCallback(
        (dir: Direction) => {
            makeMove([pos, dir])
        },
        [pos, makeMove]
    )

    const [{ x, y }, setSpring] = useSpring(() => {
        return { from: spring, config: { mass: 1, tension: 225, friction: 30 } }
    })

    useEffect(() => {
        setSpring(spring)
    }, [spring, setSpring])

    const bind = useDrag(
        ({ down, movement: [mx, my], distance }) => {
            if (!(color === 'black' || color === 'white')) return
            const trigger = distance > 30
            const dir = mapDir([mx, my])
            setSpring({
                x: down ? spring.x + mx : spring.x,
                y: down ? spring.y + my : spring.y,
            })
            if (!down && trigger) handleDrag(dir)
        },
        { lockDirection: true }
    )

    return (
        <AnimatedPaper className={classes.root} {...bind()} style={{ x, y, width: size }}>
            {/*{pos}*/}
        </AnimatedPaper>
    )
})

export default MarblePiece
