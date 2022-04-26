import { Command, CommandMessage, Description, Client, Infos } from '@typeit/discord';
import { MessageEmbed } from 'discord.js';
import { Utils } from '../utils';

export abstract class Key {
  private client: Client;

  @Command('keystone :action :dungeon :level :char')
  @Description("Displays a template for people to 'sign up' for a given key")
  async keystone(command: CommandMessage, client: Client) {
    // Utils.debug(`\`?keystone\` command executed`);
    // Utils.debug(`args: \`${JSON.stringify(command.args)}\``);
    // this.client = client;
    // const helpEmbed = new MessageEmbed();
    // if (!command.args.key && !command.args.level) {
    //   helpEmbed
    //     .setColor('#007bff')
    //     .setTitle('Usage')
    //     .setDescription('Some example usages of the `?keystone` command')
    //     .addField(
    //       'Basic syntax',
    //       '`?keystone <action> <dungeon> <level> <char>`'
    //     )
    //     .addField('Set a key', '`?keystone set MoTS 18`')
    //     .addField('Set a key for a character (alt for instance)', '`?keystone set HoA 18 Chipstocks`')
    //     .addField('Looking for tank and healer', '`?key PF 18 1 1 0`')
    //     .addField(
    //       'Looking for one dps (with remark)',
    //       '`?key PF 18 0 0 1 remark: preferably a dps with bloodlust`'
    //     );
    //   const dungeon_acronyms = dungeons
    //     .sort((a, b) => (a.name > b.name ? 1 : -1))
    //     .map((d) => `${d.name}: \`${d.tags[0]}\``);
    //   helpEmbed.addField('Dungeon acronyms', dungeon_acronyms.join('\n'));
    //   command.reply(helpEmbed);
    // } else {
    // }
  }
}
