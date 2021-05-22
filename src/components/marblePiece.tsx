import React from 'react'
import Paper from '@material-ui/core/Paper'
import { createStyles, makeStyles } from '@material-ui/core/styles'

interface Props {
    color: 'red' | 'black' | 'white' | 'empty'
}

const useStyles = makeStyles(() =>
    createStyles({
        root: {
            background: (props: Props) => {
                switch (props.color) {
                    case 'red':
                        return 'linear-gradient(135deg, #FE6B8B 30%, #FF8E53 90%)'
                    case 'black':
                        return 'linear-gradient(135deg, #2196F3 30%, #21CBF3 90%)'
                    case 'white':
                        return 'linear-gradient(135deg, white 30%, #eeeeee 90%)'
                    default:
                        return 'none'
                }
            },
            border: 0,
            borderRadius: '50%',
            aspectRatio: '1',
            cursor: (props: Props) =>
                props.color === 'empty' || props.color === 'red' ? 'default' : 'pointer',
            boxShadow: (props: Props) => {
                switch (props.color) {
                    case 'red':
                        return '0 3px 5px 2px rgba(255, 105, 135, .3)'
                    case 'black':
                        return '0 3px 5px 2px rgba(33, 203, 243, .3)'
                    case 'white':
                        return '0 3px 5px 2px rgba(0, 0, 0, .3)'
                    default:
                        return 'none'
                }
            },
        },
    })
)

const MarblePiece = (props: Props) => {
    const { color, ...other } = props
    const classes = useStyles(props)
    return <Paper className={classes.root} elevation={2} />
}

export default MarblePiece
