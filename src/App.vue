<template>
  <div id="app">
    <h1>ExGanttChart</h1>
    <ExGanttChart
      ref="exGanttChart"
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

const irandom = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const adjustFromDate = (from) => {
  from.setHours(0)
  from.setMinutes(0)
  from.setSeconds(0)
  from.setMilliseconds(0)
}

const adjustToDate = (to) => {
  to.setHours(23)
  to.setMinutes(59)
  to.setSeconds(59)
  to.setMilliseconds(999)
}

export default {
  name: 'App',

  components: {
    ExGanttChart
  },

  data () {
    return {
      exGanttChartProps: this.makeData(7),
      currentBarInfo: ''
    }
  },

  methods: {
    makeData (daysOfTerm) {
      const from = new Date()
      adjustFromDate(from)

      const to = new Date()
      to.setDate(from.getDate() + (daysOfTerm - 1))
      adjustToDate(to)

      const body = []
      for (let i = 0; i < 3; i++) {
        const headers = [
          {
            label: 'Body header 1',
            classes: { 'custom-body-header-class-1': true },
            attrs: { 'data-custom-body-header-attr-1': true }
          },
          {
            label: 'Body header 2',
            classes: { 'custom-body-header-class-2': true },
            attrs: { 'data-custom-body-header-attr-2': true }
          }
        ]
        if (i >= 1) {
          headers[0] = { rowSpan: true }
        }

        const bars = []
        for (let j = 0; j < i * (i + 1) + 1; j++) {
          const barFrom = new Date(from)
          barFrom.setHours(irandom(-6, 24 * daysOfTerm - 1))
          const barTo = new Date(barFrom)
          barTo.setHours(barTo.getHours() + irandom(6, 48))
          bars.push({
            from: barFrom,
            to: barTo,
            label: `Bar ${i + 1}-${j + 1}`,
            classes: { 'custom-bar-class': true },
            attrs: { 'data-custom-bar-attr': true },
            visible: true,
            allowDrag: true,
            allowResize: true
          })
        }

        body.push({
          headers,
          bars,
          classes: { 'custom-body-content-class': true },
          attrs: { 'data-custom-body-content-attr': true },
          allowDrag: true,
          allowDrop: true,
          allowResize: true
        })
      }

      const result = {
        from,
        to,
        headers: [
          {
            label: 'Head header 1',
            classes: { 'custom-head-header-class-1': true },
            attrs: { 'data-custom-head-header-attr-1': true }
          },
          {
            label: 'Head header 2',
            classes: { 'custom-head-header-class-2': true },
            attrs: { 'data-custom-head-header-attr-2': true }
          }
        ],
        visibleHeaders: true,
        dateFormatter (date) {
          const days = ['日', '月', '火', '水', '木', '金', '土']
          return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`
        },
        body,
        allowParallel: true,
        allowDrag: true,
        allowDrop: true,
        dropToLast: true,
        allowResize: true,
        subSeparatorSpan: 6
      }
      return result
    },

    onClickBar ({ event, bar, rowIndex, barIndex, component }) {
      // クリックされたバーのプロパティと値を表示
      const info = []
      for (const key in bar) {
        const value = Object.prototype.toString.call(bar[key]) === '[object Date]'
          ? new Date(bar[key]).toLocaleString()
          : Object.prototype.toString.call(bar[key]) === '[object Object]'
            ? JSON.stringify(bar[key])
            : bar[key]
        info.push(`${key}: ${value}`)
      }
      this.currentBarInfo = info.join('\n')

      // クリックされたバーを伸ばす
      adjustFromDate(bar.from)
      adjustToDate(bar.to)
      component.updateBarsInRow(rowIndex) // or `component.updateBarsAll()`
    },

    onMouseEnterBar ({ event, bar, rowIndex, barIndex, component }) { /**/ },

    onMouseLeaveBar ({ event, bar, rowIndex, barIndex, component }) { /**/ }
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
