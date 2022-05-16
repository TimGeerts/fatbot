import { Command, CommandMessage, Description, Client, On, ArgsOf, Guard, Infos, Once } from '@typeit/discord';
import { Message, MessageEmbed } from 'discord.js';
import { NotThy } from '../guards';
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

  @On('message')
  @Guard(NotThy)
  private onMessage(message: Message) {
    // console.log(message);
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

  @Command('config :action :key :val')
  @Infos({ description: 'Get or set a config variable', forAdmins: true })
  private config(command: CommandMessage) {
    const action = command.args.action;
    const key = command.args.key;
    const val = command.args.val;
    console.log(action, key, val);
    if (action && key) {
      if (action === 'get') {
        if (key !== 'all') {
          const keyValue = Utils.getConfig(key);
          command.reply(`the config value for ${key} is currently set to \`${keyValue}\``);
        } else {
          const configJson = Utils.getConfigJson();
          console.log(configJson);
          // command.reply(`the current config values are: \n \`\`\`json\n${configJson}\`\`\``);
        }
      } else if (action == 'set' && val) {
        const keyValue = Utils.getConfig(key);
        if (keyValue) {
          Utils.setConfig(key, val);
          command.reply(`the config value for ${key} was successfully changed to \`${process.env[key]}\``);
        }
      }
    }
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
