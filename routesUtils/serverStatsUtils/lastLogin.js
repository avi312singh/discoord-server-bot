const moment = require('moment');
const pool = require('../../db/db')

module.exports =
    (encodedNameToBeStored) => {
        const timestampForLastLogin = moment().format('YYYY-MM-DD HH:mm:ss').toString();
        return new Promise((resolve, reject) => {
            try {
                if (encodedNameToBeStored) {
                    pool.getConnection((err, connection) => {
                        const name = decodeURIComponent(encodedNameToBeStored);
                        if (err) console.log(err);
                        connection.query(`UPDATE playerInfo SET online = 0, totalTime = totalTime + .25, totalTimeDaily = totalTimeDaily + .25,  totalTimeWeekly = totalTimeWeekly + .25, totalTimeMonthly = totalTimeMonthly + .25, lastLogin = '${timestampForLastLogin}' WHERE playerName = ? LIMIT 1;`,
                        [name] ,(err, result) => {
                            connection.release();
                            return err ? reject(err) : resolve({
                                name: name, lastLogin: timestampForLastLogin, online: false
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
