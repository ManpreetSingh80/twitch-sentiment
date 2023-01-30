import {setupSentiment} from './models/lstm/index.js';
import {predict} from './models/lexicon/index.js'

let predictor = null;
const lexiconSentiment = {1: 'POSITIVE', '-1': 'NEGATIVE', 0: 'NEUTRAL'};

function sentiment(score) {
    const sentimentValue = Math.floor(score* 100);
    if (sentimentValue > 70) return 'POSITIVE';
    else if (sentimentValue < 30) return 'NEGATIVE';
    else return 'NEUTRAL';
}

async function pustToStorage(key, item) {
    try {
        const result = await window.chrome.storage.local.get([key]);
        console.log(result);
        await chrome.storage.local.set({[key]: item});
    } catch (err) {
        console.error('Error in storing data', err);
    }

}

async function getSentiment(text) {
    try {
        let sent = null;
        if (!predictor) predictor = await setupSentiment();
        const lexiconPrediction = predict(text);
        // console.log('lexiconPrediction', lexiconPrediction);
        if (lexiconPrediction.inferred) {
           sent = lexiconSentiment[lexiconPrediction.sentiment];
        } else {
            const {score} = await predictor.predict(text);
            // console.log('sentiment', score);
            sent = sentiment(score);
        }

        return sent;
    } catch (err) {
        console.error('Error in sentiment prediction', err);
    }
}


window.chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // console.log('onMessage', request, sender);
        setupSentiment().then((res) => {
            predictor = res;
            sendResponse({success: true});
        });
        return true;
    });

window.chrome.runtime.onMessageExternal.addListener(
    async function(request, sender, sendResponse) {
        console.log(request, sender);
        try {
            const sentiment = await getSentiment(request.message);
            sendResponse(sentiment);
        } catch (err) {
            console.error('Error in getting sentiment value', err);
            sendResponse(lexiconSentiment['0']);
        } finally {
            return true;
        }
      
    }
);