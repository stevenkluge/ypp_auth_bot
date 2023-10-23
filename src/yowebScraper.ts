import * as cheerio from 'cheerio'
import { logger } from './logger'
import 'dotenv/config'

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

type RosterType = {
    captain: Array<string>,
    seniorOfficer: Array<string>,
    fleetOfficer: Array<string>,
    officer: Array<string>,
    pirate: Array<string>,
    cabinPerson: Array<string>
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
            logger.warn(`Pirate not found | query: ${pirate}`)
            return {
                status: ScraperStatus.NOT_FOUND,
                crew: null,
                rank: null,
            }
        } else {
            logger.warn(`Pirate either doesn't have a crew, or there is something wrong with the scraper | query: ${pirate}`)
            return {
                status: ScraperStatus.NO_CREW,
                crew: null,
                rank: null,
            }
        }
    } catch(err) {
        logger.error(`Error while attempting to retrieve pirate page | query: ${pirate} | ${err}`)
        return null
    }
}

export const fetchTrophyCollectionBoxNames = async (pirate: string): Promise<Array<string> | null> => {
    try {
        const $ = cheerio.load(await fetchDocument(`https://emerald.puzzlepirates.com/yoweb/trophy/?pirate=${pirate}`))
        const trophyCollectionBoxes = $('body > center:nth-child(1) > table:nth-child(2n+6) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(2) > center:nth-child(1) > font:nth-child(1) > b:nth-child(1)')
        const trophyCollectionStrings = trophyCollectionBoxes.map((idx, element) => $(element).text()).toArray()
        
        if(trophyCollectionStrings?.length > 0) {
            logger.info(`Found trophy collection box titles | query: ${pirate}`)
            return trophyCollectionStrings
        } else {
            logger.warn(`Could not find trophy collection box titles | query: ${pirate}`)
            return null
        }
    } catch(err) {
        logger.error(`Error while attempting to retrieve trophy page | query: ${pirate} | ${err}`)
        return null
    }
}

export const fetchCrewRoster = async (crew: string): Promise<RosterType | null> => {
    try {  
        const $active = cheerio.load(await fetchDocument(`https://emerald.puzzlepirates.com/yoweb/crew/info.wm?crewid=${crew}`))
        const $dormant = cheerio.load(await fetchDocument(`https://emerald.puzzlepirates.com/yoweb/crew/dormant_members.wm?crewid=${crew}`))
        const crewRoster: RosterType = {
            captain: [],
            seniorOfficer: [],
            fleetOfficer: [],
            officer: [],
            pirate: [],
            cabinPerson: []
        }

        // active
        const activeRoster = $active('body > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(3) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(3) > table:nth-child(1)')
            .text()
            // convert to space-separated string of values
            .replace(/\s+/g, ' ')
            // discard Jobbing Pirates
            .split(' Jobbing Pirate')[0]
            .trim()
            // convert officer ranks + Cabin Person to single word, i.e. Fleet Officer becomes FleetOfficer
            .replace(/(?<=Senior|Fleet|Cabin)\s(?=Officer|Person)/g, '')
            // convert rest to array of strings
            .split(' ')

        // dormant
        const dormantRoster = $dormant('center')
            .text()
            // convert to space-separated string of values
            .replace(/\s+/g, ' ')
            .trim()
            // remove everything before the list of members
            .replace(/(^.* Dormant members )/,'')
            // remove the trailing string
            .replace(/( Back to crew info$)/,'')
            // convert officer ranks + Cabin Person to single word, i.e. Fleet Officer becomes FleetOfficer
            .replace(/(?<=Senior|Fleet|Cabin)\s(?=Officer|Person)/g, '')
            .split(' ')

        let currentRankArray: string[]

        // If a rank string is detected, set the currentRank to the corresponding crewRoster property reference, otherwise append the string to currentRank
        for(const token of [...activeRoster, ...dormantRoster]){ 
            switch(token) {
                case 'Captain':
                    currentRankArray = crewRoster.captain
                    break;
                case 'SeniorOfficer':
                    currentRankArray = crewRoster.seniorOfficer
                    break;
                case 'FleetOfficer':
                    currentRankArray = crewRoster.fleetOfficer
                    break;
                case 'Officer':
                    currentRankArray = crewRoster.officer
                    break;
                case 'Pirate':
                    currentRankArray = crewRoster.pirate
                    break;
                case 'CabinPerson':
                    currentRankArray = crewRoster.cabinPerson
                    break;
                default:
                    currentRankArray.push(token)
                    break;
            }
        }

        // crew needs to have at least one member, if not then we made a mistake somewhere
        if(crewRoster.cabinPerson.length +
            crewRoster.pirate.length +
            crewRoster.officer.length +
            crewRoster.fleetOfficer.length +
            crewRoster.seniorOfficer.length +
            crewRoster.captain.length > 0) {
                logger.info(`Found crew roster | query: ${crew}`)
                return crewRoster
            } else {
                logger.warn(`Could not find crew roster | query: ${crew}`)
                return null
            }
    } catch(err) {
        logger.error(`Error while attempting to retrieve crew page | query: ${crew} | ${err}`)
    }
}

const fetchDocument = async (resourceUrl: string) => {
    const response = await fetch(resourceUrl)

    if(!response.ok) throw new Error(`fetch(${resourceUrl}) returned ${response.status}: ${response.statusText}`)

    return response.text()
}
