import { SlashCommandBuilder } from 'discord.js'

export const verify = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Looks up your pirate via yoweb to verify crew membership and rank'),
    execute: (interaction) => null //TODO
}