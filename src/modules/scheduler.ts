import { Client, Once, ArgsOf } from "@typeit/discord";
import {
  clearKeystones,
  getJobs,
  getKeystonePin,
} from "../services/resource.service";
import { schedule, validate } from "node-cron";
import { Utils } from "../utils";
import { IStoredMessage } from "../types";
import { TextChannel } from "discord.js";

interface IScheduledJob {
  enabled: boolean;
  cron: string;
  exec: string;
  title: string;
}

export abstract class Scheduler {
  client: Client;

  // will be executed only once, when the bot is started and ready
  @Once("ready")
  // message parameter will always be an empty array here
  private ready(message: ArgsOf<"message">, client: Client) {
    this.client = client;
    // parse and schedule the reminders
    this.parseJobs(client);
  }

  private parseJobs(client: Client) {
    getJobs().then((jobs: IScheduledJob[]) => {
      let job = this.parseJobsJson(jobs);
      job.forEach((j) => {
        schedule(j.cron, () => this.executeJob(j, client));
      });
    });
  }

  // parse all the reminders and check them for valid "channel" and "guild" id's
  private parseJobsJson(data: IScheduledJob[]): IScheduledJob[] {
    const result: IScheduledJob[] = data.filter((entry) => {
      // The cron of '* * * * *' will post the reminder every minute
      // entry.cron = '* * * * *';

      if (!entry.enabled) {
        return false;
      }
      if (validate(entry.cron) === false) {
        console.error(
          `Invalid cron parsed in "${entry.title}" [${entry.cron}]`
        );
        return false;
      }
      return true;
    });
    Utils.success(`Parsed ${result.length} recurring job(s)`);
    return result;
  }

  // cron will execute this function to send the actual reminder
  private executeJob(job: IScheduledJob, client: Client): void {
    const action = job.exec;
    if (action) {
      switch (action) {
        case "weeklyReset":
          this.weeklyReset(client);
          break;
      }
    }
  }

  private weeklyReset(client: Client): void {
    // clear the list of keystones on weekly reset
    clearKeystones().then((r) => {
      getKeystonePin()
        .then((msg: IStoredMessage) => {
          // check if there was a previous message we should track for reactions
          if (msg && msg?.channelId !== "-1" && msg?.messageId !== "-1") {
            const chan = client.channels.cache.get(
              msg.channelId
            ) as TextChannel;
            if (chan) {
              chan.messages.fetch(msg.messageId).then((m) => {
                m.edit("No keystones available yet for this week.");
              });
            }
          } else {
            Utils.debug(
              `No previous keystone pin found, couldn't update the Message.`
            );
          }
        })
        .catch((err: Error) => {
          Utils.error(err.message);
        });
      Utils.success("All keystones successfully cleared.");
    });
  }
}
