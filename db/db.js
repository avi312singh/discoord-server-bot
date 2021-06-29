const mysql = require('mysql');

const dbHost = process.env.DBENDPOINT || (() => { new Error("Provide a db endpoint in env vars") });
const dbPassword = process.env.DBPASSWORD || (() => { new Error("Provide a db password in env vars") });
const dbUsername = process.env.DBUSER || (() => { new Error("Provide a db username in env vars") });
const dbName = process.env.DBNAME || (() => { new Error("Provide a db username in env vars") });

const pool = mysql.createPool({
    connectionLimit: 40,
    host: dbHost,
    user: dbUsername,
    password: dbPassword,
    database: dbName
});

module.exports = pool;