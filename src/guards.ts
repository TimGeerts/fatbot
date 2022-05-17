import { Client, GuardFunction } from "@typeit/discord";
import { Utils } from "./utils";

export const NotThy: GuardFunction<"message"> = async (
  [message],
  client,
  next
) => {
  if (
    process.env.THYMODE === "true" &&
    message.author.id === "196296911278309376"
  ) {
    message.channel.send("Nodody cares Thy!");
    message.channel.send("¯\\_(ツ)_/¯");
  } else {
    await next();
  }
};

// Thy: '196296911278309376'
// Me (test discord): '186929294470152192'

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
  const actualCommand = content.split(" ")[0];
  const existingCommands = Client.getCommands();

  const found = existingCommands.some((c) => {
    const command = c.commandName.toString().toLocaleLowerCase();
    return command.startsWith(actualCommand?.toLocaleLowerCase());
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
