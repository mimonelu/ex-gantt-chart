<template>
  <div
    class="ex-gantt-chart"
    :data-dragging="dragging.toString()"
    :data-resizing="resizing.toString()"
    @mouseup="onMouseUp"
  >
    <table>
      <!-- ヘッド -->
      <thead>
        <tr>
          <!-- ヘッドヘッダー -->
          <template v-if="visibleHeaders">
            <th
              v-for="header, headerIndex in headers"
              :key="`head-header-${headerIndex}`"
              :class="header.classes"
              v-bind="header.attrs"
            >
              <div
                class="head-header-label"
                v-html="header.label"
              />
            </th>
          </template>

          <!-- ヘッドコンテンツ -->
          <td>
            <div
              class="head-content"
              :style="`grid-template-columns: repeat(${dateOfTerm}, 1fr);`"
            >
              <!-- 日別ボックス -->
              <div
                v-for="date, dateIndex of datesInTerm"
                :key="`date-${dateIndex}`"
                class="date"
                :data-today="isToday(date)"
                :data-day-of-week="date.getDay()"
              >
                <!-- 分割線ラベル -->
                <div
                  class="separator-label-container"
                  :style="`grid-template-columns: repeat(${numberOfSubSeparators}, 1fr);`"
                >
                  <div
                    v-for="subSeparatorIndex of numberOfSubSeparators"
                    :key="subSeparatorIndex"
                    class="separator-label"
                  >{{ (subSeparatorIndex - 1) * subSeparatorSpan }}</div>
                </div>

                <!-- 日付 -->
                <div
                  class="date-label"
                  v-html="dateFormatter(date)"
                />
              </div>
            </div>
          </td>
        </tr>
      </thead>

      <!-- ボディ -->
      <tbody>
        <tr
          v-for="row, rowIndex in body"
          :key="`body-row-${rowIndex}`"
        >
          <!-- ボディヘッダー -->
          <template v-if="visibleHeaders">
            <th
              v-for="header, headerIndex in row.headers"
              :key="`body-header-${rowIndex}-${headerIndex}`"
              :class="header.classes"
              v-bind="header.attrs"
              :rowspan="rowSpan(rowIndex, headerIndex)"
              :style="{ display: header.rowSpan ? 'none': '' }"
            >
              <div
                class="body-header-label"
                v-html="header.label"
              />
            </th>
          </template>

          <!-- ボディコンテンツ -->
          <td
            :ref="`td-${rowIndex}`"
            :class="row.classes"
            v-bind="row.attrs"
            @dragenter.prevent
            @dragover.prevent
            @drop="canDrop(rowIndex) && onDrop($event, rowIndex)"
            @mousemove="onMouseMove"
          >
            <!-- 分割線 -->
            <div
              class="separator-container"
              :style="`grid-template-columns: repeat(${dateOfTerm}, 1fr);`"
            >
              <div
                v-for="date, dateIndex of datesInTerm"
                :key="dateIndex"
                class="main-separator"
                :data-today="isToday(date)"
                :data-day-of-week="date.getDay()"
                :style="`grid-template-columns: repeat(${numberOfSubSeparators}, 1fr);`"
              >
                <div
                  v-for="subSeparatorIndex of numberOfSubSeparators"
                  :key="subSeparatorIndex"
                  class="sub-separator"
                />
              </div>
            </div>

            <!-- バー -->
            <div
              v-for="bar, barIndex in row.bars"
              :key="barId(rowIndex, barIndex)"
              :ref="barId(rowIndex, barIndex)"
              class="bar"
              :class="bar.classes"
              v-bind="bar.attrs"
              :data-bar-id="barId(rowIndex, barIndex)"
              :data-visible="barVisible(rowIndex, barIndex).toString()"
              :draggable="!resizing && canDrag(barIndex, rowIndex)"
              @dragstart="!resizing && onDragStart($event, rowIndex, barIndex)"
              @dragend="onDragEnd"
              @click="$emit('clickBar', { event: $event, bar, rowIndex, barIndex, component: self })"
              @mouseenter="$emit('mouseEnterBar', { event: $event, bar, rowIndex, barIndex, component: self })"
              @mouseleave="$emit('mouseLeaveBar', { event: $event, bar, rowIndex, barIndex, component: self })"
            >
              <div
                v-if="canResize(barIndex, rowIndex)"
                class="bar-handle"
                @mousedown="onMouseDown($event, rowIndex, barIndex, 'from')"
              />
              <div
                class="bar-content"
                v-html="bar.label"
              />
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
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function makeToDate (date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function getFirstExistingValue () {
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

    headers: {
      type: Array,
      required: true
    },

    visibleHeaders: {
      type: Boolean,
      default: true
    },

    dateFormatter: {
      type: Function,
      default (date) {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
      }
    },

    body: {
      type: Array,
      required: true
    },

    allowParallel: {
      type: Boolean,
      default: true
    },

    allowDrag: {
      type: Boolean,
      default: true
    },

    allowDrop: {
      type: Boolean,
      default: true
    },

    dropToLast: {
      type: Boolean,
      default: true
    },

    allowResize: {
      type: Boolean,
      default: true
    },

    subSeparatorSpan: {
      type: Number,
      default: 6
    }
  },

  data () {
    return {
      dragging: false,
      resizing: false,
      resizingType: null,
      resizingBar: null,
      resizingRowIndex: 0
    }
  },

  computed: {
    self () {
      return this
    },

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

    isToday () {
      return (date) => {
        return (new Date()).toDateString() === date.toDateString()
      }
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
        if (bar.visible != null && !bar.visible) {
          return false
        }
        const barFromTime = bar.from.getTime()
        const barToTime = bar.to.getTime()
        return barFromTime <= this.toTime && this.fromTime <= barToTime
      }
    },

    numberOfSubSeparators () {
      return this.subSeparatorSpan > 0 ? Math.floor(24 / this.subSeparatorSpan) : 0
    }
  },

  mounted () {
    this.updateBarsAll()
  },

  methods: {
    updateBarsAll () {
      for (let rowIndex = 0; rowIndex < this.body.length; rowIndex++) {
        this.updateBarsInRow(rowIndex)
      }
    },

    updateBarsInRow (rowIndex) {
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
      if (this.allowParallel) {
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
      return getFirstExistingValue(
        this.body[rowIndex]?.bars[barIndex]?.allowDrag,
        this.body[rowIndex]?.allowDrag,
        this.allowDrag
      )
    },

    canDrop (rowIndex) {
      return getFirstExistingValue(this.body[rowIndex]?.allowDrop, this.allowDrop)
    },

    onDragStart (event, rowIndex, barIndex) {
      this.dragging = true
      event.dataTransfer.dropEffect = 'move'
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData(DD_MIME, JSON.stringify({ rowIndex, barIndex, offset: event.offsetX }))
    },

    onDragEnd () {
      this.dragging = false
    },

    onDrop (event, targetIndex) {
      if (event.dataTransfer.types.includes(DD_MIME)) {
        event.preventDefault()
        const json = event.dataTransfer.getData(DD_MIME)
        const data = JSON.parse(json)
        const bar = this.body[data.rowIndex].bars[data.barIndex]

        // td 要素上のマウスポジションと td 要素の幅を取得
        let offsetX = event.offsetX
        let element = event.target
        while (element != null && element.tagName !== 'TD') {
          offsetX += element.offsetLeft
          element = element.parentNode
        }
        const offsetWidth = element?.offsetWidth ?? 0

        // バーの期間設定
        const positionRatio = (offsetX - data.offset) / offsetWidth
        const fromTime = (this.timeOfTerm * positionRatio) + this.fromTime
        const toTime = (bar.to.getTime() - bar.from.getTime()) + fromTime
        bar.from.setTime(fromTime)
        bar.to.setTime(toTime)

        // バーデータの移動
        if (targetIndex !== data.rowIndex) {
          if (this.dropToLast) {
            this.body[targetIndex].bars.push(bar)
          } else {
            this.body[targetIndex].bars.unshift(bar)
          }
          this.body[data.rowIndex].bars.splice(data.barIndex, 1)
        }

        this.$nextTick(this.updateBarsAll)
      }
    },

    // バーのリサイズ

    canResize (barIndex, rowIndex) {
      return getFirstExistingValue(
        this.body[rowIndex]?.bars[barIndex]?.allowResize,
        this.body[rowIndex]?.allowResize,
        this.allowResize
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
          this.updateBarsInRow(this.resizingRowIndex)
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
  /* 枠線 */
  --exgc-border-color: #c0c0c0;

  /* ヘッドヘッダー */
  --exgc-head-header-bg-color: #d0d0d0;
  --exgc-head-header-fg-color: #303030;
  --exgc-head-h-padding: 1em;
  --exgc-head-v-padding: 1em;

  /* 日別ボックス */
  --exgc-date-bg-color: #d0d0d0;
  --exgc-date-fg-color: #303030;
  --exgc-date-separator-color: #c0c0c0;

  /* 分割線ラベル */
  --exgc-separator-label-color: #a0a0a0;

  /* ボディヘッダー */
  --exgc-body-header-bg-color: #e0e0e0;
  --exgc-body-header-fg-color: #202020;

  /* ボディコンテンツ */
  --exgc-body-content-bg-color: #f0f0f0;

  /* 分割線 */
  --exgc-main-separator-color: #c0c0c0;
  --exgc-sub-separator-color: #e0e0e0;

  /* バー */
  --exgc-bar-bg-color: #0080f0;
  --exgc-bar-fg-color: #f0f0f0;
  --exgc-bar-handle-color: #0060d0;
  --exgc-bar-margin: 0.25em;

  /* 本日 */
  --exgc-today-color: #00c000;

  /* 曜日 */
  --exgc-sunday-rgb: 224, 96, 0;
  --exgc-saturday-rgb: 0, 96, 224;
}
</style>

<style scoped>
.ex-gantt-chart {
  user-select: none;
}
.ex-gantt-chart[data-dragging="true"] {
  cursor: move;
}
.ex-gantt-chart[data-resizing="true"] {
  cursor: col-resize;
}

table {
  background-color: var(--exgc-border-color);
  border-spacing: 1px;
  width: 100%;

  /* td 要素内で `height: 100%;` を適用するため */
  height: 1px;
}

/* ヘッドヘッダー */

thead th {
  background-color: var(--exgc-head-header-bg-color);
  padding: var(--exgc-head-h-padding) var(--exgc-head-v-padding);
}

.head-header-label {
  color: var(--exgc-head-header-fg-color);
  white-space: pre;
}

/* ヘッドコンテンツ */

thead td {
  background-color: var(--exgc-date-bg-color);
  padding: 0;

  /* td 要素内で `height: 100%;` を適用するため */
  height: 100%;
}

.head-content {
  display: grid;
  height: 100%;
}

/* 日別ボックス */

.date {
  overflow: hidden;
  position: relative;
}
.date[data-today="true"]::before {
  background-color: var(--exgc-today-color);
  content: "";
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 0.25em;
}
.date[data-day-of-week="0"] {
  background-color: rgba(var(--exgc-sunday-rgb), 0.125);
}
.date[data-day-of-week="6"] {
  background-color: rgba(var(--exgc-saturday-rgb), 0.125);
}
.date:not(:first-child) {
  border-left: 1px solid var(--exgc-date-separator-color);
}

/* 分割線ラベル */

.separator-label-container {
  display: grid;
  justify-content: space-between;
  position: absolute;
  left: 0;
  bottom: 0.125em;
  width: 100%;
}

.separator-label {
  color: var(--exgc-separator-label-color);
  font-size: x-small;
  line-height: 1;
  margin-left: 0.25em;
  overflow: hidden;
}

/* 日付 */

.date-label {
  color: var(--exgc-date-fg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100% - (var(--exgc-head-v-padding) * 2));
  overflow: hidden;
  padding: var(--exgc-head-h-padding) var(--exgc-head-v-padding);
  text-overflow: ellipsis;
  white-space: pre-line;
}
.date[data-day-of-week="0"] .date-label {
  color: rgb(var(--exgc-sunday-rgb));
}
.date[data-day-of-week="6"] .date-label {
  color: rgb(var(--exgc-saturday-rgb));
}

/* ボディヘッダー */

tbody th {
  background-color: var(--exgc-body-header-bg-color);
  padding: 0.5em 1em;
}

.body-header-label {
  color: var(--exgc-body-header-fg-color);
  white-space: pre;
}

/* ボディコンテンツ */

tbody td {
  background-color: var(--exgc-body-content-bg-color);
  overflow: hidden;
  padding: 0 0 var(--exgc-bar-margin) 0;
  position: relative;
  width: 100%;
  vertical-align: top;
}

/* 分割線 */

.separator-container {
  display: grid;
  pointer-events: none;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.main-separator {
  display: grid;
}
.main-separator[data-day-of-week="0"] {
  background-color: rgba(var(--exgc-sunday-rgb), 0.125);
}
.main-separator[data-day-of-week="6"] {
  background-color: rgba(var(--exgc-saturday-rgb), 0.125);
}
.main-separator:not(:first-child) {
  border-left: 1px solid var(--exgc-main-separator-color);
}

.sub-separator:not(:first-child) {
  border-left: 1px solid var(--exgc-sub-separator-color);
}

/* バー */

.bar {
  background-color: var(--exgc-bar-bg-color);
  margin-top: var(--exgc-bar-margin);
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
  background-color: var(--exgc-bar-handle-color);
  cursor: col-resize;
  position: absolute;
  top: 0;
  width: 0.5em;
  height: 100%;
}
.bar-handle:first-child {
  left: 0;
}
.bar-handle:last-child {
  right: 0;
}

.bar-content {
  color: var(--exgc-bar-fg-color);
  padding: 0.5em 1em;
  pointer-events: none;
  text-align: center;

  /* 折り返さない */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre;
}
</style>
