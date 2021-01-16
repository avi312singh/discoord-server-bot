const express = require('express')
const router = express.Router()
const query = require("source-server-query");
const axios = require('axios');
const mysql = require('mysql');
const chalk = require('chalk')
const moment = require('moment');

let directQueryInfo = {};
let directPlayerInfo = [];
let allServerInfo = [];
let running = false;
let timestamp;


const serverIp = process.env.SERVERIP || (() => { new Error("Provide a server IP in env vars") });
const endpoint = process.env.APIENDPOINT || (() => { new Error("Provide a api endpoint in env vars") });
const dbHost = process.env.DBENDPOINT || (() => { new Error("Provide a db endpoint in env vars") });
const dbPassword = process.env.DBPASSWORD || (() => { new Error("Provide a db password in env vars") });
const dbUsername = process.env.DBUSER || (() => { new Error("Provide a db username in env vars") });
const dbName = process.env.DBNAME || (() => { new Error("Provide a db username in env vars") });


const timer = ms => new Promise(res => setTimeout(res, ms))
const keyword = keyword => chalk.keyword('blue')(keyword)


// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Request received at: ', Date.now())
    console.log("Served IP address: " + req.headers['x-forwarded-for'] || req.connection.remoteAddress)
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
    res.send(allServerInfo)
    allServerInfo = [];
})

router.post('/', async (req, res) => {
    if (req.query.playerName) {
        console.log('Request received');
        const connection = mysql.createConnection({
            host: dbHost,
            user: dbUsername,
            password: dbPassword,
            database: dbName
        });
        connection.connect((err) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName) VALUES ('${req.query.playerName.replace("'", "''")}') ON DUPLICATE KEY UPDATE totalTime = totalTime + .25`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerName: req.query.playerName
                    });
                    console.log(chalk.blue('Database entry added/updated for ' + chalk.whiteBright.underline(keyword(req.query.playerName.replace("'", "''"))) + ' endpoint!'))
                    console.log({ playerName: req.query.playerName });
                }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                if (err)
                    console.log("Error when closing connection", err)
            });
        });
    } else {
        res.send('Please provide playerName in request')
        console.log('Missing a parameter');
    }
})

router.post('/lastLogin', async (req, res) => {
    const lastLogin = Date.now();
    if (req.query.playerName) {
        console.log('Request received');
        const connection = mysql.createConnection({
            host: dbHost,
            user: dbUsername,
            password: dbPassword,
            database: dbName
        });
        connection.connect((err) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName, lastLogin) VALUES ('${req.query.playerName.replace("'", "''")}', ${lastLogin}) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerName: req.query.playerName, lastLogin: lastLogin
                    });
                    console.log(chalk.blue('Database entry added/updated for ' + chalk.whiteBright.underline(keyword(lastLogin)) + 'endpoint!'))
                    console.log({ playerName: req.query.playerName, lastLogin: lastLogin });
                }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                if (err)
                    console.log("Error when closing connection", err)
            });
        });
    } else {
        res.send('Please provide playerName in request')
        console.log('Missing a parameter');
    }
})

router.post('/kills', async (req, res) => {
    if (req.query.playerName && req.query.kills) {
        console.log('Request received');
        const connection = mysql.createConnection({
            host: dbHost,
            user: dbUsername,
            password: dbPassword,
            database: dbName
        });
        connection.connect((err) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName, totalKills) VALUES ('${req.query.playerName.replace("'", "''")}', ${req.query.kills}) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalKills = totalKills + 1`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerName: req.query.playerName, kills: req.query.kills
                    });
                    console.log(chalk.blue('Database entry added/updated for ' + chalk.whiteBright.underline(keyword(req.query.kills)) + ' endpoint!'))
                    console.log({ playerName: req.query.playerName, kills: req.query.kills })
                }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                if (err)
                    console.log("Error when closing connection", err)
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
        console.log('Request received');
        connection.connect((err) => {
            if (err) console.log(err);
            connection.query(`INSERT INTO playerInfo (playerName, totalPointsSpent) VALUES ('${req.query.playerName.replace("'", "''")}', ${req.query.pointsSpent}) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalPointsSpent = totalPointsSpent + ${req.query.pointsSpent}`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerName: req.query.playerName, pointsSpent: req.query.pointsSpent
                    });
                    console.log(chalk.blue('Database entry added/updated for ' + chalk.whiteBright.underline(keyword(req.query.pointsSpent)) + ' endpoint!'))
                    console.log({ playerName: req.query.playerName, pointsSpent: req.query.pointsSpent })
                }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                if (err)
                    console.log("Error when closing connection", err)
            });
        });
    } else {
        res.send('Please provide playerName and pointsSpent in request')
        console.log('Missing a parameter');
    }
})

router.get('/repeatedRequests', async (req, res) => {
    if (!running) {
        running = true;
        let oldPlayers = [];
        let newPlayers = [];

        timestamp = moment().format('HH:mm:ss')

        res.send("initiating repeated requests")

        async function repeatedRequests() {
            try {
                while (true) {
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

                    // TODO: UNIT TESTING

                    try {

                        const checkIfPlayerIsHere = () => {
                            for (j = 0; j < newPlayers.length; j++) {
                                if (newPlayers.indexOf(oldPlayers[j]))
                                    return true;
                            }
                        }

                        if (!Array.isArray(newPlayers) || !newPlayers.length == 0) {
                            for (i = 0; i < newPlayers.length; i++) {
                                let scoreDifference = 0;
                                let postRequests = [];
                                if (oldPlayers[i].name == newPlayers[i].name || checkIfPlayerIsHere()) {
                                    //  TODO: OLDPLAYERS IS THE PROBLEM CONSIDER LODASH GET
                                    if (newPlayers[i].name !== "") {
                                        if (newPlayers[i].score != oldPlayers[i].score) {
                                            if (newPlayers[i].score < oldPlayers[i].score) {
                                                scoreDifference = oldPlayers[i].score - newPlayers[i].score
                                                console.log(newPlayers[i].name + "'s score is less than the old one as ******** new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score + " with difference " + scoreDifference)
                                                const temp = axios.post(`${endpoint}serverstats/pointsSpent?playerName=${newPlayers[i].name}&pointsSpent=${scoreDifference}`)
                                                postRequests.push(temp);
                                            }
                                            else if (newPlayers[i].score > oldPlayers[i].score) {
                                                scoreDifference = newPlayers[i].score - oldPlayers[i].score
                                                console.log(newPlayers[i].name + "'s score is more than the old one as ******** new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score + " with difference " + scoreDifference)
                                                const temp = axios.post(`${endpoint}serverstats/kills?playerName=${newPlayers[i].name}&kills=${scoreDifference}`)
                                                postRequests.push(temp)
                                            }
                                        }
                                        else {
                                            console.log(newPlayers[i].name + "'s score hasn't changed ******** because new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score)
                                            const temp = axios.post(`${endpoint}serverstats/?playerName=${newPlayers[i].name}`)
                                            postRequests.push(temp)
                                        }
                                    }
                                }
                                else {
                                    console.log(newPlayers[i].name, " has left the server")
                                    const temp = axios.post(`${endpoint}serverstats/lastLogin?playerName=${newPlayers[i].name}`)
                                    postRequests.push(temp)
                                }
                            }
                            // console.log("ABout to be sent: ", postRequests)
                            Promise.all(postRequests)
                                .then(console.log)
                                .catch(console.error)
                        }
                        else {
                            console.log(chalk.green("No one is on the server yet! New Players: ") + JSON.stringify(newPlayers, null, 4))
                        }
                    }
                    catch (error) {
                        console.error(chalk.red("Error processing this player: ", newPlayers[i].name ? keyword(newPlayers[i].name) : " Error while getting player: " + " " + error))
                        // repeatedRequests();
                    }

                    oldPlayers = [];
                    newPlayers = [];
                    console.log(chalk.blueBright('Completed this second at Time: ', Date.now()));

                }
            }
            catch (error) {
                console.error(chalk.red("Error has occurred while executing repeated requests: ", error))
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