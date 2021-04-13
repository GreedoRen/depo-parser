const browser = require('./browser')
const pageController = require('./pageController')

// start browser
let browserInstance = browser.startBrowser()

// pass browser instance to the scrapper
pageController(browserInstance)