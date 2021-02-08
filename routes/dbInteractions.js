const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const moment = require('moment');
const winston = require('winston');

const dbHost = process.env.DBENDPOINT || (() => { new Error("Provide a db endpoint in env vars") });
const dbPassword = process.env.DBPASSWORD || (() => { new Error("Provide a db password in env vars") });
const dbUsername = process.env.DBUSER || (() => { new Error("Provide a db username in env vars") });
const dbName = process.env.DBNAME || (() => { new Error("Provide a db username in env vars") });

const allRowsUtil = require('../dbInteractionsUtils/allRows');
const resetDailyUtil = require('../dbInteractionsUtils/resetDaily');
const chalk = require('chalk');

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

const keyword = keyword => chalk.keyword('blue')(keyword)

router.use(function timeLog(req, res, next) {
    timestampForRequest = moment().format('YYYY-MM-DD HH:mm:ss')
    logger.log({
        level: 'info',
        message: `Request received at: ${timestampForRequest} + ' from IP address: ' + ${req.headers['x-forwarded-for'] || req.connection.remoteAddress || null}`,
    });
    next()
})

const pool = mysql.createPool({
    connectionLimit: 150,
    host: dbHost,
    user: dbUsername,
    password: dbPassword,
    database: dbName
});

const recognisedTableNames = ['aggregatedInfo', 'playerInfo', 'playersComparisonFirst', 'playersComparisonSecond', 'serverInfo']

router.get('/resetDaily', async (req, res) => {
    resetDailyUtil(pool, chalk, keyword)
        .then(result => {
            res.status(201).json({ message: result })
            console.log(chalk.blue('Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to ' + chalk.whiteBright.underline(keyword('0'))))
        })
        .catch(result => {
            console.log(chalk.red(result))
            res.status(400).json({ message: result })
        })
})

router.get('/allRows', async (req, res) => {
    allRowsUtil(pool, req.query.tableName, recognisedTableNames)
        .then(result => {
            res.status(201).json({ message: result })
            console.log(chalk.blue('Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to ' + chalk.whiteBright.underline(keyword('0'))))
        })
        .catch(result => {
            console.log(chalk.red(result))
            res.status(400).json({ message: result })
        });
});

module.exports = router