import {
  MessageEmbed,
  Message,
  User,
  EmbedField,
  TextChannel,
  MessageReaction,
} from "discord.js";
import {
  Command,
  CommandMessage,
  Description,
  Client,
  Infos,
} from "@typeit/discord";
import { getDungeons } from "../services/resource.service";
import { IDungeon } from "../types";
import { Utils } from "../utils";

export abstract class Key {
  private client: Client;

  @Command("keys :key :level :tank :heal :dps :remark")
  @Infos({
    description: "Displays a template for people to 'sign up' for a given key",
    forAdmins: true,
  })
  async keys(command: CommandMessage, client: Client) {
    this.key(command, client);
  }

  @Command("key :key :level :tank :heal :dps :remark")
  @Description("Displays a template for people to 'sign up' for a given key")
  async key(command: CommandMessage, client: Client) {
    this.parseCommand(command);
    this.client = client;
    getDungeons()
      .then((dungeons: IDungeon[]) => {
        if (dungeons && dungeons.length) {
          const helpEmbed = new MessageEmbed();
          let keyEmbed = new MessageEmbed();
          if (!command.args.key && !command.args.level) {
            helpEmbed
              .setColor("#007bff")
              .setTitle("Usage")
              .setDescription("Some example usages of the `?key` command")
              .addField(
                "Syntax",
                "`?key <dungeon> <level> <tank> <healer> <dps>`\n*(tank/healer/dps are optional parameters)*"
              )
              .addField(
                "Remark",
                "If you want to add a specific remark to your key, add `remark: this is my remark`"
              )
              .addField("Looking for a full group", "`?key MoTS 18`")
              .addField("Looking for two dps", "`?key HoA 18 0 0 2`")
              .addField("Looking for tank and healer", "`?key PF 18 1 1 0`")
              .addField(
                "Looking for one dps (with remark)",
                "`?key PF 18 0 0 1 remark: preferably a dps with bloodlust`"
              );
            const dungeon_acronyms = dungeons
              .sort((a, b) => (a.name > b.name ? 1 : -1))
              .map((d) => `${d.name}: \`${d.tags[0]}\``);
            helpEmbed.addField("Dungeon acronyms", dungeon_acronyms.join("\n"));

            command.reply(helpEmbed);
          } else {
            const key = command.args.key;
            const level = command.args.level;
            if (!level || isNaN(level)) {
              throw new Error(
                `No keylevel could be determined from the parameter \`${level}\``
              );
            }
            const missingRoles = this.findMissingRoles(command.args);
            const dungeon = dungeons.find(
              (d) =>
                d.tags.map((t) => t.toLowerCase()).indexOf(key?.toLowerCase()) >
                -1
            );
            if (!dungeon) {
              throw new Error(
                `No dungeon was found for the parameter  \`${key}\``
              );
            }
            command.args.key = dungeon.name;
            const chan = command.channel;
            chan
              .send(Utils.getPingStringForRoles(missingRoles, command.guild))
              .then((pingMsg: Message) => {
                keyEmbed = this.createEmbed(command);
                chan.send(keyEmbed).then((m: Message) => {
                  //change the author of the message to be the one that sent the command
                  m.author = command.author;
                  missingRoles.forEach((r) => {
                    m.react(Utils.getEmojiForReaction(r));
                  });
                  m.react("🔒");
                  m.react("❌");
                  this.followReactions(m, keyEmbed, [
                    command.id,
                    m.id,
                    pingMsg.id,
                  ]);
                });
              });
          }
        } else {
          throw new Error("No dungeons were found");
        }
      })
      .catch((err: Error) => {
        command.reply(
          `Sorry, I had some trouble fetching that information.\n\n${err.message}`
        );
      });
  }

  private parseCommand(command: CommandMessage): void {
    // find the remark (if any)
    const rgxRemark = / remark:(.*)/g;
    const rgxCmd = /\?keys|\?key/g;

    // remove the ?key or ?keys part of the command
    let content = command.content.replace(rgxCmd, "").trim();
    // get the remark from the command (if any)
    const remark = content.match(rgxRemark);

    // a remark: pattern was found, store it as an argument and remove it from the command.content
    if (remark?.length) {
      let remarkArg = remark.shift();
      const actualCommand = content.replace(rgxRemark, "").trimEnd().split(" ");
      // set the actual args of the command
      command.args.key = actualCommand[0];
      command.args.level = +actualCommand[1];
      command.args.tank = this.numberOrDefault(actualCommand[2], 1);
      command.args.heal = this.numberOrDefault(actualCommand[3], 1);
      command.args.dps = this.numberOrDefault(actualCommand[4], 3);
      command.args.remark = remarkArg.replace("remark:", "").trim();
    }
  }

  // returns an array of roles that are being looked for
  private findMissingRoles(args: any): string[] {
    let arr: string[] = [];
    if (args.tank === 1 || args.tank === undefined) {
      arr.push("Tank");
    }
    if (args.heal === 1 || args.heal === undefined) {
      arr.push("Healer");
    }
    if (args.dps !== 0 || args.dps === undefined) {
      arr.push("Dps");
    }
    return arr;
  }

  // creates the reaction handlers ("on" and "remove")
  private followReactions(
    msg: Message,
    embed: MessageEmbed,
    ids: string[]
  ): void {
    const roleCollector = Utils.createRoleReactionCollector(msg);
    roleCollector.on("collect", (reaction, user) => {
      // check if the reaction was the "lock" icon
      if (reaction.emoji.name === "🔒") {
        if (this.userIsBotAdmin(reaction) || user.id === msg.author.id) {
          this.closeEmbed(embed);
          msg.edit(embed);
          msg.reactions.removeAll();
        } else {
          // ignore and remove the reaction
          reaction.users.remove(user);
        }
      } else if (reaction.emoji.name === "❌") {
        if (this.userIsBotAdmin(reaction) || user.id === msg.author.id) {
          this.deleteMessages(msg.channel as TextChannel, ids);
        } else {
          reaction.users.remove(user);
        }
      } else {
        const roleToAssign = Utils.findRoleNameForReaction(reaction);
        if (roleToAssign) {
          this.updateEmbed(embed, user, roleToAssign);
          msg.edit(embed);
        }
      }
    });
    roleCollector.on("remove", (reaction, user) => {
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
    const embed = new MessageEmbed().setColor("#e6cc80");
    embed.setTimestamp();
    embed.setTitle(title);
    if (remark) {
      embed.setDescription("```" + remark + "```");
    } else {
      embed.setDescription(`*${this.motivationalDescription()}*`);
    }
    embed.addField("\u200B", "\u200B", true);
    if (tank === 1 || tank === undefined) {
      embed.addField(Utils.getEmoji("Tank"), "...");
    }
    if (heal === 1 || heal === undefined) {
      embed.addField(Utils.getEmoji("Healer"), "...");
    }
    dps = dps === undefined || dps > 3 ? 3 : dps;
    for (let i = 0; i < dps; i++) {
      embed.addField(Utils.getEmoji("Dps"), "...");
    }
    return embed;
  }

  // update existing embed (following a reaction change)
  private updateEmbed(
    embed: MessageEmbed,
    user: User,
    role: string,
    add = true
  ): void {
    if (!embed?.fields) return;
    const userTag = `<@${user.id}>`;
    // determine if the current user has already signed (only used for 'add' action)
    const signed = embed.fields.some((f) => f.value === userTag);
    // determine the fields we need based on the role/emoji
    const fields: EmbedField[] = embed.fields.filter(
      (f) => f.name === Utils.getEmoji(role)
    );

    // if the reaction is to "add" an unexisting signup
    if (add && !signed) {
      // find the first empty field
      let empField = fields.find((f) => f.value === "...");
      if (empField) {
        empField.value = userTag;
      }
    }
    // if the reaction is to "remove" an existing signup
    if (!add && signed) {
      // find the first field containing the user (there should actually only be one)
      let userField = fields.find((f) => f.value === userTag);
      if (userField) {
        userField.value = "...";
      }
    }
  }

  // close the embed message
  private closeEmbed(embed: MessageEmbed) {
    embed
      .setColor("#000")
      .setTitle(embed.title.replace("[LFG]", "[FULL]"))
      .setDescription("*Signups are closed*")
      .setFooter("Next time, be quicker to join a key, pleb!");
  }

  // delete the embed message
  private deleteMessages(channel: TextChannel, ids: string[]) {
    ids.forEach((i) => channel.messages.delete(i));
    // channel.messages.delete(ids[0]);
    //  .fetchMessage(lastmsg).then(msg => msg.delete());
  }

  private numberOrDefault(val: string, def: number): number {
    return isNaN(+val) ? def : +val;
  }

  private motivationalDescription(): string {
    const motivations = [
      "I'm sure it will go well...",
      "Remember, don't stand in bad shit!",
      "Who pulled that!!!",
      "God damnit, why did we get Wo relic...",
      "Skip that shit",
      "What are mechanics?",
      "Leeeeeeeeerooooooooy",
      "Just ... one ... more ...",
      "Do you neeeeed?",
      "Oops, wrong talents",
      "Oops, wrong gearset...",
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  private userIsBotAdmin(reaction: MessageReaction): boolean {
    const member = reaction.message.member;
    return Utils.isOfficer(member);
  }
}
