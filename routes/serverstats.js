const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const chalk = require('chalk');
const moment = require('moment');
const winston = require('winston');

const lastLoginUtil = require('../routesUtils/serverStatsUtils/lastLogin')
const killsUtil = require('../routesUtils/serverStatsUtils/kills')
const pointsSpentUtil = require('../routesUtils/serverStatsUtils/pointsSpent')
const serverStatsUtil = require('../routesUtils/serverStatsUtils/serverStats')
const temporaryDataUtil = require('../routesUtils/serverStatsUtils/temporaryData')

const serverIp = process.env.SERVERIP || (() => { new Error("Provide a server IP in env vars") });
const dbHost = process.env.DBENDPOINT || (() => { new Error("Provide a db endpoint in env vars") });
const dbPassword = process.env.DBPASSWORD || (() => { new Error("Provide a db password in env vars") });
const dbUsername = process.env.DBUSER || (() => { new Error("Provide a db username in env vars") });
const dbName = process.env.DBNAME || (() => { new Error("Provide a db username in env vars") });
const basicAuthUsername = process.env.BASICAUTHUSERNAME || (() => { new Error("Provide a server IP in env vars") });
const basicAuthPassword = process.env.BASICAUTHPASSWORD || (() => { new Error("Provide a server IP in env vars") });

const recognisedTemporaryTableNames = ['playersComparisonFirst', 'playersComparisonSecond']

const users = {};
users[basicAuthUsername] = basicAuthPassword;

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

const pool = mysql.createPool({
    connectionLimit: 64,
    host: dbHost,
    user: dbUsername,
    password: dbPassword,
    database: dbName
});

router.use(function timeLog(req, res, next) {
    const timestampForRequest;
    timestampForRequest = moment().format('YYYY-MM-DD HH:mm:ss')
    logger.log({
        level: 'info',
        message: `Request received at: ${timestampForRequest} + ' from IP address: ' + ${req.headers['x-forwarded-for'] || req.connection.remoteAddress || null}`,
    });
    next()
})

    router.get('/', async (req, res) => {
        const currentMapName = "aocffa-ftyd_41_s_wip"
        const currentServerName = "*** Fall To Your Death 24/7 2.4 64 Players ***"
        await serverStatsUtil(currentMapName, currentServerName, serverIp).then(response => {
            console.log('GET serverstats');
            res.status(200).json({ response })});
    })

    router.post('/', async (req, res) => {
    if (req.query.name) {
        pool.getConnection((err, connection) => {
            const name = decodeURIComponent(req.query.name);
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName, online) VALUES (?, 1) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalTimeDaily = totalTimeDaily + .25`, [name], (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    console.log('POST serverstats');
                    res.status(201).json({
                        name: name
                    })
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(name)) + ' added/updated for / POST!'))
                    console.log({ name: name, online: true })
                }
                if (fields) console.log(fields);
                connection.release();
                if (err) throw err;
            });
        });
    } else {
        res.status(400).json({
            error: {
                message: 'Please provide name in request'
            }
        })
        console.log('Missing a parameter');
    }
})

router.post('/lastLogin', (req, res) => {
    lastLoginUtil(req.query.name, pool)
    .then(result => {
        res.status(201).json(result)
        console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(result.lastLogin)) + ' added/updated for /lastLogin POST!'))
        console.log({ name: result.name, lastLogin: result.lastLogin })
    })
    .catch(result => {
        console.log(chalk.red(result))
        res.status(400).json({message: result})})
})

router.post('/kills', async (req, res) => {
    killsUtil(req.query.name, req.query.kills, pool)
    .then(result => {
        res.status(201).json(result)
        console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(result.kills)) + ' added/updated for /kills POST!'))
        console.log({ name: result.name, kills: result.kills })
    })
    .catch(result => {
        console.log(chalk.red(result))
        res.status(400).json({ message: result })})
})

router.post('/pointsSpent', async (req, res) => {
    pointsSpentUtil(req.query.name, req.query.pointsSpent, pool)
        .then(result => {
            res.status(201).json(result)
            console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(result.pointsSpent)) + ' added/updated for /pointSpent POST!'))
            console.log({ name: result.name, pointsSpent: result.pointsSpent })
        })
        .catch(result => {
            console.log(chalk.red(result))
            res.status(400).json({ message: result })
        })
})

router.post('/temporaryData', async (req, res) => {
    temporaryDataUtil(req.query.name, req.query.time, req.query.score, req.query.tableName, pool, recognisedTemporaryTableNames)
        .then(result => {
            res.status(201).json({ message: `Created temporary player inside ${result.tableName}`})
            console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(result.name)) + " with duration " + chalk.whiteBright.underline(keyword(result.time)) + " and score " + chalk.whiteBright.underline(keyword(result.score)) +
                ' added into ' + result.tableName + ' for /temporaryData POST'))
        })
        .catch(result => {
            console.log(chalk.red(result))
            res.status(400).json({ message: result })
        })
})

module.exports = router