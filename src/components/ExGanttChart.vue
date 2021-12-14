<template>
  <div
    class="ex-gantt-chart"
    :data-resizing="resizing"
    :style="{
      '--ex-gantt-chart-v-main-separator-width': `calc(100% / ${hoursOfTerm / mainSeparatorSpan})`,
      '--ex-gantt-chart-v-sub-separator-width': `calc(100% / ${hoursOfTerm / subSeparatorSpan})`,
    }"
    @mouseup="onMouseUp"
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
            @drop="canDrop(rowIndex) && onDrop($event, rowIndex)"
            @mousemove="onMouseMove"
          >
            <div
              v-for="bar, barIndex in row.bars"
              :key="barId(rowIndex, barIndex)"
              :ref="barId(rowIndex, barIndex)"
              :class="`bar${bar.classes ? ' ' + bar.classes : ''}`"
              :data-bar-id="barId(rowIndex, barIndex)"
              :data-visible="barVisible(rowIndex, barIndex).toString()"
              :draggable="!resizing && canDrag(barIndex, rowIndex)"
              @dragstart="!resizing && onDragStart($event, rowIndex, barIndex)"
              @click="$emit('clickBar', bar)"
              @mouseenter="$emit('mouseEnterBar', bar)"
              @mouseleave="$emit('mouseLeaveBar', bar)"
            >
              <div
                v-if="canResize(barIndex, rowIndex)"
                class="bar-handle"
                @mousedown="onMouseDown($event, rowIndex, barIndex, 'from')"
              />
              <div class="bar-content">{{ bar.label }}</div>
              <div
                v-if="canResize(barIndex, rowIndex)"
                class="bar-handle"
                @mousedown="onMouseDown($event, rowIndex, barIndex, 'to')"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
const DD_MIME = 'application/ikzo-bar-index'

function makeFromDate (date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function makeToDate (date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
}

function choise () {
  for (const argument of arguments) {
    if (argument != null) {
      return argument
    }
  }
  return null
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
            disableResize: false
          }, ...
        ],
        disableDrop: false,
        disableResize: false
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

    disableDrop: {
      type: Boolean,
      default: false
    },

    dropToFirst: {
      type: Boolean,
      default: false
    },

    disableResize: {
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

  data () {
    return {
      resizing: false,
      resizingType: null,
      resizingBar: null,
      resizingRowIndex: 0
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
    this.updateBarStyleAll()
  },

  methods: {
    updateBarStyleAll () {
      for (let rowIndex = 0; rowIndex < this.body.length; rowIndex++) {
        this.updateBarStyleInRow(rowIndex)
      }
    },

    updateBarStyleInRow (rowIndex) {
      // バーのポジショニングとリサイズ
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
        const barLeft = (barFromTime - this.fromTime) / this.timeOfTerm * 100
        const barWidth = (barToTime - barFromTime) / this.timeOfTerm * 100
        barElement.style.position = 'relative'
        barElement.style.left = `${barLeft}%`
        barElement.style.width = `${barWidth}%`
      }

      // バーの並列化とテーブル高の設定
      if (!this.disableParallel) {
        // バーの並列化
        // WANT: 要リファクタリング
        const topGroups = {}
        for (let barIndex = 0; barIndex < bars.length; barIndex++) {
          if (!this.barVisible(rowIndex, barIndex)) {
            continue
          }
          const bar = bars[barIndex]
          const barFromTime = bar.from.getTime()
          const barToTime = bar.to.getTime()
          const barId = this.barId(rowIndex, barIndex)
          const barElement = this.$el.querySelector(`[data-bar-id="${barId}"]`)

          let barTop = 0
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
              barTop = Math.max(barTop, targetBottom)
            }
          }

          const tops = Object.keys(topGroups)
          for (const top of tops) {
            let collided = false
            for (const targetBar of topGroups[top]) {
              const targetBarFromTime = targetBar.from.getTime()
              const targetBarToTime = targetBar.to.getTime()
              if (targetBarFromTime <= barToTime && barFromTime <= targetBarToTime) {
                collided = true
                break
              }
            }
            if (collided === false) {
              barTop = top
              break
            }
          }

          barElement.style.position = 'absolute'
          barElement.style.top = `${barTop}px`
          topGroups[barTop] = topGroups[barTop] ?? []
          topGroups[barTop].push(bar)
        }

        // テーブル高の設定
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
    },

    // バーの移動

    canDrag (barIndex, rowIndex) {
      return !choise(
        this.body[rowIndex]?.bars[barIndex]?.disableDrag,
        this.body[rowIndex]?.disableDrag,
        this.disableDrag
      )
    },

    canDrop (rowIndex) {
      return !choise(null, this.body[rowIndex]?.disableDrop, this.disableDrop)
    },

    onDragStart (event, rowIndex, barIndex) {
      event.dataTransfer.dropEffect = 'move'
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData(DD_MIME, JSON.stringify({ rowIndex, barIndex, offset: event.offsetX }))
    },

    onDrop (event, targetIndex) {
      if (event.dataTransfer.types.includes(DD_MIME)) {
        event.preventDefault()

        // ドロップできる要素は td 要素のみ
        if (event.target.tagName !== 'TD') {
          return
        }

        const json = event.dataTransfer.getData(DD_MIME)
        const data = JSON.parse(json)
        const bar = this.body[data.rowIndex].bars[data.barIndex]

        // バーの移動
        const positionRatio = (event.offsetX - data.offset) / event.target.offsetWidth
        const fromTime = (this.timeOfTerm * positionRatio) + this.fromTime
        const toTime = (bar.to.getTime() - bar.from.getTime()) + fromTime
        bar.from.setTime(fromTime)
        bar.to.setTime(toTime)

        // バーデータの移動
        if (targetIndex !== data.rowIndex) {
          if (this.dropToFirst) {
            this.body[targetIndex].bars.unshift(bar)
          } else {
            this.body[targetIndex].bars.push(bar)
          }
          this.body[data.rowIndex].bars.splice(data.barIndex, 1)
        }

        this.$nextTick(this.updateBarStyleAll)
      }
    },

    // バーのリサイズ

    canResize (barIndex, rowIndex) {
      return !choise(
        this.body[rowIndex]?.bars[barIndex]?.disableResize,
        this.body[rowIndex]?.disableResize,
        this.disableResize
      )
    },

    onMouseDown (event, rowIndex, barIndex, type) {
      if (this.canResize(barIndex, rowIndex)) {
        this.resizing = true
        this.resizingType = type
        this.resizingBar = this.body[rowIndex].bars[barIndex]
        this.resizingRowIndex = rowIndex
      }
    },

    onMouseMove (event) {
      if (this.resizing) {
        const mouseX = event.offsetX
        const tdWidth = this.$refs[`td-${this.resizingRowIndex}`][0].offsetWidth
        const barFromOrToTime = this.fromTime + ((mouseX / tdWidth) * this.timeOfTerm)
        const barFromOrTo = this.resizingBar[this.resizingType]
        const barTerm = this.resizingType === 'from'
          ? this.resizingBar.to.getTime() - barFromOrToTime
          : barFromOrToTime - this.resizingBar.from.getTime()
        const minTime = this.timeOfTerm / 100

        // バーの期間が全期間の 1 / 100 以上であればリサイズ
        if (barTerm >= minTime) {
          barFromOrTo.setTime(barFromOrToTime)
          this.updateBarStyleInRow(this.resizingRowIndex)
        }
      }
    },

    onMouseUp () {
      if (this.resizing) {
        this.resizing = false
        this.resizingType = null
        this.resizingBar = null
        this.resizingRowIndex = 0
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
  --ex-gantt-chart-bar-handle-color: #0080f0;
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
  user-select: none;
}

.date-content {
  color: var(--ex-gantt-chart-date-fg-color);
  overflow: hidden;
  padding: 0.5em 1em;
  text-align: center;
  text-overflow: ellipsis;
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
  display: flex;
  justify-content: space-between;
  margin-top: 0.25em;
  overflow: hidden;
  position: relative;
}
.bar[data-visible="false"] {
  display: none;
}
[data-resizing="true"] .bar {
  pointer-events: none;
}

.bar-handle {
  background-color: var(--ex-gantt-chart-bar-handle-color);
  cursor: col-resize;
  min-width: 0.5em;
}

.bar-content {
  color: var(--ex-gantt-chart-bar-fg-color);
  padding: 0.5em;
  user-select: none;

  /* 折り返さない */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre;
}
</style>
