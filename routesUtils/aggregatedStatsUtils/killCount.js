module.exports = (durationFromRequest, pool) => {
    return new Promise((resolve, reject) => {
        try {
            const durationCheckIfInParams = durationFromRequest ? durationFromRequest : 288;
            const duration = durationCheckIfInParams !== '2016' && durationCheckIfInParams !== '8760' && durationCheckIfInParams !== '666'
                ? 288 : parseInt(durationCheckIfInParams)
            pool.getConnection((err, connection) => {
                if (err) console.log(err);
                switch (duration) {
                    // weekly
                    case 2016:
                        connection.query(`SELECT SUM(totalKillsWeekly) FROM sys.playerInfo;`,
                            (err, result) => {
                                if (err) console.log(err);
                                return err ? reject(err) : resolve({
                                    duration,
                                    response: result
                                });
                            });
                        connection.release();
                        if (err) throw err;
                        break;
                    // monthly
                    case 8760:
                        connection.query(`SELECT SUM(totalKillsMonthly) FROM sys.playerInfo;`,
                            (err, result) => {
                                if (err) console.log(err);
                                return err ? reject(err) : resolve({
                                    duration,
                                    response: result
                                });
                            });
                        connection.release();
                        if (err) throw err;
                        break;
                    // all
                    case 666:
                        connection.query(`SELECT SUM(totalKills) FROM sys.playerInfo;`,
                            (err, result) => {
                                if (err) console.log(err);
                                return err ? reject(err) : resolve({
                                    duration,
                                    response: result
                                });
                            });
                        connection.release();
                        if (err) throw err;
                        break;
                    // daily
                    case 288:
                        connection.query(`SELECT SUM(totalKillsDaily) FROM sys.playerInfo;`,
                            (err, result) => {
                                if (err) console.log(err);
                                return err ? reject(err) : resolve({
                                    duration,
                                    response: result
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