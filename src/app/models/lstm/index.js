import './tf.es2017.min.js';
import { OOV_INDEX, padSequences } from "./sequence_utils.js";
const tf = window.tf;

const HOSTED_URLS = {
  model: "https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json",
  metadata: "models/lstm/metadata.json"
};
const modelPath = 'indexeddb://cnn-sa';
const LOCAL_URLS = {
  model: "models/lstm/model.json",
  metadata: "models/lstm/metadata.json"
};
/**
 * Test whether a given URL is retrievable.
 */
async function urlExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (err) {
    return false;
  }
}

async function loadHostedPretrainedModel(url) {
  try {
    let model = null;
    try {
        model = await tf.loadLayersModel(modelPath);
    } catch (e) {
        console.log('Model not found in local storage');
        model = await tf.loadLayersModel(url);
        await model.save(modelPath);
    }
    // We can't load a model twice due to
    // https://github.com/tensorflow/tfjs/issues/34
    // Therefore we remove the load buttons to avoid user confusion.
    return model;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Load metadata file stored at a remote URL.
 *
 *
 * @return An object containing metadata as key-value pairs.
 */
async function loadHostedMetadata(url) {
  try {
    const metadataJson = await fetch(url);
    const metadata = await metadataJson.json();
    return metadata;
  } catch (err) {
    console.error(err);
  }
}

class SentimentPredictor {
  async init(urls) {
    this.urls = urls;
    this.model = await loadHostedPretrainedModel(urls.model);
    await this.loadMetadata();
    return this;
  }

  async loadMetadata() {
    const sentimentMetadata = await loadHostedMetadata(this.urls.metadata);

    this.indexFrom = sentimentMetadata["index_from"];
    this.maxLen = sentimentMetadata["max_len"];

    this.wordIndex = sentimentMetadata["word_index"];
    this.vocabularySize = sentimentMetadata["vocabulary_size"];
  }

  predict(text) {
    // Convert to lower case and remove all punctuations.
    const inputText = text
      .trim()
      .toLowerCase()
      .replace(/(\.|\,|\!)/g, "")
      .split(" ");

    // console.log(inputText);
    // Convert the words to a sequence of word indices.
    const sequence = inputText.map((word) => {
      let wordIndex = this.wordIndex[word] + this.indexFrom;
      // console.log(word, this.wordIndex[word], wordIndex);
      if (wordIndex > this.vocabularySize) {
        wordIndex = OOV_INDEX;
      }
      return wordIndex;
    });
    // Perform truncation and padding.
    const paddedSequence = padSequences([sequence], this.maxLen);
    // console.log("paddedSequence", paddedSequence);
    const input = tf.tensor2d(paddedSequence, [1, this.maxLen]);

    const beginMs = performance.now();
    const predictOut = this.model.predict(input);
    const score = predictOut.dataSync()[0];
    predictOut.dispose();
    const endMs = performance.now();

    return { score: score, elapsed: endMs - beginMs };
  }
}

/**
 * Loads the pretrained model and metadata, and registers the predict
 * function with the UI.
 */

export async function setupSentiment() {
//   if (await urlExists(LOCAL_URLS.model)) {
//     const predictor = await  new SentimentPredictor().init(LOCAL_URLS);
//     return predictor;
//   }

  if (await urlExists(HOSTED_URLS.model)) {
    const predictor = await new SentimentPredictor().init(HOSTED_URLS);
    return predictor;
  }

}
