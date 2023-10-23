import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import  * as sqlite from 'sqlite3'
import { logger } from './logger'

export const connectDatabase = (callback: () => void) => {
    const database = new sqlite.Database(process.env.DATABASE_FILE, (err) => {
        if(err === null) {
            logger.info(`Connection to database "${process.env.DATABASE_FILE}" established`)
    
            // register clean-up and logging events on any exit condition
            const events = ['uncaughtException', 'SIGTERM', 'SIGINT', 'SIGHUP', 'beforeExit'];
            events.forEach((type => {
                process.once(type, (type) => {
                    database.close((err) => {
                        if(err === null) {
                            logger.info(`Database "${process.env.DATABASE_FILE}" closed successfully`)
                            process.exit(0)
                        } else {
                            logger.error(`Encountered an error trying to close database connection: ${err}`)
                            process.exit(1)
                        }
                    })
                })
            }))

            // verify table exists before executing anything else
            database.run(createTableQuery, () => {
                callback()
            })
    
            
        } else {
            logger.error(`Encountered an error trying to open database connection from file "${process.env.DATABASE_FILE}": ${err}`)
        }
    })

    return database
}

export type UsersRecord = {
    discord_user: string,
    pirate_name: string,
    short_code: string,
    verified: number
}

export const createRecordQuery = (discordUser: string, pirateName: string, shortCode: string) => `INSERT INTO users (discord_user, pirate_name, short_code, verified) VALUES ('${discordUser}', '${pirateName}', '${shortCode}', 0);`
export const getRecordQuery = (discordUser: string) => `SELECT * FROM users WHERE discord_user = '${discordUser}';`
export const updateRecordQuery = (discordUser: string, shortCode?: string, verified?: boolean) => `UPDATE users SET ${`'${shortCode}'` ?? ' '}${`'${verified}'` !== undefined ? (verified ? 1 : 0) : ' '} WHERE discord_user = '${discordUser}';`
export const deleteRecordQuery = (discordUser: string) => `DELETE FROM users WHERE discord_user = '${discordUser}';`

const createTableQuery = "CREATE TABLE IF NOT EXISTS users(discord_user TEXT PRIMARY KEY, pirate_name TEXT NOT NULL, short_code TEXT, verified INTEGER NOT NULL DEFAULT 0);"