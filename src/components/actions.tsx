import React, { memo, useCallback, useState } from 'react'
import { Button, Snackbar } from '@material-ui/core'
import useGameStore, { GameStore } from '../store/useGameStore'
import { Alert } from '@material-ui/lab'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'

export const Undo = memo((props) => {
    const [handleUndo, turn] = useGameStore(
        useCallback((state: GameStore) => [state.undo, state.turn], [])
    )
    return (
        <Button variant="contained" disabled={turn === 1} onClick={handleUndo}>
            {props.children}
        </Button>
    )
})

export const Reset = memo((props) => {
    const handleReset = useGameStore(useCallback((state: GameStore) => state.reset, []))
    return (
        <Button variant="contained" color="secondary" onClick={handleReset}>
            {props.children}
        </Button>
    )
})

export const EndTurn = memo((props) => {
    const handleEndTurn = useGameStore(useCallback((state) => state.endTurn, []))
    return (
        <Button variant="contained" color="secondary" onClick={handleEndTurn}>
            {props.children}
        </Button>
    )
})

export const ExportGame = memo((props) => {
    const [messageOpen, setMessageOpen] = useState(false)

    const handleExport = useCallback(() => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setMessageOpen(true)
        })
    }, [])

    const handleMessageClose = useCallback(() => {
        setMessageOpen(false)
    }, [])

    return (
        <>
            <Button variant="contained" onClick={handleExport}>
                {props.children}
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

export const ExtraTurnButton = memo((props: { label: string }) => {
    const [checked, handleToggle] = useGameStore(
        useCallback((state) => [state.allowExtraTurns, state.toggleExtraTurn], [])
    )
    return (
        <FormControlLabel
            control={<Checkbox checked={checked} onChange={handleToggle} />}
            label={props.label}
        />
    )
})
