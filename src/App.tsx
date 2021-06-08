import React, { useEffect } from 'react'
import Board from './components/board'
import Display from './components/display'
import Github from './components/github'
import { Container } from '@material-ui/core'
import useGameStore from './store/useGameStore'
import i18n from './i18n/i18n'

const useless = (any: any) => {}

const App = () => {
    const initGame = useGameStore((state) => state.init)

    useless(i18n)

    useEffect(() => {
        initGame()
    }, [initGame])

    return (
        <Container maxWidth="sm">
            <Display />
            <Board />
            <Github />
        </Container>
    )
}

export default App
