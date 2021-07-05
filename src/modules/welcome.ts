import { Client, On, ArgsOf } from '@typeit/discord';
import { MessageEmbed } from 'discord.js';

export abstract class Welcome {
  private defaultRoleGiven = 'Friend of the Eight Sin';
  private chooseRoleChannel = '<#774297748039532586>';
  private rulesChannel = '<#580734247963197450>';

  // will be executed only once, when the bot is started and ready
  @On('guildMemberAdd')
  // message parameter will always be an empty array here
  private onGuildMemberAdd([member]: ArgsOf<'guildMemberAdd'>, client: Client) {
    const welcomeEmbed = new MessageEmbed()
      .setColor(0x5512af)
      .setTitle(`Welcome to The Eighth Sin!`)
      .setDescription(
        `**Hello friend**
        
        *“You’re only given a little spark of madness. You mustn’t lose it.”*

        By joining our discord, you have been given the \`@${this.defaultRoleGiven}\` role so you can view and write in all the channels.
        
        **Roles**
        Make sure to go to the ${this.chooseRoleChannel} channel for aditional roles you wish to have. Remember that those roles can be used as 'pings' on this discord (so don't choose too many if you're alergic to pings :wink:)
        
        **Rules**
        Please go over the server rules in ${this.rulesChannel}
        

        **Thank you for choosing The Eight Sin, we're delighted that you have joined us!**`
      )
      .setThumbnail(
        'https://cdn.discordapp.com/icons/530132759210098690/fbd1d57562737104711c74ec7812eb50.png?size=128'
      );

    member.send(welcomeEmbed);
  }
}
