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
router.get('/', async function (req, res) {
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

    allServerInfo.push({ directQueryInfo: directQueryInfo})
    allServerInfo.push({ directPlayerInfo: directPlayerInfo })
    res.status(200).send(allServerInfo)
})

module.exports = router