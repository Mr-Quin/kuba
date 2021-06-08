import React from 'react'
import Link from '@material-ui/core/Link'
import GitHubIcon from '@material-ui/icons/GitHub'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles({
    root: {
        position: 'absolute',
        right: 0,
        top: 0,
        margin: '16px 16px',
        color: '#777',
    },
})

const Github = () => {
    const classes = useStyles()

    return (
        <div className={classes.root}>
            <Link
                href="https://github.com/Mr-Quin/kuba"
                target="_blank"
                rel="noreferrer"
                color="inherit"
            >
                <GitHubIcon />
                {/*accessibility text*/}
                <Typography hidden>Github</Typography>
            </Link>
        </div>
    )
}

export default Github
