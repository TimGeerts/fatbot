import { MessageEmbed, Message, User, EmbedField } from "discord.js";
import { Command, CommandMessage, Description, Client } from "@typeit/discord";
import { Utils } from "../utils";

export abstract class Arena {
  private client: Client;

  @Command("arena :type :rating :healer")
  @Description("Displays a template for people to 'sign up' for arena games")
  async arena(command: CommandMessage, client: Client) {
    this.client = client;

    try {
      const helpEmbed = new MessageEmbed();
      let arenaEmbed = new MessageEmbed();
      if (!command.args.type && !command.args.rating) {
        helpEmbed
          .setColor("#007bff")
          .setTitle("Usage")
          .setDescription("Some example usages of the `?arena` command")
          .addField(
            "Syntax",
            "`?arena <type> <rating> <healer>`\n*(<healer> is optional but can be used to indicate you want at least one healer to sign)*"
          )
          .addField(
            "Looking for a dps partner in 2v2 (at 1400 rating)",
            "`?arena 2 1400`"
          )
          .addField(
            "Looking for a healer partner in 2v2 (at 1800 rating)",
            "`?arena 2 1800 healer`"
          )
          .addField(
            "Looking for one dps and one healer to fill your 3v3 game (at 1200 rating)",
            "`?arena 3 1200 healer`"
          );
        command.reply(helpEmbed);
      } else {
        const type = command.args.type;
        if (type !== 2 && type !== 3) {
          throw new Error(
            `The <type> parameter can only be 2 or 3 for arena games, not \`${type}\``
          );
        }
        const rating = command.args.rating;
        const needsHealer = command.args.healer;
        let missingRoles = [];
        if (type === 2) {
          if (needsHealer) {
            missingRoles.push("Healer");
          } else {
            missingRoles.push("Dps");
          }
        } else if (type === 3) {
          if (needsHealer) {
            missingRoles.push("Healer");
          }
          missingRoles.push("Dps");
        }
        if (!rating || isNaN(rating)) {
          throw new Error(
            `No rating requirement could be determined from the parameter \`${rating}\``
          );
        }
        arenaEmbed = this.createEmbed(command);
        const chan = command.channel;
        chan.send(Utils.getPingStringForRoles(missingRoles, command.guild));
        chan.send(arenaEmbed).then((m: Message) => {
          //change the author of the message to be the one that sent the command
          m.author = command.author;
          missingRoles.forEach((r) => {
            m.react(Utils.getEmojiForReaction(r));
          });
          m.react("🔒");
          this.followReactions(m, arenaEmbed);
        });
      }
    } catch (err) {
      command.reply(
        `Sorry, I had some trouble parsing that command.\n\n${err.message}`
      );
    }
  }

  // creates the reaction handlers ("on" and "remove")
  private followReactions(msg: Message, embed: MessageEmbed): void {
    const roleCollector = Utils.createRoleReactionCollector(msg);
    roleCollector.on("collect", (reaction, user) => {
      // check if the reaction was the "lock" icon
      if (reaction.emoji.name === "🔒") {
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
    const type = command.args.type === 2 ? "2v2" : "3v3";
    const rating = command.args.rating;
    const healer = command.args.healer;
    const embed = new MessageEmbed().setColor("#e6cc80");
    let nrOfDps = command.args.type === 2 ? 1 : 2;
    embed.setTitle(`[LFG] - ${type} Arena (${rating} rating preferred)`);
    if (healer) {
      embed.addField(Utils.getEmoji("Healer"), "...");
      nrOfDps--;
    }
    for (let i = 0; i < nrOfDps; i++) {
      embed.addField(Utils.getEmoji("Dps"), "...");
    }
    embed.setFooter("The rating is not a requirement but a preference!");
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
      .setFooter("Better luck next time!");
  }
}
