import { persistent } from '../core/persistent';
import { csEmitter } from '../customvariables/emitter';

const old = new Map<string, any>();
const stats = persistent({
  value: {
    language:           'en',
    currentWatchedTime: 0,
    currentViewers:     0,
    maxViewers:         0,
    currentSubscribers: 0,
    currentBits:        0,
    currentTips:        0,
    currentFollowers:   0,
    currentGame:        null,
    currentTitle:       null,
    newChatters:        0,
    currentTags:        [],
  } as {
    language: string;
    currentWatchedTime: number;
    currentViewers: number;
    maxViewers: number;
    currentSubscribers: number;
    currentBits: number;
    currentTips: number;
    currentFollowers: number;
    currentGame: string | null;
    currentTitle: string | null;
    newChatters: number;
    currentTags?: string[];
  },
  name:      'stats',
  namespace: '/core/api',
  onChange:  (cur) => {
    const mapper = new Map<string, string>([
      ['currentGame', 'game'],
      ['language', 'language'],
      ['currentViewers', 'viewers'],
      ['currentFollowers', 'followers'],
      ['currentSubscribers', 'subscribers'],
      ['currentBits', 'bits'],
      ['currentTitle', 'title'],
      ['currentTags', 'tags'],
    ]);
    Object.keys(cur).forEach((key) => {
      const variable = mapper.get(key);
      if (variable) {
        if ((cur as any)[key] !== old.get(key)) {
          csEmitter.emit('variable-changed', variable);
        }
        old.set(key, (cur as any)[key]);
      }
    });
  },
});

export { stats };