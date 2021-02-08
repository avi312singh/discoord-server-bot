

module.exports =
(playerCountToBeStored, botCountToBeStored, serverNameToBeStored, mapNameToBeStored, undefinedCheck, pool) => {
    if (playerCountToBeStored && botCountToBeStored && serverNameToBeStored && mapNameToBeStored) {
        pool.getConnection((err, connection) => {
            if (err) console.error(err)
            connection.query(`INSERT INTO serverInfo (playerCount, botCount, serverName, mapName) VALUES (${undefinedCheck(playerCountToBeStored, 0)}, ${undefinedCheck(botCountToBeStored, 0)}, '${undefinedCheck(serverNameToBeStored, "Not Online")}', '${undefinedCheck(mapNameToBeStored, "Not Online")}')`, (err, result, fields) => {
                if (err) console.log(err);
                if (result) {
                    res.status(201).json({
                        playerCount: playerCountToBeStored, botCount: botCountToBeStored, serverName: serverNameToBeStored, mapName: mapNameToBeStored
                    });
                    console.log(chalk.blue('Database entry ' + chalk.whiteBright.underline(keyword('serverInfo') + ' added/updated for serverInfo endpoint!')))
                    console.log({ playerCount: playerCountToBeStored, botCount: botCountToBeStored, serverName: serverNameToBeStored, mapName: mapNameToBeStored })
                }
                if (fields) console.log(fields);
                return connection.release();
            });
        })
    } else {
        res.status(400).json({
            error: {
                message: 'Please provide playerCount, botCount, serverName and mapName in request'
            }
        })
        console.log('Missing a parameter');
    }
}