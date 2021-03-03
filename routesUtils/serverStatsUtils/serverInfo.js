
const pool = require('../../db/db')
const undefinedCheck = (objectToCheck, ifUndefined) => objectToCheck == undefined ? ifUndefined : objectToCheck;

module.exports = (playerCountToBeStored, botCountToBeStored, serverNameToBeStored, mapNameToBeStored) => {
    return new Promise((resolve, reject) => {
        try {
            if (!isNaN(playerCountToBeStored) && !isNaN(botCountToBeStored) && serverNameToBeStored && mapNameToBeStored) {
                pool.getConnection((err, connection) => {
                    if (err) console.error(err)
                    connection.query(`INSERT INTO serverInfo (playerCount, botCount, serverName, mapName) VALUES (${undefinedCheck(playerCountToBeStored, 0)}, ${undefinedCheck(botCountToBeStored, 0)}, '${undefinedCheck(serverNameToBeStored, "Not Online")}', '${undefinedCheck(mapNameToBeStored, "Not Online")}')`, (err, result, fields) => {
                        connection.release();
                        return err ? reject(err) : resolve({
                            playerCount: playerCountToBeStored, botCount: botCountToBeStored, serverName: serverNameToBeStored, mapName: mapNameToBeStored
                            // , result: result
                        });
                    });
                })
            } else {
                return reject('Please provide playerCount, botCount, serverName and mapName in query params')
            }
        }
        catch (error) {
            return reject(error)
        }
    })
}