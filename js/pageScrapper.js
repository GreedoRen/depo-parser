const fs = require('fs')
const request = require('request')

const URL = 'https://depomoscow.ru/corners'

const scraperObject = {
    url: URL,
    async scraper(browser) {
        let page = await browser.newPage()
        await page.setDefaultNavigationTimeout(0)
        await page.goto(this.url)

        console.log(`Navigating to ${this.url}...`)

        await page.waitForSelector('.restaurants-blocks__list')

        let urls = await page.$$eval('.restaurants-blocks__list > li', links => {
            links = links.map(link => link.querySelector('.restaurants-block > a').href)
            return links
        })

        let pagePromise = (link) => new Promise(async (resolve, reject) => {
            let arrayObj = []
            let infoArray = []
            let dataObj = {}

            let newPage = await browser.newPage()
            await newPage.goto(URL)

            dataObj['cornerName'] = await newPage
                .$$eval('.restaurants-block__info-name', texts => texts.map(text => text.textContent))
            dataObj['ambassadorImg'] = await newPage
                .$$eval('.restaurants-block__image > img', imgs => imgs.map(img => img.src))
            const info = await newPage
                .$$eval('.restaurants-block__info-caption', texts => texts.map(text => text.textContent));

            [...info].forEach((item, index, arr) => {
                !(index % 3) ? infoArray.push(arr.slice(index, index + 3)) : ''
            })

            dataObj['info'] = infoArray
            dataObj['links'] = urls

            arrayObj.push(dataObj)

            resolve(dataObj)
            await newPage.close()
        })

        let currentPageData = await pagePromise(URL)
        const corners = await formatinData(currentPageData)
        const download = await downloadImages(corners)
    }
}

formatinData = (data) => {
    const { cornerName, ambassadorImg, info, links } = data
    let corners = []

    for (let index = 0; index < cornerName.length; index++) {
        let corner = {
            cornerName: cornerName[index],
            ambassadorImg: ambassadorImg[index],
            place: info[index][0],
            kitchenType: info[index][1],
            ambassadorName: info[index][2],
            url: links[index]
        }

        corners.push(corner)
    }

    return corners
}

downloadImages = async (corners) => {
    const download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
        })
    }

    for (let index = 0; index < corners.length; index++) {
        const element = corners[index]
        const url = element.ambassadorImg

        await download(url, `${element.cornerName}.jpg`, () => { console.log(`download ${element.cornerName}.jpg`) })
    }
}

module.exports = scraperObject