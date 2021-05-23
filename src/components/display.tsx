import React, { useCallback, useEffect, useState } from 'react'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import useGameStore, { Marble } from '../store/useGameStore'
import { Backdrop, Button, Card, CardActions, CardContent, Snackbar } from '@material-ui/core'
import { Alert } from '@material-ui/lab'

const useStyles = makeStyles({
    root: {
        outline: 'none',
        boxShadow: 'none',
    },
    title: {
        fontSize: '3em',
    },
    backdrop: {
        zIndex: 999,
        color: 'white',
    },
})

const Display = () => {
    const classes = useStyles()
    const [open, setOpen] = useState(false)
    const [backDropOpen, setBackDropOpen] = useState(false)
    const [undo, reset, turns, currentPlayer, error, captures, winner] = useGameStore(
        useCallback(
            (state) => [
                state.undo,
                state.reset,
                state.turns,
                state.currentPlayer,
                state.errorMessage,
                state.captures,
                state.winner,
            ],
            []
        )
    )

    useEffect(() => {
        if (error.message) {
            setOpen(true)
        } else {
            setOpen(false)
        }
        if (winner !== null) {
            setBackDropOpen(true)
        }
    }, [error, winner])

    const handleAlertClose = useCallback((e, reason?) => {
        if (reason === 'clickaway') return
        setOpen(false)
    }, [])

    const handleBackDropClose = useCallback(() => {
        setBackDropOpen(false)
    }, [])

    return (
        <>
            <Card className={classes.root} variant={'elevation'}>
                <CardContent>
                    <Typography className={classes.title} variant="h1" component="h1" gutterBottom>
                        Kuba
                    </Typography>
                    <Typography>
                        Turn {turns}, {currentPlayer !== null ? Marble[currentPlayer] : 'anyone'}
                    </Typography>
                    <Typography>
                        Captures: White: {captures[Marble.WHITE]}, Black: {captures[Marble.BLACK]}
                    </Typography>
                    <Snackbar
                        open={open}
                        autoHideDuration={2000}
                        onClose={handleAlertClose}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Alert
                            onClose={handleAlertClose}
                            severity="warning"
                            children={error.message}
                        />
                    </Snackbar>
                </CardContent>
                <CardActions>
                    <Button variant="contained" onClick={undo}>
                        Undo
                    </Button>
                    <Button variant="contained" color="secondary" onClick={reset}>
                        Reset
                    </Button>
                </CardActions>
            </Card>

            <Backdrop
                className={classes.backdrop}
                open={backDropOpen}
                onClick={handleBackDropClose}
            >
                <Typography variant="h1" component="h1">
                    {Marble[winner!]} wins
                </Typography>
            </Backdrop>
        </>
    )
}

export default Display
