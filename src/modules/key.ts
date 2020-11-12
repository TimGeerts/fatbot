import { MessageEmbed, Message, MessageReaction, User, EmbedField, Snowflake, Guild } from 'discord.js';
import { Command, CommandMessage, Description, Client } from '@typeit/discord';
import { getDungeons } from '../services/resource.service';
import { IDungeon } from '../types';
import { Utils } from '../utils';

export abstract class Key {
  private client: Client;

  @Command('key :key :level :tank :heal :dps')
  @Description("Displays a template for people to 'sign up' for a given key")
  async key(command: CommandMessage, client: Client) {
    this.client = client;
    getDungeons()
      .then((dungeons: IDungeon[]) => {
        if (dungeons && dungeons.length) {
          const helpEmbed = new MessageEmbed();
          let keyEmbed = new MessageEmbed();
          if (!command.args.key && !command.args.level) {
            helpEmbed
              .setColor('#007bff')
              .setTitle('Usage')
              .setDescription('Some example usages of the `?key` command')
              .addField(
                'Syntax',
                '`?key <dungeon> <level> <tank> <healer> <dps>`\n*(tank/healer/dps are optional parameters)*'
              )
              .addField('Looking for a full group', '`?key AD 18`')
              .addField('Looking for two dps', '`?key AD 18 0 0 2`')
              .addField('Looking for tank and healer', '`?key AD 18 1 1 0`');
            const dungeon_acronyms = dungeons
              .sort((a, b) => (a.name > b.name ? 1 : -1))
              .map((d) => `${d.name}: \`${d.tags[0]}\``);
            helpEmbed.addField('Dungeon acronyms', dungeon_acronyms.join('\n'));

            command.reply(helpEmbed);
          } else {
            const key = command.args.key;
            const level = command.args.level;
            const missingRoles = this.findMissingRoles(command.args);
            const dungeon = dungeons.find((d) => d.tags.map((t) => t.toLowerCase()).indexOf(key?.toLowerCase()) > -1);
            if (!dungeon) {
              throw new Error(`No dungeon was found for the parameter  \`${key}\``);
            }
            if (!level || isNaN(level)) {
              throw new Error(`No keylevel could be determined from the parameter \`${level}\``);
            }
            command.args.key = dungeon.name;
            keyEmbed = this.createEmbed(command);

            const chan = command.channel;
            chan.send(Utils.getPingStringForRoles(missingRoles, command.guild));
            chan.send(keyEmbed).then((m: Message) => {
              //change the author of the message to be the one that sent the command
              m.author = command.author;
              missingRoles.forEach((r) => {
                m.react(Utils.getEmojiForReaction(r));
              });
              m.react('🔒');
              this.followReactions(m, keyEmbed);
            });
          }
        } else {
          throw new Error('No dungeons were found');
        }
      })
      .catch((err: Error) => {
        command.reply(`Sorry, I had some trouble fetching that information.\n\n${err.message}`);
      });
  }

  // returns an array of roles that are being looked for
  private findMissingRoles(args: any): string[] {
    let arr: string[] = [];
    if (args.tank === 1 || args.tank === undefined) {
      arr.push('Tank');
    }
    if (args.heal === 1 || args.heal === undefined) {
      arr.push('Healer');
    }
    if (args.dps !== 0 || args.dps === undefined) {
      arr.push('Dps');
    }
    return arr;
  }

  // creates the reaction handlers ("on" and "remove")
  private followReactions(msg: Message, embed: MessageEmbed): void {
    const roleCollector = Utils.createRoleReactionCollector(msg);
    roleCollector.on('collect', (reaction, user) => {
      // check if the reaction was the "lock" icon
      if (reaction.emoji.name === '🔒') {
        if (user.id !== msg.author.id) {
          // ignore and remove the reaction
          reaction.users.remove(user);
        } else {
          this.closeEmbed(embed);
          msg.edit(embed);
          msg.reactions.removeAll();
        }
      } else {
        const roleToAssign = Utils.findRoleNameForReaction(reaction);
        if (roleToAssign) {
          this.updateEmbed(embed, user, roleToAssign);
          msg.edit(embed);
        }
      }
    });
    roleCollector.on('remove', (reaction, user) => {
      const roleToRemove = Utils.findRoleNameForReaction(reaction);
      if (roleToRemove) {
        this.updateEmbed(embed, user, roleToRemove, false);
        msg.edit(embed);
      }
    });
  }

  // create the initial embed based on the command parameters
  private createEmbed(command: CommandMessage): MessageEmbed {
    const key = command.args.key;
    const level = command.args.level;
    const tank = command.args.tank;
    const heal = command.args.heal;
    let dps = command.args.dps;
    const embed = new MessageEmbed().setColor('#e6cc80');
    embed.setTitle(`[LFG] ${key} +${level}`);
    if (tank === 1 || tank === undefined) {
      embed.addField(Utils.getEmoji('Tank'), '...');
    }
    if (heal === 1 || heal === undefined) {
      embed.addField(Utils.getEmoji('Healer'), '...');
    }
    dps = dps === undefined || dps > 3 ? 3 : dps;
    for (let i = 0; i < dps; i++) {
      embed.addField(Utils.getEmoji('Dps'), '...');
    }
    return embed;
  }

  // update existing embed (following a reaction change)
  private updateEmbed(embed: MessageEmbed, user: User, role: string, add = true): void {
    if (!embed?.fields) return;
    const userTag = `<@${user.id}>`;
    // determine if the current user has already signed (only used for 'add' action)
    const signed = embed.fields.some((f) => f.value === userTag);
    // determine the fields we need based on the role/emoji
    const fields: EmbedField[] = embed.fields.filter((f) => f.name === Utils.getEmoji(role));

    // if the reaction is to "add" an unexisting signup
    if (add && !signed) {
      // find the first empty field
      let empField = fields.find((f) => f.value === '...');
      if (empField) {
        empField.value = userTag;
      }
    }
    // if the reaction is to "remove" an existing signup
    if (!add && signed) {
      // find the first field containing the user (there should actually only be one)
      let userField = fields.find((f) => f.value === userTag);
      if (userField) {
        userField.value = '...';
      }
    }
  }

  // close the embed message
  private closeEmbed(embed: MessageEmbed) {
    embed
      .setColor('#000')
      .setTitle(embed.title.replace('[LFG]', '[FULL]'))
      .setDescription('*Signups are closed*')
      .setFooter('Next time, be quicker to join a key, pleb!');
  }
}
