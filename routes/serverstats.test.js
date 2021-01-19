const express = require('express')
const request = require('supertest')
const moment = require('moment')
const serverStats = require('./serverstats')
const serverStatsResponse = require('../serverstats.json')
const { isObject, isArray } = require('underscore')

const app = express()

app.use('/serverStats', serverStats)

describe('Server Stats Endpoints', () => {
    it('GET /', async (done) => {
        const response = await request(app).get('/serverStats');
        expect(response.status).toBe(200)
        expect(response.body).toEqual(expect.arrayContaining([{ "directQueryInfo": {} }, { "directPlayerInfo": {} }]));
        done()
    }),
        it('GET /repeatedRequests', async (done) => {
            const running = false;
            // const repeatedRequests = jest.fn(request => {
            //     if (!running) {
            //         running = true;
            //         return { message: "Initiating repeated requests ", timestamp: moment().format('YYYY-MM-DD HH:mm:ss') }
            //     }
            //     else {
            //         return {
            //             message: "This endpoint has already been called and was called at: ", timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            //         }
            //     }
            // });
            const response = await request(app).get('/serverStats/repeatedRequests');
            expect(response.status).toBe(200)
            // expect(repeatedRequests).toHaveNthReturnedWith(1, { message: "Initiating repeated requests ", timestamp: moment().format('YYYY-MM-DD HH:mm:ss') });
            // expect(repeatedRequests).toHaveNthReturnedWith(2, { message: "Initiating repeated requests ", timestamp: moment().format('YYYY-MM-DD HH:mm:ss') });
            expect(response.body).toEqual(expect.objectContaining({ "message": "Initiating repeated requests ", "timestamp": moment().format('YYYY-MM-DD HH:mm:ss') }));
            done()
        })
}
)