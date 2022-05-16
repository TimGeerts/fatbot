import { GuardFunction } from '@typeit/discord';

export const NotThy: GuardFunction<'message'> = async ([message], client, next) => {
  if (process.env.THYMODE === 'true' && message.author.id === '196296911278309376') {
    message.channel.send('Nodody cares Thy!');
    message.channel.send('¯\\_(ツ)_/¯');
  } else {
    await next();
  }
};

// Thy: '196296911278309376'
// Me (test discord): '186929294470152192'
