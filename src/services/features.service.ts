export const featFlags = {
  twitch: false,
};

// generic getter
export const getFlag = (name: string): boolean => {
  return (featFlags[name] ?? false) as boolean;
};

// generic setter
export const setFlag = (name: string, value: boolean): void => {
  featFlags[name] = value as boolean;
};

// shorthand getters
export const twitchFlag = (): boolean => {
  return getFlag('twitch');
};
