module.exports =
    (encodedNameToBeStored, killsToBeStored, pool) => {
        return new Promise((resolve, reject) => {
            try {
                if (encodedNameToBeStored && killsToBeStored) {
                    if (isNaN(killsToBeStored)) {
                        reject('Kills needs to be a number')
                    }
                    pool.getConnection((err, connection) => {
                        const name = decodeURIComponent(encodedNameToBeStored);
                        const kills = killsToBeStored;
                        if (err) console.log(err);
                        connection.query(`INSERT INTO playerInfo (playerName, totalKills, totalKillsDaily, online) VALUES ('${name}', ${kills}, ${kills}, 1) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalKills = totalKills + ${kills}, totalKillsDaily = totalKillsDaily + ${kills}`, (err, result) => {
                            connection.release();
                            return err ? reject(err) : resolve({
                                name: name, kills: kills
                                // , result: result
                            });
                        });
                    });
                }
                else reject('Please enter name and kills in query params');
            }
            catch (error) {
                return reject(error)
            }
        })
    }
