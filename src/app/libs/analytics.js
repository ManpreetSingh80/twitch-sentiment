/* eslint-disable no-unused-expressions */
import { DEBUG } from "../config.js";
import {getbrowser} from './utils.js';

let GA_TRACKING_ID = '';
let GA_CLIENT_ID = '';
let APP_NAME = '';
let APP_ID = '';
let APP_VERSION = '';

export const EVENT = {
  /** Extension installed */
  INSTALLED: {
    eventCategory: "extension",
    eventAction: "installed",
    eventLabel: "",
  },
  PERMISSION: {
    eventCategory: "permission",
    eventAction: "background",
    eventLabel: "",
  },

  /** Extension updated */
  UPDATED: {
    eventCategory: "extension",
    eventAction: "updated",
    eventLabel: "",
  },
  /** Toggle state changed */
  TOGGLE: {
    eventCategory: 'ui',
    eventAction: 'toggle',
    eventLabel: ''
  },

  /** Url link clicked */
  LINK: {
    eventCategory: 'ui',
    eventAction: 'linkSelect',
    eventLabel: ''
  },
  /** Text changed */
  TEXT: {
    eventCategory: 'ui',
    eventAction: 'textChanged',
    eventLabel: ''
  },
  /** Button clicked */
  BUTTON: {
    eventCategory: 'ui',
    eventAction: 'buttonClicked',
    eventLabel: ''
  },

  /** Radio button clicked */
  RADIO_BUTTON: {
    eventCategory: 'ui',
    eventAction: 'radioButtonClicked',
    eventLabel: ''
  },
};

export async function initialize(trackingId, appName, appId, appVersion) {
  const platform = (await getbrowser()).split('::')[0];
  if (platform.toLowerCase() === 'firefox') {
    console.log('dont load GA');
    GA_TRACKING_ID = trackingId;
    APP_NAME = appName;
    APP_ID = appId;
    APP_VERSION = appVersion;
  } else {
    // Standard Google Universal Analytics code
    // @ts-ignore
    (function (i, s, o, g, r, a, m) {
      i["GoogleAnalyticsObject"] = r;
      (i[r] =
        i[r] ||
        function () {
          (i[r].q = i[r].q || []).push(arguments);
        }),
        (i[r].l = 1 * new Date());
      (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
      a.async = 1;
      a.src = g;
      m.parentNode.insertBefore(a, m);
    })(window, document, "script", "https://www.google-analytics.com/analytics.js", "ga");

    window.ga("create", trackingId, "auto"); // see: http://stackoverflow.com/a/22152353/1958200

    window.ga("set", "checkProtocolTask", function () {});
    window.ga("set", "appName", appName);
    window.ga("set", "appId", appId);
    window.ga("set", "appVersion", appVersion);
    window.ga("require", "displayfeatures");
    console.log('ga inittialized', window.ga);
  }
  
}
/**
 * Send a page
 *
 * @param url - page path
 */
export function page(url) {
  console.log('page event', url, DEBUG);
  if (url) {
    if (!DEBUG) {
      if (GA_TRACKING_ID && GA_CLIENT_ID) {
        /*try {
          let request = new XMLHttpRequest();
          let message =
            "v=1&tid=" + 'UA-111203315-5' + "&cid= " + '555' + "&aip=1" +
            "&ds=add-on&t=pageview&dp=" + url;
    
          request.open("POST", "https://www.google-analytics.com/collect", true);
          request.send(message);
        } catch (err) {
          console.error('Error in sending analytics event', err);
        }*/
      } else {
        try {
          window.ga("send", "pageview", url);
        } catch (err) {}
      }      
    }
  }
}
/**
 * Send an event
 *
 * @param ev - the event type
 * @param label - override label
 * @param action - override action
 */

export function event(ev, label, action) {
  const theEvent = {
    hitType: "event",
    eventCategory: ev.eventCategory,
    eventAction: action ? action : ev.eventAction,
    eventLabel: label ? label : ev.eventLabel,
  };
  console.log('event', theEvent);

  if (!DEBUG) {
    if (GA_TRACKING_ID && GA_CLIENT_ID) {
     /* try {
        let request = new XMLHttpRequest();
        let message =
          "v=1&tid=" + GA_TRACKING_ID + "&cid= " + '555' + "&aip=1" +
          "&ds=add-on&t=event&ec=" + theEvent.eventCategory + "&ea=" + theEvent.eventAction + "&el=" + theEvent.eventLabel;
  
        request.open("POST", "https://www.google-analytics.com/collect", true);
        request.send(message);
      } catch (err) {
        console.error('Error in sending analytics event', err);
      }*/
    } else {
      try {window.ga("send", theEvent);} catch (err) {};
      
    }
  } else {
    console.log(theEvent); // tslint:disable-line no-console
  }
}
/**
 * Send an error
 *
 * @param label - override label
 * @param method - override method
 */

export function error(label = "unknown", method = "unknownMethod") {
  const ev = {
    hitType: "event",
    eventCategory: "error",
    eventAction: method,
    eventLabel: `Err: ${label}`,
  };

  if (!DEBUG) {
    try {window.ga("send", ev);} catch (err) {};
  } else {
    console.error(ev); // tslint:disable-line no-console
  }
}
/**
 * Send an exception
 *
 * @param err - the error
 * @param msg - the error message
 * @param fatal - true if fatal
 */

export function exception(err, msg, fatal) {
  try {
    const theFatal = fatal === undefined ? false : fatal;
    let theMsg = "Unknown";

    if (msg) {
      theMsg = msg;
    } else if (err && err.message) {
      theMsg = err.message;
    }

    if (err && err.stack) {
      theMsg += `\n\n${err.stack}`;
    }

    const ex = {
      hitType: "exception",
      exDescription: theMsg,
      exFatal: theFatal,
    };

    if (!DEBUG) {
      try {window.ga("send", ex);} catch (err) {};
    } else {
      console.error(ex); // tslint:disable-line no-console
    }
  } catch (err) {
    if (DEBUG) {
      console.error(err); // tslint:disable-line no-console
    }
  }
}
