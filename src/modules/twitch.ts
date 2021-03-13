import { Command, CommandMessage, Infos } from "@typeit/discord";
import { GuildMember } from "discord.js";

export abstract class Twitch {
  @Command("twitch")
  @Infos({ description: "Lists out all currently active twitch streams" })
  async twitch(command: CommandMessage) {
    let streamers: string[] = new Array<string>();
    const members = command?.guild?.members?.cache;
    if (members) {
      members.each((m: GuildMember) => {
        const activities = m.presence?.activities;
        if (activities && activities.length) {
          const streaming = activities.find((a) => a.type === "STREAMING");
          if (streaming) {
            streamers.push(
              `**${m.displayName}** (${streaming.details})\n${streaming.url}`
            );
          }
        }
      });
    }

    if (streamers && streamers.length) {
      streamers.forEach((s) => {
        command.channel.send(s);
      });
    } else {
      command.channel.send(
        "There's nobody streaming at the moment, but here's a cat with a twitch :man_shrugging:"
      );
      command.channel.send(
        "https://tenor.com/view/angry-cat-cat-cute-mad-angry-gif-16108037"
      );
    }
  }
}
