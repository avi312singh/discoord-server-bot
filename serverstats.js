var express = require('express')
var router = express.Router()
const query = require("source-server-query");
const axios = require('axios');

let directQueryInfo = {};
let directPlayerInfo = [];
let allServerInfo = [];
const serverIp = process.env.SERVERIP || (() => { new Error("Provide a server IP in env vars") });
const endpoint = process.env.APIENDPOINT || (() => { new Error("Provide a api endpoint in env vars") });

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
    if (req.query.name && req.query.email && req.query.age) {
        console.log('Request received');
        con.connect((err) => {
            if (err) res.send(err);
            con.query(`INSERT INTO playerInfo (playerName, totalTime, totalKills, totalPointsSpent) VALUES ('${req.query.playerName}', '${req.query.totalTime}', '${req.query.totalKills}', '${req.query.totalPointsSpent}')`, (err, result, fields) => {
                if (err) res.send(err);
                if (result) res.send({ playerName: req.query.playerName, totalTime: req.query.totalTime, totalKills: req.query.totalKills, totalPointsSpent: req.query.totalPointsSpent });
                if (fields) console.log(fields);
            });
            con.query(`UPDATE playerInfo SET totalTime = totalTime + 1 WHERE playerName = ${req.query.playerName}')`, (err, result, fields) => {
                if (err) res.send(err);
                if (result) res.send({ playerName: req.query.playerName, totalTime: req.query.totalTime });
                if (fields) console.log(fields);
            });
        });
    } else {
        res.send('Please provide playerName, totalTime, totalKills and totalPointsSpent in request')
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
                console.log('*** pausing for 20 seconds ***');
                await timer(20000);

                await axios.get(`${endpoint}serverstats`)
                    .then(response => response.data)
                    .then(eachObject => (
                        eachObject
                            .map(element => element.directPlayerInfo)
                            .filter(el => el != null)))
                    .then(filteredResult => newPlayers = filteredResult[0].map(element => element))
                    .catch(console.error)

                    // TODO: What params do we actually need to pass fo incrementing
                    // TODO: restructure POST request to have a switch case to increment either points spent or kills... time is alwaysw incrememnted
                    // TODO: UNIT TESTING

                try {
                    for (i = 0; i < newPlayers.length; i++) {
                        if (newPlayers[i].score) {
                            let scoreDifference = 0;
                            if (newPlayers[i].score != oldPlayers[i].score) {
                                if (newPlayers[i].score < oldPlayers[i].score) {
                                    scoreDifference = oldPlayers[i].score - newPlayers[i].score
                                    console.log(newPlayers[i].name + "'s score is less than the old one as ******** new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score + " with difference " + scoreDifference)
                                    await axios.post(`${endpoint}serverstatsrepeatedrequests?playerName=${newPlayers[i].name}&totalKills=123&totalPointsSpent=321`)
                                }
                                else if (newPlayers[i].score > oldPlayers[i].score) {
                                    scoreDifference = newPlayers[i].score - oldPlayers[i].score
                                    console.log(newPlayers[i].name + "'s score is more than the old one as ******** new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score + " with difference " + scoreDifference)
                                    await axios.post(`${endpoint}serverstats`)
                                }
                            }
                            else {
                                console.log(newPlayers[i].name + "'s score hasn't changed ******** because new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score)
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