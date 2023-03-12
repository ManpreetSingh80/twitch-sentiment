'use strict';

import lexicon from './lexicon.json' assert { type: 'json' };
import tokenize from './tokenizer.js';

const computeProbablitiy = (matrix) => matrix.reduce((a , c) => {
    a.negative *= c.negative;
    a.neutral *= c.neutral;
    a.positive *= c.positive;
    return a;
}, {negative: 1, neutral: 1, positive: 1});

function getSentiment({positive, neutral, negative}) {
    if (positive > neutral) {
        return positive > negative ? 1 : -1;
    } else {
        return neutral > negative ? 0 : -1;
    }
}

export function predict(text) {
    const tokens = tokenize(text, lexicon.emotes);
    const prob = [];
    let sentiment = 0;
    let inferred = false;
    let class_scores = [0.33, 0.34, 0.33];

    if(tokens.length) {
        for (const token of tokens) {
            if (token.endsWith('_NEG')) token = token.replace('_NEG', '');

            if (lexicon.lexica[token]) prob.push(lexicon.lexica[token]);
        }
    }

    if (prob.length) {
        // console.log(prob);
        const classProds = computeProbablitiy(prob);
        // console.log(classProds);
        sentiment = getSentiment(classProds);
        const sum = Object.values(classProds).reduce((a , c) => a + c);
        inferred = true;
        class_scores = [classProds.negative/sum, classProds.neutral/sum, classProds.positive/sum];
    }

    return {sentiment, inferred, score: {negative: class_scores[0].toFixed(2), neutral: class_scores[1].toFixed(2), positive: class_scores[2].toFixed(2)}};
}