import { Command, CommandMessage, Infos } from "@typeit/discord";
import { GuildMember } from "discord.js";

export abstract class Twitch {
  @Command("twitch")
  @Infos({ description: "Lists out all currently active twitch streams" })
  async twitch(command: CommandMessage) {
    let streamers: string[] = new Array<string>();

    console.log("twitch command executed");
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
    }
  }
}
