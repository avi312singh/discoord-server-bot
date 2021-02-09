module.exports =
    (encodedNameToBeStored, pointsSpentToBeStored, pool) => {
        return new Promise((resolve, reject) => {
            try {
                if (encodedNameToBeStored && pointsSpentToBeStored) {
                    pool.getConnection((err, connection) => {
                        if (err) console.log(err);
                        const name = decodeURIComponent(encodedNameToBeStored);
                        const pointsSpent = pointsSpentToBeStored;
                        connection.query(`INSERT INTO playerInfo (playerName, totalPointsSpent, totalPointsSpentDaily, online) VALUES ('${name}', ${pointsSpent}, ${pointsSpent}, true) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalPointsSpent = totalPointsSpent + ${pointsSpent}, totalPointsSpentDaily = totalPointsSpentDaily + ${pointsSpent}`,
                            (err, result) => {
                                connection.release();
                                return err ? reject(err) : resolve({
                                    name: name, pointsSpent: pointsSpent
                                    // , result: result
                                });
                            });
                    });
                }
                else reject('Please enter name and point spent in query params');
            }
            catch (error) {
                return reject(error)
            }
        })
    }