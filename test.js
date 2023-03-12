// import {setupSentiment} from './src/app/models/lstm/index.js';
import {predict} from './src/app/models/lexicon/index.js';
import {writeFileSync, readFileSync} from 'fs'
import Papa from 'papaparse';
// let predictor = null;

const getFile = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').toString();
const getCSV = (path) => Papa.parse(getFile(path), {header: true});

// async function getSentiment(text) {
//     try {
//         if (!predictor) {
//             predictor = {};
//             predictor.cnn = await setupSentiment('cnn');
//             predictor.lstm = await setupSentiment('lstm');
//         }
//         const lexiconPrediction = predict(text);
//         const [cnn, lstm] = await Promise.all([predictor.cnn.predict(text), predictor.lstm.predict(text)]);

//         return {cnn_sentiment: cnn.score, lstm_sentiment: lstm.score, inferred: lexiconPrediction.inferred, lx_sentiment: lexiconPrediction.sentiment};
//     } catch (err) {
//         console.error('Error in sentiment prediction', err);
//     }
// }

const accuracy = (dataset, actualColumnName, predictedCloumnName) => {
    let correct = 0;
    let total = 0;
    for (const row of dataset) {
        if (row[actualColumnName] == row[predictedCloumnName]) correct += 1;
        total += 1;
    }

    return correct/total;
}

function sum(matrix, keys) {
    return keys.reduce((a, c) => a+=matrix[c], 0);
}

function evaluateModel(dataset, actualColumnName, predictedCloumnName, pos, neg, neu) {
    const confusionMatrix = {
        TPos: 0,
        FNeg1: 0,
        FNeu1: 0,
        FPos1: 0,
        TNeg: 0,
        FNeu2: 0,
        FPos2: 0,
        FNeg2: 0,
        TNeu: 0
    };
    for (const row of dataset) {
        const actual = row[actualColumnName];
        const predicted = row[predictedCloumnName];
        if (actual == pos) {
            if (predicted == pos) confusionMatrix.TPos++;
            else if (predicted == neg) confusionMatrix.FNeg1++;
            else if (predicted == neu) confusionMatrix.FNeu1++;
        } else if (actual == neg) {
            if (predicted == pos) confusionMatrix.FPos1++;
            else if (predicted == neg) confusionMatrix.TNeg++;
            else if (predicted == neu) confusionMatrix.FNeu2++;
        } else if (actual == neu) {
            if (predicted == pos) confusionMatrix.FPos2++;
            else if (predicted == neg) confusionMatrix.FNeg2++;
            else if (predicted == neu) confusionMatrix.TNeu++;
        }
    }
    console.log('Confusion Matrix', confusionMatrix);

    const accuracy = sum(confusionMatrix, ['TPos', 'TNeg', 'TNeu'])/sum(confusionMatrix, Object.keys(confusionMatrix));
    console.log('Accuracy', accuracy.toFixed(3));

    const precisionPos = confusionMatrix.TPos/sum(confusionMatrix, ['TPos', 'FPos1', 'FPos2']);
    const precisionNeg = confusionMatrix.TNeg/sum(confusionMatrix, ['TNeg', 'FNeg1', 'FNeg2']);
    const precisionNeu = confusionMatrix.TNeu/sum(confusionMatrix, ['TNeu', 'FNeu1', 'FNeu2']);
    const precisionAvg = (precisionPos + precisionNeg + precisionNeu)/3;

    console.log('Precision (Positive)', precisionPos.toFixed(3));
    console.log('Precision (Negative)', precisionNeg.toFixed(3));
    console.log('Precision (Neutral)', precisionNeu.toFixed(3));
    console.log('Precision (Average)', precisionAvg.toFixed(3));

    const recallPos = confusionMatrix.TPos/sum(confusionMatrix, ['TPos', 'FNeg1', 'FNeu1']);
    const recallNeg = confusionMatrix.TNeg/sum(confusionMatrix, ['TNeg', 'FPos1', 'FNeu2']);
    const recallNeu = confusionMatrix.TNeu/sum(confusionMatrix, ['TNeu', 'FPos2', 'FNeg2']);
    const recallAvg = (recallPos + recallNeg + recallNeu)/3;

    console.log('Recall (Positive)', recallPos.toFixed(3));
    console.log('Recall (Negative)', recallNeg.toFixed(3));
    console.log('Recall (Neutral)', recallNeu.toFixed(3));
    console.log('Recall (Average)', recallAvg.toFixed(3));

    const f1 = (precision, recall) => 2*((precision*recall)/(precision+recall));

    const f1Pos = f1(precisionPos, recallPos);
    const f1Neg = f1(precisionNeg, recallNeg);
    const f1Neu = f1(precisionNeu, recallNeu);
    const f1Avg = (f1Pos+f1Neg+f1Neu)/3;

    console.log('F1 (Positive)', f1Pos.toFixed(3));
    console.log('F1 (Negative)', f1Neg.toFixed(3));
    console.log('F1 (Neutral)', f1Neu.toFixed(3));
    console.log('F1 (Average)', f1Avg.toFixed(3));
}


function test() {
    const csv = getCSV('labeled_dataset.csv');
    const {data} = csv;
    
    const output = [];
    for (const index in data) {
        const item = data[index];
        const sentimentData = predict(item.message);
        output.push({message: item.message, sentiment: item.sentiment, predicted: sentimentData.sentiment});
    }

    evaluateModel(output, 'sentiment', 'predicted', 1, -1, 0)
}

(async () => {
    test();
    // console.log(predict('FeelsOkayMan 🔫'));
    // await writeFile('blizzcon_lstm.csv', Papa.unparse(output));
    // writeFileSync('temp.csv', Papa.unparse(output));
    
})();