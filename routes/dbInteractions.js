const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const moment = require('moment');
const winston = require('winston');

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
    pool.getConnection((err, connection) => {
        if (err) console.error(err)
        pool.query(`UPDATE playerInfo SET totalKillsDaily = 0, totalPointsSpentDaily = 0, totalTimeDaily = 0 WHERE playerName IS NOT NULL`,
            (err, result, fields) => {
                if (err) console.error(err)
                res.status(200).json({
                    message: "Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to 0"
                })
            });
        console.log(chalk.blue('Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to ' + chalk.whiteBright.underline(keyword('0'))))
        connection.release();
        if (err) throw err;
    });
})

router.get('/allRows', async (req, res) => {
    if (req.query.tableName && recognisedTableNames.includes(req.query.tableName)) {
        pool.getConnection((err, connection) => {
            if (err) console.error(err)
            connection.query(`SELECT * FROM ${req.query.tableName}`, (error, rows, fields) => {
                if (error) console.log(error);
                res.status(200).json({
                    message: `Successfully got all data from ${req.query.tableName}`,
                    result: rows
                });
            });
            connection.release();
            if (err) throw err;
        });
    }
    else {
        res.status(400).json({
            error: {
                message: `Please provide valid table name`,
            }
        });
        console.log('Not valid table name');
    }
});

module.exports = router