const ctx = document.getElementById('myChart');

const config = {
  type: 'line',
  data: null,
  options: {
    scales: {
      x: {
        // min: '2018-11-02 17:10:00',
        // max: '2018-11-02 18:01:00',
        // type: 'time',
        time: {
          unit: 'minute',
          //   // Luxon format string
          //   // tooltipFormat: 'DD T',
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        // min: -0.2,
        // max: 0.5,
        title: {
          display: true,
          text: 'Average Sentiment',
        },
      },
    },
  },
};


function getData(data, windowSampleSize) {
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
            x: datetime,
            y: Number((values.reduce((a,c) => a+=parseFloat(c), 0)/values.length).toFixed(2))
        });
    }

  return dataset;
}

(async () => {
  try {
    const blizzcon = await fetch('blizzcon.json').then((response) =>
      response.json()
    );
    const dataset = getData(blizzcon, 4000);
    const data = {
      // labels: blizzcon.slice(0, 100).map((item) => item.datetime),
      datasets: [
        {
          label: 'Sentiment',
          // backgroundColor: 'aaa',
          // borderColor: '#bbb',
          // fill: false,
          data: dataset,
        },
      ],
    };
    console.log(data);
    config.data = data;
    new Chart(ctx, config);
  } catch (err) {
    console.error(err);
  }
})();
