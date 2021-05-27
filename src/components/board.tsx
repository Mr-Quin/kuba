import React from 'react'
import { makeStyles, createStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import useGameStore, { GameStore } from '../store/useGameStore'
import MarblePiece from './marblePiece'
import shallow from 'zustand/shallow'
import BoardGrid from './boardGrid'
import { Marble, Position } from '../helpers/gameUtils'

const useStyles = makeStyles((theme) =>
    createStyles({
        grid: {
            userSelect: 'none',
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
    const marbles = useGameStore(selector, shallow)

    return (
        <Grid className={classes.grid} container>
            <BoardGrid />
            {marbles
                .filter((marble) => marble.pos !== Position.OFF_GRID)
                .map((marble, i) => {
                    return (
                        <MarblePiece
                            color={Marble[marble.color].toLowerCase() as any}
                            pos={marble.pos}
                            key={marble.id}
                        />
                    )
                })}
        </Grid>
    )
}

export default Board
