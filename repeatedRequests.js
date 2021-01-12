const cron = require('node-cron');
const axios = require('axios');

let allServerInfo = {};

cron.schedule('* * * * * *', async () => {
    await axios.get('http://localhost:5000/serverstats')
        .then((response) => allServerInfo = response.data)
        .then()
    .catch(console.error)
    console.log('running a task every second');
});