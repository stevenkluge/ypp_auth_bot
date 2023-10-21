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
export enum ScraperStatus {
    SUCCESS,
    NOT_FOUND,
    NO_CREW
}

export const fetchPirateCrewRank = async (pirate: string): Promise<{ status: ScraperStatus, crew: string | null, rank: string | null} | null> => {
    try {
        const $ = cheerio.load(await fetchDocument(`http://emerald.puzzlepirates.com/yoweb/pirate.wm?target=${pirate}`))
        const crewInfoElements = $('body > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > font:nth-child(1)')
        const rank = crewInfoElements?.text()?.match(/^(?: ?\w+){1,2}(?= (?:and .*)?of the crew)/)?.[0]
        const crew = crewInfoElements?.find('a')?.attr('href')?.match(/(?<=crewid=)\d{7}/)?.[0]

        if(!!crew && !!rank) {
            logger.info(`Found ${pirate} | crew: ${crew}, rank: ${rank}`)
            return {
                status: ScraperStatus.SUCCESS,
                crew,
                rank,
            }
        } else if( $('body > center:nth-child(1)').text().trim() === "Arr! We have heard no tell of that pirate around these parts."){
            logger.info(`Pirate not found | query: ${pirate}`)
            return {
                status: ScraperStatus.NOT_FOUND,
                crew: null,
                rank: null,
            }
        } else {
            logger.info(`Pirate either doesn't have a crew, or there is something wrong with the scraper | query: ${pirate}`)
            return {
                status: ScraperStatus.NO_CREW,
                crew: null,
                rank: null,
            }
        }
    } catch(err) {
        logger.error(`Error while attempting to retrieve pirate page for: ${pirate} | ${err}`)
        return null
    }
}

export const fetchTrophyCollectionBoxNames = async (pirate: string): Promise<Array<string> | null> => {
    try {
        const $ = cheerio.load(await fetchDocument(`https://emerald.puzzlepirates.com/yoweb/trophy/?pirate=${pirate}`))
        const trophyCollectionBoxes = $('body > center:nth-child(1) > table:nth-child(2n+6) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(2) > center:nth-child(1) > font:nth-child(1) > b:nth-child(1)')
        const trophyCollectionStrings = trophyCollectionBoxes.map(() => $(this).text()).toArray()
        console.log(trophyCollectionStrings)

        return null

    } catch(err) {
        logger.error(`Error while attempting to retrieve trophy page for: ${pirate} | ${err}`)
    }
}

const fetchDocument = async (resourceUrl: string) => {
    const response = await fetch(resourceUrl)

    if(!response.ok) throw new Error(`fetch(${resourceUrl}) returned ${response.status}: ${response.statusText}`)

    return response.text()
}
