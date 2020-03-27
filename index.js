const puppeteer = require('puppeteer');
const moment = require('moment');
const fs = require('fs');

const USERNAME ='Nshah';
const PASSWORD = 'test0101';

function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}  

(async () => {
    const browser = await puppeteer.launch({ headless: true, ignoreDefaultArgs: ['--enable-automation'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36');
    await page.goto('https://roambee.sutihr.com');
    await page.waitFor('#loginForm_0');
    const username = await page.$('#username');
    await username.type(USERNAME);
    const password = await page.$('#password');
    await password.type(PASSWORD);
    await page.evaluate(() => {
        document.querySelector('#loginForm_0').click();
    });
    // Wait for next pageload
    await page.waitForNavigation({ waitUntil: 'networkidle2'});

    let inTime = null;
    try {
        inTime = fs.readFileSync('intime.log').toString();
        console.log(inTime);
        inTime = moment(parseInt(inTime));
    } catch (err) {
        console.log('In time not found');
    }


    let clockInTime = randomNumber(600, 630); // Random time between 10:00 and 10:30 AM
    let shouldClockIn = false;

    // Check if we need to check in or check out
    if (!inTime || (inTime.isBefore(moment(new Date()).startOf('d')) && moment(new Date()).isAfter(moment(new Date()).startOf('d').add(clockInTime, 'm')))) {
        shouldClockIn = true;
    }

    if (shouldClockIn) {
        let clockIn = await page.waitFor('a[onclick="lateSimpleClockIn();"]');
        await page.evaluate(() => {
            document.querySelector('a[onclick="lateSimpleClockIn();"]').click();
        });
        // Save the time 
        fs.writeFileSync('intime.log', moment(new Date()));
        console.log('Clocked in at ' + new Date());
    } else {

        // Minutes to consider
        let minmins = randomNumber(480, 570);
        console.log('Minutes to consider: ', minmins);
        
        let outTime = null;
        try {
            outTime = fs.readFileSync('outtime.log').toString();
            console.log(outTime);
            outTime = moment(parseInt(outTime));
        } catch (err) {
            console.log('Out time not found');
        }

        let shouldClockOut = false;
        if (!outTime || (outTime.isBefore(moment(new Date()).startOf('d')) && inTime.isAfter(moment(new Date()).startOf('d')))) {
            shouldClockOut = true;
        }

        if (moment(new Date()).subtract(minmins, 'm').isAfter(inTime) && shouldClockOut) {
            console.log(minmins + ' minutes are done');
            let clockOut = await page.waitFor('a[onclick="simpleClockOut(\'out\');"]');
            if (clockOut) {
                await page.evaluate(() => {
                    document.querySelector('a[onclick="simpleClockOut(\'out\');"]').click();
                });
                fs.writeFileSync('outtime.log', moment(new Date()));
                console.log('Clocked out at ' + new Date());
            }
        } else {
            let timespent = moment.duration(moment(new Date()).diff(inTime));
            console.log(timespent.asMinutes() + ' minutes spent');
        }
        
    }
    await browser.close();
})();