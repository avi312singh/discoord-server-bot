const moment = require('moment');
const async = require('async')

module.exports =
    (encodedNameToBeStored, pool) => {
        const timestampForLastLogin = moment().format('YYYY-MM-DD HH:mm:ss').toString();
        return new Promise((resolve, reject) => {
            try {
                if (encodedNameToBeStored) {
                    pool.getConnection((err, connection) => {
                        const name = decodeURIComponent(encodedNameToBeStored);
                        if (err) console.log(err);

                        async.parallel([
                            (parallel_done) => {
                                connection.query(`INSERT INTO playerInfo (playerName) VALUES (?) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalTimeDaily = totalTimeDaily + .25, lastLogin = '${timestampForLastLogin}'`,
                                    [name], (err, results) => {
                                        if (err) return parallel_done(err);
                                        parallel_done();
                                    })
                            },
                            (parallel_done) => {
                                connection.query(`UPDATE playerInfo SET online = 0 WHERE playerName = ?`,
                                    [name], (err, results) => {
                                        if (err) return parallel_done(err);
                                        parallel_done();
                                    });
                            }
                        ], (err) => {
                            if (err) console.log(err);
                                connection.release();
                                resolve({ name: name, lastLogin: timestampForLastLogin, online: false })
                        });
                    });
                }
                else reject('Name is empty in query params');
            }
            catch (error) {
                return reject(error)
            }
        })
    }
