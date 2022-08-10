import { MessageEmbed, Message, User, EmbedField, TextChannel, MessageReaction } from 'discord.js';
import { Command, CommandMessage, Description, Client, Infos } from '@typeit/discord';
import { getDungeons } from '../services/resource.service';
import { IDungeon } from '../types';
import { Utils } from '../utils';

export abstract class Key {
  private client: Client;

  @Command('keys :key :level :tank :heal :dps :remark')
  @Infos({
    description: "Displays a template for people to 'sign up' for a given key",
    forAdmins: true,
  })
  async keys(command: CommandMessage, client: Client) {
    this.key(command, client);
  }

  @Command('key :key :level :tank :heal :dps :remark')
  @Description("Displays a template for people to 'sign up' for a given key")
  async key(command: CommandMessage, client: Client) {
    Utils.debug(`\`/key\` command executed`);
    Utils.debug(`args: \`${JSON.stringify(command.args)}\``);
    this.parseCommand(command);
    Utils.debug(`parsed args: \`${JSON.stringify(command.args)}\``);
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
              .setDescription('Some example usages of the `/key` command')
              .addField(
                'Syntax',
                '`/key <dungeon> <level> <tank> <healer> <dps>`\n*(tank/healer/dps are optional parameters)*'
              )
              .addField('Remark', 'If you want to add a specific remark to your key, add `remark: this is my remark`')
              .addField('Looking for a full group', '`/key MoTS 18`')
              .addField('Looking for two dps', '`/key HoA 18 0 0 2`')
              .addField('Looking for tank and healer', '`/key PF 18 1 1 0`')
              .addField(
                'Looking for one dps (with remark)',
                '`/key PF 18 0 0 1 remark: preferably a dps with bloodlust`'
              );
            const dungeon_acronyms = dungeons
              .sort((a, b) => (a.name > b.name ? 1 : -1))
              .map((d) => `${d.name}: \`${d.tags[0]}\``);
            helpEmbed.addField('Dungeon acronyms', dungeon_acronyms.join('\n'));

            command.reply(helpEmbed);
          } else {
            const key = command.args.key;
            const level = command.args.level;
            if (!level || isNaN(level)) {
              throw new Error(`No keylevel could be determined from the parameter \`${level}\``);
            }
            const missingRoles = this.findMissingRoles(command.args);
            Utils.debug(`missing roles: \`${JSON.stringify(missingRoles)}\``);
            const dungeon = dungeons.find((d) => d.tags.map((t) => t.toLowerCase()).indexOf(key?.toLowerCase()) > -1);
            if (!dungeon) {
              throw new Error(`No dungeon was found for the parameter  \`${key}\``);
            }
            command.args.key = dungeon.name;
            const chan = command.channel;
            Utils.debug(`pinging missing roles`);
            chan.send(Utils.getPingStringForRoles(missingRoles, command.guild)).then((pingMsg: Message) => {
              keyEmbed = this.createEmbed(command);
              Utils.debug(`embed message created`);
              chan.send(keyEmbed).then((m: Message) => {
                //change the author of the message to be the one that sent the command
                m.author = command.author;
                missingRoles.forEach((r) => {
                  const emoji = Utils.getEmojiForReaction(r);
                  Utils.debug(`adding reaction for \`${JSON.stringify(r)}\` using emoji ${emoji}`);
                  m.react(emoji);
                });
                Utils.debug(`adding reaction for \`"Close"\` using emoji 🔒`);
                m.react('🔒');
                Utils.debug(`adding reaction for \`"Delete"\` using emoji ❌`);
                m.react('❌');
                Utils.debug(`adding reaction for \`"Notify"\` using emoji 📢`);
                m.react('📢');
                this.followReactions(m, keyEmbed, [command.id, m.id, pingMsg.id, `${key}-${level}`]);
                // add an autoclose timer
                this.timeOutEmbed(m, keyEmbed);
              });
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

  private parseCommand(command: CommandMessage): void {
    // find the remark (if any)
    const rgxRemark = / remark:(.*)/g;
    const rgxCmd = /\/keys|\/key/g;

    // remove the /key or /keys part of the command
    let content = command.content.replace(rgxCmd, '').trim();
    // get the remark from the command (if any)
    const remark = content.match(rgxRemark);

    // a remark: pattern was found, store it as an argument and remove it from the command.content
    if (remark?.length) {
      let remarkArg = remark.shift();
      const actualCommand = content.replace(rgxRemark, '').trimEnd().split(' ');
      // set the actual args of the command
      command.args.key = actualCommand[0];
      command.args.level = +actualCommand[1];
      command.args.tank = this.numberOrDefault(actualCommand[2], 1);
      command.args.heal = this.numberOrDefault(actualCommand[3], 1);
      command.args.dps = this.numberOrDefault(actualCommand[4], 3);
      command.args.remark = remarkArg.replace('remark:', '').trim();
    }
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
  private followReactions(msg: Message, embed: MessageEmbed, ids: string[]): void {
    const roleCollector = Utils.createRoleReactionCollector(msg);
    roleCollector.on('collect', (reaction, user) => {
      Utils.debug(`reaction collected`);
      const isAdmin = this.isAdminReaction(reaction);
      const isAuthor = user.id === msg.author.id;
      Utils.debug(`isAdmin? \`${JSON.stringify(isAdmin)}\``);
      Utils.debug(`isAuthor? \`${JSON.stringify(isAuthor)}\``);
      Utils.debug(`emoji? \`${JSON.stringify(reaction.emoji.name)}\``);

      // check if the reaction was the "lock" icon
      if (reaction.emoji.name === '🔒') {
        if (isAdmin || isAuthor) {
          this.closeEmbed(embed);
          msg.edit(embed);
          msg.reactions.removeAll();
          Utils.debug(`message closed and reactions removed`);
        } else {
          // ignore and remove the reaction
          reaction.users.remove(user);
          Utils.debug(`user \`${JSON.stringify(user)}\` not allowed to use ${reaction.emoji.name} reaction`);
        }
        // check if the reaction was the "delete" icon
      } else if (reaction.emoji.name === '❌') {
        if (isAdmin || isAuthor) {
          this.deleteMessages(msg.channel as TextChannel, ids);
          Utils.debug(`message deleted`);
        } else {
          // ignore and remove the reaction
          reaction.users.remove(user);
          Utils.debug(`user \`${JSON.stringify(user)}\` not allowed to use ${reaction.emoji.name} reaction`);
        }
        // check if the reaction was the "loudspeaker" icon
      } else if (reaction.emoji.name === '📢') {
        if (isAdmin || isAuthor) {
          this.pingTeam(msg, ids[3]);
          this.closeEmbed(embed);
          msg.edit(embed);
          msg.reactions.removeAll();
        } else {
          // ignore and remove the reaction
          reaction.users.remove(user);
          Utils.debug(`user \`${JSON.stringify(user)}\` not allowed to use ${reaction.emoji.name} reaction`);
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
    const remark = command.args.remark;
    const title = `[LFG] ${key} +${level}`;
    let dps = command.args.dps;
    const embed = new MessageEmbed().setColor('#e6cc80');
    embed.setTimestamp();
    embed.setTitle(title);
    if (remark) {
      embed.setDescription('```' + remark + '```');
    } else {
      embed.setDescription(`*${this.motivationalDescription()}*`);
    }
    embed.addField('\u200B', '\u200B', true);
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
  private closeEmbed(embed: MessageEmbed): void {
    embed
      .setColor('#000')
      .setTitle(embed.title.replace('[LFG]', '[FULL]'))
      .setDescription('*Signups are closed*')
      .setFooter('Next time, be quicker to join a key, pleb!');
  }

  // timeout function to auto-close a key that has had no activity for 10 minutes
  private timeOutEmbed(msg: Message, embed: MessageEmbed): NodeJS.Timeout {
    const msgId = msg.id;
    const msgChan = msg.channel;
    return setTimeout(function () {
      msgChan.messages
        .fetch(msgId)
        .then((m) => {
          // was the key already closed?
          const title = m.embeds[0]?.title;
          if (title.indexOf('[FULL]') === -1) {
            Utils.debug(`closing key \`${embed.title}\` after 10 minutes of inactivity`);
            embed
              .setColor('#000')
              .setTitle(embed.title.replace('[LFG]', '[CLOSED]'))
              .setDescription('*Signups are closed*')
              .setFooter('Timed out due to inactivity!');
            m.edit(embed);
            m.reactions.removeAll();
          } else {
            Utils.debug(`no need to close the key \`${embed.title}\` as it was already closed`);
          }
        })
        .catch((e) => {
          //empty catch, gets triggered if the message no longer exists, but /care
        });
    }, 600000);
  }

  // delete the embed message
  private deleteMessages(channel: TextChannel, ids: string[]) {
    //pop the last value, as it's a custom parameter, not an actual message id
    ids.pop();
    ids.forEach((i) => channel.messages.delete(i));
  }

  private numberOrDefault(val: string, def: number): number {
    return isNaN(+val) ? def : +val;
  }

  private motivationalDescription(): string {
    const motivations = [
      "I'm sure it will go well...",
      "Remember, don't stand in bad shit!",
      'Who pulled that!!!',
      'God damnit, why did we get Wo relic...',
      'Skip that shit',
      'What are mechanics?',
      'Leeeeeeeeerooooooooy',
      'Just ... one ... more ...',
      'Do you neeeeed?',
      'Oops, wrong talents',
      'Oops, wrong gearset...',
      "Just be glad Thy ain't here",
      'Team deplete!',
      'Boost Ari, he needs it',
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  private isAdminReaction(reaction: MessageReaction): boolean {
    const member = reaction.message.member;
    return Utils.isAdmin(member);
  }

  private pingTeam(msg: Message, key: string): void {
    const voiceChannelName = `key-${key}`;
    const pingString = Utils.getPingStringForReactions(msg.reactions);
    Utils.debug(`notifying team \`${JSON.stringify(pingString)}\``);
    Utils.debug(`creating voice channel \`${JSON.stringify(voiceChannelName)}\``);
    // create temporary voice channel in a specific category
    // 504796984519950359 for localhost
    // 952237305895219220 for Fat Dragons server
    const parent = msg.guild.channels.cache.find((c) => c.id === '952237305895219220');
    msg.guild.channels
      .create(voiceChannelName, {
        type: 'voice', //This create a text channel, you can make a voice one too, by changing "text" to "voice"
        parent: parent,
      })
      .then((channel) => {
        msg.channel.send(
          `${pingString}, please log in to your character, the key you signed up for (\`${key}\`) is about to start!\nJoin the voice channel created for this run <#${channel.id}>`
        );
        // remove the channel after 5 minutes
        let timeout = setTimeout(function () {
          Utils.debug(`deleting voice channel \`${JSON.stringify(voiceChannelName)}\` after 5 minutes of inactivity`);
          channel.delete();
        }, 300000);
        // unless there's "activity" in the channel, then don't delete it
        this.client.on('voiceStateUpdate', (oldState, newState) => {
          const memberCount = channel.members.size;
          if (memberCount > 0) {
            Utils.debug(
              `activity found in voice channel \`${JSON.stringify(voiceChannelName)}\`, removing 'delete' timer`
            );
            clearTimeout(timeout);
          } else {
            Utils.debug(
              `no more members in voice channel \`${JSON.stringify(voiceChannelName)}\`, deleting the channel`
            );
            channel.delete();
          }
        });
      })
      .catch((e) => {
        Utils.error(`${e}`);
      });
  }
}
