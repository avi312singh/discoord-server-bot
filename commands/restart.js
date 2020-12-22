const query = require("source-server-query");
const axios = require("axios")

const serverRestartConfig = {
    method: 'post',
    url: 'https://billing.time4vps.com/api/server/144002/reboot',
    headers: {
        'Authorization': process.env.AUTHORIZATION,
        'Cookie': '__cfduid=d2e88590e27d1f2c0a6bf0ca2d9b6b7391608573389'
    }
};

async function restartServer(queryName) {

    let directQueryInfo = {};


    console.log("server to be restarted is ", queryName[0])

    switch (queryName[0]) {
        case "main":
            directQueryInfo =
                query
                    .info("77.68.16.178", 7778, 2000)
                    .then(result => directQueryInfo = result)
                    .catch(console.log);
            break;
        case "Main":
            directQueryInfo =
                query
                    .info("77.68.16.178", 7778, 2000)
                    .then(result => directQueryInfo = result)
                    .catch(console.log);
            break;
        case "test":
            directQueryInfo =
                query
                    .info("77.68.16.178", 7783, 2000)
                    .then(result => directQueryInfo = result)
                    .catch(console.log);
            break;
        case "Test":
            directQueryInfo =
                query
                    .info("77.68.16.178", 7783, 2000)
                    .then(result => directQueryInfo = result)
                    .catch(console.log);
            break;
        default:
            throw new Error(queryName[0] + "is not recognised");
    }

    return directQueryInfo;
}

module.exports = {
    name: '!server_restart',
    description: 'Restarts a server!',
    execute(msg, args) {
        console.log(args)
        restartServer(args).then(resolve => {
            msg.channel.send('*********** SERVER INFORMATION AS OF CURRENTLY ***********');
            if (resolve.name !== undefined) {
                msg.reply(args[0].charAt(0).toUpperCase() + args[0].slice(1) + ' server is online');
                msg.reply(resolve.name + " is running map " + resolve.map + " and has " + resolve.playersnum + " players with " + resolve.botsnum + " of those being bots")
                msg.reply('************************************************************')
                resolve.playersnum > 0 ? msg.reply("Are you sure you want to restart server with " + resolve.playersnum + " players?"): console.log('No players so no need to ask again for server restart confirmation')
                msg.reply("Click on the thumbs up emoji at the initial *** server_restart *** command to ** CONFIRM ** the restart or thumbs down to cancel restart")

                msg.react('👍');

                const filter = (reaction, user) => {
                    return ['👍', '👎'].includes(reaction.emoji.name) && user.id === msg.author.id;
                };

                msg.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                    .then(collected => {
                        const reaction = collected.first();
                        if (reaction.emoji.name === '👍') {
                            msg.reply('You reacted with a thumbs up. ** Attempting ** to Restarting server');

                            axios(serverRestartConfig)
                                .then(response => {
                                    console.log(JSON.stringify(response.data));
                                    if(response.status == 200 && response.data.task_id != undefined)
                                        msg.reply('Server restart successful! Please wait');
                                })
                                .catch(error => {
                                    console.log(error);
                                });
                        } else {
                            msg.reply('You reacted with thumbs down. ** Cancelling restart **');
                        }
                    })
                    .catch(collected => {
                        msg.reply('Error ** Cancelling restart **', collected);
                        console.error("Error", collected);
                    });
            }
        })
            .catch(error => {
                console.error(error);
                if (error === "is not recognised")
                    return msg.reply(args[0].charAt(0).toUpperCase() + args[0].slice(1) + ' is not ours!')
                else msg.reply(args[0].charAt(0).toUpperCase() + args[0].slice(1) + ' is not online yet!')
            }
            );
    }
}