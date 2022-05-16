import { CommandMessage, Client } from '@typeit/discord';
import {
  Channel,
  Guild,
  GuildMember,
  Message,
  MessageReaction,
  ReactionCollector,
  ReactionManager,
  Role,
  Snowflake,
  TextChannel,
  User,
} from 'discord.js';
import { Emoji } from './types';

export namespace Utils {
  let _client: Client = null;
  let _logChan: TextChannel = null;
  let _officerRole: string = 'Officer';
  let _adminRole: string = 'Admin';

  export const guildColor: string = '#a330c9';

  //* Init (pass client property) *//
  export function init(client: Client): void {
    _client = client;
    const channel = client.channels.cache.find((c) => c.id === process.env.BOT_CHAN && c.type === 'text');
    if (channel) {
      _logChan = channel as TextChannel;
    }
  }

  //* General helpers *//
  export function hasParams(command: CommandMessage) {
    const args = command.args;
    return Object.keys(command.args).some((k) => args[k]);
  }

  export function capFirst(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  export function objectToArray<T>(obj: Object): Array<T> {
    let arr = new Array<T>();
    Object.keys(obj).forEach((k) => {
      arr.push(obj[k]);
    });
    return arr;
  }

  export function stripPrefix(message: string): string {
    const startWith = message.startsWith('?');
    if (message.startsWith('?')) {
      return message.substring(1);
    }
    return message;
  }

  export function multiTwitch(streams: string[]): string {
    const multiTwitch = 'https://www.multitwitch.tv/';
    if (streams && streams.length) {
      const handles = streams.map((s) => s.split('/')?.pop());
      if (handles && handles.length) {
        return `${multiTwitch}${handles.join('/')}`;
      }
    }
    return '';
  }

  export function getConfig(key: string): string {
    var keyToGet = process.env[`${key}`];
    return keyToGet;
  }

  export function getConfigJson(): string {
    return JSON.stringify(process.env);
  }

  export function setConfig(key: string, val: string): void {
    var keyToSet = process.env[`${key}`];
    if (keyToSet && val) {
      process.env[`${key}`] = val;
    }
  }

  //* Log helpers *//
  // basic log function
  export function log(message: string, prefix?: string, timestamp?: boolean) {
    if (prefix) {
      prefix = `[${prefix}] - `;
    } else {
      prefix = '';
    }
    if (timestamp) {
      prefix += `[${new Date().toISOString()}] - `;
    }
    if (_logChan) {
      _logChan.send(`${prefix}${message}`);
    } else {
      console.log(`${prefix}${message}`);
    }
  }

  export function success(message: string): void {
    this.log(`:white_check_mark: ${message}`);
  }

  // wrapper that adds the [DEBUG] prefix
  export function debug(message: string): void {
    if (process.env.DEBUG === 'true') {
      this.log(message, 'DEBUG', true);
    }
  }

  // wrapper that adds the [ERROR] prefix
  export function error(message: string): void {
    log(message, 'ERROR', true);
  }

  //* Emoji/Role helpers *//
  // gets the emoji for the given role (for usage in text)
  export function getEmoji(role: string): string {
    const e: string = Emoji[role];
    let retVal = e;
    // returns the emoji, either straight from the enum, or a lookup in cache in case of a custom one
    if (Number(e)) {
      let customEmoji = _client.emojis.cache.find((emoji) => emoji.id === e);
      retVal = customEmoji ? `<:${customEmoji.name}:${customEmoji.id}>` : Emoji[`${role}FallBack`];
    }
    return retVal;
  }

  // gets the emoji for the given role (for usage in reactions)
  export function getEmojiForReaction(role: string): string {
    const e: string = Emoji[role];
    let retVal = e;
    // returns the emoji, either straight from the enum, or a lookup in cache in case of a custom one
    if (Number(e)) {
      let customEmoji = _client.emojis.cache.find((emoji) => emoji.id === e);
      retVal = customEmoji ? customEmoji.id : Emoji[`${role}FallBack`];
    }
    return retVal;
  }

  // finds the role (name) for the given "reaction"
  export function findRoleNameForReaction(reaction: MessageReaction): string {
    let role: string = undefined;
    // if it has an id, it's a custom emoji
    const emojiToCheck: string = reaction.emoji.id ?? reaction.emoji.name;
    switch (emojiToCheck) {
      case Emoji.Tank:
      case Emoji.TankFallBack:
        role = 'Tank';
        break;
      case Emoji.Healer:
      case Emoji.HealerFallBack:
        role = 'Healer';
        break;
      case Emoji.Dps:
      case Emoji.DpsFallBack:
        role = 'Dps';
        break;
    }
    return role;
  }

  // finds the role (of type Role) for the given "reaction"
  export function findRoleForReaction(reaction: MessageReaction): Role {
    const roleName = this.findRoleNameForReaction(reaction);
    const guild = reaction?.message?.guild;
    return findRoleByName(roleName, guild);
  }

  // finds the role (of type Role) for the given "name" and "guild"
  export function findRoleByName(roleName: string, guild: Guild): Role {
    const discordRole = guild?.roles.cache.find((r) => r.name.toLocaleLowerCase() === roleName.toLocaleLowerCase());
    if (!discordRole) {
      error(`The role '${roleName}' could not be found in this discord.`);
    }
    return discordRole;
  }

  // adds a role to a given user
  export function addRole(guild: Guild, user: User, role: Role): void {
    // fuck you caching!
    this.debug(`trying to assign role ${role.name} to user ${user.username}`);
    guild.members
      .fetch(user)
      .then((m) => {
        this.debug(`user ${user.username} found, adding role ${role.name}`);
        m.roles
          .add(role)
          .then((r) => {
            this.debug(`role ${role.name} added to ${user.username}`);
          })
          .catch((e) => {
            this.error(`${e}`);
          });
      })
      .catch((e) => {
        this.error(`${e}`);
      });
  }

  // removes a role from a given user
  export function removeRole(guild: Guild, user: User, role: Role): void {
    // fuck you caching!
    this.debug(`trying to remove role ${role.name} from user ${user.username}`);
    guild.members
      .fetch(user)
      .then((m) => {
        this.debug(`user ${user.username} found, removing role ${role.name}`);
        m.roles
          .remove(role)
          .then((r) => {
            this.debug(`role ${role.name} removed from ${user.username}`);
          })
          .catch((e) => {
            this.error(`${e}`);
          });
      })
      .catch((e) => {
        this.error(`${e}`);
      });
  }

  // generic filter that can be used in a reactionCollector used for roles
  export function createRoleReactionCollector(message: Message): ReactionCollector {
    Utils.debug(`creating ReactionCollector for message: \`${JSON.stringify(message)}\``);
    const tank = this.getEmojiForReaction('Tank');
    const healer = this.getEmojiForReaction('Healer');
    const dps = this.getEmojiForReaction('Dps');
    const lock = '🔒';
    const del = '❌';
    const speaker = '📢';

    return message.createReactionCollector(
      (reaction: MessageReaction, user: User) => {
        const toCheck = reaction.emoji.id ?? reaction.emoji.name;
        return !user.bot && [tank, healer, dps, lock, del, speaker].includes(toCheck);
      },
      {
        dispose: true,
      }
    );
  }

  //* Ping helpers *//
  // used to create a string of mentions based on an array of rolenames
  export function getPingStringForRoles(roles: string[], guild: Guild): string {
    const idsToMention: Snowflake[] = [];
    roles.forEach((missingRole) => {
      const guildRole = guild.roles.cache.find((r) => r.name.toLocaleLowerCase() === missingRole.toLocaleLowerCase());
      if (guildRole) {
        idsToMention.push(guildRole.id);
      }
    });
    return idsToMention.map((id) => `<@&${id}>`).join(' ');
  }

  export function getPingStringForReactions(reactions: ReactionManager): string {
    const idsToMention: Snowflake[] = [];
    const tank = this.getEmojiForReaction('Tank');
    const healer = this.getEmojiForReaction('Healer');
    const dps = this.getEmojiForReaction('Dps');

    const userList = reactions.cache
      .filter((r) => {
        const toCheck = r.emoji.id ?? r.emoji.name;
        return [tank, healer, dps].includes(toCheck);
      })
      .map((r) => r.users.cache.filter((u) => !u.bot).map((u) => u.toString()));
    [].concat(...userList).forEach((u) => idsToMention.push(u));
    return idsToMention.join(' ');
  }

  export function isOfficer(member: GuildMember): boolean {
    const isOfficer = member.roles.cache.some((r) => r.name.toLocaleLowerCase() === _officerRole.toLocaleLowerCase());
    return isOfficer;
  }

  export function isAdmin(member: GuildMember): boolean {
    const isAdmin = member.roles.cache.some((r) => r.name.toLocaleLowerCase() === _adminRole.toLocaleLowerCase());
    return isAdmin;
  }
}
