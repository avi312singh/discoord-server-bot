const pool = require('../../db/db')

module.exports =
    (encodedNameToBeStored, killsToBeStored) => {
        return new Promise((resolve, reject) => {
            try {
                if (encodedNameToBeStored && killsToBeStored) {
                    if (isNaN(killsToBeStored)) {
                        reject('Kills needs to be a number')
                    }
                    pool.getConnection((err, connection) => {
                        const name = decodeURIComponent(encodedNameToBeStored);
                        let kills = killsToBeStored;
                        kills > 12 ? kills = 1 : kills = kills;
                        if (err) console.log(err);
                        connection.query(`INSERT INTO playerInfo (playerName, totalKills, totalKillsDaily, totalKillsWeekly, totalKillsMonthly, online) VALUES (?, ${kills}, ${kills}, ${kills}, ${kills}, 1)
                        ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalTimeDaily = totalTimeDaily + .25, totalTimeWeekly = totalTimeWeekly + .25, totalTimeMonthly = totalTimeMonthly + .25,
                        totalKills = totalKills + ${kills}, totalKillsDaily = totalKillsDaily + ${kills}, totalKillsWeekly = totalKillsWeekly + ${kills}, totalKillsMonthly = totalKillsMonthly + ${kills},
                        online = 1`, [name], (err, result) => {
                            connection.release();
                            return err ? reject(err) : resolve({
                                name: name, kills: kills, online: true
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
