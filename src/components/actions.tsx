import React, { memo, useCallback, useState } from 'react'
import { Button, Snackbar } from '@material-ui/core'
import useGameStore, { GameStore } from '../store/useGameStore'
import { Alert } from '@material-ui/lab'

export const Undo = memo(() => {
    const [handleUndo, history] = useGameStore(
        useCallback((state: GameStore) => [state.undo, state.boardHistory], [])
    )
    return (
        <Button variant="contained" disabled={history.length === 0} onClick={handleUndo}>
            Undo
        </Button>
    )
})

export const Reset = memo(() => {
    const handleReset = useGameStore(useCallback((state: GameStore) => state.reset, []))
    return (
        <Button variant="contained" color="secondary" onClick={handleReset}>
            Reset
        </Button>
    )
})

export const ExportGame = memo(() => {
    const [messageOpen, setMessageOpen] = useState(false)

    const handleExport = useCallback(() => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setMessageOpen(true)
            console.log('Copied to clipboard')
        })
    }, [])

    const handleMessageClose = useCallback(() => {
        setMessageOpen(false)
    }, [])

    return (
        <>
            <Button variant="contained" onClick={handleExport}>
                Export game state
            </Button>
            <Snackbar
                open={messageOpen}
                autoHideDuration={2000}
                onClose={handleMessageClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleMessageClose}
                    severity="success"
                    children="Copied to clipboard"
                />
            </Snackbar>
        </>
    )
})
