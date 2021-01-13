var express = require('express')
var router = express.Router()
const query = require("source-server-query");
const axios = require('axios');
const cron = require('node-cron');

let directQueryInfo = {};
let directPlayerInfo = [];
let allServerInfo = [];
const serverIp = process.env.SERVERIP || (() => { new Error("Provide a server IP in env vars") });
const endpoint = process.env.APIENDPOINT || (() => { new Error("Provide a api endpoint in env vars") });

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now())
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
            con.query(`INSERT INTO main.users (playerName, time, score, kills, deaths) VALUES ('${req.query.playerName}', '${req.query.time}', '${req.query.score}', '${req.query.kills}', '${req.query.deaths}')`, (err, result, fields) => {
                if (err) res.send(err);
                if (result) res.send({ playerName: req.query.playerName, time: req.query.time, score: req.query.score, kills: req.query.kills, deaths: req.query.deaths });
                if (fields) console.log(fields);
            });
        });
    } else {
        console.log('Missing a parameter');
    }
})

router.get('/repeatedRequests', async (req, res) => {
    let oldPlayers = [];
    let newPlayers = [];

    res.send("initiating repeated requests")

    var i = 1;

    async function myLoop() {
        try {
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
            console.log('pausing for 20 seconds');
            setTimeout(async () => {

                await axios.get(`${endpoint}serverstats`)
                    .then(response => response.data)
                    .then(eachObject => (
                        eachObject
                            .map(element => element.directPlayerInfo)
                            .filter(el => el != null)))
                    .then(filteredResult => newPlayers = filteredResult[0].map(element => element))
                    .catch(console.error)

                try {
                    for (let i = 0; i < newPlayers.length; i++) {
                        if (newPlayers[i].score != oldPlayers[i].score) {
                            console.log(newPlayers[i].name + "'s score has changed ******** new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score)
                        }
                        else {
                            console.log(newPlayers[i].name + "'s score hasnt changed ******** because new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score)

                        }
                    }
                }
                catch (error) {
                    console.error("Error processing this player: ", newPlayers[i].name + " " + error)
                }

                oldPlayers = [];
                newPlayers = [];

                // await axios.post
                console.log('Completed this second at Time: ', Date.now());

                i++;
                if (i < 10) {
                    myLoop();
                }
            }, 25000)
        }
        catch (error) {
            console.error("Error has occurred while executing repasted requests", error)
        }
    }

    myLoop();
})

module.exports = router