import React, { memo, useCallback } from 'react'
import Paper from '@material-ui/core/Paper'
import { createStyles, makeStyles } from '@material-ui/core/styles'
import useGameStore, { Direction, GameStore } from '../store/useGameStore'
import { useDrag } from 'react-use-gesture'
import { useSpring, animated } from 'react-spring'

interface Props {
    color: 'red' | 'black' | 'white' | 'empty'
    posRow: number
    posCol: number
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

const selector = (state: GameStore) => state.makeMove

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

const AnimatedPaper = animated(Paper)

const MarblePiece = memo((props: Props) => {
    const { color, posRow, posCol } = props
    const classes = useStyles(props)
    const makeMove = useGameStore(selector)

    const handleClick = useCallback(
        (dir: Direction) => {
            makeMove([[posRow, posCol], dir])
        },
        [posRow, posCol, makeMove]
    )

    const [{ x, y }, set] = useSpring(() => ({ x: 0, y: 0 }))

    const bind = useDrag(
        ({ down, movement: [mx, my], distance }) => {
            if (!(color === 'black' || color === 'white')) return
            const trigger = distance > 30
            const dir = mapDir([mx, my])
            set({ x: down ? mx : 0, y: down ? my : 0 })
            if (!down && trigger) handleClick(dir)
        },
        { lockDirection: true }
    )

    // console.log('render', posRow, posCol)

    return <AnimatedPaper className={classes.root} {...bind()} style={{ x, y }} />
})

export default MarblePiece
