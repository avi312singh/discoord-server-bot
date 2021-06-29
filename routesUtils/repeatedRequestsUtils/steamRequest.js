const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (sessionId, playerNameUnescaped) => {
    return new Promise((resolve, reject) => {
        const escapedPlayerName = playerNameUnescaped.replace(' ', '+');
        const config = {
            method: 'get',
            url: `https://steamcommunity.com/search/SearchCommunityAjax?text=${encodeURI(escapedPlayerName)}&filter=users&sessionid=${sessionId}&steamid_user=false`,
            headers: {
                'Connection': 'keep-alive',
                'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
                'Accept': '*/*',
                'X-Requested-With': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?0',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Referer': 'https://steamcommunity.com/search/users/',
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,es;q=0.7',
                'Cookie': `timezoneOffset=3600,0; sessionid=${sessionId}; steamCountry=GB%7C91baec723d318fefb4c1fe77b01936f1; sessionid=${sessionId}; steamCountry=GB%7C91baec723d318fefb4c1fe77b01936f1`
            }
        };

        axios(config)
            .then((response) => {
                const $ = cheerio.load(response.data.html)
                // get first result always
                const imageSrc = $('.mediumHolder_default .avatarMedium img[src]').get()[0]
                    // href of avatar jpg of the first result
                    ?.attribs?.src
                return setTimeout(() => {
                    resolve(imageSrc)
                    console.log("Waited for 1000ms")
                }, 1000)

                // if need profile id
                // $('.mediumHolder_default .avatarMedium a[href]').get()[0].attribs.href
            })
            .catch((error) => {
                reject("Error occurred during getting image src ", error)
            });
    })
}