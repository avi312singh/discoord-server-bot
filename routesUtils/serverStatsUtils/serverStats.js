const chalk = require('chalk');
const query = require("source-server-query");

{module.exports =
    async (currentMapName, currentServerName, serverIp) => {
        let allServerInfo = [];
    try {
        directQueryInfo =
            await query
                .info(serverIp, 7778, 2000)
                .then(query.close)
                .catch(console.error);
        directPlayerInfo =
            await query
                .players(serverIp, 7778, 2000)
                .then(query.close)
                .catch(console.error);

        if (directQueryInfo === {}) {
            throw error;
        }

        allServerInfo.push({ directQueryInfo: directQueryInfo })
        allServerInfo.push({ directPlayerInfo: directPlayerInfo })
        return allServerInfo
    }
    catch (error) {
        console.error(chalk.red("Sending default response as error has occurred whilst fetching a set of new players with error: " + error))

        allServerInfo.push({
            directQueryInfo: {
                "name": currentServerName,
                "map": currentMapName,
                "folder": "chivalrymedievalwarfare",
                "game": "Chivalry: Medieval Warfare",
                "appid": 0,
                "playersnum": 0,
                "maxplayers": 64,
                "botsnum": 0
            }
        })
        allServerInfo.push({ directPlayerInfo: [] })
        return allServerInfo
    }
}}