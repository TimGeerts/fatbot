import { MessageEmbed } from "discord.js";
import { Client, On, ArgsOf, Guard } from "@typeit/discord";
import { getQuickLinks } from "../services/resource.service";
import { IQuickLink } from "../types";
import { HasPrefix, NotBot, NotHandled } from "../guards";
import { Utils } from "../utils";

export abstract class Corruption {
  @On("message")
  @Guard(NotBot, HasPrefix("?"), NotHandled)
  private onMessage([message]: ArgsOf<"message">, client: Client) {
    //the three guards on this handler make sure that
    // - 1: the author of the message is not a bot
    // - 2: the message has the "?" prefix
    // - 3: the message is not handled by another command already implemented
    const command = Utils.stripPrefix(message.content);
    //lookup existing quicklink
    getQuickLinks()
      .then((lnks: IQuickLink[]) => {
        if (lnks && lnks.length) {
          if (command.toLocaleLowerCase() === "links") {
            // list all available quicklinks
            const embed = new MessageEmbed()
              .setColor("#c97a30")
              .setTitle("Available links")
              .setDescription("The following links are available");
            const commands = lnks.map((l) => {
              if (l.tags && l.tags.length) {
                return `\`?${l.tags[0]}\``;
              }
            });
            embed.addField("Commands", commands.join("\n"));
            message.reply(embed);
          } else {
            const lnk = this.lookupCommand(command, lnks);
            if (!lnk) {
              message.reply("I have no witty reply for that command...");
              return;
            }
            const reply = this.getRandomReply(lnk);
            if (!reply) {
              message.reply("I have no witty reply for that command...");
              return;
            }
            message.channel.send(reply);
            message.delete();
          }
        } else {
          throw new Error("No links were found");
        }
      })
      .catch((err: Error) => {
        message.reply(
          `Sorry, I had some trouble fetching that information.\n\n${err.message}`
        );
      });
  }

  // try and find a matching QuickLink for the command
  private lookupCommand(command: string, links: IQuickLink[]): IQuickLink {
    const link = links.find(
      (l) =>
        l.tags.map((t) => t.toLowerCase()).indexOf(command.toLowerCase()) > -1
    );
    return link;
  }

  // gets a random reply from the available replies to a command
  private getRandomReply(link: IQuickLink): string {
    return Utils.randomFromArray<string>(link.replies);
  }
}
