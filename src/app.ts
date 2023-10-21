import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import  * as sqlite from 'sqlite3'
import { logger } from './logger'
import { fetchCrewRoster, fetchPirateCrewRank, fetchTrophyCollectionBoxNames } from './yowebScraper'

logger.info('### Starting YPP Pirate Verifier Bot ###')

// TODO remove this when finished testing
fetchCrewRoster('5036718').then(crewRoster => {
    process.exit(0);
})

process.stdin.resume();
// initialize database connection and export
export let database = new sqlite.Database(process.env.DATABASE_FILE, (err) => {
    if(err === null) {
        logger.info(`Connection to database "${process.env.DATABASE_FILE}" established`)

        // register clean-up and logging events on any exit condition
        const events = ['uncaughtException', 'SIGTERM', 'SIGINT', 'SIGHUP', 'beforeExit'];
        events.forEach((type => {
            process.once(type, (type) => {
                logger.info(`Received signal: "${type}". Beginning clean-up`)
                database.close((err) => {
                    if(err === null) {
                        logger.info(`Database "${process.env.DATABASE_FILE}" closed successfully`)
                    } else {
                        logger.error(`Encountered an error trying to close database connection: ${err}`)
                    }
                    process.exit(0)
                })
                
            })
        }))

        // login to discord bot
        const client = new Client({ intents: [GatewayIntentBits.Guilds] })
        client.once(Events.ClientReady, c => console.log(`Logging into discord as: ${c.user.tag}`))
        client.login(process.env.DISCORD_TOKEN)
        
    } else {
        logger.error(`Encountered an error trying to open database connection from file "${process.env.DATABASE_FILE}": ${err}`)
    }
})