const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const chalk = require('chalk');
const moment = require('moment');
const winston = require('winston');

const playerCountUtil = require('../routesUtils/aggregatedStatsUtils/playerCount')

const dbHost = process.env.DBENDPOINT || (() => { new Error("Provide a db endpoint in env vars") });
const dbPassword = process.env.DBPASSWORD || (() => { new Error("Provide a db password in env vars") });
const dbUsername = process.env.DBUSER || (() => { new Error("Provide a db username in env vars") });
const dbName = process.env.DBNAME || (() => { new Error("Provide a db username in env vars") });

const dir = './logging/'

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: `${dir}logging.log`, level: 'info', maxsize: 7000 }),
        new winston.transports.File({ filename: `${dir}error.log`, level: 'error' }),
    ],
});

const pool = mysql.createPool({
    connectionLimit: 5,
    host: dbHost,
    user: dbUsername,
    password: dbPassword,
    database: dbName,
    dateStrings: ['DATE', 'DATETIME']
});

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    const timestampForRequest = moment().format('YYYY-MM-DD HH:mm:ss')
    logger.log({
        level: 'info',
        message: `'Request received at: ', ${timestampForRequest + ' from IP address: ' + req.headers['x-forwarded-for'] || req.connection.remoteAddress || null}`,
    });
    next()
})
// define the home page route
router.get('/', async (req, res) => {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss')
    res.status(200).json({ message: "Seems to be ok.. ", timestamp })
})

router.get('/playerCount', async (req, res) => {
    playerCountUtil(req.query.duration, pool).then(result => {
        res.status(201).json({ result })
        console.log(chalk.blue('Completed query for ' + chalk.whiteBright.underline(result.duration) + " records at aggregatedstats/playerCount GET"))
    })
        .catch(result => {
            console.log(chalk.red(result))
            res.status(400).json({ message: result })
        });
})

module.exports = router