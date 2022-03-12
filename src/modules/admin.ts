import { Command, CommandMessage, Description, Client, On, ArgsOf, Guard, Infos, Once } from '@typeit/discord';
import { MessageEmbed } from 'discord.js';
import { Utils } from '../utils';

export abstract class Admin {
  // will be executed only once, when the bot is started and ready
  @Once('ready')
  // message parameter will always be an empty array here
  private ready(message: ArgsOf<'message'>, client: Client) {
    // init the helper.service properties
    Utils.init(client);
    Utils.success('Bot successfully started');
  }

  @Command('gma')
  @Infos({ description: 'Triggers the guildMemberAdd event', forAdmins: true })
  private gma(command: CommandMessage, client: Client) {
    command.reply('Triggering `guildMemberAdd` event.');
    setTimeout(() => {
      client.emit('guildMemberAdd', command.member);
    }, 500);
  }

  @Command('restart')
  @Infos({ description: 'Does it really need explaining?', forAdmins: true })
  private restart(command: CommandMessage) {
    command.reply('Very well master, restarting, brb... :wave:').then(() => {
      process.exit();
    });
  }

  // help command lists out all available commands
  @Command('help')
  @Infos({ description: 'List all available commands', forAdmins: true })
  private help(command: CommandMessage) {
    const cmds = Client.getCommands();
    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Welcome to FatBot')
      .setDescription('The following commands are available:');
    cmds
      .filter((c) => {
        return !c.infos?.forAdmins;
      })
      .forEach((c) => {
        embed.addField(`${c.prefix}${c.commandName}`, c.description);
      });
    command.reply(embed);
  }
}
