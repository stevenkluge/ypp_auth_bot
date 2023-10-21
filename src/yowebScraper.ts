import * as cheerio from 'cheerio'
import { logger } from './logger'
import 'dotenv/config'
import { database } from './app'

/*
How the scraper will be used:
-----------------------------
/link pirate
    fetch pirate document => getPirateCrewRank() returns crew, rank

/link verify
    fetch trophy document
    parse trophy collection box names


swampboaty
body > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > font:nth-child(1)
swampyy



*/

export const getPirateCrewRank = async (pirate: string): Promise<{ crew: string, rank: string } | null> => {

    try {
        const document = await fetchDocument(`http://emerald.puzzlepirates.com/yoweb/pirate.wm?target=${pirate}`)
        const $ = cheerio.load(document)
        const crewInfoElements = $('body > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > font:nth-child(1)')
        const rank = crewInfoElements.text().match(/^.*(?= of the crew)/)[0]
        const crew = crewInfoElements.find('a').attr('href').match(/(?<=crewid=)\d{7}/)[0]

        if(!!crew && !!rank) {
            return {crew, rank}
        } else {
            logger.error(`Scraped the wrong data from yoweb while looking up ${pirate}. Found: ${crewInfoElements.text()}`)
            return null
        }

    } catch(err) {
        logger.error(err)
    }
}

const fetchDocument = async (resourceUrl: string) => {
    const response = await fetch(resourceUrl)

    if(!response.ok) throw new Error(`'fetch(${resourceUrl}') returned ${response.status}: ${response.statusText}`)

    return response.text()
}
