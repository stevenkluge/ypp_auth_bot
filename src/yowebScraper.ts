import * as cheerio from 'cheerio'
import { logger } from './logger'
import 'dotenv/config'

/*
How the scraper will be used:
-----------------------------
/link pirate
    fetch pirate document
    parse crew, rank

/link verify
    fetch trophy document
    parse trophy collection box names


swampboaty
body > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > font:nth-child(1)
swampyy



*/

export class YowebScraper {
    private pirate: string;
    private crew: string;
    private rank: string;
    private trophyCollectionBoxNames: string[];

    constructor(pirate: string) {
        this.pirate = pirate;
    }

    async getPirateCrewInfo(): Promise<{ crew: string, rank: string }> {

        try {
            const document = await this.fetchDocument(`http://emerald.puzzlepirates.com/yoweb/pirate.wm?target=${this.pirate}`)
            const $ = cheerio.load(document)
            const crewInfo = $('body > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > font:nth-child(1)')
            // TODO get the first <b> tag for rank, second <b> tag get the child <a> tag href value then regex match the id from address
            //example address http://emerald.puzzlepirates.com/yoweb/crew/info.wm?crewid=5036718&classic=$classic <- match 5036718

        } catch(err) {
            logger.error(err)
        }



    }

    private fetchDocument = async (resourceUrl: string) => {
        const response = await fetch(resourceUrl)

        if(!response.ok) throw new Error(`'fetch(${resourceUrl}') returned ${response.status}: ${response.statusText}`)

        return response.text()
    }

}