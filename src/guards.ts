import { Client, ArgsOf, GuardFunction } from "@typeit/discord";
import { Utils } from "./utils";

export const NotBot: GuardFunction<"message"> = async (
  [message],
  client,
  next
) => {
  if (!message.author.bot) {
    await next();
  }
};

export const NotHandled: GuardFunction<"message"> = async (
  [message],
  client,
  next
) => {
  const content = Utils.stripPrefix(message.content);
  const cmds = Client.getCommands();

  const found = cmds.some((c) => {
    const command = c.commandName.toString().toLocaleLowerCase();
    return command.startsWith(content.toLocaleLowerCase());
  });
  if (!found) {
    await next();
  }
};

export function HasPrefix(text: string) {
  const guard: GuardFunction<"message"> = async ([message], client, next) => {
    const startWith = message.content.startsWith(text);
    if (startWith) {
      await next();
    }
  };

  return guard;
}
