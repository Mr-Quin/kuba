import React from 'react'
import { makeStyles, createStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import gameStore, { Marble } from '../store/gameStore'
import { StateSelector } from 'zustand'
import MarblePiece from './marblePiece'

const useStyles = makeStyles((theme) =>
    createStyles({
        root: {
            width: '80%',
            margin: 'auto',
        },
        paper: {
            padding: theme.spacing(1),
            color: theme.palette.text.secondary,
        },
    })
)

const selector: StateSelector<any, number[][]> = (state) => state.currentBoard

export default function Board() {
    const classes = useStyles()
    const currentBoard = gameStore(selector)

    return (
        <div className={classes.root}>
            <Grid container>
                {currentBoard.map((row, i) => {
                    return (
                        <Grid container item spacing={0} key={i}>
                            {row.map((cell, j) => {
                                return (
                                    <Grid item xs>
                                        <Paper className={classes.paper} variant="outlined" square>
                                            <MarblePiece
                                                color={Marble[cell].toLowerCase() as any}
                                            />
                                        </Paper>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    )
                })}
            </Grid>
        </div>
    )
}
