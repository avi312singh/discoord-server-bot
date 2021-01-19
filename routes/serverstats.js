const express = require('express');
const router = express.Router();
const query = require("source-server-query");
const axios = require('axios');
const mysql = require('mysql');
const chalk = require('chalk');
const utf8 = require('utf8');
const cron = require('node-cron');
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


const timer = ms => new Promise(res => setTimeout(res, ms))
const keyword = keyword => chalk.keyword('blue')(keyword)

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logging.log', level: 'log' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});


// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    timestampForRequest = moment().format('YYYY-MM-DD HH:mm:ss')
    logger.log('Request received at: ', timestampForRequest + ' from IP address: ' + req.headers['x-forwarded-for'] || req.connection.remoteAddress || null)
    next()
})
// define the home page route
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
    if (req.query.playerName) {
        const connection = mysql.createConnection({
            host: dbHost,
            user: dbUsername,
            password: dbPassword,
            database: dbName
        });
        connection.connect((err) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName) VALUES ('${utf8.decode(req.query.playerName).replace("'", "''")}') ON DUPLICATE KEY UPDATE totalTime = totalTime + .25`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerName: utf8.decode(req.query.playerName)
                    })
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(utf8.decode(req.query.playerName).replace("'", "''"))) + ' added/updated for time addition endpoint!'))
                    console.log({ playerName: utf8.decode(req.query.playerName) })
                }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                if (err)
                    console.error("Error when closing connection", err)
            });
        });
    } else {
        res.send('Please provide playerName in request')
        console.log('Missing a parameter');
    }
})

router.post('/lastLogin', async (req, res) => {
    const timestampForLastLogin = moment().format('YYYY-MM-DD HH:mm:ss').toString();
    if (req.query.playerName) {
        const connection = mysql.createConnection({
            host: dbHost,
            user: dbUsername,
            password: dbPassword,
            database: dbName
        });
        connection.connect((err) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName) VALUES ('${utf8.decode(req.query.playerName).replace("'", "''")}') ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, lastLogin = '${timestampForLastLogin}'`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerName: utf8.decode(req.query.playerName), lastLogin: timestampForLastLogin
                    });
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(timestampForLastLogin)) + ' added/updated for lastLogin endpoint!'))
                    console.log({ playerName: utf8.decode(req.query.playerName), lastLogin: timestampForLastLogin });
                }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                if (err)
                    console.error("Error when closing connection", err)
            });
        });
    } else {
        res.send('Please provide playerName in request')
        console.log('Missing a parameter');
    }
})

router.post('/kills', async (req, res) => {
    if (req.query.playerName && req.query.kills) {
        const connection = mysql.createConnection({
            host: dbHost,
            user: dbUsername,
            password: dbPassword,
            database: dbName
        });
        connection.connect((err) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName, totalKills) VALUES ('${utf8.decode(req.query.playerName).replace("'", "''")}', ${req.query.kills}) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalKills = totalKills + ${req.query.kills}`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerName: utf8.decode(req.query.playerName), kills: req.query.kills
                    });
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(req.query.kills)) + ' added/updated for kills endpoint!'))
                    console.log({ playerName: utf8.decode(req.query.playerName), kills: req.query.kills })
                }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                if (err)
                    console.error("Error when closing connection", err)
            });
        });
    } else {
        res.send('Please provide playerName and kills in request')
        console.log('Missing a parameter');
    }
})

router.post('/pointsSpent', async (req, res) => {
    if (req.query.playerName && req.query.pointsSpent) {
        const connection = mysql.createConnection({
            host: dbHost,
            user: dbUsername,
            password: dbPassword,
            database: dbName
        });
        connection.connect((err) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName, totalPointsSpent) VALUES ('${utf8.decode(req.query.playerName).replace("'", "''")}', ${req.query.pointsSpent}) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalPointsSpent = totalPointsSpent + ${req.query.pointsSpent}`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerName: utf8.decode(req.query.playerName), pointsSpent: req.query.pointsSpent
                    });
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(req.query.pointsSpent)) + ' added/updated for pointSpent endpoint!'))
                    console.log({ playerName: utf8.decode(req.query.playerName), pointsSpent: req.query.pointsSpent })
                }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                if (err)
                    console.error("Error when closing connection", err)
            });
        });
    } else {
        res.send('Please provide playerName and pointsSpent in request')
        console.log('Missing a parameter');
    }
})

router.post('/serverInfo', async (req, res) => {
    if (req.query.playerCount && req.query.botCount && req.query.serverName && req.query.mapName) {
        const connection = mysql.createConnection({
            host: dbHost,
            user: dbUsername,
            password: dbPassword,
            database: dbName
        });
        connection.connect((err) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO serverInfo (playerCount, botCount, serverName, mapName) VALUES ('${req.query.playerCount}', '${req.query.botCount}', '${req.query.serverName}', '${req.query.mapName}')`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerCount: req.query.playerCount, botCount: req.query.botCount, serverName: req.query.serverName, mapName: req.query.mapName
                    });
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword('serverInfo') + ' added/updated for serverInfo endpoint!')))
                    console.log({ playerCount: req.query.playerCount, botCount: req.query.botCount, serverName: req.query.serverName, mapName: req.query.mapName })
                }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                if (err)
                    console.error("Error when closing connection", err)
            });
        });
    } else {
        res.send('Please provide playerCount, botCount, serverName and mapName in request')
        console.log('Missing a parameter');
    }
})

router.get('/repeatedRequests', async (req, res) => {
    if (!running) {
        running = true;
        let oldPlayers = [];
        let newPlayers = [];

        timestamp = moment().format('YYYY-MM-DD HH:mm:ss')

        res.status(200).json({
            message: "Initiating repeated requests ", timestamp
        })

        cron.schedule('*/5 * * * *', async () => {
            const serverInfo = await axios.get(`${endpoint}serverstats`)
                .then(response => response.data)
                .then(eachObject => (
                    eachObject
                        .map(element => element.directQueryInfo)
                        .filter(el => el != null)))

            await axios.post(`${endpoint}serverstats/serverInfo?playerCount=${serverInfo[0].playersnum}&botCount=${serverInfo[0].botsnum}&serverName=${serverInfo[0].name}&mapName=${serverInfo[0].map}`)
        });

        async function repeatedRequests() {
            try {
                const serverInfo = await axios.get(`${endpoint}serverstats`)
                    .then(response => response.data)
                    .then(eachObject => (
                        eachObject
                            .map(element => element.directQueryInfo)
                            .filter(el => el != null)))
                while (true) {
                    if (serverInfo[0].name) {
                        console.log(chalk.hex('#DEADED').bold('running a new task ************************************************************************************************************************************************************'));
                        await axios.get(`${endpoint}serverstats`)
                            .then(response => response.data)
                            .then(eachObject => (
                                eachObject
                                    .map(element => element.directPlayerInfo)
                                    .filter(el => el != null)))
                            .then(filteredResult => newPlayers = filteredResult[0] !== null && filteredResult[0] instanceof (Array) ? filteredResult[0].map(element => element) : console.error("******************** ERROR HAS OCCURRED: FILTERED RESULT IS ", filteredResult))
                            .catch(console.error)
                        oldPlayers = newPlayers;
                        newPlayers = [];

                        console.log(chalk.hex('#DEADED').bold('*** pausing for 15 seconds ***'));
                        await timer(15000);

                        await axios.get(`${endpoint}serverstats`)
                            .then(response => response.data)
                            .then(eachObject => (
                                eachObject
                                    .map(element => element.directPlayerInfo)
                                    .filter(el => el != null)))
                            .then(filteredResult => newPlayers = filteredResult[0] !== null && filteredResult[0] instanceof (Array) ? filteredResult[0].map(element => element) : console.error("******************** ERROR HAS OCCURRED: FILTERED RESULT IS ", filteredResult))
                            .catch(console.error)

                        try {

                            // Remove entries where they have just joined and server hasn't loaded name yet
                            oldPlayers = oldPlayers.filter(el => el.name !== '' || undefined)
                            newPlayers = newPlayers.filter(el => el.name !== '' || undefined)

                            // Compare both arrays with each other and see which elements don't exist in other one

                            // They have left and remove from oldPlayers array
                            if (!Array.isArray(oldPlayers) || !oldPlayers.length == 0 || serverInfo[0].playersnum >= 0) {
                                var z = oldPlayers.length
                                while (z--) {
                                    const playerHasLeft = _.findIndex(newPlayers, { name: oldPlayers[z].name }) === -1 ? true : false;
                                    if (playerHasLeft) {
                                        console.log(utf8.decode(oldPlayers[z].name) + " has left the server")
                                        const endpointRequest = axios.post(`${endpoint}serverstats/lastLogin?playerName=${oldPlayers[z].name}`)
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
                                        console.log(utf8.decode(newPlayers[y].name), " has joined the server")
                                        const endpointRequest = axios.post(`${endpoint}serverstats/?playerName=${newPlayers[y].name}`)
                                        postRequests.push(endpointRequest)
                                        // remove from array
                                        const findIndex = _.findIndex(newPlayers, { name: newPlayers[y].name })

                                        if (findIndex > -1) {
                                            newPlayers.splice(findIndex, 1);
                                        }
                                    }
                                }
                            }

                            if (!Array.isArray(newPlayers) || !newPlayers.length == 0 || serverInfo[0].playersnum >= 0) {
                                for (i = 0; i < newPlayers.length; i++) {

                                    let scoreDifference = 0;

                                    newPlayerIndex = _.findIndex(newPlayers, { name: oldPlayers[i].name }) != -1 ? _.findIndex(newPlayers, { name: oldPlayers[i].name }) : _.findIndex(newPlayers, { name: newPlayers[i].name })
                                    oldPlayerIndex = _.findIndex(oldPlayers, { name: newPlayers[i].name }) != -1 ? _.findIndex(oldPlayers, { name: newPlayers[i].name }) : _.findIndex(oldPlayers, { name: oldPlayers[i].name })

                                    if (newPlayers[newPlayerIndex].score != oldPlayers[oldPlayerIndex].score) {
                                        if (newPlayers[newPlayerIndex].score < oldPlayers[oldPlayerIndex].score) {
                                            scoreDifference = oldPlayers[oldPlayerIndex].score - newPlayers[newPlayerIndex].score
                                            logger.log(utf8.decode(newPlayers[newPlayerIndex].name) + "'s score is less than the old one as ******** new score is " + newPlayers[newPlayerIndex].score + " and old score is " + oldPlayers[oldPlayerIndex].score + " with difference " + scoreDifference)
                                            const endpointRequest = axios.post(`${endpoint}serverstats/pointsSpent?playerName=${newPlayers[newPlayerIndex].name}&pointsSpent=${scoreDifference >= 90 ? 0 : scoreDifference}`)
                                            postRequests.push(endpointRequest);
                                        }
                                        else if (newPlayers[newPlayerIndex].score > oldPlayers[oldPlayerIndex].score) {
                                            scoreDifference = newPlayers[newPlayerIndex].score - oldPlayers[oldPlayerIndex].score
                                            logger.log(utf8.decode(newPlayers[newPlayerIndex].name) + "'s score is more than the old one as ******** new score is " + newPlayers[newPlayerIndex].score + " and old score is " + oldPlayers[oldPlayerIndex].score + " with difference " + scoreDifference)
                                            const endpointRequest = axios.post(`${endpoint}serverstats/kills?playerName=${newPlayers[newPlayerIndex].name}&kills=${scoreDifference % 2 == 0 ? scoreDifference / 2 : scoreDifference}`)
                                            postRequests.push(endpointRequest)
                                        }
                                    }
                                    else {
                                        logger.log(utf8.decode(newPlayers[newPlayerIndex].name) + "'s score hasn't changed ******** because new score is " + newPlayers[newPlayerIndex].score + " and old score is " + oldPlayers[oldPlayerIndex].score)
                                        const endpointRequest = axios.post(`${endpoint}serverstats/?playerName=${newPlayers[newPlayerIndex].name}`)
                                        postRequests.push(endpointRequest)
                                    }
                                }

                                // Send all endpoint requests from above
                                Promise.all(postRequests)
                                    .then(console.log(chalk.whiteBright("Sent remaining players to database")))
                                    .catch(console.error)

                            }
                            else {
                                console.log(chalk.green("No one is on the server yet! New Players: ") + JSON.stringify(newPlayers, null, 4))
                            }
                        }
                        catch (error) {
                            console.error(chalk.red("Error processing this player: ", newPlayers[newPlayerIndex].name ? keyword(utf8.decode(newPlayers[newPlayerIndex].name)) : " Error while getting player: " + " " + error))
                            repeatedRequests();
                        }
                        oldPlayers = [];
                        newPlayers = [];
                        const completedNow = moment().format('HH:mm:ss')
                        console.log(chalk.blue('Completed this second at Time: ', chalk.blueBright(completedNow)));
                    }
                    else {
                        console.log(chalk.magentaBright("Server not online!"))
                    }
                }
            }
            catch (error) {
                console.error(chalk.red("Error has occurred while executing repeated requests: ", error))
                console.trace()
                repeatedRequests();
            }
        }
        repeatedRequests();
    }
    else {
        try {
            console.log("Already running, restart endpoint/dyno in heroku and call repeatedRequests again")
            res.status(404).json({
                error: {
                    message: "This endpoint has already been called and was called at: " + timestamp
                }
            });
        }
        catch (err) {
            console.error(err)
        }
    }
})

module.exports = router