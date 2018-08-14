// Conection and credentials to DataBase

require('dotenv/config')

const knex = require('knex')({
    client: 'pg',
    connection: {
        host: 'localhost',
        database: 'OneApp',
        user: 'postgres',
        password: 'hamasak1'
    }
})

module.exports = knex


// user: process.env.PG_User,
// password: process.env.PG_Pass