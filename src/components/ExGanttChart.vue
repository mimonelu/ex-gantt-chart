<template>
  <div
    class="ex-gantt-chart"
    :style="{
      '--ex-gantt-chart-v-main-separator-width': `calc(100% / ${hoursOfTerm / mainSeparatorSpan})`,
      '--ex-gantt-chart-v-sub-separator-width': `calc(100% / ${hoursOfTerm / subSeparatorSpan})`,
    }"
  >
    <table>
      <thead>
        <tr>
          <th
            v-for="header, headerIndex in headers"
            :key="`head-header-${headerIndex}`"
          >
            <div class="head-header-content">{{ header.label }}</div>
          </th>
          <td>
            <div
              class="date"
              :style="`grid-template-columns: repeat(${dateOfTerm}, 1fr);`"
            >
              <div
                v-for="date, dateIndex of datesInTerm"
                :key="`date-content-${dateIndex}`"
                class="date-content"
              >{{ dateFormatter(date) }}</div>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row, rowIndex in body"
          :key="`body-row-${rowIndex}`"
        >
          <th
            v-for="header, headerIndex in row.headers"
            :key="`body-header-${rowIndex}-${headerIndex}`"
            :rowspan="rowSpan(rowIndex, headerIndex)"
            :style="{ display: header.rowSpan ? 'none': '' }"
          >
            <div class="body-header-content">{{ header.label }}</div>
          </th>
          <td>
            <div
              v-for="bar, barIndex in row.bars"
              :key="barId(rowIndex, barIndex)"
              :class="`bar${bar.classes ? ' ' + bar.classes : ''}`"
              :data-id="barId(rowIndex, barIndex)"
              :data-visible="barVisible(rowIndex, barIndex).toString()"
              @click="!bar.disableToClick && $emit('clickBar', bar)"
              @mouseenter="!bar.disableToMouseEnter && $emit('mouseEnterBar', bar)"
              @mouseleave="!bar.disableToMouseLeave && $emit('mouseLeaveBar', bar)"
            >
              <div class="bar-content">{{ bar.label }}</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
const makeFromDate = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const makeToDate = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
}

export default {
  name: 'ExGanttChart',

  props: {
    /*
    ```
    [
      { label: 'Header\nThis is header in table head.' }, ...
    ]
    ```
    */
    headers: {
      type: Array,
      required: true
    },

    dateFormatter: {
      type: Function,
      default (date) {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
      }
    },

    /*
    ```
    [
      {
        headers: [
          { label: 'Header\nThis is header in table body.' },
          { rowSpan: true }
        ],
        bars: [
          {
            from: Date,
            to: Date,
            label: 'Bar\nThis is bar.',
            classes: 'className',
            disableToClick: false,
            disableToMouseEnter: false,
            disableToMouseLeave: false
          }, ...
        ]
      }, ...
    ]
    ```
    */
    body: {
      type: Array,
      required: true
    },

    from: {
      type: Date,
      default () {
        const date = new Date()
        date.setDate(date.getDate() - 3)
        return makeFromDate(date)
      }
    },

    to: {
      type: Date,
      default () {
        const date = new Date()
        date.setDate(date.getDate() + 3)
        return makeToDate(date)
      }
    },

    mainSeparatorSpan: {
      type: Number,
      default: 24
    },

    subSeparatorSpan: {
      type: Number,
      default: 1
    }
  },

  computed: {
    fromDate () {
      return makeFromDate(this.from)
    },

    toDate () {
      return makeToDate(this.to)
    },

    fromTime () {
      return this.fromDate.getTime()
    },

    toTime () {
      return this.toDate.getTime()
    },

    datesInTerm () {
      const results = []
      for (let i = 0; i < this.dateOfTerm; i++) {
        const date = new Date(this.fromDate)
        date.setDate(date.getDate() + i)
        results.push(date)
      }
      return results
    },

    dateOfTerm () {
      return Math.round((this.toTime - this.fromTime) / 1000 / 60 / 60 / 24)
    },

    hoursOfTerm () {
      return (this.toTime - this.fromTime) / 1000 / 60 / 60
    },

    rowSpan () {
      return (rowIndex, headerIndex) => {
        if (this.body[rowIndex].headers[headerIndex].rowSpan) {
          return null
        }
        let rowSpan = 0
        for (let i = rowIndex + 1; i < this.body.length; i++, rowSpan++) {
          const header = this.body[i].headers[headerIndex]
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
        const bar = this.body[rowIndex].bars[barIndex]
        const barFromTime = bar.from.getTime()
        const barToTime = bar.to.getTime()
        return (
          (this.fromTime <= barFromTime && this.toTime >= barFromTime) ||
          (this.fromTime <= barToTime && this.toTime >= barToTime)
        )
      }
    }
  },

  mounted () {
    this.updateBarStyle()
  },

  methods: {
    updateBarStyle () {
      for (let rowIndex = 0; rowIndex < this.body.length; rowIndex++) {
        for (let barIndex = 0; barIndex < this.body[rowIndex].bars.length; barIndex++) {
          if (!this.barVisible(rowIndex, barIndex)) {
            continue
          }
          const bar = this.body[rowIndex].bars[barIndex]
          const barId = this.barId(rowIndex, barIndex)
          const barElement = this.$el.querySelector(`[data-id="${barId}"]`)
          const barFromTime = bar.from.getTime()
          const barToTime = bar.to.getTime()
          const left = (barFromTime - this.fromTime) / (this.toTime - this.fromTime) * 100
          const width = (barToTime - barFromTime) / (this.toTime - this.fromTime) * 100
          barElement.style = `left: ${left}%; width: ${width}%`
        }
      }
    }
  }
}
</script>

<style>
.ex-gantt-chart {
  --ex-gantt-chart-border-color: #c0c0c0;

  /* ヘッドヘッダー */
  --ex-gantt-chart-head-header-bg-color: #d0d0d0;
  --ex-gantt-chart-head-header-fg-color: #303030;

  /* 日付 */
  --ex-gantt-chart-date-bg-color: #d0d0d0;
  --ex-gantt-chart-date-fg-color: #303030;
  --ex-gantt-chart-date-separator-color: #c0c0c0;

  /* ボディヘッダー */
  --ex-gantt-chart-body-header-bg-color: #e0e0e0;
  --ex-gantt-chart-body-header-fg-color: #202020;

  /* ボディデータ */
  --ex-gantt-chart-body-data-bg-color: #f0f0f0;

  /* 縦のメイン分割線 */
  --ex-gantt-chart-v-main-separator-color: #c0c0c0;
  --ex-gantt-chart-v-main-separator-width: calc(100% / 24); /* スクリプト制御 */

  /* 縦のサブ分割線 */
  --ex-gantt-chart-v-sub-separator-color: #e0e0e0;
  --ex-gantt-chart-v-sub-separator-width: calc(100% / 48); /* スクリプト制御 */

  /* バー */
  --ex-gantt-chart-bar-bg-color: #0080f0;
  --ex-gantt-chart-bar-fg-color: #f0f0f0;
}
</style>

<style scoped>
.ex-gantt-chart {
  overflow-y: scroll;
}

table {
  background-color: var(--ex-gantt-chart-border-color);
  border-spacing: 1px;
  width: 100%;
}

thead th {
  background-color: var(--ex-gantt-chart-head-header-bg-color);
  padding: 0.5em 1em;
}

.head-header-content {
  color: var(--ex-gantt-chart-head-header-fg-color);
  user-select: none;
  white-space: pre;
}

thead td {
  background-color: var(--ex-gantt-chart-date-bg-color);
  padding: 0;

  /* 縦の分割線 */
  background-image:
    repeating-linear-gradient(90deg, var(--ex-gantt-chart-date-separator-color), var(--ex-gantt-chart-date-separator-color) 1px, transparent 1px, transparent var(--ex-gantt-chart-v-main-separator-width));
  background-position: -1px 0;
  background-size: auto auto;
}

.date {
  display: grid;
}

.date-content {
  color: var(--ex-gantt-chart-date-fg-color);
  overflow: hidden;
  padding: 0.5em 1em;
  text-align: center;
  text-overflow: ellipsis;
  user-select: none;
  white-space: pre-line;
}

tbody th {
  background-color: var(--ex-gantt-chart-body-header-bg-color);
  padding: 0.5em 1em;
  user-select: none;
}

.body-header-content {
  color: var(--ex-gantt-chart-body-header-fg-color);
  white-space: pre;
}

tbody td {
  background-color: var(--ex-gantt-chart-body-data-bg-color);
  overflow-x: hidden;
  padding: 0;
  position: relative;
  width: 100%;

  /* 縦の分割線 */
  background-image:
    repeating-linear-gradient(90deg, var(--ex-gantt-chart-v-main-separator-color), var(--ex-gantt-chart-v-main-separator-color) 1px, transparent 1px, transparent var(--ex-gantt-chart-v-main-separator-width)),
    repeating-linear-gradient(90deg, var(--ex-gantt-chart-v-sub-separator-color), var(--ex-gantt-chart-v-sub-separator-color) 1px, transparent 1px, transparent var(--ex-gantt-chart-v-sub-separator-width));
  background-position: -1px 0;
  background-size: auto auto;
}

.bar {
  background-color: var(--ex-gantt-chart-bar-bg-color);
  border-radius: 0.25em;
  box-sizing: border-box;
  margin: 0.25em 0;
  overflow: hidden;
  padding: 0.5em 0;
  position: relative;
}
.bar[data-visible="false"] {
  display: none;
}

.bar-content {
  color: var(--ex-gantt-chart-bar-fg-color);
  padding: 0 0.5em;
  user-select: none;

  /* 折り返さない */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre;
}
</style>
