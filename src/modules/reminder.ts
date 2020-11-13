import { TextChannel, Snowflake } from 'discord.js';
import { Client, Once, ArgsOf } from '@typeit/discord';
import { getReminders } from '../services/resource.service';
import { schedule, validate } from 'node-cron';
import { Utils } from '../utils';

interface IReminder {
  enabled: boolean;
  cron: string;
  guild: string;
  channel: string;
  mentions: string[];
  title: string;
  message: string;
}

export abstract class Reminder {
  client: Client;

  // will be executed only once, when the bot is started and ready
  @Once('ready')
  // message parameter will always be an empty array here
  private ready(message: ArgsOf<'message'>, client: Client) {
    this.client = client;
    // parse and schedule the reminders
    getReminders().then((reminders: IReminder[]) => {
      let rem = this.parseRemindersJson(reminders);
      rem.forEach((r) => {
        schedule(r.cron, () => this.sendReminder(r));
      });
    });
  }

  // parse all the reminders and check them for valid "channel" and "guild" id's
  private parseRemindersJson(reminderData: IReminder[]): IReminder[] {
    const result: IReminder[] = reminderData.filter((entry) => {
      // Uncomment for debug if you want to use your own channels/guilds/mentions to test stuff
      // Make sure to change the ids so they match your own discord server
      // The cron of '* * * * *' will post the reminder every minute
      // entry.enabled = true;
      // entry.guild = '504796984519950355';
      // entry.channel = '729317838338392174';
      // entry.mentions = ['TestRaider'];
      // entry.cron = '* * * * *';

      if (!entry.enabled) {
        return false;
      }
      if (validate(entry.cron) === false) {
        console.error(`Invalid cron parsed in "${entry.title}" [${entry.cron}]`);
        return false;
      }
      const guild = this.client.guilds.cache.get(entry.guild);
      const channel = this.client.channels.cache.get(entry.channel);
      if (!guild) {
        console.error(`Cannot find guild with ID parsed in "${entry.title}" [${entry.guild}]`);
        return false;
      }
      if (!channel) {
        console.error(`Cannot find channel with ID parsed in "${entry.title}" [${entry.channel}]`);
        return false;
      } else if (channel.type !== 'text') {
        console.error(`Found channel but it is of the wrong type "${entry.title}" [${channel.type}]`);
        return false;
      }
      return true;
    });
    Utils.success(`Parsed ${result.length} reminder(s) for SinBot`);
    return result;
  }

  // cron will execute this function to send the actual reminder
  private sendReminder(reminder: IReminder): void {
    const channel = this.client.channels.cache.get(reminder.channel) as TextChannel;
    const guild = this.client.guilds.cache.get(reminder.guild);
    const pingString = Utils.getPingStringForRoles(reminder.mentions, guild);
    channel.send(`${pingString.length > 0 ? `${pingString}\n` : ''}${reminder.message}`);
  }
}
