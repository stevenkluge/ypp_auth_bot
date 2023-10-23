import { REST, Routes } from "discord.js";
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { logger } from "../logger";

const commands = [];

const devDeployment = () => {
  return rest.put(
    Routes.applicationGuildCommands(
      process.env.APPLICATION_ID,
      process.env.DEV_SERVER_ID,
    ),
    { body: commands },
  );
};

const prodDeployment = () => {
  return rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), {
    body: commands,
  });
};

const findFiles = async () => {
  // Grab all the command files from the commands directory you created earlier
  const commandFiles = fs.readdirSync(path.join(__dirname, "..", "commands"));
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(__dirname, "..", "commands", file);
    const module = await import(filePath);
    if ("data" in module.command && "execute" in module.command) {
      commands.push(module.command.data.toJSON());
    } else {
      logger.warn(
        `The command at ${filePath} is missing a required "data" or "execute" property`,
      );
    }
  }
};

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
  try {
    await findFiles();
    logger.info(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    // last commandline argument [dev|prod] determines deploy type
    const data = await (process.argv[-1] === "dev"
      ? devDeployment()
      : prodDeployment());

    logger.info(
      `Successfully reloaded ${
        (data as unknown & { length: number }).length
      } application (/) commands.`,
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    logger.error(error);
  }
})();
