const query = require("source-server-query");

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
    name: 'server_restart',
    description: 'Restarts a server!',
    execute(msg, args) {
        console.log(args)
        restartServer(args).then(resolve => {
            msg.channel.send('*********** SERVER INFORMATION AS OF CURRENTLY ***********');
            if (resolve.name !== undefined) {
                msg.reply(args[0].charAt(0).toUpperCase() + args[0].slice(1) + ' server is online');
                msg.reply(resolve.name + " is running map " + resolve.map + " and has " + resolve.playersnum + " players with " + resolve.botsnum + " of those being bots")
                msg.reply("Click on the thumbs up emoji at the initial *** server_restart *** command to confirm the restart or thumbs down to cancel restart")

                msg.react('👍');

                const filter = (reaction, user) => {
                    return ['👍', '👎'].includes(reaction.emoji.name) && user.id === msg.author.id;
                };

                msg.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                    .then(collected => {
                        const reaction = collected.first();
                        if (reaction.emoji.name === '👍') {
                            msg.reply('You reacted with a thumbs up. ** Restarting server **');
                            //TODO: API CALL FOR RESTART HERE
                        } else {
                            msg.reply('You reacted with thumbs down. ** Cancelling restart **');
                        }
                    })
                    .catch(collected => {
                        msg.reply('You did not react with thumbs down. ** Cancelling restart **');
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