import {setupSentiment} from './models/lstm/index.js';
import {predict} from './models/lexicon/index.js'

let predictor = null;

function sentiment(score) {
    const sentimentValue = Math.floor(score* 100);
    if (sentimentValue > 70) return 1;
    else if (sentimentValue < 30) return 0;
    else return -1;
}

async function getItem(keys = []) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            resolve(result);
        })
    })
}

async function setItem(key, item) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({[key]: item}, (result) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            resolve(result);
        })
    })
}

async function pustToStorage(storageItem) {
    try {
        let key = `${storageItem.metadata.channelName}#${storageItem.metadata.type}`;
        if (storageItem.metadata.type === 'VOD') {
            key += `#${storageItem.metadata.videoId}`;
        }
        const result = await getItem([key]);
        let item = null;
        if (result[key]) {
            item = result[key];
        } else {
            item = {metadata: {...storageItem.metadata, start: storageItem.item.start}, items: []}
        }
        item.metadata.end = storageItem.item.end;
        item.metadata.profilePic = storageItem.metadata.profilePic;
        item.metadata.title = storageItem.metadata.title;
        item.items.push({...storageItem.item, title: storageItem.metadata.title});
        const index = item.items.length-1;
        console.log(result);
        await setItem(key, item);
        return index;
    } catch (err) {
        console.error('Error in storing data', err);
    }

}

async function getSentiment(text) {
    try {
        let sent = null;
        // if (!predictor) predictor = await setupSentiment();
        const lexiconPrediction = predict(text);
        // console.log('lexiconPrediction', lexiconPrediction);
        // if (lexiconPrediction.inferred) {
           sent = lexiconPrediction.sentiment;
        // } else {
        //     const {score} = await predictor.predict(text);
        //     // console.log('sentiment', score);
        //     sent = sentiment(score);
        // }

        return sent;
    } catch (err) {
        console.error('Error in sentiment prediction', err);
    }
}


window.chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    // console.log('onMessage', request, sender);
    // if (!predictor) predictor = await setupSentiment();
        sendResponse({success: true});
        return true;
});

window.chrome.runtime.onMessageExternal.addListener(
    async function(request, sender, sendResponse) {
        console.log(request, sender);
        if (request.type === 'GET-SA') {
            try {
                const sentiment = await getSentiment(request.message);
                sendResponse(sentiment);
            } catch (err) {
                console.error('Error in getting sentiment value', err);
                sendResponse(0);
            } finally {
                return true;
            }
        } else if (request.type === 'STORE-SA') {
            try {
                const index = await pustToStorage(request.dataToStore);
                sendResponse(index);
            } catch (err) {
                console.error('Error in storing sentiment value', err);
            } finally {
                return true;
            }
        } else if (request.type === 'OPENURL') {
            chrome.tabs.create({url: request.url});
        } else return true;
    }
);

window.chrome.pageAction.onClicked.addListener((tab) => {
    console.log("open options page");
    window.chrome.runtime.openOptionsPage();
});