import React, { useCallback } from 'react'
import { makeStyles, createStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import useGameStore, { GameStore } from '../store/useGameStore'
import MarblePiece from './marblePiece'
import BoardGrid from './boardGrid'
import { Marble, Position } from '../helpers/gameUtils'
import useDisplayStore, { DisplayStore } from '../store/useDisplayStore'

const useStyles = makeStyles((theme) =>
    createStyles({
        grid: {
            userSelect: 'none',
            touchAction: 'none',
        },
        paper: {
            padding: theme.spacing(1),
            color: theme.palette.text.secondary,
        },
    })
)

const selector = (state: GameStore) => state.pieces

const Board = () => {
    const classes = useStyles()
    const marbles = useGameStore(selector)
    const [gridSize, calc] = useDisplayStore(
        useCallback((state: DisplayStore) => [state.gridSize, state.calcPos], [])
    )

    return (
        <Grid className={classes.grid} container>
            <BoardGrid />
            {marbles
                .filter((marble) => marble.pos !== Position.OFF_GRID)
                .map((marble) => {
                    const { x, y } = calc(marble.pos)
                    return (
                        <MarblePiece
                            color={Marble[marble.color].toLowerCase() as any}
                            size={gridSize * 0.8}
                            pos={marble.pos}
                            x={x}
                            y={y}
                            key={marble.id}
                        />
                    )
                })}
        </Grid>
    )
}

export default Board
