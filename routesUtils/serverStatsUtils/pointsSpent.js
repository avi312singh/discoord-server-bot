const pool = require('../../db/db')

module.exports =
    (encodedNameToBeStored, pointsSpentToBeStored) => {
        return new Promise((resolve, reject) => {
            try {
                if (encodedNameToBeStored && pointsSpentToBeStored) {
                    pool.getConnection((err, connection) => {
                        if (err) console.log(err);
                        const name = decodeURIComponent(encodedNameToBeStored);
                        const pointsSpent = pointsSpentToBeStored;
                        connection.query(`INSERT INTO playerInfo (playerName, totalPointsSpent, totalPointsSpentDaily, totalPointsSpentWeekly, totalPointsSpentMonthly, online) VALUES (?, ${pointsSpent}, ${pointsSpent}, ${pointsSpent}, ${pointsSpent}, 1)
                        ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalTimeDaily = totalTimeDaily + .25, totalTimeWeekly = totalTimeWeekly + .25, totalTimeMonthly = totalTimeMonthly + .25, totalPointsSpent = totalPointsSpent + ${pointsSpent}, totalPointsSpentDaily = totalPointsSpentDaily + ${pointsSpent}, online = 1`,
                        [name],
                            (err, result) => {
                                connection.release();
                                return err ? reject(err) : resolve({
                                    name: name, pointsSpent: pointsSpent, online: true
                                    // , result: result
                                });
                            });
                    });
                }
                else reject('Please enter name and points spent in query params');
            }
            catch (error) {
                return reject(error)
            }
        })
    }