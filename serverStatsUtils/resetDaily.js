module.exports = () => {
    pool.getConnection((err, connection) => {
        if (err) console.error(err)
        pool.query(`UPDATE playerInfo SET totalKillsDaily = 0, totalPointsSpentDaily = 0, totalTimeDaily = 0 WHERE playerName IS NOT NULL`,
            (err, result, fields) => {
                if (err) console.error(err)
                res.status(200).json({
                    message: "Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to 0"
                })
            });
        console.log(chalk.blue('Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to ' + chalk.whiteBright.underline(keyword('0'))))
        connection.release();
        if (err) throw err;
    });
}