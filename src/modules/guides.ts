import { MessageEmbed } from 'discord.js';
import { Command, CommandMessage, Description } from '@typeit/discord';
import { Utils } from '../utils';
import { getGuides } from '../services/resource.service';
import { IGuide } from '../types';

export abstract class Guides {
  private allGuides: IGuide[];

  @Command('guide :param')
  @Description('Lists raid guides (written and/or youtube) for the chosen boss encounter')
  async guides(command: CommandMessage) {
    getGuides()
      .then((g: IGuide[]) => {
        if (g && g.length) {
          this.allGuides = g;
        } else {
          throw new Error('No guides were found');
        }
      })
      .then(() => {
        if (!Utils.hasParams(command)) {
          // no params, so list out all available guides
          command.reply(this.replyGuideList());
        } else {
          // request for a specific guide
          const specific = command.args.param.toString().toLocaleLowerCase();
          command.reply(this.replyGuide(specific));
        }
      })
      .catch((err: Error) => {
        command.reply(`Sorry, I had some trouble fetching that information.\n\n${err.message}`);
      });
  }

  private replyGuideList(): MessageEmbed {
    const embed = new MessageEmbed()
      .setColor(0xd82428)
      .setTitle(`Castle Nathria - guides`)
      .setDescription(
        'Castle Nathria is a gothic-style castle towering strong above the rest of Revendreth. The castle entrance is located in the center area of Revendreth, with the closest flight path currently available being the one by Menagerie of the Master.\n\nCastle Nathria will have 10 boss encounters in the raid, guides for these encounters can be viewed by using one of the commands below.'
      )
      .setThumbnail('https://wow.zamimg.com/uploads/guide/header/10246.jpg')
      .addField('Weakauras', 'https://wago.io/slraid1');
    const bosses = this.allGuides.map((g) => {
      if (g.tags && g.tags.length) {
        return `${g.name} - \`?guide ${g.tags[0]}\``;
      }
    });
    embed.addField('Guides', bosses);
    return embed;
  }

  private replyGuide(g: string): MessageEmbed {
    const guide = this.allGuides.find((b) => b.tags.map((l) => l.toLowerCase()).indexOf(g.toLowerCase()) > -1);
    const embed = new MessageEmbed().setColor(0xd82428).setTitle(`__${guide.name} Mythic - ${guide.raid}__`);
    if (guide.thumbnail) {
      embed.setThumbnail(guide.thumbnail);
    }
    if (guide.description) {
      embed.setDescription(guide.description);
    }
    if (guide.wowhead) {
      embed.addField('Wowhead', guide.wowhead, true);
    }
    if (guide.youtube) {
      embed.addField('Youtube', guide.youtube);
    }
    if (guide.extra && guide.extra.length) {
      guide.extra.forEach((e) => {
        embed.addField(e.name, e.content);
      });
    }
    return embed;
  }
}
