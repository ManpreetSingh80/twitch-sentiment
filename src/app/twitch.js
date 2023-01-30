let extensionId = null;

const bots = ['streamelements', 'nightbot'];

function isBot(user) {
    return bots.some((name) => name === user.userLogin);
}

const getReactInstance = (el) => {
    for (const k in el) {
        if (k.startsWith('__reactInternalInstance$')) {
            return (el)[k];
        }
    }
}

/**
	 * Get an individual chat line
*/
function getChatLine(el) {
    const inst = getReactInstance(el);

		return {
			component: inst?.return?.stateNode,
			instance: inst
		};
}

function Observe() {
    const mutationObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const n of m.addedNodes) {
                const r = getChatLine(n);

                const data = {
                    id: r.component.props.message.id,
                    message: r.component.props.message.messageBody,
                    bot: isBot(r.component.props.message.user),
                    element: n,
                    component: r.component,
                    inst: r.instance
                }
                console.log(data);

                loadSentiment(data);
            }
        }
    });

    const container = window.document.querySelector('.chat-scrollable-area__message-container');
    if (!container) throw new Error('Could not find chat container');

    mutationObserver.observe(container, {
        childList: true
    });
}

function init() {
    try {
        Observe();
    } catch (err) {
        console.error(err);
        setTimeout(() => init(), 2000);
    }
}
window.addEventListener('onbeforeunload', (event) => {
    console.log('unload twitch script', event)
})

function sendEvent(event) {
    return new Promise((resolve) => {
        window.chrome.runtime.sendMessage(extensionId, event, resolve);
    });
}

const SENTIMENT = {
    POSITIVE: '😀',
    NEGATIVE: '🙁',
    NEUTRAL: '😐'
};

function updateChat(el, sentiment) {
    // add badge
    const container = el.querySelector('.chat-line__username-container');
    const span = document.createElement('span');
    span.classList.add(...['chat-badge', 'sa-badge']);
    span.style = 'margin-left: 5px; margin-right: 5px;    font-size: larger'
    span.innerHTML = SENTIMENT[sentiment];
    container.insertAdjacentElement('afterend', span);
}

async function loadSentiment(data) {
    try {
        const sentiment = await sendEvent({message: data.message});
        console.log('sentiment', sentiment);
        updateChat(data.element, sentiment);
    } catch (err) {
        console.error('Error in getting sentiment', err);
    }
}

window.addEventListener(`SA`, event => {
    if (!(event instanceof CustomEvent)) return undefined;

    console.log('received event', event);
    if (event.detail.extensionId) {
        extensionId = event.detail.extensionId;
        // sendEvent({message: 'test message text'});
        init()
    }
});



console.log('twitch script loaded');