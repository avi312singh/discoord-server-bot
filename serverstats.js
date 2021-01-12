var express = require('express')
var router = express.Router()
const query = require("source-server-query");

let directQueryInfo = {};
let directPlayerInfo = [];
let allServerInfo = [];
const serverIp = process.env.SERVERIP || (() => { new Error("Provide a server IP in env vars") });

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

module.exports = router