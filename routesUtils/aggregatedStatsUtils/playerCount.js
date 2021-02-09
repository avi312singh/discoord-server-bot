module.exports = (durationFromRequest, pool) => {
    return new Promise((resolve, reject) => {
        try {
            const durationCheckIfInParams = durationFromRequest ? durationFromRequest : 288;
            const duration = durationCheckIfInParams !== '2016' && durationCheckIfInParams !== '8760'
                ? 288 : parseInt(durationCheckIfInParams)
            pool.getConnection((err, connection) => {
                if (err) console.log(err);
                switch (duration) {
                    case 2016:
                    case 8760:
                        connection.query(`SELECT
                                            time, playerCount
                                            FROM (
                                            SELECT
                                                @row := @row +1 AS rownum, time, playerCount
                                            FROM (
                                                SELECT @row :=0) r, sys.serverInfo ORDER BY time DESC limit ${duration}
                                            ) ranked
                                            WHERE rownum % 4 = 1
                                            ORDER BY
                                            time;`,
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
                    case 288:
                        connection.query(`SELECT
                                        time, playerCount
                                        FROM
                                            (
                                            SELECT time, playerCount FROM sys.serverInfo ORDER BY time DESC limit 288
                                            ) a
                                        ORDER BY
                                        time;`,
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