/** Get the extension's name */
export function getExtensionName() {
    return `chrome-extension://${window.browser.runtime.id}`;
}
  /** Get the extension's version */
  
export function getVersion() {
    const manifest = window.browser.runtime.getManifest();
    return manifest.version;
}

export async function getbrowser() {
    // Opera 8.0+ (tested on Opera 42.0)
    const isOpera = (!!window.opr && !!window.opr.addons) || !!window.opera 
    || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+ (tested on Firefox 45 - 53)
    const isFirefox = typeof InstallTrigger !== 'undefined';

    // Internet Explorer 6-11
    //   Untested on IE (of course). Here because it shows some logic for isEdge.
    const isIE = /*@cc_on!@*/false || !!document.documentMode;

    // Edge 20+ (tested on Edge 38.14393.0.0)
    const isEdge = !isIE && !!window.StyleMedia;

    const isEdgeChromium = window.navigator.userAgent.toLowerCase().indexOf('edg') > -1;

    // Chrome 1+ (tested on Chrome 55.0.2883.87)
    // This does not work in an extension:
    //var isChrome = !!window.chrome && !!window.chrome.webstore;
    // The other window.browsers are trying to be more like Chrome, so picking
    // capabilities which are in Chrome, but not in others is a moving
    // target.  Just default to Chrome if none of the others is detected.
    const isChrome = !isOpera && !isFirefox && !isIE && !isEdge && !isEdgeChromium;

    // Blink engine detection (tested on Chrome 55.0.2883.87 and Opera 42.0)
    const isBlink = (isChrome || isOpera) && !!window.CSS;

    /* The above code is based on code from: https://stackoverflow.com/a/9851769/3773011 */

    const version = await getbrowserInfo() || getChromeVersion();
    if (isOpera) {
        return 'Opera::' + version;
    } else if(isFirefox) {
        return 'Firefox::' + version;
    } else if(isEdge) {
        return 'Edge::' + version;
    } else if(isEdgeChromium) {
      return 'Edge::' + version;
    } else if(isChrome) {
        return 'Chrome::' + version;
    } else if(isBlink) {
        return 'Blink::' + version;
    } else {
        return 'Unknown::' + version;
    }

}

/**
 * Get the full Chrome version
 * {@link https://goo.gl/2ITMNO}
 *
 * @returns Chrome version
 */

export function getFullChromeVersion() {
    const raw = navigator.userAgent;
    return raw ? raw : 'Unknown';
  }
  /** Get the OS as a human readable string */
  
  export async function getPlatformOS() {
    let output = 'Unknown';
  
    try {
      const info = await window.browser.runtime.getPlatformInfo();
      const os = info.os;
  
      switch (os) {
        case 'win':
          output = 'MS Windows';
          break;
  
        case 'mac':
          output = 'Mac';
          break;
  
        case 'android':
          output = 'Android';
          break;
  
        case 'cros':
          output = 'Chrome OS';
          break;
  
        case 'linux':
          output = 'Linux';
          break;
  
        case 'openbsd':
          output = 'OpenBSD';
          break;
  
        default:
          break;
      }
    } catch (err) {// something went wrong - linux seems to fail this call sometimes
    }
  
    return output;
  }
  /** Determine if we are MS windows */
  
  export function isWindows() {
    return isOS('win');
  }
  /** Determine if we are Chrome OS */
  
  export function isChromeOS() {
    return isOS('cros');
  }
  /** Determine if we are Mac */
  
  export function isMac() {
    return isOS('mac');
  }

  /**
 * Determine if we are a given operating system
 *
 * @param os - os short name
 * @returns true if the given os
 */

async function isOS(os) {
    try {
      const info = await window.browser.runtime.getPlatformInfo();
      return info.os === os;
    } catch (err) {
      // something went wrong - linux seems to fail this call sometimes
      return false;
    }
  }

export async function getbrowserInfo() {
    let version = '';
    try {
        if (window.browser.runtime.getBrowserInfo) {
          ({version} = await window.browser.runtime.getBrowserInfo());
          return version;
        }
    } catch(err) {
        return version;
    }
}

/**
 * Get the Chrome version
 * {@link http://stackoverflow.com/a/4900484/4468645}
 *
 * @returns Chrome major version
 */

export function getChromeVersion() {
  const raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
  return raw ? parseInt(raw[2], 10) : 0;
}

export function getBrowserAcceptedLangs() {
  return window.browser.i18n.getAcceptLanguages();
}