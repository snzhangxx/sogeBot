import { In, Not } from 'typeorm';

import { AppDataSource } from '~/database';
import { User } from '~/database/entity/user';
import { getFunctionName } from '~/helpers/getFunctionName';
import { debug, error, isDebugEnabled, warning } from '~/helpers/log';
import { addUIError } from '~/helpers/panel/index';
import { setStatus } from '~/helpers/parser';
import * as changelog from '~/helpers/user/changelog.js';
import twitch from '~/services/twitch';
import { variables } from '~/watchers';

export async function getModerators(opts: { isWarned: boolean }) {
  if (isDebugEnabled('api.calls')) {
    debug('api.calls', new Error().stack);
  }
  try {
    const broadcasterId = variables.get('services.twitch.broadcasterId') as string;
    const botId = variables.get('services.twitch.botId') as string;
    const broadcasterCurrentScopes = variables.get('services.twitch.broadcasterCurrentScopes') as string[];

    if (!broadcasterCurrentScopes.includes('moderation:read')) {
      if (!opts.isWarned) {
        opts.isWarned = true;
        warning('Missing Broadcaster oAuth scope moderation:read to read channel moderators.');
        addUIError({ name: 'OAUTH', message: 'Missing Broadcaster oAuth scope moderation:read to read channel moderators.' });
      }
      return { state: false, opts };
    }

    const getModeratorsPaginated = await twitch.apiClient?.moderation.getModeratorsPaginated(broadcasterId).getAll();
    if (!getModeratorsPaginated) {
      return { state: false };
    }

    await changelog.flush();
    await AppDataSource.getRepository(User).update({ userId: Not(In(getModeratorsPaginated.map(o => o.userId))) }, { isModerator: false });
    await AppDataSource.getRepository(User).update({ userId: In(getModeratorsPaginated.map(o => o.userId)) }, { isModerator: true });

    setStatus('MOD', getModeratorsPaginated.map(o => o.userId).includes(botId));
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes('ETIMEDOUT')) {
        warning(`${getFunctionName()} => Connection to Twitch timed out. Will retry request.`);
        return { state: false }; // ignore etimedout error
      } else {
        error(`${getFunctionName()} => ${e.stack ?? e.message}`);
      }
    }
  }
  return { state: true };
}