import { SlashCommandBuilder } from 'discord.js'

export const link = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Links your pirate to your discord account in this server')
        .addSubcommand((subcommand) => 
            subcommand
                .setName('pirate')
                .setDescription('Starts the linking process by creating your linking code')
                .addStringOption((pirate) =>
                    pirate
                        .setName('pirate_name')
                        .setDescription('The name of the pirate you want to link')
                        .setRequired(true)
                )
            )
        .addSubcommand((subcommand) => 
            subcommand
                .setName('verify')
                .setDescription('Completes the linking process by validating your linking code')
            )
        .addSubcommand((subcommand) => 
            subcommand
                .setName('reset')
                .setDescription('Clears any existing linking data')
            )
        .addSubcommand((subcommand) => 
            subcommand
                .setName('status')
                .setDescription('Prints linking information for your discord account')
            )
        .addSubcommand((subcommand) => 
            subcommand
                .setName('refresh')
                .setDescription('Fetches fresh crew information from yoweb')
            ),
    async execute(interaction) {
        switch(interaction.options.getSubcommand()) {
            case "pirate":
                break;
            case "verify":
                break;
            case "reset":
                break;
            case "status":
                break;
            case "refresh":
                break;
        }
    }
}