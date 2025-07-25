<template>
  <div ref="monacoContainer" class="monaco-container" />
</template>

<script setup lang="ts">
import * as monaco from "monaco-editor";
import { onMounted, onBeforeUnmount, ref, watch, inject } from "vue";
import { usePluginStore } from "@/store/modules/plugin";

const props = defineProps({
  value: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    default: "plaintext",
  },
  theme: {
    type: String,
    default: "vs-dark",
  },
  readOnly: {
    type: Boolean,
    default: true,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
  fileName: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["context-menu-action"]);

const monacoContainer = ref<HTMLElement | null>(null);
const pluginStore = usePluginStore();
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const initMonaco = () => {
  if (!monacoContainer.value) return;

  editor = monaco.editor.create(monacoContainer.value, {
    value: props.value,
    language: props.language,
    theme: props.theme,
    readOnly: props.readOnly,
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    wordWrap: "off",
    ...props.options,
  });
  // 添加插件右键菜单
  addPluginContextMenuActions();
};

const addPluginContextMenuActions = () => {
  if (!editor) return;
  pluginStore.loadPlugins();
  const plugins = pluginStore.getPlugins;
  plugins.forEach((plugin, index) => {
    editor!.addAction({
      id: `plugin-${plugin.id}`,
      label: `📦 ${plugin.name}`,
      contextMenuGroupId: "plugins",
      contextMenuOrder: index + 1,
      run: async (ed) => {
        try {
          const content = ed.getValue();
          if (!content.trim()) {
            emit("context-menu-action", {
              action: "plugin-error",
              text: "没有内容可以处理",
            });
            return;
          }

          // 显示处理中状态
          emit("context-menu-action", {
            action: "plugin-processing",
            text: `正在使用 ${plugin.name} 处理内容...`,
          });

          const result = await plugin.process(content, { fileName: props.fileName });
          emit("context-menu-action", {
            action: "plugin-result",
            result: result,
            pluginName: plugin.name,
            pluginId: plugin.id,
          });
        } catch (error) {
          console.error(`Plugin ${plugin.name} processing error:`, error);
          emit("context-menu-action", {
            action: "plugin-error",
            text: `${plugin.name} 处理失败: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      },
    });
  });
};

// 暴露编辑器实例和方法
defineExpose({
  getEditor: () => editor,
  getMonaco: () => monaco,
  refreshPluginMenus: () => {
    // 重新添加插件菜单
    addPluginContextMenuActions();
  },
});

watch(
  () => props.value,
  (newValue) => {
    if (editor) {
      editor.setValue(newValue);
    }
  }
);

onMounted(() => {
  initMonaco();
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});
</script>

<style scoped>
.monaco-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
