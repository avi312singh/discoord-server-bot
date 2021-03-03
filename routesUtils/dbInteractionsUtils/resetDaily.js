const pool = require('../../db/db');

module.exports = (chalk, keyword) => {
    return new Promise((resolve, reject) => {
        try {
            pool.getConnection((err, connection) => {
                if (err) console.error(err)
                connection.query(`UPDATE playerInfo SET totalKillsDaily = 0, totalPointsSpentDaily = 0, totalTimeDaily = 0 WHERE playerName IS NOT NULL`,
                    (err) => {
                        if (err) console.error(err)
                        connection.release();
                        return err ? reject(err) : resolve("Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to 0"
                        );
                    });
                console.log(chalk.blue('Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to ' + chalk.whiteBright.underline(keyword('0'))))
                if (err) throw err;
            })
        }
        catch (error) {
            reject(error)
        }
    })
}