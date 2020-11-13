import { ArgsOf, Client, Command, CommandMessage, Infos, Once } from '@typeit/discord';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { getRoleMessage, setRoleMessage } from '../services/resource.service';
import { IStoredMessage } from '../types';
import { Utils } from '../utils';

export abstract class Roles {
  // This event will fire each time the bot starts up
  // it's used to check if there was an existing "rolemessage" based on firebase info and attach the reactionCollector to it
  @Once('ready')
  // message parameter will always be an empty array here
  private ready(message: ArgsOf<'message'>, client: Client) {
    getRoleMessage()
      .then((msg: IStoredMessage) => {
        // check if there was a previous message we should track for reactions
        if (msg && msg?.channelId !== '-1' && msg?.messageId !== '-1') {
          Utils.success('Previous rolemessage found, attaching handler to the existing message');
          const chan = client.channels.cache.get(msg.channelId) as TextChannel;
          if (chan) {
            chan.messages.fetch(msg.messageId).then((m) => {
              if (m) {
                this.followReactions(m);
              }
            });
          }
        } else {
          Utils.debug('no previous rolemessage found, use `?rolemessage` command to create one.');
        }
      })
      .catch((err: Error) => {
        Utils.error(err.message);
      });
  }

  @Command('rolemessage')
  @Infos({
    description: 'Creates a post where roles will be assigned based on the reactions',
    forAdmins: true,
  })
  async rolemessage(command: CommandMessage, client: Client) {
    const chan = command.channel;
    const msg = new MessageEmbed();
    msg
      .setColor(Utils.guildColor)
      .setTitle('Role assignment')
      .setDescription(
        'React to this message to assign your desired role within The Eighth Sin discord.\n(*multiple roles are of course allowed*)'
      )
      .addField(
        'Roles',
        `${Utils.getEmoji('Tank')}: Tank\n${Utils.getEmoji('Healer')}: Healer\n${Utils.getEmoji('Dps')}: DPS\n`
      )
      .setFooter(
        "These roles will be used as 'mentions' by other bot commands and can be used by people that are looking for a specific role to fill a group."
      );
    try {
      command.delete();
    } catch (e) {
      // ignore the catch, bot can't delete the "calling" command but that's not really an issue
      Utils.error(`${e}`);
    }
    chan.send(msg).then((m: Message) => {
      ['Tank', 'Healer', 'Dps'].forEach((r) => {
        m.react(Utils.getEmojiForReaction(r));
      });
      // create a collector to watch for reactions
      this.followReactions(m);
      const roleMessage: IStoredMessage = {
        channelId: m.channel.id,
        messageId: m.id,
      };
      // stores the channel and message id on firebase so a freshly started bot (which happens regularly) can reattach the handler
      setRoleMessage(roleMessage).catch((err: Error) => {
        Utils.log(`Sorry, I had some trouble fetching that information.\n\n${err.message}`, '[ERROR');
      });
    });
  }

  private followReactions(msg: Message): void {
    Utils.debug(`creating reactionCollector on message ${msg.id}`);
    const roleCollector = Utils.createRoleReactionCollector(msg);
    roleCollector.on('collect', (reaction, user) => {
      user
        .fetch()
        .then((u) => {
          Utils.debug(`reaction ${reaction.emoji.id ?? reaction.emoji.name} added by user ${u.username}`);
          const guild = reaction.message.guild;
          const roleToAssign = Utils.findRoleForReaction(reaction);
          if (roleToAssign) {
            Utils.addRole(guild, u, roleToAssign);
          } else {
            Utils.debug(`object 'roleToAssign' is undefined`);
          }
        })
        .catch((e) => {
          Utils.error(`${e}`);
        });
    });
    roleCollector.on('remove', (reaction, user) => {
      user
        .fetch()
        .then((u) => {
          Utils.debug(`reaction ${reaction.emoji.id ?? reaction.emoji.name} removed by user ${u.username}`);
          const guild = reaction.message.guild;
          const roleToRemove = Utils.findRoleForReaction(reaction);
          if (roleToRemove) {
            Utils.removeRole(guild, u, roleToRemove);
          } else {
            Utils.debug(`object 'roleToRemove' is undefined`);
          }
        })
        .catch((e) => {
          Utils.error(`${e}`);
        });
    });
  }
}
