import { Client, Once, ArgsOf } from '@typeit/discord';
import { clearKeystones, getJobs } from '../services/resource.service';
import { schedule, validate } from 'node-cron';
import { Utils } from '../utils';

interface IScheduledJob {
  enabled: boolean;
  cron: string;
  exec: string;
  title: string;
}

export abstract class Scheduler {
  client: Client;

  // will be executed only once, when the bot is started and ready
  @Once('ready')
  // message parameter will always be an empty array here
  private ready(message: ArgsOf<'message'>, client: Client) {
    this.client = client;
    // parse and schedule the reminders
    this.parseJobs();
  }

  private parseJobs() {
    getJobs().then((jobs: IScheduledJob[]) => {
      let job = this.parseJobsJson(jobs);
      job.forEach((j) => {
        schedule(j.cron, () => this.executeJob(j));
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
        console.error(`Invalid cron parsed in "${entry.title}" [${entry.cron}]`);
        return false;
      }
      return true;
    });
    Utils.success(`Parsed ${result.length} recurring job(s)`);
    return result;
  }

  // cron will execute this function to send the actual reminder
  private executeJob(job: IScheduledJob): void {
    const action = job.exec;
    if (action) {
      switch (action) {
        case 'weeklyReset':
          this.weeklyReset();
          break;
      }
    }
  }

  private weeklyReset(): void {
    // clear the list of keystones on weekly reset
    clearKeystones().then((r) => {
      Utils.success('All keystones successfully cleared.');
    });
  }
}
