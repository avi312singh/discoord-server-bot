module.exports = (page, pool) => {
    return new Promise((resolve, reject) => {
        try {
            pool.getConnection((err, connection) => {
                if (err) console.log(err);
                switch (duration) {
                    case 288:
                        connection.query(`INSERT INTO pageCount (page) VALUES ('${page}') ON DUPLICATE KEY UPDATE hits = hits + 1`,
                        (err, result) => {
                            if (err) console.log(err);
                            return err ? reject(err) : resolve({
                                duration,
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