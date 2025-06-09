<template>
  <div id="monaco" ref="monacoRef" class="monaco" />
</template>

<script setup lang="ts">
defineOptions({
  name: "Log",
});
import * as monaco from "monaco-editor";
const props = defineProps({
  code: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    default: "xml",
  },
  line: {
    type: Number,
    default: 0,
  },
});
const monacoRef = ref();
let editor = null;
const init = () => {
  editor = monaco.editor.create(monacoRef.value, {
    value: props.code,
    language: props.language,
    theme: "vs-dark",
    automaticLayout: true, // 自动调整大小
    lineHeight: 24,
    tabSize: 2,
    minimap: {
      // 关闭小地图
      enabled: false,
    },
    readOnly: false,
    domReadOnly: true,
  });
};

onMounted(() => {
  init();
});
</script>
<style scoped lang="scss">
.monaco {
  width: 100%;
  height: 100%;
}
</style>

<style>
#monaco .highlight-line {
  background-color: rgb(140 143 255 / 70%) !important; /* 设置高亮背景颜色 */
}
</style>
