import { Command, CommandMessage, Description, Client } from "@typeit/discord";
import { MessageEmbed, TextChannel, User } from "discord.js";
import {
  clearKeystones,
  getDungeons,
  getKeystonePin,
  getKeystones,
  setKeystone,
} from "../services/resource.service";
import {
  IDungeon,
  IDungeonKeyStones,
  IStoredKeystone,
  IStoredMessage,
} from "../types";
import { Utils } from "../utils";

export abstract class KeyStone {
  @Command("keystone :action :dungeon :level :char")
  @Description(
    "Command to add or view available keystones for this reset.\nAutomatically resets on weekly reset."
  )
  async keystone(command: CommandMessage, client: Client) {
    const args = command.args;
    Utils.debug(`\`?keystone\` command executed`);
    Utils.debug(`args: \`${JSON.stringify(command.args)}\``);
    getDungeons()
      .then((dungeons: IDungeon[]) => {
        if (dungeons && dungeons.length) {
          const helpEmbed = new MessageEmbed();
          if (!Utils.hasParams(command)) {
            Utils.debug(
              "No parameters given for the `?keystone` command, showing documentation"
            );
            helpEmbed
              .setColor("#007bff")
              .setTitle("Usage")
              .setDescription("Some example usages of the `?keystone` command")
              .addField(
                "Basic syntax",
                "`?keystone <action> <dungeon> <level> <char>`"
              )
              .addField("Set a key", "`?keystone set MoTS 18`")
              .addField(
                "Set a key for a specific character (alt for instance)",
                "`?keystone set HoA 18 Chipstocks`"
              )
              .addField("List all keystones", "`?keystone list`");
            const dungeon_acronyms = dungeons
              .sort((a, b) => (a.name > b.name ? 1 : -1))
              .map((d) => `${d.name}: \`${d.tags[0]}\``);
            helpEmbed.addField("Dungeon acronyms", dungeon_acronyms.join("\n"));
            command.reply(helpEmbed);
          } else {
            // check the action
            Utils.debug(`Checking the action parameter`);
            switch (args.action) {
              case "set":
                Utils.debug(`Executing action \`${args.action}\``);
                if (!args.dungeon || !args.level) {
                  throw new Error(
                    `Can't set keystone with these parameters (\`${JSON.stringify(
                      args
                    )}\`).\nAre you sure you used the correct command (\`?keystone set <dungeon> <level> <char:optional>\`)?`
                  );
                }
                const realDungeon = dungeons.find(
                  (d) =>
                    d.tags
                      .map((t) => t.toLowerCase())
                      .indexOf(args.dungeon?.toLowerCase()) > -1
                );
                if (!realDungeon) {
                  throw new Error(
                    `No dungeon was found for the parameter  \`${args.dungeon}\``
                  );
                }
                this.setKeystone(
                  command.author,
                  realDungeon,
                  args.level,
                  args.char
                ).then((r) => {
                  let reply = ` your keystone \`${realDungeon.name} ${args.level}\` was successfully saved`;
                  if (args.char) {
                    reply += ` (for character: ${Utils.capFirst(args.char)})`;
                  }
                  reply += "!";
                  command.reply(reply);
                  this.updateKeystonePin(client, dungeons);
                });
                break;
              case "list":
                Utils.debug(`Executing action \`${args.action}\``);
                command.channel.send("Check the pins :pushpin:");
                break;
              case "clear":
                clearKeystones().then((r) => {
                  command.reply("All keystones successfully cleared.");
                  this.updateKeystonePin(client, dungeons);
                });
                break;
              default:
                throw new Error(
                  `Can't set keystone with these parameters (\`${JSON.stringify(
                    args
                  )}\`).\nAre you sure you used the correct command (\`?keystone set <dungeon> <level> <char:optional>\`)?`
                );
            }
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

  private setKeystone(
    user: User,
    dungeon: IDungeon,
    level: string,
    char: string = undefined
  ): Promise<any> {
    Utils.debug(`Setting keystone for ${user} to \`${dungeon.name} ${level}\``);
    return setKeystone(user.id, char, {
      userId: user.id,
      dungeon: dungeon.name,
      level,
      char,
    });
  }

  private createEmbed(
    list: IStoredKeystone[],
    dungeons: IDungeon[]
  ): MessageEmbed {
    const listEmbed = new MessageEmbed();
    const arr = Utils.objectToArray<IStoredKeystone>(list);
    let keystones = new Array<IDungeonKeyStones>();

    // prepare return object
    dungeons.forEach((d) => {
      keystones.push({
        dungeon: d.name,
        keystones: new Array<IStoredKeystone>(),
      });
    });
    arr.forEach((k) => {
      let item = keystones.find((ks) => ks.dungeon === k.dungeon);
      item.keystones.push(k);
      item.keystones = item.keystones.sort((a, b) =>
        a.level > b.level ? 1 : -1
      );
    });

    // create embed
    listEmbed.title = "Available keystones";
    keystones = keystones.sort((a, b) => (a.dungeon > b.dungeon ? 1 : -1));
    keystones.forEach((ks) => {
      if (ks.keystones && ks.keystones.length) {
        const keys = ks.keystones
          .map((x) => {
            let keystring = `+${x.level} <@${x.userId}>`;
            if (x.char) {
              keystring += ` (${Utils.capFirst(x.char)})`;
            }
            return keystring;
          })
          .join("\n");
        listEmbed.addField(ks.dungeon, keys);
      }
    });

    return listEmbed;
  }

  private updateKeystonePin(client: Client, dungeons: IDungeon[]): void {
    getKeystonePin()
      .then((msg: IStoredMessage) => {
        // check if there was a previous message we should track for reactions
        if (msg && msg?.channelId !== "-1" && msg?.messageId !== "-1") {
          const chan = client.channels.cache.get(msg.channelId) as TextChannel;
          if (chan) {
            chan.messages.fetch(msg.messageId).then((m) => {
              if (m) {
                getKeystones().then((keystones: IStoredKeystone[]) => {
                  if (keystones) {
                    const emb = this.createEmbed(keystones, dungeons);
                    m.edit(emb);
                  } else {
                    m.edit("No keystones available yet for this week.");
                  }
                });
              }
            });
          }
        } else {
          Utils.debug(
            `No previous keystone pin found, couldn't update the Message.`
          );
        }
      })
      .catch((err: Error) => {
        Utils.error(err.message);
      });
  }
}
