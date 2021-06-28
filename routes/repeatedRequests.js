const express = require('express');
const router = express.Router();
const axios = require('axios');
const chalk = require('chalk');
const cron = require('node-cron');
const schedule = require('node-schedule');
const moment = require('moment');
const winston = require('winston');
const _ = require('underscore');

const resetDailyUtil = require('../routesUtils/serverStatsUtils/resetDaily')
const resetWeeklyUtil = require('../routesUtils/serverStatsUtils/resetWeekly')
const resetMonthlyUtil = require('../routesUtils/serverStatsUtils/resetMonthly')
const serverInfoUtil = require('../routesUtils/serverStatsUtils/serverInfo')
const serverStatsUtil = require('../routesUtils/serverStatsUtils/serverStats')
const temporaryDataUtil = require('../routesUtils/serverStatsUtils/temporaryData');
const imageSrcUtil = require('../routesUtils/serverStatsUtils/imageSrc');
const truncate = require('../routesUtils/repeatedRequestsUtils/truncate');
const topPlayers = require('../routesUtils/aggregatedStatsUtils/topPlayers');
const allRows = require('../routesUtils/dbInteractionsUtils/allRows.js');
const steamRequest = require('../routesUtils/repeatedRequestsUtils/steamRequest');
const steamSessionRequest = require('../routesUtils/repeatedRequestsUtils/steamSessionIdRequest');

const pool = require('../db/db');

const serverIp = process.env.SERVERIP || (() => { new Error("Provide a server IP in env vars") });
const endpoint = process.env.APIENDPOINT || (() => { new Error("Provide a api endpoint in env vars") });
const basicAuthUsername = process.env.BASICAUTHUSERNAME || (() => { new Error("Provide a server IP in env vars") });
const basicAuthPassword = process.env.BASICAUTHPASSWORD || (() => { new Error("Provide a server IP in env vars") });

const recognisedTemporaryTableNames = ['playersComparisonFirst', 'playersComparisonSecond']
let running = false;

const users = {};
users[basicAuthUsername] = basicAuthPassword;

const axiosBasicAuthConfig = {
    auth: {
        username: 'avi312',
        password: basicAuthPassword
    }
}

const keyword = keyword => chalk.keyword('blue')(keyword)

const getNewPlayers = async () => {
    const currentMapName = "aocffa-ftyd_41_s_wip"
    const currentServerName = "*** Fall To Your Death 24/7 2.4 64 Players ***"
    return await serverStatsUtil(currentMapName, currentServerName, serverIp).catch(error => console.log(chalk.red(error)))
};

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

const timestamp = moment().format('YYYY-MM-DD HH:mm:ss')
router.get('/', async (req, res) => {
    if (!running) {
        running = true;

        console.log("GET: repeatedRequests " + timestamp)
        res.status(200).json({
            message: "Initiating repeated requests ", timestamp
        })

        // Start running all scheduled tasks

        // sends player count every 5 mins to serverInfo table
        cron.schedule('*/5 * * * *', async () => {
            const serverInfo = await getNewPlayers()
                .then(eachObject => (
                    eachObject
                        .map(element => element.directQueryInfo)
                        .filter(el => el != null)))

            serverInfoUtil(serverInfo[0].playersnum, serverInfo[0].botsnum, serverInfo[0].name, serverInfo[0].map)
                .then(result => {
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword('serverInfo') + ' added/updated for serverInfo endpoint!')))
                    console.log({ playerCount: result.playerCount, botCount: result.botCount, serverName: result.serverName, mapName: result.mapName })
                })
                .catch(result => {
                    console.log(chalk.red(result))
                })
        });

        // sends query to set all daily columns to 0 at 00:01 everyday
        cron.schedule('01 00 * * *', async () => {
            resetDailyUtil()
                .then(console.log(chalk.blue('I WAS TRIGGERED ON LINE 86 in repeated requests AT ' + moment().format('YYYY-MM-DD HH:mm:ss') + 'Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to ' + chalk.whiteBright.underline(keyword('0')))))
        })

        // sends query to set all weekly columns to 0 at 00:01 every Monday
        cron.schedule('01 00 * * 1', async () => {
            resetWeeklyUtil()
                .then(console.log(chalk.blue('I WAS TRIGGERED ON LINE 92 in repeated requests AT ' + moment().format('YYYY-MM-DD HH:mm:ss') + 'Reset totalKillsWeekly, totalPointsSpentWeekly, totalTimeWeekly to ' + chalk.whiteBright.underline(keyword('0')))))
        })

        // sends query to set all daily columns to 0 at 00:01 every 1st
        cron.schedule('01 00 1 * *', async () => {
            resetMonthlyUtil()
                .then(console.log(chalk.blue('I WAS TRIGGERED ON LINE 98 in repeated requests AT ' + moment().format('YYYY-MM-DD HH:mm:ss') + 'Reset totalKillsWeekly, totalPointsSpentWeekly, totalTimeWeekly to ' + chalk.whiteBright.underline(keyword('0')))))
        })

        // sends query to steam to get all imageSrc of top players every hour
        cron.schedule('0 * * * *', async () => {
            console.log("Sending query to steam to get all imageSrc of top players every due to start of hour")
            const topPlayersRequest = await topPlayers('', pool)
            const topPlayersResponse = topPlayersRequest.response
            const flattenedTopPlayers = [].concat.apply([], topPlayersResponse)
            for (var i = 0; i < flattenedTopPlayers.length; i += 5) {
                try {
                    let sessionId;
                    console.log("current player: ", flattenedTopPlayers[i])
                    sessionId = await steamSessionRequest()
                    console.log("sessionId: ", sessionId)
                    const imageSrc = await steamRequest(sessionId, flattenedTopPlayers[i])
                    await imageSrcUtil(encodeURIComponent(flattenedTopPlayers[i]), imageSrc)
                } catch (error) {
                    console.log("Error has occurred during steam requests for avatar picture for top players started at " + moment().format('YYYY-MM-DD HH:mm:ss') + ": " + error)
                    continue;
                }
            }
        })

        // sends query to steam to get all imageSrc of all players at 05:01 everyday
        cron.schedule('01 5 * * *', async () => {
            console.log("Sending query to steam to get all imageSrc of top players every due to 05:01")
            const allRowsRequest = await allRows('playerInfo', 'playerInfo')
            const allRowsResponse = allRowsRequest.rows
            for (var i = 0; i < allRowsResponse.length; i++) {
                try {
                    let sessionId;
                    console.log("current player: ", allRowsResponse[i].playerName)
                    sessionId = await steamSessionRequest()
                    console.log("sessionId: ", sessionId)
                    const imageSrc = await steamRequest(sessionId, allRowsResponse[i].playerName)
                    await imageSrcUtil(encodeURIComponent(allRowsResponse[i].playerName), imageSrc)
                } catch (error) {
                    console.log("Error has occurred during steam requests for avatar picture for all players started at " + moment().format('YYYY-MM-DD HH:mm:ss') + ": " + error)
                    continue;
                }
            }
        })

        // initial request of players every 15 seconds to playersComparisonCache table
        const firstJob = schedule.scheduleJob({ rule: '*/15 * * * * *' }, async (fireDate) => {

            const serverInfoUnfiltered = await getNewPlayers();
            const serverInfo = serverInfoUnfiltered
                .map(element => element.directQueryInfo)
                .filter(el => el != null)

            if (!serverInfo[0].name) {
                console.log(chalk.magentaBright("Server not online! Waiting for 1 minute"))
                firstJob.cancel(true)
                secondJob.cancel(true)
            }

            console.log(chalk.hex('#DEADED').bold('running first task ************************************************************************************************************************************************************'));
            console.log('First starting now: ' + moment().format('ss') + " but really started at " + fireDate);

            const playerInfoToBeCompared = await getNewPlayers()
                .then(eachObject => (
                    eachObject
                        .map(element => element.directPlayerInfo)
                        .filter(el => el != null)))

            const playersInfoUnfiltered = playerInfoToBeCompared[0] !== null && playerInfoToBeCompared[0] instanceof (Array) ? playerInfoToBeCompared[0].map(element => element)
                : undefined

            if (!playersInfoUnfiltered) {
                console.error(chalk.red("************* Server is not online so waiting for 30 seconds before next request to server"))
                firstJob.cancel(true)
                secondJob.cancel(true)
            }

            const playersInfo = playersInfoUnfiltered ? playersInfoUnfiltered.filter(el => el.name !== '' || undefined) : firstJob.cancel(true)

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
                    temporaryDataUtil(encodeURIComponent(playersInfo[i].name), playersInfo[i].duration, playersInfo[i].score, 'playersComparisonFirst', recognisedTemporaryTableNames)
                        .then(result => {
                            console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(result.name)) + " with duration " + chalk.whiteBright.underline(keyword(result.time)) + " and score " + chalk.whiteBright.underline(keyword(result.score)) + ' added into ' + result.tableName))
                        })
                        .catch(result => {
                            console.log(chalk.red(result))
                        })
                }
            }

            const completedNow = moment().format('HH:mm:ss')
            console.log(chalk.blue('Completed first job at Time: ', chalk.blueBright(completedNow)));
        });

        const secondJob = schedule.scheduleJob({ rule: '14-59/15 * * * * *' }, async (fireDate) => {
            console.log(chalk.hex('#DEADED').bold('running second task ************************************************************************************************************************************************************'));
            console.log('Second starting now: ' + moment().format('ss') + " but really started at " + fireDate);

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

            if (!playersInfoUnfiltered) {
                console.error(chalk.red("************* Server is not online so waiting for 30 seconds before next request to server"))
                firstJob.cancel(true)
                secondJob.cancel(true)
            }

            const playersInfo = playersInfoUnfiltered ? playersInfoUnfiltered.filter(el => el.name !== '' || undefined) : secondJob.cancel(true)

            for (i = 0; i < playersInfo.length; i++) {
                temporaryDataUtil(encodeURIComponent(playersInfo[i].name), playersInfo[i].duration, playersInfo[i].score, 'playersComparisonSecond', recognisedTemporaryTableNames)
                    .then(result => {
                        console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword(result.name)) + " with duration " + chalk.whiteBright.underline(keyword(result.time)) + " and score " + chalk.whiteBright.underline(keyword(result.score)) + ' added into ' + result.tableName))
                    })
                    .catch(result => {
                        console.log(chalk.red(result))
                    })
            }

            // Now that we have sent both players to the database - compare them both
            console.log("********* START COMPARISON ***************")
            const oldPlayersUnfiltered = await axios.get(`${endpoint}dbinteractions/allRows?tableName=playersComparisonFirst`, axiosBasicAuthConfig).then(element => element.data.result)
            const newPlayersUnfiltered = await axios.get(`${endpoint}dbinteractions/
            ?tableName=playersComparisonSecond`, axiosBasicAuthConfig).then(element => element.data.result)

            // Remove entries where they have just joined and server hasn't loaded name yet
            const oldPlayers = oldPlayersUnfiltered.rows.filter(el => el.name !== '' || undefined)
            const newPlayers = newPlayersUnfiltered.rows.filter(el => el.name !== '' || undefined)

            // Compare both arrays with each other and see which elements don't exist in other one
            let postRequests = [];
            // They have left and remove from oldPlayers array
            if (!Array.isArray(oldPlayers) || !oldPlayers.length == 0 || serverInfo[0].playersnum >= 0) {
                var z = oldPlayers.length
                while (z--) {
                    const playerHasLeft = _.findIndex(newPlayers, { name: oldPlayers[z].name }) === -1 ? true : false;
                    if (playerHasLeft) {
                        console.log(oldPlayers[z].name + " has abandoned the battle")
                        const endpointRequest = axios.post(`${endpoint}serverstats/lastLogin?name=${encodeURIComponent(oldPlayers[z].name)}`, {}, axiosBasicAuthConfig)
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
                        console.log(newPlayers[y].name, " has joined the server")
                        const endpointRequest = axios.post(`${endpoint}serverstats/?name=${encodeURIComponent(newPlayers[y].name)}`, {}, axiosBasicAuthConfig)
                        postRequests.push(endpointRequest)
                        // remove from array
                        const findIndex = _.findIndex(newPlayers, { name: newPlayers[y].name })

                        if (findIndex > -1) {
                            newPlayers.splice(findIndex, 1);
                        }
                    }
                }
            }

            for (i = 0; i < newPlayers.length; i++) {

                let scoreDifference = 0;
                let newPlayerIndex;
                let oldPlayerIndex;
                newPlayerIndex = _.findIndex(newPlayers, { name: oldPlayers[i].name }) != -1 ? _.findIndex(newPlayers, { name: oldPlayers[i].name }) : _.findIndex(newPlayers, { name: newPlayers[i].name })
                oldPlayerIndex = _.findIndex(oldPlayers, { name: newPlayers[i].name }) != -1 ? _.findIndex(oldPlayers, { name: newPlayers[i].name }) : _.findIndex(oldPlayers, { name: oldPlayers[i].name })

                if (newPlayers[newPlayerIndex].score != oldPlayers[oldPlayerIndex].score) {
                    if (newPlayers[newPlayerIndex].score < oldPlayers[oldPlayerIndex].score) {
                        scoreDifference = oldPlayers[oldPlayerIndex].score - newPlayers[newPlayerIndex].score
                        logger.log({
                            level: 'info',
                            message: `${newPlayers[newPlayerIndex].name + "'s score is less than the old one as ******** new score is " + newPlayers[newPlayerIndex].score + " and old score is " + oldPlayers[oldPlayerIndex].score + " with difference " + scoreDifference}`,
                        });
                        const endpointRequest = axios.post(`${endpoint}serverstats/pointsSpent?name=${encodeURIComponent(newPlayers[newPlayerIndex].name)}&pointsSpent=${scoreDifference >= 90 ? 0 : scoreDifference}`, {}, axiosBasicAuthConfig)
                        postRequests.push(endpointRequest);
                    }
                    else if (newPlayers[newPlayerIndex].score > oldPlayers[oldPlayerIndex].score) {
                        scoreDifference = newPlayers[newPlayerIndex].score - oldPlayers[oldPlayerIndex].score
                        logger.log({
                            level: 'info',
                            message: `${newPlayers[newPlayerIndex].name + "'s score is more than the old one as ******** new score is " + newPlayers[newPlayerIndex].score + " and old score is " + oldPlayers[oldPlayerIndex].score + " with difference " + scoreDifference}`,
                        });
                        const endpointRequest = axios.post(`${endpoint}serverstats/kills?name=${encodeURIComponent(newPlayers[newPlayerIndex].name)}&kills=${scoreDifference % 2 == 0 ? scoreDifference / 2 : scoreDifference}`, {}, axiosBasicAuthConfig)
                        postRequests.push(endpointRequest)
                    }
                }
                else {
                    logger.log({
                        level: 'info',
                        message: `${newPlayers[newPlayerIndex].name + "'s score hasn't changed ******** because new score is " + newPlayers[newPlayerIndex].score + " and old score is " + oldPlayers[oldPlayerIndex].score}`,
                    });
                    const endpointRequest = axios.post(`${endpoint}serverstats/?name=${encodeURIComponent(newPlayers[newPlayerIndex].name)}`, {}, axiosBasicAuthConfig)
                    postRequests.push(endpointRequest)
                }
            }

            // Send all endpoint requests from above
            Promise.all(postRequests)
                .then(console.log(chalk.whiteBright("Sent remaining players to database")))
                .catch(console.error)

            //  Need to truncate temp tables playersComparisonFirst and playersComparisonSecond
            truncate();
            const completedNow = moment().format('HH:mm:ss')
            console.log(chalk.blue('Completed second job at Time: ', chalk.blueBright(completedNow)));

            process.on('unhandledRejection', (reason, p) => {
                console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
                // application specific logging, throwing an error, or other logic here
            });

        });

        // Do not do the first scheduled run of secondJob as firstJob needs to be in front with a 15 second offset
        secondJob.cancelNext(true)

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