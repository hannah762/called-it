// Coin economy
export const STARTING_BALANCE = 500;
export const DAILY_BONUS = 25;
export const PARTICIPATION_BONUS = 10;
export const CREATION_BONUS = 50; // when bet gets 3+ participants
export const STREAK_BONUS = 100;
export const INVITE_BONUS = 50;
export const BAILOUT_AMOUNT = 100;

// Wager limits
export const MIN_WAGER = 10;
export const MAX_WAGER = 200;
export const FIXED_WAGER = 50; // flat amount per vote

// Bet rules
export const MIN_OPTIONS = 2; // custom options (wild card is always added)
export const MAX_OPTIONS = 5; // custom options
export const MAX_QUESTION_LENGTH = 150;
export const MAX_OPTION_LENGTH = 60;
export const MIN_DEADLINE_MINUTES = 5;
export const MAX_DEADLINE_DAYS = 30;

// Resolution
export const RESOLUTION_REMINDER_HOURS = [1, 24, 48];
export const AUTO_EXPIRE_HOURS = 72;
export const CREATOR_ABANDON_PENALTY = 50;

// Join codes
export const JOIN_CODE_LENGTH = 6;
