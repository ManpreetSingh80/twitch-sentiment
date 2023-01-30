import * as Msg from './msg.js';
import * as Log from './log.js';

/** Permission for Chrome running in background */

export const BACKGROUND = {
    name: 'permBackground',
    permissions: ['background'],
    origins: []
};

/**
 * Request optional permission
 *
 * @param type - permission type
 * @throws An error if request failed
 * @returns true if permission granted
 */
/**
 * Determine if we have an optional permission
 *
 * @param type - permission type
 * @throws An error if failed to get status
 * @returns true if we have the permission
 */


async function contains(type) {
    return await window.browser.permissions.contains({
        permissions: type.permissions,
        origins: type.origins
    });
}

export async function request(type) {
    let granted = false;
    const permissions = {
        permissions: type.permissions,
        origins: type.origins
    };

    try {
        console.log('requesting permission', type);
        const hasPermission = await contains(permissions);
        console.log('hasPermission', hasPermission);
        if (!hasPermission) {
            granted = await window.browser.permissions.request(permissions);
            console.log('granted?', granted);
            if (granted) {
                Msg.send({message: 'EVENT', event: 'PERMISSION', label: type.name, action: 'granted'});
                // Analytics.event(Analytics.EVENT.PERMISSION, type.name, 'granted');
            } else {
                Msg.send({message: 'EVENT', event: 'PERMISSION', label: type.name, action: 'denied'})
                // Analytics.event(Analytics.EVENT.PERMISSION, type.name, 'denied');
            }

        } else {
            console.log('already have permission');
            granted = true;;
        }
    } catch (err) {
        console.error(err);
        Log.error(err.message, 'Permission.request');
        throw err;
    }

    return granted;
}

/**
 * Remove an optional permission
 *
 * @remarks
 * Chrome doesn't actually remove an optional permission once it has been granted
 *
 * @param type - permission type
 * @throws An error if failed to remove
 * @returns true if removed
 */

export async function remove(type) {
    let removed = false;
    const hasPermission = await contains(type);

    if (hasPermission) {
        console.log('removing permission', type);
        const args = {
            permissions: type.permissions,
            origins: type.origins
        };
        removed = await window.browser.permissions.remove(args);
        Msg.send({message: 'EVENT', event: 'PERMISSION', label: type.name, action: 'removed'})
    } else {
        console.log('permission already removed');
        removed = true;
    }

    return removed;
}

export async function isPermissionAvailable(permission) {
    let available = true;

    try {
        await window.browser.permissions.contains(permission);
    } catch (err) {
        available = false;
        console.log(err);
    }

    return available;
}