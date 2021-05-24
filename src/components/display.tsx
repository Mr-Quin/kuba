import React, { useCallback, useEffect, useState } from 'react'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import useGameStore, { Marble } from '../store/useGameStore'
import { Backdrop, Card, CardActions, CardContent, Snackbar } from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import { properCase } from '../helpers/helpers'
import { Undo, Reset, ExportGame } from './actions'

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
    const [alertOpen, setAlertOpen] = useState(false)
    const [backDropOpen, setBackDropOpen] = useState(false)
    const [undo, reset, turn, currentPlayer, error, captures, winner] = useGameStore(
        useCallback(
            (state) => [
                state.undo,
                state.reset,
                state.turn,
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
            setAlertOpen(true)
        } else {
            setAlertOpen(false)
        }
        if (winner !== null) {
            setBackDropOpen(true)
        }
    }, [error, winner])

    const handleAlertClose = useCallback((e, reason?) => {
        if (reason === 'clickaway') return
        setAlertOpen(false)
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
                        Turn {turn},{' '}
                        {currentPlayer !== null ? properCase(Marble[currentPlayer]) : 'Anyone'}
                    </Typography>
                    <Typography>
                        Captures: White: {captures[Marble.WHITE]}, Black: {captures[Marble.BLACK]}
                    </Typography>
                    <Snackbar
                        open={alertOpen}
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
                    <Undo />
                    <Reset />
                    <ExportGame />
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
