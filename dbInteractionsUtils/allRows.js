module.exports = (pool, tableName, recognisedTableNames) => {
    return new Promise((resolve, reject) => {
        try {
            if (tableName) {
                if (recognisedTableNames.includes(tableName)) {
                    pool.getConnection((err, connection) => {
                        if (err) console.error(err)
                        connection.query(`SELECT * FROM ${tableName}`, (error, rows, fields) => {
                            if (error) console.log(error);
                            connection.release();
                            return err ? reject(err) : resolve({
                                message: `Successfully got all data from ${tableName}`,
                                result: rows
                            });
                        });
                        if (err) throw err;
                    });
                } else {
                    reject('Please provide a valid tableName')
                }
            }
            else {
                reject('Please provide tableName in query params')
            }
        } catch (error) {
            reject('Error has occured ', error)
        }
    })
}