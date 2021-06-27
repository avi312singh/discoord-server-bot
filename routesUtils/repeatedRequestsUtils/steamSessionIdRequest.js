const https = require('https')
const cookie = require('cookie');

module.exports = async () => {
    return new Promise((resolve, reject) => {
        let sessionid = '';
        https.get('https://store.steampowered.com/', response => {
            variable = response.headers['set-cookie'];
            const cookies = cookie.parse(variable[1])
            sessionid = cookies.sessionid
            return sessionid ? setTimeout(() => {
                console.log("Waited for 3000ms")
                resolve(sessionid)
            }, 3000) : reject('Steam session id request failed');
        })
    })
}
