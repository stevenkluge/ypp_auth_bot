import * as cheerio from 'cheerio'
import { logger } from './logger'
import 'dotenv/config'

export class YowebScraper {
    private pirate: string;
    private ocean: string;
    private crew: string;
    private rank: string;
    private trophyCollectionBoxNames: string[];

    constructor(pirate: string, ocean: string) {
        this.pirate = pirate;
        this.ocean = ocean;
    }

    // Access external resources

    fetchPirateInfo() {
        this.fetchResource(`http://${this.ocean}.puzzlepirates.com/yoweb/pirate.wm?target=${this.pirate}`).then((html) => {

            const $ = cheerio.load(html);

            // If no table elements are present, the pirate does not exist
            if($('table').length === 0) return;

            // Search for crew name and rank, if pirate is in a crew
            const crewInfo = $('body > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > font:nth-child(1)').children('b')
            const rank = crewInfo.first().text()
            const crewId = crewInfo.last().children('a').attr('href').match(/\d+/)?.[0]
            // if nothing found, pirate is not in a crew
            if(crewId === undefined) return;

            // assign values
            this.rank = rank
            this.crew = crewId

            return;
        })
        .catch((err) => {
            logger.error(err);
            return;
        })
    }

    fetchTrophyCollection() {
        this.fetchResource(`http://${this.ocean}.puzzlepirates.com/yoweb/trophy/?pirate=${this.pirate}`).then((html) => {

            const $ = cheerio.load(html);

            const trophyCollectionBoxNames = $('body > center:nth-child(1) > table:nth-child(2n+6) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(2) > center:nth-child(1) > font:nth-child(1) > b:nth-child(1)')

            if(trophyCollectionBoxNames === undefined) return;

            this.trophyCollectionBoxNames = trophyCollectionBoxNames.text().split(/\s+/);
        })
    }

    // Getters

    getPirate() {
        return this.pirate
    }

    getOcean() {
        return this.ocean
    }

    getCrew() {
        return this.crew
    }

    getRank() {
        return this.rank
    }

    getTrophyCollectionBoxNames() {
        return this.trophyCollectionBoxNames
    }

    // Private

    private fetchResource(resource: string) {
        logger.info(`Attempting to fetch resource: ${resource}`)
        return fetch(resource).then((response) => {
            if(response.ok) {
                return response.text();
            } else {
                throw new Error(`Yoweb responded with status ${response.status}: ${response.statusText}. Not retrying.`);
            }
        })
    }

    // Static

    static fetchCrewMemberList() {
        logger.info('Attempting to fetch crew page')
        return fetch(`http://${process.env.CREW_OCEAN}.puzzlepirates.com/yoweb/crew/info.wm?crewid=${process.env.CREW_ID}`).then((response) => {
            if(response.ok) {
                return response.text();
            } else {
                throw new Error(`Yoweb responded with status ${response.status}: ${response.statusText}.`);
            }
        })
    }



}