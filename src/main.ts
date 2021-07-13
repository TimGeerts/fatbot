import 'reflect-metadata';
import { Client } from '@typeit/discord';
import { Utils } from './utils';
import { twitchFlag } from './services/features.service';

export class Main {
  static start() {
    const client = new Client({
      classes: [`${__dirname}/*.ts`],
      partials: ['USER', 'MESSAGE', 'REACTION'],
      variablesChar: ':',
    });
    require('dotenv').config();
    client.login(process.env.BOT_TOKEN); // needs bot token to work

    // For some reason this hook (presenceUpdate) doesn't work well when defined within a module
    // So leaving it here for now, ... cluttering my code...
    client.on('presenceUpdate', (oldPresence, newPresence) => {
      // check if twitch module is enabled
      if (twitchFlag()) {
        // check for duplicate events
        if (oldPresence.status !== newPresence.status) {
          // get the member object and work from there
          newPresence.guild.members.fetch(newPresence.user).then((m) => {
            if (!newPresence.activities) return;
            const streamingChannel = Utils.getStreamingChannel();
            newPresence.activities.every((a) => {
              if (a.type === 'STREAMING') {
                streamingChannel.send(`**${m.displayName}** started streaming '**${a.details}**' at ${a.url}`);
                return false; // break the loop once we found a 'STREAMING' activity
              }
            });
          });
        }
      }
    });
  }
}
Main.start();
