
module.exports = (encodedNameToBeStored, timeToBeStored, scoreToBeStored, tableNameToBeStored, pool, recognisedTemporaryTableNames) => {
    return new Promise((resolve, reject) => {
        try {
            if (encodedNameToBeStored, timeToBeStored, scoreToBeStored, tableNameToBeStored) {
                if (recognisedTemporaryTableNames.includes(recognisedTemporaryTableNames)) {
                    reject("Needs to be a valid table name")
                }
                pool.getConnection((err, connection) => {
                    const name = decodeURIComponent(encodedNameToBeStored);
                    const time = timeToBeStored;
                    const score = scoreToBeStored;
                    const tableName = tableNameToBeStored;
                    if (err) console.log(err);
                    connection.query(`INSERT INTO ${tableName} (name, time, score)
            VALUES (${name}, ${time}, ${score}) ON DUPLICATE KEY UPDATE name = ${name}, time = ${time}, score = ${score}`, (err, result) => {
                        connection.release();
                        return err ? reject(err) : resolve({
                            tableName: tableName, name: name, time: time, score: score,
                            // , result: result
                        });
                    });
                });
            }
            else {
                return reject('Please provide name, time, score and a tableName in request')
            }
        }
        catch (error) {
            return reject(error)
        }
    })
}