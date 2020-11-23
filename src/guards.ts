import { Client, ArgsOf, GuardFunction } from '@typeit/discord';
import { Utils } from './utils';

export const NotBot: GuardFunction<'message'> = async ([message], client, next) => {
  if (!message.author.bot) {
    await next();
  }
};

export const NotHandled: GuardFunction<'message'> = async ([message], client, next) => {
  const content = Utils.stripPrefix(message.content);
  const actualCommand = content.split(' ')[0];
  const existingCommands = Client.getCommands();

  const found = existingCommands.some((c) => {
    const command = c.commandName.toString().toLocaleLowerCase();
    console.log('existing command: ', command);
    console.log('message: ', content);
    return command.startsWith(actualCommand?.toLocaleLowerCase());
  });
  if (!found) {
    await next();
  }
};

export function HasPrefix(text: string) {
  const guard: GuardFunction<'message'> = async ([message], client, next) => {
    const startWith = message.content.startsWith(text);
    if (startWith) {
      await next();
    }
  };

  return guard;
}
