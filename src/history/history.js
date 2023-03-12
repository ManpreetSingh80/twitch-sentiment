
// document.documentElement.style.setProperty('--bs-primary', '#6f42c1');
const myModal = new bootstrap.Modal(
    document.getElementById('historyModalToggle')
  );
  // myModal.show();
  const chartModal = new bootstrap.Modal(document.getElementById('chartModal'));
  const realtimeCartModal = new bootstrap.Modal(
    document.getElementById('realtimeChartModal')
  );
  
  
  async function getItem(keys = null) {
      return new Promise((resolve, reject) => {
          chrome.storage.local.get(keys, (result) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              resolve(result);
          })
      })
  }
  
  function getTime(x) {
    const date = new Date(x.timestamp*1000);
    return date.getTime();
  }
  
  function getPartitions(arr, partitionDuration, startTime) {
    if (arr.length < 2) return arr;
  
    const windows = [];
    let i = 0;
    let startIndex = 0;
    if (!startTime) startTime = getTime(arr[startIndex]);
  
    for (i = startIndex; i < arr.length; i++) {
      const time = getTime(arr[i]);
  
      if (time - startTime > partitionDuration) {
        windows.push(arr.slice(startIndex, i));
        startIndex = i;
        while (time > startTime + partitionDuration)
          startTime += partitionDuration;
      }
    }
  
    startIndex < i && windows.push(arr.slice(startIndex, i));
  
    return windows;
  }
  
  function partitionWindow(arr, windowDuration, intervalDuration) {
    const partitionInterval = gcd(windowDuration, intervalDuration);
    const partitions = getPartitions(arr, partitionInterval);
    const windowSize = windowDuration / partitionInterval;
    const intervalSize = intervalDuration / partitionInterval;
    console.log(partitions, windowSize, intervalSize);
    const windows = [];
  
    let i = 0;
    while (i < partitions.length) {
      windows.push(
        partitions.slice(i, Math.min(i + windowSize, partitions.length)).flat()
      );
      i += intervalSize;
    }
  
    return windows;
  }
  
  // console.log(partitionWindow(arr, 3, 2));
  
  function gcd(a, b) {
    if (b === 0) return a;
    return gcd(b, a % b);
  }
  

  const windowDuration = 180*1000;
  const intervalDuration = 120*1000;

  async function getChartData({channelName, type, videoId, startIndex,endIndex}) {
      try {
          let key = `${channelName}#${type}`;
          key += videoId && videoId !== 'undefined' ? `#${videoId}` : ''; 
          const store = await getItem([key]);
          console.log(store);
          const data = store[key].items.slice(parseInt(startIndex), parseInt(endIndex) + 1).map((item) => item.items).flat();
          const partitions = partitionWindow(data, windowDuration, intervalDuration);
          const chartData = partitions.map((arr) => {
            const date = new Date(arr[0].timestamp*1000);
            const sum = arr.reduce((a, c) => (a += parseInt(c.sentiment)), 0);
            return {
              x: date.toLocaleTimeString(),
              y: Number((sum / arr.length).toFixed(2)),
            };
          });
          console.log(chartData);
          return chartData;
      } catch (err) {
          console.error('Error in fetching chart data', err);
      }
  }
  
  async function openChart(event) {
    const channelName = event.target.getAttribute('data-channel');
    const type = event.target.getAttribute('data-type').toUpperCase();
    const videoId = event.target.getAttribute('data-videoId') || null;
    const startIndex = event.target.getAttribute('data-startIndex');
    const endIndex = event.target.getAttribute('data-endIndex');
    console.log(event.target, channelName, type, videoId, startIndex, endIndex);
    myModal.hide();
    const loader = document.getElementById('chart-loader');
    const chartContainer = document.getElementById('chart-container');
    loader.setAttribute('style', 'display:flex !important');
    chartContainer.style.display = 'none';
    chartModal.show();
  
    try {
      const chartData = await getChartData({
        channelName,
        type,
        videoId,
        startIndex,
        endIndex,
      });
      console.log('data loaded', chartData);
      
      const chartStatus = Chart.getChart("chart"); // <canvas> id
      if (chartStatus != undefined) {
        chartStatus.destroy();
      }
      const ctx = document.getElementById('chart');
      await loadChart(chartData, ctx);
      
      loader.setAttribute('style', 'display:none !important');
      chartContainer.style.display = 'block';
    } catch (err) {
      console.error('Error in loading chart');
    }
  }
  
  const liveStreamDelay = 60*60*1000; // 30 mins
  
  async function getHistory() {
      try {
          const list = await getItem();
          console.log(list);
          const channels = {};
          for (const [key, value] of Object.entries(list)) {
              const [channelName, type, videoId] = key.split('#');
              if (!channels[channelName]) {
                  channels[channelName] = {channelName, profilePic: value.metadata.profilePic, live: [], videos: []};
              }
              if (type === 'VOD') {
                  channels[channelName].videos.push({
                      title: value.metadata.title,
                      videoId,
                      startTime: value.metadata.start,
                      endTime: value.metadata.end,
                      startIndex: 0,
                      endIndex: value.items.length - 1,
                  });
              } else {
                  let prevIndex = 0;
                  for (let index = 1; index < value.items.length; index++) {
                      if ((value.items[index].start - value.items[prevIndex].end) < liveStreamDelay) {
                          continue;
                      }
  
                      channels[channelName].live.push({
                          title: value.metadata.title,
                          startTime: value.items[prevIndex].start,
                          endTime: value.items[index - 1].end,
                          startIndex: prevIndex,
                          endIndex: index - 1,
                      });
                      prevIndex = index;
                  }
  
                  channels[channelName].live.push({
                      title: value.items[prevIndex].title,
                      startTime: value.items[prevIndex].start,
                      endTime: value.items[value.items.length - 1].end,
                      startIndex: prevIndex,
                      endIndex: value.items.length - 1,
                  });
              }
          }
          return Object.values(channels);
      } catch (err) {
          console.error('Error in loading cards', err);
      }
  }
  
  function getMockData() {
    return [
      'dyrus',
      'qt',
      'wattson',
      'naggz21',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
      'streamer1',
    ].map((channelName) => ({
      channelName,
      profilePic:
        'https://static-cdn.jtvnw.net/jtv_user_pictures/dyrus-profile_image-65fe199f18b9e0ff-70x70.png',
      live: ['title1', 'title2', 'title3'].map((title) => ({
        title,
        startIndex: 0,
        endIndex: 45,
        startTime: new Date().getTime() - 200000,
        endTime: new Date().getTime(),
      })),
      videos: ['title1', 'title2', 'title3'].map((title) => ({
        title,
        startIndex: 0,
        endIndex: 45,
        startTime: new Date().getTime() - 200000,
        endTime: new Date().getTime(),
        videoId: 'dfsd68',
      })),
    }));
  }
  
  function getChannelCard(channelName, channelUrl) {
    const content = `
      <img
        src="${channelUrl}"
        class="card-img-top"
        alt="${channelName}"
      />
      <div class="card-body">
        <h5 class="card-title">${channelName}</h5>
        <div class="card-body">
          <button
            type="button"
            data-channel="${channelName}"
            class="btn btn-primary btn-view"
          > View History
          </button>
        </div>
      </div>
    `;
    const component = document.createElement('div');
    component.classList = 'card m-2';
    // component.style = 'min-width: 14rem';
    component.innerHTML = content;
    return component;
  }
  
  function getList(channelName, type, session) {
    const content = `
      <div class="card-body">
        <h5 class="card-title">${session.title}</h5>
          <p class="card-text">${new Date(
            session.startTime
          ).toUTCString()} - ${new Date(session.endTime).toUTCString()}</p>
            <button
              data-startIndex="${session.startIndex}"
              data-channel="${channelName}"
              data-type="${type}"
              data-videoId="${session.videoId}"
              data-endIndex="${session.endIndex}"
              class="btn btn-primary session-list"
            >
            Show graph
          </button></div>
    `;
    const component = document.createElement('div');
    component.classList = 'card mb-3';
    // component.style = 'min-width: 14rem';
    component.innerHTML = content;
    return component;
  }
  
  let data = []
  
  const listRecords = function (event) {
    const channelName = event.target.getAttribute('data-channel');
    const liveTab = document.getElementById('nav-live');
    const videosTab = document.getElementById('nav-videos');
    liveTab.innerHTML = '';
    videosTab.innerHTML = '';
    const streamer = data.find((item) => item.channelName === channelName);
  
    for (const session of streamer.live) {
      const listEl = getList(streamer.channelName, 'LIVE', session);
      liveTab.appendChild(listEl);
    }
  
    for (const session of streamer.videos) {
      const listEl = getList(streamer.channelName, 'VOD', session);
      videosTab.appendChild(listEl);
    }
  
    document
    .querySelectorAll('button.session-list')
    .forEach((btn) => btn.addEventListener('click', openChart));
    
    myModal.show();
    console.log(event);
  
  };
  
  function loadData(node) {
    
    for (const streamer of data) {
      const card = getChannelCard(streamer.channelName, streamer.profilePic);
      node.appendChild(card);
  
    //   for (const session of streamer.live) {
    //     const listEl = getList(streamer.channelName, 'LIVE', session);
    //     liveTab.appendChild(listEl);
    //   }
  
    //   for (const session of streamer.videos) {
    //     const listEl = getList(streamer.channelName, 'VOD', session);
    //     videosTab.appendChild(listEl);
    //   }
    }
  
    document
      .querySelectorAll('button.btn-view')
      .forEach((btn) => btn.addEventListener('click', listRecords));
  
    
  }
  
  async function loadChart(chartData, canvas) {
      const config = {
          type: 'line',
          data: {
              datasets: [
                  {
                    label: 'Sentiment Trend',
                    data: chartData,
                  },
              ]
          },
          options: {
            scales: {
              x: {
                // min: '2018-11-02 17:10:00',
                // max: '2018-11-02 18:01:00',
                // type: 'time',
                time: {
                  unit: 'minute',
                },
                title: {
                  display: true,
                  text: 'Time',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Average Sentiment',
                },
              },
            },
          },
        };
    new Chart(canvas, config);
  }
  
  async function getBlizzconData() {
      const data = await fetch('blizzcon.json').then((response) =>
        response.json()
      );
      const windowSampleSize = 4000;
      let sum = data.slice(0, windowSampleSize - 1).reduce((a, c) => a += parseInt(c.pred_sentiment), 0);
    const map = {}
    const dataset = [];
    data
      .slice(windowSampleSize - 1)
      .forEach(({ datetime, pred_sentiment }, index) => {
        sum = sum + parseInt(pred_sentiment) - (index > 0 ? parseInt(data[index - 1].pred_sentiment) : 0);
          if (!map[datetime]) map[datetime] = [];
          map[datetime].push(sum / windowSampleSize);
      });
      for (const [datetime, values] of Object.entries(map)) {
          dataset.push({
              x: (new Date(datetime)).toLocaleTimeString(),
              y: Number((values.reduce((a,c) => a+=parseFloat(c), 0)/values.length).toFixed(2))
          });
      }
  
    return dataset;
  }
  
  async function loadRealtimeChart() {
    const queryParams = new URLSearchParams(location.search);
    const params = {};
    for (const [key, value] of queryParams.entries()) {
      console.log(key, value);
      params[key] = value;
    }
    if (Object.keys(params).length === 0) return;
  
    const loader = document.getElementById('realtime-chart-loader');
    const chartContainer = document.getElementById('realtime-chart-container');
    loader.setAttribute('style', 'display:flex !important');
    chartContainer.style.display = 'none';
    realtimeCartModal.show();
  
    try {
      const chartData = await getBlizzconData(params);
      console.log('data loaded', chartData);
      loader.setAttribute('style', 'display:none !important');
      chartContainer.style.display = 'block';
      const ctx = document.getElementById('realtime-chart');
      await loadChart(chartData, ctx);
    } catch (err) {
      console.error('Error in loading realtime chart', err);
    }
  }
  
  (async () => {
    try {
      await loadRealtimeChart();
      data = await getHistory();
      console.log(data);
      const channelContainer = document.getElementById('channels-list');
      loadData(channelContainer);
      document.getElementById('page-loader').remove();
      channelContainer.style.visibility = 'visible';
    } catch (err) {
      console.error('An Error happened', err);
    }
  })();
  