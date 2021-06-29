module.exports = (pageFromRequest, pool) => {
    return new Promise((resolve, reject) => {
        try {
            const pageCheckIfInParams = pageFromRequest ? pageFromRequest : reject('Provide a param for the page');
            const page = pageCheckIfInParams !== '/' && pageCheckIfInParams !== 'donate' && pageCheckIfInParams !== 'server-info'
                && pageCheckIfInParams !== 'player-stats' && pageCheckIfInParams !== 'server-data' && pageCheckIfInParams !== 'top-players'
                ? reject('Not a valid page') : pageCheckIfInParams.toString()
            pool.getConnection((err, connection) => {
                if (err) console.log(err);
                connection.query(`SELECT * FROM sys.pageCount where page='${page}'`,
                        (err, result) => {
                            if (err) console.log(err);
                            return err ? reject(err) : resolve({
                                result,
                            });
                        });
                        connection.release();
                        if (err) throw err;
            });
        }
        catch (error) {
            reject('Error has occurred ', error)
        }
    })
}