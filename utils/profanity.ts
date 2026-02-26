// src/utils/profanity.ts

const PROFANITY_LIST = [
  "anal", "anus", "arse", "ass", "asshat", "asshole", "asswipe", "bastard", 
  "bitch", "bitchy", "blowjob", "bollocks", "boob", "boobs", "bugger", 
  "bullshit", "butthole", "chink", "clit", "clitoris", "cock", "cocksucker", 
  "coon", "crap", "craphead", "crapper", "cum", "cumshot", "cunt", "damn", 
  "dick", "dickhead", "dildo", "dumbass", "dyke", "fag", "faggot", "felching", 
  "fellate", "fellatio", "flamer", "fuck", "fucker", "fuckface", "fucking", 
  "fuckwad", "fuckwit", "goddamn", "gook", "hell", "hoe", "homo", "hore", 
  "jackass", "jap", "jerk", "jizz", "kike", "lesbian", "macaca", "masturbate", 
  "motherfucker", "muff", "nazi", "nigg", "nigga", "nigger", "pecker", "penis", 
  "piss", "pissed", "pisser", "poon", "poop", "porn", "prick", "pussy", "queer", 
  "rape", "rectum", "retard", "schlong", "scrotum", "shag", "shit", "shithead", 
  "shitty", "skank", "slut", "smut", "snatch", "spic", "testicle", "tit", 
  "tits", "titties", "titty", "turd", "twat", "vagina", "wank", "wanker", 
  "wetback", "whore", "wtf"
];

/**
 * Checks if the text contains any matches of words in the profanity list.
 * Note: Following Fix #2, this is no longer used to block transactions,
 * but can still be used for UI warnings if desired.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  return PROFANITY_LIST.some(word => lowerText.includes(word));
}

/**
 * Replaces exact matches of profanity with asterisks of the same length.
 * Only processes if the filter is currently enabled by the user (Fix #2).
 */
export function censorText(text: string, isEnabled: boolean): string {
  if (!text || !isEnabled) return text;
  
  let censored = text;
  
  // Sort descending by length so compound words like "bullshit" are 
  // processed before their roots ("shit") to prevent double-masking errors.
  const sortedList = [...PROFANITY_LIST].sort((a, b) => b.length - a.length);

  sortedList.forEach(word => {
    // case-insensitive global replacement
    const regex = new RegExp(word, 'gi');
    censored = censored.replace(regex, match => '*'.repeat(match.length));
  });

  return censored;
}