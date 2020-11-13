import { Client, Command, Once, ArgsOf, CommandMessage, Infos } from '@typeit/discord';
import { Utils } from '../utils';

export abstract class Startup {
  // will be executed only once, when the bot is started and ready
  @Once('ready')
  // message parameter will always be an empty array here
  private ready(message: ArgsOf<'message'>, client: Client) {
    // init the helper.service properties
    Utils.init(client);
    Utils.success('Bot successfully started');
  }

  @Command('restart')
  @Infos({ description: 'Does it really need explaining?', forAdmins: true })
  private restart(command: CommandMessage) {
    command.reply('Very well master, restarting, brb... :wave:').then(() => {
      process.exit();
    });
  }
}
