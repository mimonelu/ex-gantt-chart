<template>
  <table class="gantt-chart">
    <tbody>
      <tr
        v-for="row, rowIndex in data"
        :key="`row-${rowIndex}`"
      >
        <th
          v-for="header, headerIndex in row.headers"
          :key="`header-${rowIndex}-${headerIndex}`"
          :rowspan="rowSpan(rowIndex, headerIndex)"
          :style="{ display: header.rowSpan ? 'none': '' }"
        >
          <div class="header-content">{{ header.label }}</div>
        </th>
        <td>
          <div
            v-for="bar, barIndex in row.bars"
            :key="barId(rowIndex, barIndex)"
            :id="barId(rowIndex, barIndex)"
            class="bar"
            :data-visible="barVisible(rowIndex, barIndex).toString()"
          >
            <div class="bar-content">{{ bar.label }}</div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  name: 'GanttChart',

  props: {
    data: {
      type: Array,
      required: true
    },
    from: {
      type: String,
      default () {
        const date = new Date()
        date.setHours(0)
        date.setMinutes(0)
        date.setSeconds(0)
        return date.toLocaleString()
      }
    },
    to: {
      type: String,
      default () {
        const date = new Date()
        date.setHours(23)
        date.setMinutes(59)
        date.setSeconds(59)
        return date.toLocaleString()
      }
    }
  },

  computed: {
    fromTime () {
      return new Date(this.from).getTime()
    },

    toTime () {
      return new Date(this.to).getTime()
    },

    rowSpan () {
      return (rowIndex, headerIndex) => {
        if (this.data[rowIndex].headers[headerIndex].rowSpan) {
          return null
        }
        let rowSpan = 0
        for (let i = rowIndex + 1; i < this.data.length; i++, rowSpan++) {
          const header = this.data[i].headers[headerIndex]
          if (header === undefined || !header.rowSpan) {
            break
          }
        }
        return rowSpan === 0 ? null : rowSpan + 1
      }
    },

    barId () {
      return (rowIndex, barIndex) => {
        return `bar-${rowIndex}-${barIndex}`
      }
    },

    barVisible () {
      return (rowIndex, barIndex) => {
        const bar = this.data[rowIndex].bars[barIndex]
        const barFromTime = new Date(bar.from).getTime()
        const barToTime = new Date(bar.to).getTime()
        return (
          (this.fromTime <= barFromTime && this.toTime >= barFromTime) ||
          (this.fromTime <= barToTime && this.toTime >= barToTime)
        )
      }
    }
  },

  mounted () {
    for (let rowIndex = 0; rowIndex < this.data.length; rowIndex++) {
      for (let barIndex = 0; barIndex < this.data[rowIndex].bars.length; barIndex++) {
        if (!this.barVisible(rowIndex, barIndex)) {
          continue
        }
        const bar = this.data[rowIndex].bars[barIndex]
        const barId = this.barId(rowIndex, barIndex)
        const $bar = this.$el.querySelector(`#${barId}`)
        const barFromTime = new Date(bar.from).getTime()
        const barToTime = new Date(bar.to).getTime()
        const left = (barFromTime - this.fromTime) / (this.toTime - this.fromTime) * 100
        const width = (barToTime - barFromTime) / (this.toTime - this.fromTime) * 100
        $bar.style = `left: ${left}%; width: ${width}%`
      }
    }
  }
}
</script>

<style>
.gantt-chart {
  --gantt-chart-border-color: #c0c0c0;
  --gantt-chart-header-bg-color: #e0e0e0;
  --gantt-chart-header-fg-color: #202020;
  --gantt-chart-bar-bg-color: #0080f0;
  --gantt-chart-bar-fg-color: #f0f0f0;
  --gantt-chart-content-bg-color: #f0f0f0;
}
</style>

<style scoped>
.gantt-chart {
  background-color: var(--gantt-chart-border-color);
  border-spacing: 1px;
  width: 100%;
}

th {
  background-color: var(--gantt-chart-header-bg-color);
  padding: 0.5em 1em;
  user-select: none;
}

.header-content {
  color: var(--gantt-chart-header-fg-color);
  white-space: pre;
}

td {
  background-color: var(--gantt-chart-content-bg-color);
  overflow-x: hidden;
  padding: 0;
  position: relative;
  width: 100%;
}

.bar {
  background-color: var(--gantt-chart-bar-bg-color);
  border-radius: 0.5em;
  box-sizing: border-box;
  overflow: hidden;
  padding: 0.5em 1em;
  position: relative;

  /* バーのマージン代わり */
  border: 2px solid var(--gantt-chart-content-bg-color);
}
.bar[data-visible="false"] {
  display: none;
}

.bar-content {
  color: var(--gantt-chart-bar-fg-color);
  user-select: none;

  /* 折り返さない */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre;
}
</style>
