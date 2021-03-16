import { Command, CommandMessage, Infos } from '@typeit/discord';
import { GuildMember } from 'discord.js';
import { Utils } from '../utils';

export abstract class Twitch {
  @Command('twitch')
  @Infos({ description: 'Lists out all currently active twitch streams' })
  async twitch(command: CommandMessage) {
    let streams: string[] = new Array<string>();
    const members = command?.guild?.members?.cache;
    if (members) {
      members.each((m: GuildMember) => {
        const activities = m.presence?.activities;
        if (activities && activities.length) {
          const streaming = activities.find((a) => a.type === 'STREAMING');
          if (streaming) {
            streams.push(streaming.url);
          }
        }
      });
    }

    if (streams && streams.length) {
      const result = Utils.multiTwitch(streams);
      if (result) {
        command.channel.send(result);
      } else {
        this.noStreams(command);
      }
    } else {
      this.noStreams(command);
    }
  }

  private noStreams(command: CommandMessage): void {
    command.channel.send("There's nobody streaming at the moment, but here's a cat with a twitch :man_shrugging:");
    command.channel.send('https://tenor.com/view/angry-cat-cat-cute-mad-angry-gif-16108037');
  }
}
