const express = require('express');
const router = express.Router();
const query = require("source-server-query");
const axios = require('axios');
const mysql = require('mysql');
const chalk = require('chalk');
const utf8 = require('utf8');
const cron = require('node-cron');
const sqlString = require('sqlstring')
const schedule = require('node-schedule');
const moment = require('moment');
const winston = require('winston');
const _ = require('underscore');

let directQueryInfo = {};
let directPlayerInfo = [];
let allServerInfo = [];
let running = false;
let timestamp;      // can be made const
let timestampForRequest;        // can be made const
let newPlayerIndex;
let oldPlayerIndex;
let postRequests = [];

const serverIp = process.env.SERVERIP || (() => { new Error("Provide a server IP in env vars") });
const endpoint = process.env.APIENDPOINT || (() => { new Error("Provide a api endpoint in env vars") });
const dbHost = process.env.DBENDPOINT || (() => { new Error("Provide a db endpoint in env vars") });
const dbPassword = process.env.DBPASSWORD || (() => { new Error("Provide a db password in env vars") });
const dbUsername = process.env.DBUSER || (() => { new Error("Provide a db username in env vars") });
const dbName = process.env.DBNAME || (() => { new Error("Provide a db username in env vars") });
const basicAuthUsername = process.env.BASICAUTHUSERNAME || (() => { new Error("Provide a server IP in env vars") });
const basicAuthPassword = process.env.BASICAUTHPASSWORD || (() => { new Error("Provide a server IP in env vars") });

const recognisedTablenames = ['aggregatedInfo', 'playerInfo', 'playersComparisonFirst', 'playersComparisonSecond', 'serverInfo']

const users = {};
users[basicAuthUsername] = basicAuthPassword;

const axiosBasicAuthConfig = {
    auth: {
        username: 'avi312',
        password: basicAuthPassword
    }
}

const keyword = keyword => chalk.keyword('blue')(keyword)
const utf8decode = stringTOBeDecoded => utf8.decode(stringTOBeDecoded)
const getNewPlayers = async () => await axios.get(`${endpoint}serverstats`, axiosBasicAuthConfig)
    .then(response => response.data)

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
    connectionLimit: 20,
    host: dbHost,
    user: dbUsername,
    password: dbPassword,
    database: dbName
});

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    timestampForRequest = moment().format('YYYY-MM-DD HH:mm:ss')
    logger.log({
        level: 'info',
        message: `Request received at: ${timestampForRequest} + ' from IP address: ' + ${req.headers['x-forwarded-for'] || req.connection.remoteAddress || null}`,
    });
    next()
})

router.get('/', async (req, res) => {
    directQueryInfo =
        await query
            .info(serverIp, 7778, 2000)
            .then(query.close)
            .catch(console.log);
    directPlayerInfo =
        await query
            .players(serverIp, 7778, 2000)
            .then(query.close)
            .catch(console.log);

    allServerInfo.push({ directQueryInfo: directQueryInfo })
    allServerInfo.push({ directPlayerInfo: directPlayerInfo })
    res.status(200).json(allServerInfo)
    allServerInfo = [];
})

router.post('/', async (req, res) => {
    if (req.query.name) {
        pool.getConnection((err, connection) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName) VALUES (${sqlString.escape(utf8decode(req.query.name).replace("'", "''"))}) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalTimeDaily = totalTimeDaily + .25`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        name: utf8decode(req.query.name)
                    })
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(utf8decode(req.query.name).replace("'", "''"))) + ' added/updated for time addition endpoint!'))
                    console.log({ name: utf8decode(req.query.name) })
                }
                if (fields) console.log(fields);
                connection.release();
                if (err) throw err;
            });
        });
    } else {
        res.send('Please provide name in request')
        console.log('Missing a parameter');
    }
})

router.post('/lastLogin', async (req, res) => {
    const timestampForLastLogin = moment().format('YYYY-MM-DD HH:mm:ss').toString();
    if (req.query.name) {
        pool.getConnection((err, connection) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName) VALUES (${sqlString.escape(utf8decode(req.query.name).replace("'", "''"))}) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalTimeDaily = totalTimeDaily + .25, lastLogin = ${timestampForLastLogin}`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        name: utf8decode(req.query.name), lastLogin: timestampForLastLogin
                    });
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(timestampForLastLogin)) + ' added/updated for lastLogin endpoint!'))
                    console.log({ name: utf8decode(req.query.name), lastLogin: timestampForLastLogin });
                }
                if (fields) console.log(fields);
                connection.release();
                if (err) throw err;
            });
        });
    } else {
        res.send('Please provide name in request')
        console.log('Missing a parameter');
    }
})

router.post('/kills', async (req, res) => {
    if (req.query.name && req.query.kills) {
        pool.getConnection((err, connection) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName, totalKills, totalKillsDaily) VALUES (${sqlString.escape(utf8decode(req.query.name).replace("'", "''"))}, ${sqlString.escape(req.query.kills)}, ${sqlString.escape(req.query.kills)})
                            ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalKills = totalKills + ${sqlString.escape(req.query.kills)}, totalKillsDaily = totalKillsDaily + ${sqlString.escape(req.query.kills)}`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        name: utf8decode(req.query.name), kills: req.query.kills
                    });
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(req.query.kills)) + ' added/updated for kills endpoint!'))
                    console.log({ name: utf8decode(req.query.name), kills: req.query.kills })
                }
                if (fields) console.log(fields);
            });
            connection.release();
            if (err) throw err;
        });
    } else {
        res.send('Please provide name and kills in request')
        console.log('Missing a parameter');
    }
})

router.post('/pointsSpent', async (req, res) => {
    if (req.query.name && req.query.pointsSpent) {
        pool.getConnection((err, connection) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName, totalPointsSpent, totalPointsSpentDaily) VALUES (${sqlString.escape(utf8decode(req.query).name).replace("'", "''")}, ${sqlString.escape(req.query.pointsSpent)}, ${sqlString.escape(req.query.pointsSpent)})
                                ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalPointsSpent = totalPointsSpent + ${sqlString.escape(req.query.pointsSpent)}, totalPointsSpentDaily = totalPointsSpentDaily + ${sqlString.escape(req.query.pointsSpent)}`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        name: utf8decode(req.query.name), pointsSpent: req.query.pointsSpent
                    });
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(req.query.pointsSpent)) + ' added/updated for pointSpent endpoint!'))
                    console.log({ name: utf8decode(req.query.name), pointsSpent: req.query.pointsSpent })
                }
                if (fields) console.log(fields);
            });
            connection.release();
            if (err) throw err;
        });
    } else {
        res.send('Please provide name and pointsSpent in request')
        console.log('Missing a parameter');
    }
})

router.post('/serverInfo', async (req, res) => {
    if (req.query.playerCount && req.query.botCount && req.query.serverName && req.query.mapName) {
        pool.getConnection((err, connection) => {
            if (err) console.error(err)
            connection.query(`INSERT INTO serverInfo (playerCount, botCount, serverName, mapName) VALUES (${sqlString.escape(req.query.playerCount)}, ${sqlString.escape(req.query.botCount)}, ${sqlString.escape(req.query.serverName)}, ${sqlString.escape(req.query.mapName)})`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerCount: req.query.playerCount, botCount: req.query.botCount, serverName: req.query.serverName, mapName: req.query.mapName
                    });
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword('serverInfo') + ' added/updated for serverInfo endpoint!')))
                    console.log({ playerCount: req.query.playerCount, botCount: req.query.botCount, serverName: req.query.serverName, mapName: req.query.mapName })
                }
                if (fields) console.log(fields);
                connection.release();
                if (err) throw err;
            });
        })
    } else {
        res.send('Please provide playerCount, botCount, serverName and mapName in request')
        console.log('Missing a parameter');
    }
})

router.get('/allRows', async (req, res) => {
    if (req.query.tableName && recognisedTablenames.includes(req.query.tableName)) {
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
            message: `Please provide valid table name`,
        });
        console.log('Not valid table name');
    }
});

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

router.post('/temporaryData', async (req, res) => {
    if (req.query.name && req.query.time && req.query.score && req.query.tableName) {
        pool.getConnection((err, connection) => {
            connection.query(`INSERT INTO ${sqlString.escape(req.query.tableName)} (name, time, score)
            VALUES (${sqlString.escape(utf8decode(req.query.name).replace("'", "''"))}, ${sqlString.escape(req.query.time)}, ${sqlString.escape(req.query.score)}) ON DUPLICATE KEY UPDATE name = ${sqlString.escape(utf8decode(req.query.name).replace("'", "''"))}, time = ${sqlString.escape(req.query.time)}, score = ${sqlString.escape(req.query.score)}`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        message: `Created temporary player inside ${req.query.tableName}`
                    })
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(utf8decode(req.query.name).replace("'", "''"))) + " " + chalk + chalk.whiteBright.underline(keyword(req.query.time)) + " " + chalk.whiteBright.underline(keyword(req.query.score)) + ' added into ' + req.query.tableName))
                }
                if (fields) console.log(fields);
                connection.release();
                if (err) throw err;
            });
        });
    } else {
        res.status(400).json({
            message: 'Please provide name, time, score and tableName in request',
        });
        console.log('Missing a parameter');
    }
})

router.get('/repeatedRequests', async (req, res) => {
    if (!running) {
        running = true;

        timestamp = moment().format('YYYY-MM-DD HH:mm:ss')

        console.log("GET: repeatedRequests " + timestamp)

        res.status(200).json({
            message: "Initiating repeated requests ", timestamp
        })

        // sends player count every 5 mins to serverInfo table
        cron.schedule('*/5 * * * *', async () => {
            const serverInfo = await getNewPlayers()
                .then(eachObject => (
                    eachObject
                        .map(element => element.directQueryInfo)
                        .filter(el => el != null)))

            await axios.post(`${endpoint}serverstats/serverInfo?playerCount=${serverInfo[0].playersnum}&botCount=${serverInfo[0].botsnum}&serverName=${serverInfo[0].name}&mapName=${serverInfo[0].map}`, {}, axiosBasicAuthConfig)
        });

        // sends query to set all daily columns to 0 at 00:01 everyday
        cron.schedule('01 00 * * *', async () => {
            const serverInfo = await getNewPlayers()
                .then(eachObject => (
                    eachObject
                        .map(element => element.directQueryInfo)
                        .filter(el => el != null)))

            await axios.get(`${endpoint}serverstats/resetDaily`, axiosBasicAuthConfig);
        })
        // NEW IMPLEMENTATION STARTS HERE

        // initial request of players every 15 seconds to playersComparisonCache table

        const firstJob = schedule.scheduleJob({ rule: '*/15 * * * * *' }, async (fireDate) => {


            const serverInfoUnfiltered = await getNewPlayers();
            const serverInfo = serverInfoUnfiltered
                .map(element => element.directQueryInfo)
                .filter(el => el != null)

            if (!serverInfo[0].name) {
                console.log(chalk.magentaBright("Server not online! Waiting for 1 minute"))
                firstJob.cancelNext(true)
                secondJob.cancelNext(true)

            }


            console.log(chalk.hex('#DEADED').bold('running first task ************************************************************************************************************************************************************'));
            console.log('First starting now: ' + moment().format('ss') + " but really started at " + fireDate);

            const playersToBePushedToTemporaryTable = [];

            const playerInfoToBeCompared = await getNewPlayers()
                .then(eachObject => (
                    eachObject
                        .map(element => element.directPlayerInfo)
                        .filter(el => el != null)))

            const playersInfoUnfiltered = playerInfoToBeCompared[0] !== null && playerInfoToBeCompared[0] instanceof (Array) ? playerInfoToBeCompared[0].map(element => element)
                : undefined

            const playersInfo = playersInfoUnfiltered.filter(el => el.name !== '' || undefined)


            if (!playersInfo) {
                console.error(chalk.red("************* Error has occurred whilst fetching first set of new players so waiting for 30 seconds before next request to server"))
                firstJob.cancelNext(true)
                secondJob.cancelNext(true)
            }

            if (playersInfo.length == 0 || serverInfo[0].playersnum == 0) {
                console.log(chalk.green("No one is on the server yet! New Players: ") + JSON.stringify(playersInfo, null, 4))
                console.log(chalk.green("Cancelling current jobs "))
                // TODO: Wait or not
                firstJob.cancel(true)
                secondJob.cancel(true)
            }

            for (i = 0; i < playersInfo.length; i++) {
                if (!playersInfo[i] || !playersInfo[i].name) {
                    console.error("PlayersInfo at index " + [i] + " has been skipped")
                }
                else {
                    const endpointRequest = axios.post(`${endpoint}serverstats/temporaryData?name=${playersInfo[i].name}&score=${playersInfo[i].score}&time=${playersInfo[i].duration}&tableName=playersComparisonFirst`, {}, axiosBasicAuthConfig)
                    playersToBePushedToTemporaryTable.push(endpointRequest)
                }
            }

            await Promise.all(playersToBePushedToTemporaryTable);

            const completedNow = moment().format('HH:mm:ss')
            console.log(chalk.blue('Completed first job at Time: ', chalk.blueBright(completedNow)));
        });


        const secondJob = schedule.scheduleJob({ rule: '14-59/15 * * * * *' }, async (fireDate) => {
            console.log(chalk.hex('#DEADED').bold('running second task ************************************************************************************************************************************************************'));
            console.log('Second starting now: ' + moment().format('ss') + " but really started at " + fireDate);

            const playersToBePushedToTemporaryTable = [];

            // try {
            const playersInfoToBeCompared = await getNewPlayers()
                .then(eachObject => (
                    eachObject
                        .map(element => element.directPlayerInfo)
                        .filter(el => el != null)))

            const serverInfoUnfiltered = await getNewPlayers();
            const serverInfo = serverInfoUnfiltered
                .map(element => element.directQueryInfo)
                .filter(el => el != null)

            const playersInfoUnfiltered = playersInfoToBeCompared[0] !== null && playersInfoToBeCompared[0] instanceof (Array) ? playersInfoToBeCompared[0].map(element => element)
                : undefined

            const playersInfo = playersInfoUnfiltered.filter(el => el.name !== '' || undefined)

            if (!playersInfo) {
                console.error(chalk.red("************* Error has occurred whilst fetching second set of new players so waiting for 30 seconds before next request to server ------- cancelling current scheduled jobs"))
                firstJob.cancel(true)
                secondJob.cancel(true)
            }

            for (i = 0; i < playersInfo.length; i++) {
                const endpointRequest = axios.post(`${endpoint}serverstats/temporaryData?name=${playersInfo[i].name}&score=${playersInfo[i].score}&time=${playersInfo[i].duration}&tableName=playersComparisonSecond`, {}, axiosBasicAuthConfig)
                playersToBePushedToTemporaryTable.push(endpointRequest)
            }

            await Promise.all(playersToBePushedToTemporaryTable);

            // Now that we have sent both players to the database - compare them both
            console.log("********* START COMPARISON ***************")
            const oldPlayersUnfiltered = await axios.get(`${endpoint}serverstats/allRows?tableName=playersComparisonFirst`, axiosBasicAuthConfig).then(element => element.data.result)
            const newPlayersUnfiltered = await axios.get(`${endpoint}serverstats/allRows?tableName=playersComparisonSecond`, axiosBasicAuthConfig).then(element => element.data.result)

            // Remove entries where they have just joined and server hasn't loaded name yet
            const oldPlayers = oldPlayersUnfiltered.filter(el => el.name !== '' || undefined)
            const newPlayers = newPlayersUnfiltered.filter(el => el.name !== '' || undefined)

            // Compare both arrays with each other and see which elements don't exist in other one

            // They have left and remove from oldPlayers array
            if (!Array.isArray(oldPlayers) || !oldPlayers.length == 0 || serverInfo[0].playersnum >= 0) {
                var z = oldPlayers.length
                while (z--) {
                    const playerHasLeft = _.findIndex(newPlayers, { name: oldPlayers[z].name }) === -1 ? true : false;
                    if (playerHasLeft) {
                        console.log(utf8decode(oldPlayers[z].name) + " has abandoned the battle")
                        const endpointRequest = axios.post(`${endpoint}serverstats/lastLogin?name=${oldPlayers[z].name}`, {}, axiosBasicAuthConfig)
                        postRequests.push(endpointRequest)
                        // remove from array
                        const index = oldPlayers.indexOf(oldPlayers[z].name);
                        if (index > -1) {
                            oldPlayers.splice(index, 1);
                        }
                    }
                }
            }

            // They have joined and remove from newPlayers array
            if (!Array.isArray(newPlayers) || !newPlayers.length == 0 || serverInfo[0].playersnum >= 0) {
                var y = newPlayers.length
                while (y--) {
                    const playerHasJoined = _.findIndex(oldPlayers, { name: newPlayers[y].name }) === -1 ? true : false;
                    if (playerHasJoined) {
                        console.log(utf8decode(newPlayers[y].name), " has joined the server")
                        const endpointRequest = axios.post(`${endpoint}serverstats/?name=${newPlayers[y].name}`, {}, axiosBasicAuthConfig)
                        postRequests.push(endpointRequest)
                        // remove from array
                        const findIndex = _.findIndex(newPlayers, { name: newPlayers[y].name })

                        if (findIndex > -1) {
                            newPlayers.splice(findIndex, 1);
                        }
                    }
                }
            }

            try {
                for (i = 0; i < newPlayers.length; i++) {

                    let scoreDifference = 0;

                    newPlayerIndex = _.findIndex(newPlayers, { name: oldPlayers[i].name }) != -1 ? _.findIndex(newPlayers, { name: oldPlayers[i].name }) : _.findIndex(newPlayers, { name: newPlayers[i].name })
                    oldPlayerIndex = _.findIndex(oldPlayers, { name: newPlayers[i].name }) != -1 ? _.findIndex(oldPlayers, { name: newPlayers[i].name }) : _.findIndex(oldPlayers, { name: oldPlayers[i].name })

                    if (newPlayers[newPlayerIndex].score != oldPlayers[oldPlayerIndex].score) {
                        if (newPlayers[newPlayerIndex].score < oldPlayers[oldPlayerIndex].score) {
                            scoreDifference = oldPlayers[oldPlayerIndex].score - newPlayers[newPlayerIndex].score
                            logger.log({
                                level: 'info',
                                message: `${utf8decode(newPlayers[newPlayerIndex].name) + "'s score is less than the old one as ******** new score is " + newPlayers[newPlayerIndex].score + " and old score is " + oldPlayers[oldPlayerIndex].score + " with difference " + scoreDifference}`,
                            });
                            const endpointRequest = axios.post(`${endpoint}serverstats/pointsSpent?name=${newPlayers[newPlayerIndex].name}&pointsSpent=${scoreDifference >= 90 ? 0 : scoreDifference}`, {}, axiosBasicAuthConfig)
                            postRequests.push(endpointRequest);
                        }
                        else if (newPlayers[newPlayerIndex].score > oldPlayers[oldPlayerIndex].score) {
                            scoreDifference = newPlayers[newPlayerIndex].score - oldPlayers[oldPlayerIndex].score
                            logger.log({
                                level: 'info',
                                message: `${utf8decode(newPlayers[newPlayerIndex].name) + "'s score is more than the old one as ******** new score is " + newPlayers[newPlayerIndex].score + " and old score is " + oldPlayers[oldPlayerIndex].score + " with difference " + scoreDifference}`,
                            });
                            const endpointRequest = axios.post(`${endpoint}serverstats/kills?name=${newPlayers[newPlayerIndex].name}&kills=${scoreDifference % 2 == 0 ? scoreDifference / 2 : scoreDifference}`, {}, axiosBasicAuthConfig)
                            postRequests.push(endpointRequest)
                        }
                    }
                    else {
                        logger.log({
                            level: 'info',
                            message: `${utf8decode(newPlayers[newPlayerIndex].name) + "'s score hasn't changed ******** because new score is " + newPlayers[newPlayerIndex].score + " and old score is " + oldPlayers[oldPlayerIndex].score}`,
                        });
                        const endpointRequest = axios.post(`${endpoint}serverstats/?name=${newPlayers[newPlayerIndex].name}`, {}, axiosBasicAuthConfig)
                        postRequests.push(endpointRequest)
                    }
                }

                // Send all endpoint requests from above
                Promise.all(postRequests)
                    .then(console.log(chalk.whiteBright("Sent remaining players to database")))
                    .catch(console.error)

            }
            catch (error) {
                console.error(chalk.red("Error processing this player: ", newPlayers[newPlayerIndex].name ? keyword(utf8decode(newPlayers[newPlayerIndex].name)) : " Error while getting player: " + " " + error))
                return repeatedRequests();
                // continue
            }

            // }
            // catch (error) {
            //     console.error(chalk.red("Error has occurred while executing repeated requests: ", error))
            //     console.trace()
            //     return res.status(404).json({
            //         error: {
            //             message: "Something went wrong: " + timestamp,
            //             error
            //         }
            //     });
            // }

            //  Need to truncate temp tables playersComparisonFirst and playersComparisonSecond
            pool.getConnection((err, connection) => {
                if (err) console.log(err);
                connection.query(`TRUNCATE playersComparisonFirst;`, (err, result, fields) => {
                    if (err) console.log(err);
                    if (result) {
                        console.log("Reset all rows in playersComparisonFirst table")
                    }
                    if (fields) console.log(fields);
                    if (err) throw error;
                });
                connection.query(`TRUNCATE playersComparisonSecond;`, (err, result, fields) => {
                    if (err) console.log(err);
                    if (result) {
                        console.log("Reset all rows in playersComparisonSecond table")
                    }
                    if (fields) console.log(fields);
                    if (err) throw error;
                });
                connection.release();
            });

            const completedNow = moment().format('HH:mm:ss')
            console.log(chalk.blue('Completed second job at Time: ', chalk.blueBright(completedNow)));

        });

        // Do not do the first scheduled run of secondJob as firstJob needs to be in front with a 15 second offset
        secondJob.cancelNext(true)

        // NEW IMPLEMENTATION ENDS HERE
    }

    else {
        console.log("Already running, restart endpoint/dyno in heroku and call repeatedRequests again")
        return res.status(404).json({
            error: {
                message: "This endpoint has already been called and was called at: " + timestamp
            }
        });
    }
})

module.exports = router