const pool = require('../../db/db')

module.exports = () => {
    return new Promise((resolve, reject) => {
        try {
            pool.getConnection((err, connection) => {
                if (err) console.error(err)
                pool.query(`UPDATE playerInfo SET totalKillsDaily = 0, totalPointsSpentDaily = 0, totalTimeDaily = 0 WHERE playerName IS NOT NULL`,
                    (err, result) => {
                        connection.release();
                        return err ? reject(err) : resolve();
                    });
            }
            )
        }
        catch (error) {
            reject(error)
        }
    })
}