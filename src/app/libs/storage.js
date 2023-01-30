export async function get(key = null) {
    try {
        const value = await window.browser.storage.local.get(key);
        return value;
    } catch(err) {
        console.error(err)
        throw err;
    }
    
}

export function set(item) {
    return window.browser.storage.local.set(item);
}

export const remove = key => window.browser.storage.local.remove(key);
export const clear = () => window.browser.storage.local.clear();