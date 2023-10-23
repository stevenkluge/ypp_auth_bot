import { ClientOptions, Collection, Client as DiscordClient, Interaction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder} from 'discord.js'
export class Client<Ready extends boolean = boolean> extends DiscordClient {
    commands: Collection<string, {data: SlashCommandSubcommandsOnlyBuilder | SlashCommandBuilder, execute: (interaction: Interaction) => Promise<void>}>

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection()
        this.isReady
    }
}