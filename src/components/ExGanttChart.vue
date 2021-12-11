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
          <template v-if="!invisibleHeaders">
            <th
              v-for="header, headerIndex in headers"
              :key="`head-header-${headerIndex}`"
            >
              <div class="head-header-content">{{ header.label }}</div>
            </th>
          </template>
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
          <template v-if="!invisibleHeaders">
            <th
              v-for="header, headerIndex in row.headers"
              :key="`body-header-${rowIndex}-${headerIndex}`"
              :rowspan="rowSpan(rowIndex, headerIndex)"
              :style="{ display: header.rowSpan ? 'none': '' }"
            >
              <div class="body-header-content">{{ header.label }}</div>
            </th>
          </template>
          <td
            :ref="`td-${rowIndex}`"
            @dragenter.prevent
            @dragover.prevent
            @drop="!row.disableDrop && onDrop($event, rowIndex)"
          >
            <div
              v-for="bar, barIndex in row.bars"
              :key="barId(rowIndex, barIndex)"
              :ref="barId(rowIndex, barIndex)"
              :class="`bar${bar.classes ? ' ' + bar.classes : ''}`"
              :data-bar-id="barId(rowIndex, barIndex)"
              :data-visible="barVisible(rowIndex, barIndex).toString()"
              :draggable="bar.disableDrag != null ? !bar.disableDrag : !disableDrag"
              @dragstart="onDragStart($event, rowIndex, barIndex)"
              @click="!bar.disableOnClick && $emit('clickBar', bar)"
              @mouseenter="!bar.disableOnMouseEnter && $emit('mouseEnterBar', bar)"
              @mouseleave="!bar.disableOnMouseLeave && $emit('mouseLeaveBar', bar)"
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
const DD_MIME = 'application/ikzo-bar-index'

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

    invisibleHeaders: {
      type: Boolean,
      default: false
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
            invisible: false,
            disableDrag: false,
            disableMove: false,
            disableOnClick: false,
            disableOnMouseEnter: false,
            disableOnMouseLeave: false
          }, ...
        ],
        disableDrop: false
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

    disableParallel: {
      type: Boolean,
      default: false
    },

    disableDrag: {
      type: Boolean,
      default: false
    },

    disableMove: {
      type: Boolean,
      default: false
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

    timeOfTerm () {
      return this.toTime - this.fromTime
    },

    dateOfTerm () {
      return Math.round(this.timeOfTerm / 1000 / 60 / 60 / 24)
    },

    hoursOfTerm () {
      return this.timeOfTerm / 1000 / 60 / 60
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
      return (rowIndex, barIndex) => `bar-${rowIndex}-${barIndex}`
    },

    barVisible () {
      return (rowIndex, barIndex) => {
        const bar = this.body[rowIndex].bars[barIndex]
        if (bar.invisible) {
          return false
        }
        const barFromTime = bar.from.getTime()
        const barToTime = bar.to.getTime()
        return barFromTime <= this.toTime && this.fromTime <= barToTime
      }
    }
  },

  mounted () {
    this.updateBarStyle()
  },

  methods: {
    wait (duration) {
      return new Promise((resolve) => {
        setTimeout(resolve, duration)
      })
    },

    async updateBarStyle () {
      // バーのポジショニングとリサイズ
      for (let rowIndex = 0; rowIndex < this.body.length; rowIndex++) {
        const bars = this.body[rowIndex].bars
        for (let barIndex = 0; barIndex < bars.length; barIndex++) {
          if (!this.barVisible(rowIndex, barIndex)) {
            continue
          }
          const bar = bars[barIndex]
          const barId = this.barId(rowIndex, barIndex)
          const barElement = this.$el.querySelector(`[data-bar-id="${barId}"]`)
          const barFromTime = bar.from.getTime()
          const barToTime = bar.to.getTime()
          const left = (barFromTime - this.fromTime) / this.timeOfTerm * 100
          const width = (barToTime - barFromTime) / this.timeOfTerm * 100
          barElement.style.position = 'relative'
          barElement.style.left = `${left}%`
          barElement.style.width = `${width}%`
        }
      }

      // バーの並列化
      if (!this.disableParallel) {
        for (let rowIndex = 0; rowIndex < this.body.length; rowIndex++) {
          const bars = this.body[rowIndex].bars
          const topGroups = { 0: [bars[0]] }
          for (let barIndex = 1; barIndex < bars.length; barIndex++) {
            if (!this.barVisible(rowIndex, barIndex)) {
              continue
            }
            const bar = bars[barIndex]
            const barFromTime = bar.from.getTime()
            const barToTime = bar.to.getTime()

            let top = 0
            for (let targetIndex = 0; targetIndex < barIndex; targetIndex++) {
              if (!this.barVisible(rowIndex, targetIndex)) {
                continue
              }
              const targetBar = bars[targetIndex]
              const targetBarFromTime = targetBar.from.getTime()
              const targetBarToTime = targetBar.to.getTime()
              if (targetBarFromTime <= barToTime && barFromTime <= targetBarToTime) {
                const targetBarId = this.barId(rowIndex, targetIndex)
                const targetBarElement = this.$el.querySelector(`[data-bar-id="${targetBarId}"]`)
                const targetBottom = targetBarElement.offsetTop + targetBarElement.offsetHeight
                top = Math.max(top, targetBottom)
              }
            }

            const tops = Object.keys(topGroups)
            for (let i = 0; i < tops.length; i++) {
              let collided = false
              for (const targetBar of topGroups[tops[i]]) {
                const targetBarFromTime = targetBar.from.getTime()
                const targetBarToTime = targetBar.to.getTime()
                if (targetBarFromTime <= barToTime && barFromTime <= targetBarToTime) {
                  collided = true
                  break
                }
              }
              if (collided === false) {
                top = tops[i]
                break
              }
            }

            const barId = this.barId(rowIndex, barIndex)
            const barElement = this.$el.querySelector(`[data-bar-id="${barId}"]`)
            barElement.style.position = 'absolute'
            barElement.style.top = `${top}px`
            topGroups[top] = topGroups[top] ?? []
            topGroups[top].push(bar)
          }
        }

        // テーブル行の高さを設定
        for (let rowIndex = 0; rowIndex < this.body.length; rowIndex++) {
          const bars = this.body[rowIndex].bars
          let bottom = 0
          for (let barIndex = 0; barIndex < bars.length; barIndex++) {
            if (!this.barVisible(rowIndex, barIndex)) {
              continue
            }
            const barId = this.barId(rowIndex, barIndex)
            const barElement = this.$el.querySelector(`[data-bar-id="${barId}"]`)
            const barBottom = barElement.offsetTop + barElement.offsetHeight
            bottom = Math.max(bottom, barBottom)
          }
          this.$refs[`td-${rowIndex}`][0].style.height = `${bottom}px`
        }
      }
    },

    onDragStart (event, rowIndex, barIndex) {
      event.dataTransfer.dropEffect = 'move'
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData(DD_MIME, JSON.stringify({ rowIndex, barIndex, offset: event.offsetX }))
    },

    onDrop (event, targetIndex) {
      if (event.dataTransfer.types.includes(DD_MIME)) {
        event.preventDefault()
        const json = event.dataTransfer.getData(DD_MIME)
        const data = JSON.parse(json)
        const bar = this.body[data.rowIndex].bars[data.barIndex]

        // バーの移動が許可されている場合、ドロップできる要素は td 要素のみに制限
        if ((bar.disableMove != null ? !bar.disableMove : !this.disableMove) && event.target.tagName !== 'TD') {
          return
        }

        // バーの移動
        if (bar.disableMove != null ? !bar.disableMove : !this.disableMove) {
          const positionRatio = (event.offsetX - data.offset) / event.target.offsetWidth
          const fromTime = (this.timeOfTerm * positionRatio) + this.fromTime
          const toTime = (bar.to.getTime() - bar.from.getTime()) + fromTime
          bar.from.setTime(fromTime)
          bar.to.setTime(toTime)
        }

        this.body[targetIndex].bars.push(bar)
        this.body[data.rowIndex].bars.splice(data.barIndex, 1)
        this.$nextTick(this.updateBarStyle)
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
  overflow: hidden;
  padding: 0 0 0.25em 0;
  position: relative;
  width: 100%;
  vertical-align: top;

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
  margin-top: 0.25em;
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
