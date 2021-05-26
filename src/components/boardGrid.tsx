import React, { MutableRefObject, useEffect, useRef } from 'react'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import { createStyles, makeStyles } from '@material-ui/core/styles'
import useDisplayStore, { DisplayStore } from '../store/useDisplayStore'

const boardGrid = new Array(7).fill(0).map(() => new Array(7).fill(0))

const useStyles = makeStyles((theme) =>
    createStyles({
        grid: {
            userSelect: 'none',
        },
        paper: {
            padding: theme.spacing(1),
            color: theme.palette.text.secondary,
            aspectRatio: '1',
        },
    })
)

const selector = (state: DisplayStore) => state.setGridSize

const BoardGrid = (props: any) => {
    const classes = useStyles()
    const setGridSize = useDisplayStore(selector)
    const gridRef = useRef<HTMLDivElement>()

    useEffect(() => {
        if (gridRef.current) {
            const { width } = gridRef.current?.getBoundingClientRect()
            setGridSize(width / 7)
        }
    }, [gridRef])

    return (
        <>
            <Grid ref={gridRef as any} className={classes.grid} container>
                {boardGrid.map((row, i) => {
                    return (
                        <Grid container item spacing={0} key={i}>
                            {row.map((cell, j) => {
                                return (
                                    <Grid item xs key={j}>
                                        <Paper
                                            className={classes.paper}
                                            variant="outlined"
                                            square
                                        />
                                    </Grid>
                                )
                            })}
                        </Grid>
                    )
                })}
            </Grid>
            {props.children}
        </>
    )
}

export default BoardGrid
