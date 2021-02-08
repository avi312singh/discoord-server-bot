const moment = require('moment');
const sqlString = require('sqlstring');

module.exports =
    (encodedNameToBeStored, pool) => {
        const timestampForLastLogin = moment().format('YYYY-MM-DD HH:mm:ss').toString();
        return new Promise((resolve, reject) => {
            try {
                if (encodedNameToBeStored) {
                    pool.getConnection((err, connection) => {
                        const name = decodeURIComponent(encodedNameToBeStored);
                        if (err) console.log(err);
                        connection.query(`INSERT INTO playerInfo (playerName) VALUES (${sqlString.escape(name)}) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalTimeDaily = totalTimeDaily + .25, lastLogin = '${timestampForLastLogin}'`, (err, result) => {
                            connection.release();
                            return err ? reject(err) : resolve({
                                name: name, lastLogin: timestampForLastLogin
                                // , result: result
                            });
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
