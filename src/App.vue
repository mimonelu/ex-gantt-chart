<template>
  <div id="app">
    <h1>ExGanttChart</h1>
    <ExGanttChart
      v-bind="exGanttChartProps"
      @clickBar="onClickBar"
      @mouseEnterBar="onMouseEnterBar"
      @mouseLeaveBar="onMouseLeaveBar"
    />
    <div class="info-container">
      <pre>{{ JSON.stringify(exGanttChartProps) }}</pre>
      <pre>{{ currentBarInfo }}</pre>
    </div>
  </div>
</template>

<script>
import ExGanttChart from './components/ExGanttChart.vue'

export default {
  name: 'App',

  components: {
    ExGanttChart
  },

  data () {
    return {
      exGanttChartProps: this.makeData(),
      currentBarInfo: ''
    }
  },

  methods: {
    makeData () {
      const from = new Date()
      from.setDate(from.getDate() - 3)
      from.setHours(0)
      from.setMinutes(0)
      from.setSeconds(0)
      from.setMilliseconds(0)

      const to = new Date()
      to.setDate(to.getDate() + 3)
      to.setHours(23)
      to.setMinutes(59)
      to.setSeconds(59)
      to.setMilliseconds(0)

      const body = []
      for (let i = 0; i < 3; i++) {
        const headers = [
          { label: 'Body header 1' },
          { label: 'Body header 2' }
        ]
        if (i >= 1) {
          headers[0] = { rowSpan: true }
        }

        const bars = []
        for (let j = 0; j < i + 1; j++) {
          const barFrom = new Date(from)
          barFrom.setHours(this.irandom(-6, 24 * 7 - 1))
          const barTo = new Date(barFrom)
          barTo.setHours(barTo.getHours() + this.irandom(6, 48))
          bars.push({
            from: barFrom,
            to: barTo,
            label: `Bar ${i + 1}-${j + 1}`,
            classes: 'hoge fuga',
            disableToClick: false,
            disableToMouseEnter: false,
            disableToMouseLeave: false
          })
        }

        body.push({
          headers,
          bars
        })
      }

      const result = {
        from,
        to,
        headers: [
          { label: 'Head header 1' },
          { label: 'Head header 2' }
        ],
        body,
        disableParallel: false,
        mainSeparatorSpan: 24,
        subSeparatorSpan: 6,
        dateFormatter (date) {
          const days = ['日', '月', '火', '水', '木', '金', '土']
          return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`
        }
      }
      return result
    },

    irandom (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    },

    onClickBar (bar) {
      this.currentBarInfo = `
        label: ${bar.label}
        from: ${bar.from.toLocaleString()}
        to: ${bar.to.toLocaleString()}
      `.trim().replace(/^\s/m, '')
    },

    onMouseEnterBar (bar) { /**/ },

    onMouseLeaveBar (bar) { /**/ }
  }
}
</script>

<style>
:root {
  font-size: 16px;
}

body {
  background-color: #102030;
  color: #f0f0f0;
  font-family: monospace;
  margin: 2rem;
}

h1 {
  font-size: 2rem;
  font-weight: normal;
  line-height: 2rem;
  margin: 0 0 2rem;
}

.ex-gantt-chart {
  margin-bottom: 1rem;
}

.info-container {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 75% auto;
}
.info-container pre {
  border: 1px solid #00f000;
  color: #00f000;
  margin: 0;
  padding: 1rem;
  white-space: pre-wrap;
  word-break: break-all;
}
.info-container pre:nth-child(2) {
  white-space: pre-line;
}
</style>
