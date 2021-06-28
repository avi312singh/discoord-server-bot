module.exports = (durationFromRequest, pool) => {
    return new Promise((resolve, reject) => {
        try {
            const durationCheckIfInParams = durationFromRequest ? durationFromRequest : 288;
            const duration = durationCheckIfInParams !== '218' ? 288 : parseInt(durationCheckIfInParams)
            pool.getConnection((err, connection) => {
                if (err) console.log(err);
                switch (duration) {
                    case 288:
                        connection.query(`SELECT playername, ceiling(totalKillsWeekly) as totalKillsWeekly, ceiling(totalTimeWeekly) as totalTimeWeekly, ROUND(totalKillsWeekly/totalTimeWeekly, 2) as killsPerTimeSpentRatio, imageSrc
                        FROM sys.playerInfo
                        WHERE totalKillsWeekly != 0
                        ORDER BY totalKillsWeekly DESC;`,
                        (err, result) => {
                            if (err) console.log(err);
                            return err ? reject(err) : resolve({
                                duration,
                                // remove .map() to return with keys
                                response: result.map(Object.values)
                            });
                        });
                        connection.release();
                        if (err) throw err;
                        break;
                }
            });
        }
        catch (error) {
            reject('Error has occurred ', error)
        }
    })
}