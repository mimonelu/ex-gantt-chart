<template>
  <div id="app">
    <GanttChart v-bind="ganttChartProps" />
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
      ganttChartProps: {
        data: [
          {
            headers: [
              { label: 'ヘッダー 1' },
              { label: 'ヘッダー 2-1' }
            ],
            bars: [
              {
                from: '2021/10/11 22:00:00',
                to: '2021/10/12 9:00:00',
                label: 'テストです'
              }
            ]
          },
          {
            headers: [
              { rowSpan: true },
              { label: 'ヘッダー 2-2' }
            ],
            bars: [
              {
                from: '2021/10/12 12:00:00',
                to: '2021/10/12 15:00:00',
                label: 'テストです 2-2-a'
              },
              {
                from: '2021/10/12 15:30:00',
                to: '2021/10/12 19:30:00',
                label: 'テストです 2-2-b'
              },
              {
                from: '2021/10/13 14:00:00',
                to: '2021/10/13 18:00:00',
                label: 'テストです 2-2-c'
              }
            ]
          },
          {
            headers: [
              { rowSpan: true },
              { label: 'ヘッダー 2-3' }
            ],
            bars: [
              {
                from: '2021/10/12 18:00:00',
                to: '2021/10/13 01:30:00',
                label: 'テストです 2-3-a'
              }
            ]
          }
        ]
      }
    }
  }
}
</script>

<style>
</style>
