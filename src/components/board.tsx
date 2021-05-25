import React from 'react'
import { makeStyles, createStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import useGameStore, { GameStore, Marble } from '../store/useGameStore'
import MarblePiece from './marblePiece'
import shallow from 'zustand/shallow'
import { boardTo2D } from '../helpers/gameUtils'

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

const selector = (state: GameStore) => state.currentBoard

const Board = () => {
    const classes = useStyles()
    const currentBoard = useGameStore(selector, shallow)

    return (
        <>
            <Grid className={classes.grid} container>
                {boardTo2D(currentBoard).map((row, i) => {
                    return (
                        <Grid container item spacing={0} key={i}>
                            {row.map((cell, j) => {
                                return (
                                    <Grid item xs key={j}>
                                        <Paper className={classes.paper} variant="outlined" square>
                                            <MarblePiece
                                                color={Marble[cell].toLowerCase() as any}
                                                posRow={i}
                                                posCol={j}
                                            />
                                        </Paper>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    )
                })}
            </Grid>
        </>
    )
}

export default Board
