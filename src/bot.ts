import * as Path from "path";
import { MessageEmbed } from "discord.js";
import {
  Client,
  Discord,
  CommandMessage,
  Command,
  Description,
} from "@typeit/discord";

@Discord("?", {
  import: [Path.join(__dirname, "modules", "*.ts")],
})
abstract class SinBot {
  // help command lists out all available commands
  @Command("help")
  @Description("List all available commands")
  private help(command: CommandMessage) {
    const silent = ["help", "restart", "rolemessage", "reminders"];
    const cmds = Client.getCommands();
    const embed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Welcome to SinBot")
      .setDescription("The following commands are available:");
    cmds
      .filter((c) => !silent.includes(c.commandName.toString()))
      .forEach((c) => {
        embed.addField(`${c.prefix}${c.commandName}`, c.description);
      });
    command.reply(embed);
  }
}
