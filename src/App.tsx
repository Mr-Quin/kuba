import React from 'react'
import Board from './components/board'
import Display from './components/display'
import { Container } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles({
    root: {
        // width: '100%',
        // minWidth: 500,
        // maxWidth: 700,
    },
})

function App() {
    const classes = useStyles()

    return (
        <Container className={classes.root} maxWidth="sm">
            <Display />
            <Board />
        </Container>
    )
}

export default App
