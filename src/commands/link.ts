import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { databaseInstance } from "../app";
import { UsersRecord, deleteRecordQuery, getRecordQuery } from "../database";
import { RunResult } from "sqlite3";

export const command = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Links your pirate to your discord account in this server")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("pirate")
        .setDescription(
          "Starts the linking process by creating your linking code",
        )
        .addStringOption((pirate) =>
          pirate
            .setName("pirate_name")
            .setDescription("The name of the pirate you want to link")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("verify")
        .setDescription(
          "Completes the linking process by validating your linking code",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reset")
        .setDescription("Clears any existing linking data"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Prints linking information for your discord account"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("refresh")
        .setDescription("Fetches fresh crew information from yoweb"),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case "pirate":
        break;

      case "verify":
        break;

      case "reset":
        // send the "So-and-so is thinking..." message
        await interaction.deferReply({ ephemeral: true });

        await databaseInstance.run(
          deleteRecordQuery(interaction.user.id),
          function(this: RunResult, err: UsersRecord) {
            if (err === null) {
              interaction.editReply('Your verification data has been reset')
            } else {
              throw err;
            }
          },
        );
        break;

      case "status":
        // send the "So-and-so is thinking..." message
        await interaction.deferReply({ ephemeral: true });

        await databaseInstance.get(
          getRecordQuery(interaction.user.id),
          (err, row: UsersRecord) => {
            if (err === null) {
              // amend the message with the actual content
              interaction.editReply(
                row !== undefined
                  ? `Linked Pirate: ${row.pirate_name}    ${
                      row.verified === 'true' ? "(VERIFIED)" : `(NOT VERIFIED)\n\nYour 6-character verification code is: ${row.short_code}\n\nSet one of your trophy collection box names to this code and use \`\`\`/link verify\`\`\` to complete your verification.`
                    }`
                  : `There is no linking data associated with your account. Use \`\`\`/link pirate [pirate_name]\`\`\` to get started.`,
              );
            } else {
              throw err;
            }
          },
        );
        break;

      case "refresh":
        break;
    }
  },
};
