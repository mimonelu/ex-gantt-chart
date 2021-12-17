# ExGanttChart

## 課題
* 異なるガントチャート間、もしくは HTML Drag and Drop API を直接用いたドラッグ＆ドロップへの対応。

## プロパティ
```
{
  from: Date, // Default: 当日から3日前
  to: Date, // Default: 当日から3日後
  headers: [
    {
      label: string,
      classes: string | Array | Object,
      attrs: Array | Object
    },
    ...
  ],
  visibleHeaders: boolean, // Default: `true`
  dateFormatter (date) {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
  },
  body: [
    {
      headers: [
        {
          label: string,
          classes: string | Array | Object,
          attrs: Array | Object
        },
        { rowSpan: true },
        ...
      ],
      bars: [
        {
          from: Date, // Required
          to: Date, // Required
          label: string,
          classes: string | Array | Object,
          attrs: Array | Object,
          visible: boolean,
          allowDrag: boolean,
          allowResize: boolean
        },
        ...
      ],
      classes: string | Array | Object,
      attrs: Array | Object,
      allowDrag: boolean,
      allowDrop: boolean,
      allowResize: boolean
    },
    ...
  ],
  allowParallel: boolean, // Default: `true` Desc: バーを上に「詰める」ことを許可します。
  allowDrag: boolean, // Default: `true` Desc: バーのドラッグを許可します。
  allowDrop: boolean, // Default: `true` Desc: バーのドロップを許可します。
  dropToLast: boolean, // Default: `true` Desc: バーがドロップされた際、データを末尾に追加するか、先頭に追加するかを表します。
  allowResize: boolean, // Default: `true` Desc: バーのリサイズを許可します。
  subSeparatorSpan: number // Default: `6` Desc: 1日を横に分割するサブ分割線の間隔です。単位は時間です。 `0` で非表示になります。
}
```

### 注意点
* 各 `label` では HTML タグ と改行文字（ `\n` ）が有効です。
* `allowDrag` や `allowResize` などの個別に設定可能なプロパティは下位のプロパティが優先されます。全体で `allowDrag = false` であっても、 `bars` 内で `allowDrag = true` のバーがあれば、そのバーはドラッグ可能となります。

## イベント
* `clickBar({ event, bar, rowIndex, barIndex, component })` バーがクリックされた時に送信されます。
* `mouseEnterBar({ event, bar, rowIndex, barIndex, component })` バーにマウスカーソルが乗った時に送信されます。
* `mouseLeaveBar({ event, bar, rowIndex, barIndex, component })` バーからマウスカーソルが離れた時に送信されます。

## API
* `updateBarsAll(): void` すべてのバーの位置とサイズを更新します。
* `updateBarsInRow(rowIndex: number): void` 指定された行に含まれるバーの位置とサイズを更新します。
