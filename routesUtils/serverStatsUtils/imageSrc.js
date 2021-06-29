const pool = require('../../db/db')

module.exports =
    (encodedNameToBeStored, imageSrcFromRequest) => {
        return new Promise((resolve, reject) => {
            try {
                if (encodedNameToBeStored) {
                    pool.getConnection((err, connection) => {
                        const name = decodeURIComponent(encodedNameToBeStored);
                        const imageSrc = imageSrcFromRequest ? imageSrcFromRequest : ''
                        const imageSrcFull = imageSrc.includes('_medium.jpg') && imageSrc.replace('_medium.jpg', '_full.jpg')
                        console.log('Sending unencoded name ' + name + ' imageSrc ' + imageSrcFull + ' to database')
                        if (err) console.log(err);
                        connection.query(`UPDATE playerInfo SET imageSrc = '${imageSrcFull}' WHERE playerName = ?`, [name], (err, result, fields) => {
                            connection.release();
                            return err ? reject(err) : resolve({
                                name: name, imageSrc: imageSrcFull
                                // , result: result
                            });
                        });
                    });
                }
                else reject('Please enter name and image src in query params');
            }
            catch (error) {
                return reject('Error has occurred during getting the imagesrc: ' + imageSrcFromRequest + ' and encoded name to be stored ' + encodedNameToBeStored + ': ' +  error)
            }
        })
    }
