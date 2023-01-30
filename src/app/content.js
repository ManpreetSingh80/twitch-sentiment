let injected = false;
let loadedBS = false;

async function init() {
    try {
        console.log(chrome.runtime);
        console.log('loading');
        if (loadedBS) {
            inject();
            return;
        }
        loadedBS = true;
        // load cnn model
        // predictor = await setupSentiment();
        
        // innject script to twitch.tv
        
        const response = window.chrome.runtime.sendMessage({init: true});
        if (response.success) {
            inject();
        } else {
            throw new Error('Failed to initialize model');
        }
        // inject();

        // window.chrome.runtime.onMessageExternal.addListener(
        //     function(request, sender, sendResponse) {
        //         console.log(request, sender);
        //       getSentiment(request.message).then(sendResponse);
        //       return true;
        //     }
        // );
        
        // setTimeout(() => inject(), 500);
        
    } catch (err) {
        console.error(err);
        setTimeout(() => init(), 2000);
    }
    
}



(() => {
    
    window.addEventListener('onbeforeunload', (event) => {
        console.log('unload content script', event)
        window.chrome.runtime.sendMessage({event: 'unload'});
    })
})();
init();


function inject() {
    if (injected) {
        return;
    }
    if (!!document.querySelector('script#sa')) {
        return;
    }

    injected = true;
    const script = document.createElement('script');
    // const style = document.createElement('link');
    // style.rel = 'stylesheet';
    // style.type = 'text/css';
    // style.href = chrome.runtime.getURL('styles/Style.css');
    // style.setAttribute('charset', 'utf-8');
    // style.setAttribute('content', 'text/html');
    // style.setAttribute('http-equiv', 'content-type');
    script.src = window.chrome.runtime.getURL(`twitch.js`);
    script.id = 'sa';
    script.onload = () => {
        console.info(`Injected into twitch`);
        window.dispatchEvent(new CustomEvent('SA', {detail: {extensionId: window.chrome.runtime.id}}));
    };

    (document.head ?? document.documentElement).appendChild(script);
    // (document.head ?? document.documentElement).appendChild(style);
}