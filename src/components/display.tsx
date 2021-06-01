import React, { useCallback, useEffect, useState } from 'react'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import useGameStore from '../store/useGameStore'
import { Backdrop, Card, CardActions, CardContent, Snackbar } from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import { properCase } from '../helpers/helpers'
import { Undo, Reset, ExportGame, ExtraTurnButton } from './actions'
import { useTranslation } from 'react-i18next'
import { Marble } from '../helpers/game/consts'

const useStyles = makeStyles({
    root: {
        outline: 'none',
        boxShadow: 'none',
    },
    title: {
        fontSize: '3em',
    },
    controls: {
        flexWrap: 'wrap',
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
    const { t } = useTranslation()
    const [turn, currentPlayer, error, captures, winner] = useGameStore(
        useCallback(
            (state) => [
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
    }, [error])

    useEffect(() => {
        if (winner !== null) {
            setBackDropOpen(true)
        }
    }, [winner])

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
                        {t('title')}
                    </Typography>
                    <Typography>
                        Turn {turn},{' '}
                        {currentPlayer !== null ? properCase(Marble[currentPlayer]) : t('anyone')}
                    </Typography>
                    <Typography>
                        Captures: {t('white')}: {captures[Marble.WHITE]}, {t('black')}:{' '}
                        {captures[Marble.BLACK]}
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
                <CardActions className={classes.controls}>
                    <Undo>{t('undo')}</Undo>
                    <Reset>{t('reset')}</Reset>
                    <ExportGame>{t('export')}</ExportGame>
                    <ExtraTurnButton label={t('allowExtra')} />
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
