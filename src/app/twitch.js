let extensionId = null;
const channelRegex = /(?:videos\/(?<videoid>[0-9]{3,100})|[a-zA-Z0-9_]{3,25}\/clip\/(?<clipid>[a-zA-Z0-9-]{3,100})|(?:(u|popout|moderator)\/)?(?<channelname>[a-zA-Z0-9_]{3,25}))/;

const bots = ['streamelements', 'nightbot'];

function isBot(user) {
    return bots.some((name) => name === (user.userLogin || user.name));
}

const getReactInstance = (el) => {
    for (const k in el) {
        if (k.startsWith('__reactInternalInstance$')) {
            return (el)[k];
        }
    }
}

function findReactParents(node, predicate, maxDepth = 15, depth = 0) {
    let success = false;
    try { success = predicate(node); } catch (_) {}
    if (success) return node;
    if (!node || depth > maxDepth) return null;

    const { 'return': parent } = node;
    if (parent) {
        return findReactParents(parent, predicate, maxDepth, depth + 1);
    }

    return null;
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

function getChatController() {
    const node = findReactParents(
        getReactInstance(document.querySelectorAll('section[data-test-selector="chat-room-component-layout"]')[0]),
        n => n.stateNode?.props.messageHandlerAPI && n.stateNode?.props.chatConnectionAPI,
        100
    );

    return node?.stateNode;
}

function ObserveLive() {
    const mutationObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const n of m.addedNodes) {
                const r = getChatLine(n);

                const images = document.querySelectorAll('img.tw-image-avatar');
                const data = {
                    profilePic: images[images.length - 1].src,
                    title: document.querySelector('h2[data-a-target=stream-title]').title,
                    channelName: r.component.props.channelLogin,
                    id: r.component.props.message.id,
                    message: r.component.props.message.messageBody,
                    bot: isBot(r.component.props.message.user),
                    element: n,
                    component: r.component,
                    inst: r.instance,
                    type: 'LIVE',
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

/**
	 * Get an individual chat line
*/
function getVideoChatLine(el) {
    const inst = getReactInstance(el);

		return {
			component: inst?.return?.return?.stateNode,
			instance: inst
		};
}

function getIDsFromRoute(path) {
    const match = path.match(channelRegex);
    const groups = match?.groups;

    return [
        groups?.['channelname'] ?? '',
        groups?.['videoid'] ?? groups?.['clipid'] ?? ''
    ];
}

	/**
	 * Gets the channel's id and display name for a video.
	 * Note: VOD and clips do not have the channel name in
	 * the URL nor do they contain a chat controller with the info.
	 */
	function getVideoChannel() {
		const node = findReactParents(
			getReactInstance(document.querySelectorAll('div.video-chat.va-vod-chat')[0]),
			n => n.stateNode?.props.channelID && n.stateNode?.props.displayName,
			100
		);

		// Kinda hacky? However, display names are merely
		// case variations of the pure lowercase channel logins.
		if (node?.stateNode?.props) {
			node.stateNode.props.channelLogin = node.stateNode.props.displayName.toLowerCase();
		}

		return node?.stateNode;
	}

function getMessageFromTokens(tokens) {
    return tokens.map((token) => {
        if (typeof token.content === 'string') return token.content;
        if (token.content?.alt) return token.content.alt;
        if (token.content?.recipient) return '@' + token.content.recipient;
        console.error('Unknown token', token); return undefined;
    }).filter(t => t).join('');
}

function ObserveVOD(channelName, videoId) {
    const mutationObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const n of m.addedNodes) {
                const message = n.querySelectorAll('.vod-message > div:not(.vod-message__header) > div')[0];
                if (!message) continue;
                const r = getVideoChatLine(message);
                const images = document.querySelectorAll('img.tw-image-avatar');
                const data = {
                    profilePic: images[images.length - 1].src,
                    title: document.querySelector('h2[data-a-target=stream-title]').title,
                    channelName,
                    id: r.component.props.context.comment.id,
                    message: getMessageFromTokens(r.component.props.context.comment.message.tokens),
                    bot: isBot(r.component.props.context.author),
                    element: n,
                    component: r.component,
                    inst: r.instance,
                    type: 'VOD',
                    videoId,
                };
                console.log('data', data);

                loadSentiment(data);
            }
        }
    });

    const getVideoChatList = () => document.querySelectorAll(`div.video-chat.va-vod-chat div.video-chat__message-list-wrapper > div > ul`)?.[0];

    const container = getVideoChatList();
    console.log(container);
    if (!container) throw new Error('Could not find chat container');

    mutationObserver.observe(container, {
        childList: true
    });
}

function insertHeader(live = true) {
    const liveChatContainer = 'div.chat-room__content';
    const vodChatContainer = 'div.video-chat__header';
    const chatRoom = document.querySelector(live ? liveChatContainer : vodChatContainer);
    const div = document.createElement('div');
    div.style = `
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 5px;
        justify-content: space-around;
    `;
    div.id = 'sa-container';
    div.innerHTML = `
        <div style="
            color: #bf94ff;
            font-size: medium;
        "><span>Sentiment: </span>
        <span id="sa-agg">${SENTIMENT['0']}</span></div>
        <button id="sa-open" style="
            color: white;
            background-color: #bf94ff;
            border-radius: 4px;
            padding: 5px;
        ">Open Chart</button>
    `;
    chatRoom.insertAdjacentElement(live ? 'afterbegin' : 'afterend', div);
    document.querySelector('#sa-open').addEventListener('click', () => {
        console.log('Opening chart', store);

        let params = {channelName: store.metadata.channelName, type: store.metadata.type};
        if (store.metadata.type === 'LIVE') {
            params.startIndex = store.metadata.startIndex;
            params.endIndex = store.metadata.endIndex;
        } else {
            params.videoId = store.params.videoId;
        }
        const url = 'history.html?' +  new URLSearchParams(params);
        sendEvent({type: 'OPENURL', url})
    });
}


async function awaitChannelInfo(isVideo) {
    return new Promise(resolve => {
        const i = setInterval(() => {
            const c = isVideo
                ? getVideoChannel()
                : getChatController();
            if (c && (c.props?.channelID && c.props?.channelLogin)) {
                clearInterval(i);
                resolve(c);
            }
        }, 500);
    });
}

async function Observe() {
    const [ urlChannelName, urlVideoID ] = getIDsFromRoute(location.pathname);
    const channelInfo = await awaitChannelInfo(urlVideoID);
    const channelName = channelInfo.props.channelLogin;
    if (urlVideoID) {
        ObserveVOD(channelName, urlVideoID);
        insertHeader(false);
    } else {
        ObserveLive(channelName);
        insertHeader(true);
    }
}

async function init() {
    try {
        await Observe();
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
    '1': '😀',
    '-1': '🙁',
    '0': '😐'
};

function updateChat(el, sentiment, live = true) {
    // add badge
    const liveChatContainer = '.chat-line__username-container';
    const vodChatContainer = '.video-chat__message';
    const container = el.querySelector(live ? liveChatContainer : vodChatContainer);
    const span = document.createElement('span');
    span.classList.add(...['chat-badge', 'sa-badge']);
    span.style = 'margin-left: 5px; margin-right: 5px;    font-size: larger'
    span.innerHTML = SENTIMENT[sentiment];
    container.insertAdjacentElement(live ? 'afterend' : 'beforebegin', span);
}

const slidingWindowDuration = 20; // in s
const parttionTime = 10; // in s
let startTime = null;
let partition = [];
const store = {
    partitions: [],
}

function updateSentiment() {
    const partitionSize = Math.floor(slidingWindowDuration/parttionTime);
    if (store.partitions.length < partitionSize) return;

    const score = store.partitions.slice(store.partitions.length - partitionSize).reduce((a, c) => a+=parseFloat(c.sentiment, 10), 0)/partitionSize;
    console.log('store', store)
    let sentiment = 0;
    if (score > 0.1) sentiment = 1;
    if (score < -0.1) sentiment = -1;
    console.info('Agg sentiment score', score);
    document.querySelector('#sa-agg').innerHTML = SENTIMENT[sentiment];
}


async function updateSentimentData(data) {
    let currentTime = new Date();
    currentTime.setUTCMilliseconds(0);
    // currentTime.setMinutes(0);
    currentTime = Math.floor(currentTime/1000);
    if (!startTime) startTime = currentTime;

    if (currentTime - startTime > parttionTime && partition.length) {
        console.log('partition', JSON.stringify(partition));
        const item = {
            items: partition,
            start: startTime*1000,
            end: partition[partition.length-1]?.timestamp*1000,
            sentiment: (partition.reduce((a, c) => a += parseFloat(c.sentiment, 10), 0)/partition.length).toFixed(2),
            timestamp: (startTime + parttionTime/2)*1000
        };
        partition = [];
        startTime = currentTime;
        store.partitions.push(item);
        updateSentiment();
        const dataToStore = {
            item,
            metadata: {
                profilePic: data.profilePic,
                videoId: data.videoId,
                channelName: data.channelName,
                type: data.type,
                title: data.title,
            }
        };
        const index = await sendEvent({type: 'STORE-SA', dataToStore});
        if (!store.metadata) store.metadata = {startIndex: index, ...dataToStore.metadata};
        else store.metadata.endIndex = index;
    }

    partition.push({sentiment: data.sentiment, timestamp: currentTime});
}


async function loadSentiment(data) {
    try {
        const live = data.type === 'LIVE';
        const sentiment = await sendEvent({message: data.message, type: 'GET-SA'});
        console.log('sentiment', sentiment);
        updateChat(data.element, sentiment, live);
        await updateSentimentData({...data, sentiment});
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