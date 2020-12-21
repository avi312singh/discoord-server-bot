module.exports = {
    name: 'teest',
    description: 'Test!',
    execute(msg, args) {
        console.log(args)
        msg.reply('tester');
        msg.channel.send('tester');
    },
};
