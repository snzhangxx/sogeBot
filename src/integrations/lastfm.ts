import { MINUTE } from '@sogebot/ui-helpers/constants';
import axios from 'axios';

import { settings } from '../decorators';
import { onChange, onStartup } from '../decorators/on';
import Integration from './_interface';

import { announce, prepare } from '~/helpers/commons';
import {  error } from '~/helpers/log';

let canSendRequests = true;

class LastFM extends Integration {
  @settings()
    apiKey = '';

  @settings()
    username = '';

  @settings()
    notify = false;

  currentSong: null | string = null;

  @onStartup()
  onStartup() {
    setInterval(() => {
      this.fetchData();
    }, 5000);
  }

  @onChange('username')
  @onChange('apiKey')
  reEnableAfterFail() {
    canSendRequests = true;
  }

  async notifySong (song: string) {
    announce(prepare('integrations.lastfm.current-song-changed', { name: song }), 'songs');
  }

  async fetchData() {
    if (this.enabled && canSendRequests) {
      try {
        const response = await axios.get<any>(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${this.username}&api_key=${this.apiKey}&format=json`);
        const tracks = response.data.recenttracks.track;

        for (const track of tracks) {
          if (track['@attr'] && track['@attr'].nowplaying === 'true') {
            const song = `${track.name} - ${track.artist['#text']}`;
            if (this.currentSong !== song && this.notify) {
              this.notifySong(song);
            }
            this.currentSong = song;
          }
        }
      } catch(e: any) {
        if (e.isAxiosError) {
          if (e.response.data.error === 10) {
            error('LAST.FM: Invalid API key - You must be granted a valid key by last.fm');
            canSendRequests = false;
          } else if (e.response.data.error === 26) {
            error('LAST.FM: Suspended API key - Access for your account has been suspended, please contact Last.fm');
            canSendRequests = false;
          } else if (e.response.data.error === 29) {
            error('LAST.FM: Rate limit exceeded, waiting 5 minutes');
            canSendRequests = false;
            setTimeout(() => canSendRequests = true, 5 * MINUTE);
          } else {
            error('LAST.FM: ' + e.response.data.message + ' | Error no. ' + e.response.data.error);
          }
        } else {
          error('LAST.FM: ' + e.stack);
        }
      }
    }
  }
}

const self = new LastFM();
export default self;
