module.exports = {
    name: '!help',
    description: 'Information',
    execute(msg, args) {
        msg.reply('Use ** !server_info ** "main" or "test" to display server info or ** !server_restart ** "main" or "test to restart a server');
    },
};
