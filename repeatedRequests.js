require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');

const endpoint = process.env.APIENDPOINT || (() => { new Error("Provide a api endpoint in env vars") });

let players = [];
console.log("oLD PLAYERS *******", players)
cron.schedule('* * * * * *', async () => {
    console.log('running a new task');
    await axios.get(`${endpoint}serverstats`)
        .then(response => response.data)
        .then(eachObject => (
            eachObject
                .map(element => element.directPlayerInfo)
                .filter(el => el != null)))
        .then(filteredResult => players = filteredResult[0].map(element => element))
        .catch(console.error)

        console.log("NEW PLAYERS ********",players)
    // await axios.po
    console.log('Completed this second at Time: ', Date.now());
});