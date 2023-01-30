/**
 * Wrapper for chrome messages
 *
 * {@link https://developer.chrome.com/extensions/messaging}
 *
 * @module chrome/msg
 */

/** */

import * as Analytics from './analytics.js';

/**
 * Chrome Messages
 */

export const TYPE = {
  /** highlight the options tab */
  HIGHLIGHT: {
    message: 'highlightTab'
  },

  /** restore default settings for app */
  RESTORE_DEFAULTS: {
    message: 'restoreDefaults'
  },

  /** save to some storage source failed because it would exceed capacity */
  STORAGE_EXCEEDED: {
    message: 'storageExceeded'
  },

  /** save value to local storage */
  STORE: {
    message: 'store',
    key: '',
    value: ''
  },

  /** Show screensaver */
  SS_SHOW: {
    message: 'showScreensaver'
  },

  /** Close screensaver */
  SS_CLOSE: {
    message: 'closeScreensaver'
  },

  /** Is a screensaver showing */
  SS_IS_SHOWING: {
    message: 'isScreensaverShowing'
  },

  ANALYTICS: {
    message: 'EVENT'
  }
};
/**
 * Send a chrome message
 *
 * @param type - type of message
 * @throws An error if we failed to connect to the extension
 * @returns Something that is json
 */

export async function send(type) {
  try {
    // TODO remove type cast if added
    // const resp = await browser.runtime.sendMessage(type);
    // console.log(resp, browser.runtime.lastError)
    // if(!resp) {
    //   throw new Error('Extension port closed');
    // }
    const resp = await window.browser.runtime.sendMessage(type);
    if(!resp) {
      throw new Error('Extension port closed');
    }
  } catch (err) {
    if (err.message && !err.message.includes('port closed') && !err.message.includes('Receiving end does not exist')) {
      const msg = `type: ${type.message}, ${err.message}`;
      Analytics.error(msg, 'Msg.send');
    }

    throw err;
  }
}
/**
 * Add a listener for chrome messages
 *
 * @param listener - function to receive messages
 */

export function addListener(listener) {
  window.browser.runtime.onMessage.addListener(listener);
}
/**
 * Remove a listener for chrome messages
 *
 * @param listener - function to receive messages
 */

export function removeListener(listener) {
  window.browser.runtime.onMessage.removeListener(listener);
}
