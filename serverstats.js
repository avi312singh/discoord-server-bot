var express = require('express')
var router = express.Router()
const query = require("source-server-query");
const axios = require('axios');
const mysql = require('mysql');

let directQueryInfo = {};
let directPlayerInfo = [];
let allServerInfo = [];
const serverIp = process.env.SERVERIP || (() => { new Error("Provide a server IP in env vars") });
const endpoint = process.env.APIENDPOINT || (() => { new Error("Provide a api endpoint in env vars") });
const dbHost = process.env.DBENDPOINT || (() => { new Error("Provide a db endpoint in env vars") });
const dbPassword = process.env.DBPASSWORD || (() => { new Error("Provide a db password in env vars") });
const dbUsername = process.env.DBUSER || (() => { new Error("Provide a db username in env vars") });
const dbName = process.env.DBNAME || (() => { new Error("Provide a db username in env vars") });


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
            connection.query(`INSERT INTO playerInfo (playerName, totalKills) VALUES ('${req.query.playerName}', ${req.query.kills}) ON DUPLICATE KEY UPDATE totalTime = totalTime + 1, totalKills = totalKills + 1`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.send({ playerName: req.query.playerName, kills: req.query.kills });
                    console.log({ playerName: req.query.playerName, kills: req.query.kills })
                }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                console.log("Connection terminated")
                if(err)
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
            connection.query(`INSERT INTO playerInfo (playerName, totalPointsSpent) VALUES ('${req.query.playerName}', ${req.query.pointsSpent}) ON DUPLICATE KEY UPDATE totalTime = totalTime + 1, totalPointsSpent = totalPointsSpent + ${req.query.pointsSpent}`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.send({ playerName: req.query.playerName, pointsSpent: req.query.pointsSpent });
                    console.log({ playerName: req.query.playerName, pointsSpent: req.query.pointsSpent})
            }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                console.log("Connection terminated")
                if (err)
                    console.log("Error when closing connection", err)
            });
        });
    } else {
        res.send('Please provide playerName and pointsSpent in request')
        console.log('Missing a parameter');
    }
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
            connection.query(`INSERT INTO playerInfo (playerName) VALUES ('${req.query.playerName}') ON DUPLICATE KEY UPDATE totalTime = totalTime + 1`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                res.send({ playerName: req.query.playerName });
                console.log({ playerName: req.query.playerName });
            }
                if (fields) console.log(fields);
            });
            connection.end((err) => {
                console.log("Connection terminated")
                if (err)
                    console.log("Error when closing connection", err)
            });
        });
    } else {
        res.send('Please provide playerName in request')
        console.log('Missing a parameter');
    }
})

router.get('/repeatedRequests', async (req, res) => {
    let oldPlayers = [];
    let newPlayers = [];

    res.send("initiating repeated requests")


    const timer = ms => new Promise(res => setTimeout(res, ms))

    async function repeatedRequests() {
        try {

            while (true) {
                console.log('running a new task ************************************************************************************************************************************************************');
                await axios.get(`${endpoint}serverstats`)
                    .then(response => response.data)
                    .then(eachObject => (
                        eachObject
                            .map(element => element.directPlayerInfo)
                            .filter(el => el != null)))
                    .then(filteredResult => newPlayers = filteredResult[0].map(element => element))
                    .catch(console.error)
                oldPlayers = newPlayers;
                newPlayers = [];
                console.log('*** pausing for 15 seconds ***');
                await timer(15000);

                await axios.get(`${endpoint}serverstats`)
                    .then(response => response.data)
                    .then(eachObject => (
                        eachObject
                            .map(element => element.directPlayerInfo)
                            .filter(el => el != null)))
                    .then(filteredResult => newPlayers = filteredResult[0].map(element => element))
                    .catch(console.error)

                    // TODO: UNIT TESTING

                try {
                    for (i = 0; i < newPlayers.length; i++) {
                        if (newPlayers[i].score) {
                            let scoreDifference = 0;
                            if (newPlayers[i].score != oldPlayers[i].score) {
                                if (newPlayers[i].score < oldPlayers[i].score) {
                                    scoreDifference = oldPlayers[i].score - newPlayers[i].score
                                    console.log(newPlayers[i].name + "'s score is less than the old one as ******** new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score + " with difference " + scoreDifference)
                                    await axios.post(`${endpoint}serverstats/pointsSpent?playerName=${newPlayers[i].name}&pointsSpent=${scoreDifference}`)
                                        .then(res => console.log('Database entry added/updated!'))

                                }
                                else if (newPlayers[i].score > oldPlayers[i].score) {
                                    scoreDifference = newPlayers[i].score - oldPlayers[i].score
                                    console.log(newPlayers[i].name + "'s score is more than the old one as ******** new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score + " with difference " + scoreDifference)
                                    await axios.post(`${endpoint}serverstats/kills?playerName=${newPlayers[i].name}&kills=${scoreDifference}`)
                                        .then(res => console.log('Database entry added/updated!'))
                                }
                            }
                            else {
                                console.log(newPlayers[i].name + "'s score hasn't changed ******** because new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score)
                                await axios.post(`${endpoint}serverstats/?playerName=${newPlayers[i].name}`)
                                    .then(res => console.log('Database entry added/updated!'))
                            }
                        }
                    }
                }
                catch (error) {
                    console.error("Error processing this player: ", newPlayers[i].name + " " + error)
                    continue;
                }

                oldPlayers = [];
                newPlayers = [];

                console.log('Completed this second at Time: ', Date.now());

            }
        }
        catch (error) {
            console.error("Error has occurred while executing repasted requests", error)
            repeatedRequests();
        }
    }

    repeatedRequests();
})

module.exports = router