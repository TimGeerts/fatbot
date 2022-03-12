import 'reflect-metadata';
import { Client } from '@typeit/discord';

export class Main {
  static start() {
    const client = new Client({
      classes: [`${__dirname}/*.ts`],
      partials: ['USER', 'MESSAGE', 'REACTION'],
      variablesChar: ':',
    });
    require('dotenv').config();
    client.login(process.env.BOT_TOKEN); // needs bot token to work
  }
}
Main.start();
