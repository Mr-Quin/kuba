import React, { useEffect } from 'react'
import Board from './components/board'
import Display from './components/display'
import Github from './components/github'
import { Container } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import useGameStore from './store/useGameStore'

const useStyles = makeStyles({
    root: {
        // width: '100%',
        // minWidth: 500,
        // maxWidth: 700,
    },
})

function App() {
    const classes = useStyles()
    const initGame = useGameStore((state) => state.init)

    useEffect(() => {
        initGame()
    }, [initGame])

    return (
        <Container className={classes.root} maxWidth="sm">
            <Display />
            <Board />
            <Github />
        </Container>
    )
}

export default App
