import 'dotenv/config'
import { Collection, Events, GatewayIntentBits } from 'discord.js'
import { logger } from './logger'
import { connectDatabase } from './database'
import { Client } from './DiscordClientType'
import * as fs from 'node:fs'
import * as path from 'node:path'



logger.info('### Starting YPP Pirate Verifier Bot ###')

// initialize database connection
export const databaseInstance = connectDatabase(() => {

    const client = new Client({ intents: [GatewayIntentBits.Guilds] })

    // find and load command files
    logger.info('Finding commands')
    fs.readdirSync(path.join(__dirname, 'commands')).forEach(async (commandPath) => {
        const command = await import(path.join(__dirname, 'command', commandPath))
        if('data' in command && 'execute' in command) {
            logger.info(`Loaded command at ${commandPath}`)
            client.commands.set(command.data.name, command)
        } else {
            logger.warn(`Command at ${commandPath} cannot be loaded because it's malformed`)
        }
    })

    // register interaction handler
    logger.info('Registering interaction handler')
    client.on(Events.InteractionCreate, async (interaction) => {
        // only process chat commands
        if(!interaction.isChatInputCommand()) return;
        
        const command = (interaction.client as Client).commands.get(interaction.commandName)

        if(!command) {
            logger.warn(`No command matching '${interaction.commandName}' was found`)
            return
        }

        try {
            // actually execute the command
            await command.execute(interaction) //TODO send the command to the scheduler
        } catch(err) {
            logger.error(`There was an error while executing this command (${interaction.commandName}): ${err}`)
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    })

    // log in
    client.once(Events.ClientReady, c => {
        logger.info(`Logged into discord as: ${c.user.tag}. Ready to process input`)
    })
    client.login(process.env.DISCORD_TOKEN)

})