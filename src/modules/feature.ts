import { Command, CommandMessage, Infos } from '@typeit/discord';
import { MessageEmbed } from 'discord.js';
import { featFlags, setFlag } from '../services/features.service';

export abstract class Feature {
  @Command('feature :name :value')
  @Infos({ description: 'Toggle feature flags', forAdmins: true })
  async feature(command: CommandMessage) {
    const helpEmbed = new MessageEmbed();
    if (!command.args.name && !command.args.value) {
      helpEmbed
        .setColor('#007bff')
        .setTitle('Usage')
        .setDescription('Some example usages of the `?feature` command')
        .addField('Syntax', '`?feature <name> <on/off>`')
        .addField('Enable twitch feature', '`?feature twitch true`')
        .addField('Disable twitch feature', '`?key feature twitch false`')
        .addField('List all features', '`?feature list`');
      command.reply(helpEmbed);
    } else if (command.args.name === 'list') {
      let ret = 'The following featureflags are available\n```';
      for (let key of Object.keys(featFlags)) {
        ret += `${key}: ${featFlags[key]}\n`;
      }
      ret += '```';
      ret += 'You can enable/disable them by using the `?feature <name> <on/off>` command';
      command.channel.send(ret);
    } else {
      const feat = command.args.name;
      const val = command.args.value;

      setFlag(feat, this.parseBool(val));
      command.channel.send(`Feature '${feat}' has been set to '${val}'`);
    }
  }

  private parseBool(value: string): boolean {
    switch (value) {
      case 'true':
      case '1':
      case 'on':
      case 'yes':
        return true;
      default:
        return false;
    }
  }
}
