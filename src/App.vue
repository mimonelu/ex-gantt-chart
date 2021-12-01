<template>
  <div id="app">
    <h1>ExGanttChart</h1>
    <GanttChart
      v-bind="ganttChartProps"
      @clickBar="printBarEvent('clickBar', $event)"
      @mouseEnterBar="printBarEvent('mouseEnterBar', $event)"
      @mouseLeaveBar="printBarEvent('mouseLeaveBar', $event)"
    />
  </div>
</template>

<script>
import GanttChart from './components/GanttChart.vue'

export default {
  name: 'App',

  components: {
    GanttChart
  },

  data () {
    return {
      ganttChartProps: this.makeData()
    }
  },

  methods: {
    makeData () {
      const from = new Date()
      from.setDate(from.getDate() - 3)
      from.setHours(0)
      from.setMinutes(0)
      from.setSeconds(0)

      const to = new Date()
      to.setDate(to.getDate() + 3)
      to.setHours(23)
      to.setMinutes(59)
      to.setSeconds(59)

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
            from: barFrom.toLocaleString(),
            to: barTo.toLocaleString(),
            label: 'Bar'
          })
        }

        body.push({
          headers,
          bars
        })
      }

      const result = {
        from: from.toLocaleString(),
        to: to.toLocaleString(),
        headers: [
          { label: 'Head header 1' },
          { label: 'Head header 2' }
        ],
        body,
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

    printBarEvent (eventName, bar) {
      console.log(eventName, bar)
    }
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
</style>
