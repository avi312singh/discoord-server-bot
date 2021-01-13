require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');

const endpoint = process.env.APIENDPOINT || (() => { new Error("Provide a api endpoint in env vars") });

let oldPlayers = [];
let newPlayers = [];

cron.schedule('*/20 * * * * *', async () => {

    console.log('running a new task ************************************************************************************************************************************************************');
    await axios.get(`${endpoint}serverstats`)
        .then(response => response.data)
        .then(eachObject => (
            eachObject
                .map(element => element.directPlayerInfo)
                .filter(el => el != null)))
        .then(filteredResult => newPlayers = filteredResult[0].map(element => element))
        .catch(console.error)

    oldPlayers = newPlayers;
    newPlayers = [];

    // Need a pause here

    await axios.get(`${endpoint}serverstats`)
        .then(response => response.data)
        .then(eachObject => (
            eachObject
                .map(element => element.directPlayerInfo)
                .filter(el => el != null)))
        .then(filteredResult => newPlayers = filteredResult[0].map(element => element))
        .catch(console.error)


    for (let i = 0; i < newPlayers.length; i++) {
        if (newPlayers[i].score != oldPlayers[i].score) {
            console.log("score changed ******")
        }
        else {
            console.log(newPlayers[i].name + "'s score hasnt changed ******** new score is " + newPlayers[i].score + " and old score is " + oldPlayers[i].score)

        }
    }

    oldPlayers = [];
    newPlayers = [];

    // await axios.po
    console.log('Completed this second at Time: ', Date.now());

});