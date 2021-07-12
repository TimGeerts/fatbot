import 'reflect-metadata';
import { Client } from '@typeit/discord';
import { Utils } from './utils';

export class Main {
  static start() {
    const client = new Client({
      classes: [`${__dirname}/*.ts`],
      partials: ['USER', 'MESSAGE', 'REACTION'],
      variablesChar: ':',
    });
    require('dotenv').config();
    client.login(process.env.BOT_TOKEN); //needs bot token to work

    // For some reason this hook (presenceUpdate) doesn't work well when defined within a module
    // So leaving it here for now, ... cluttering my code...
    client.on('presenceUpdate', (oldPresence, newPresence) => {
      //get the member object and work from there
      newPresence.guild.members.fetch(newPresence.user).then((m) => {
        if (!newPresence.activities) return;
        const streamingChannel = Utils.getStreamingChannel();
        newPresence.activities.forEach((activity) => {
          if (activity.type === 'STREAMING') {
            streamingChannel.send(
              `**${m.displayName}** started streaming '**${activity.details}**' at ${activity.url}`
            );
          }
        });
      });
    });
  }
}
Main.start();
