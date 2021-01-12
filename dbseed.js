require('dotenv').config();
const mysql = require('mysql');

const host = process.env.DBENDPOINT || (() => { new Error("Provide a db endpoint in env vars") });
const user = process.env.DBUSER || (() => { new Error("Provide a server db port in env vars") });
const password = process.env.DBPASSWORD || (() => { new Error("Provide a db password IP in env vars") });

const con = mysql.createConnection({
    host: host,
    user: user,
    password: password
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    con.end();
});