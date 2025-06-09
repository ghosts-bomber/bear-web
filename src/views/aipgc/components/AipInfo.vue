<template>
  <div class="aip-info-container">
    <div class="left-panel" :style="{ width: leftPanelWidth + 'px' }">
      <el-form label-position="right" label-width="auto" style="max-width: 600px">
        <el-form-item label="aip" label-position="right">
          <el-link class="mx-1" type="primary" :href="aipInfo.jiraIssueLink" target="_blank">
            {{ aipInfo.jiraIssueKey }}
          </el-link>
        </el-form-item>

        <el-form-item label="car id" label-position="right">
          <el-text class="mx-1">{{ aipInfo.carId }}</el-text>
        </el-form-item>

        <el-form-item label="cyberrt version" label-position="right">
          <el-text class="mx-1">{{ aipInfo.carCyberRtVersion }}</el-text>
        </el-form-item>

        <el-form-item label="问题时间点" label-position="right">
          <el-text class="mx-1">{{ aipInfo.dateTime }}</el-text>
        </el-form-item>

        <el-form-item label="故障描述" label-position="right">
          <el-text class="mx-1">{{ aipInfo.remark }}</el-text>
        </el-form-item>

        <el-form-item label="dv" label-position="right">
          <el-link class="mx-1" type="primary" :href="dvLink" target="_blank">看dv点我</el-link>
        </el-form-item>
      </el-form>

      <el-table
        :data="aipDataInfo.logFiles"
        stripe
        style="width: 100%"
        @row-dblclick="logDbClickedHandle"
      >
        <el-table-column property="name" label="文件名" width="240" show-overflow-tooltip />
        <el-table-column property="filesize" label="大小" width="120" />
      </el-table>

      <el-table :data="aipDataInfo.record3dayLinks" style="width: 100%">
        <el-table-column label="record url">
          <template #default="scope">
            {{ scope.row }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="resize-handle" @mousedown="startResize" />
    <div class="right-panel" :style="{ width: `calc(100% - ${leftPanelWidth}px - 10px)` }">
      <!-- 空状态显示 -->
      <div v-if="openTabs.length === 0" class="empty-state">
        <div class="empty-content">
          <el-icon size="48" color="#c0c4cc"><Document /></el-icon>
          <p>双击左侧日志文件以打开查看</p>
        </div>
      </div>

      <!-- Tab页面 -->
      <el-tabs
        v-else
        v-model="activeTab"
        type="card"
        closable
        class="log-tabs"
        @tab-remove="removeTab"
        @tab-click="handleTabClick"
      >
        <el-tab-pane v-for="tab in openTabs" :key="tab.id" :name="tab.id" :closable="true">
          <template #label>
            <div class="tab-label-container" @contextmenu.prevent="showTabContextMenu($event, tab)">
              <el-icon class="tab-icon" size="14"><DocumentCopy /></el-icon>
              <el-tooltip :content="tab.fullName" placement="top" :disabled="tab.name.length <= 25">
                <span class="tab-label">{{ tab.name }}</span>
              </el-tooltip>
            </div>
          </template>
          <div class="tab-content">
            <LogViewer :content="tab.content" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import LogViewer from "@/components/LogViewer/index.vue";
import type { AxiosResponse } from "axios";
import PTApi from "@/api/platform";
import { useAipStore } from "@/store";
import pako from "pako";
import Tar from "parse-tar";
import { Document, DocumentCopy } from "@element-plus/icons-vue";

interface AipInfo {
  carCyberRtVersion?: string;
  carId?: string;
  carMapVersion?: string;
  carOtherVersion?: string;
  createTime?: string;
  dateTime?: string;
  dvObjName?: string;
  id: number;
  jiraIssueKey?: string;
  jiraIssueLink?: string;
  machineType?: string;
  mainQuestionId?: number;
  ossName?: string;
  remark?: string;
  reporter?: string;
  status?: number;
  subQuestionId?: number;
  subType?: string;
  title?: string;
  type?: string;
}

interface LogFile {
  cut: boolean;
  filesize: number;
  name: string;
  objName: string;
  updateTime: string;
}

interface AipDataInfo {
  dvLinks: string[];
  logFiles: LogFile[];
  ossName?: string;
  record3dayLinks: string[];
}

interface LogTab {
  id: string;
  name: string;
  fullName: string;
  content: string;
  logFile: LogFile;
}

const props = defineProps({
  code: { type: String, required: true },
});

const aipStroe = useAipStore();
console.log("get aip code:", props.code);
let info = aipStroe.getAipInfo(props.code);
console.info("get stroe info:", info);
const aipInfo = reactive(info as AipInfo);
const aipDataInfo = reactive<AipDataInfo>({
  dvLinks: [],
  logFiles: [],
  record3dayLinks: [],
});

PTApi.aipDataInfo(aipInfo.id)
  .then((response: any) => {
    console.log("API Response:", response);
    if (response) {
      aipDataInfo.dvLinks = response.dvLinks || [];
      aipDataInfo.logFiles = response.logFiles || [];
      aipDataInfo.record3dayLinks = response.record3dayLinks || [];
      aipDataInfo.ossName = response.ossName;
    }
    console.log("aipDataInfo:", aipDataInfo);
  })
  .catch((error) => {
    console.error("Failed to fetch AIP data:", error);
  });

const dvLink = computed(() => {
  return (
    "http://ndp.data.neolix.cn/neodata/#/dvPlay?recordPath=" +
    aipInfo.dvObjName +
    "&mapName=" +
    aipInfo.carMapVersion +
    "&carId=" +
    aipInfo.carId +
    "&version=" +
    aipInfo.carCyberRtVersion +
    "&ossName=" +
    aipDataInfo.ossName
  );
});

// Tab相关状态
const openTabs = ref<LogTab[]>([]);
const activeTab = ref<string>("");

// 文件名缩略处理
const truncateFileName = (name: string, maxLength: number = 25): string => {
  if (name.length <= maxLength) return name;
  const extension = name.split(".").pop() || "";
  const nameWithoutExt = name.substring(0, name.lastIndexOf(".")) || name;
  const availableLength = maxLength - extension.length - 3; // 3 for "..."

  if (availableLength > 0) {
    return nameWithoutExt.substring(0, availableLength) + "..." + extension;
  }
  return name.substring(0, maxLength - 3) + "...";
};

// 生成唯一的Tab ID
const generateTabId = (logFile: LogFile): string => {
  return `tab-${logFile.objName}-${Date.now()}`;
};

// 移除Tab
const removeTab = (targetName: string | number) => {
  const targetId = String(targetName);
  const index = openTabs.value.findIndex((tab) => tab.id === targetId);
  if (index !== -1) {
    openTabs.value.splice(index, 1);

    // 如果关闭的是当前活跃的tab，切换到其他tab
    if (activeTab.value === targetId) {
      if (openTabs.value.length > 0) {
        // 切换到前一个tab，如果没有则切换到下一个
        const newIndex = index > 0 ? index - 1 : 0;
        activeTab.value = openTabs.value[newIndex]?.id || "";
      } else {
        activeTab.value = "";
      }
    }
  }
};

// 添加新Tab
const addTab = (logFile: LogFile, content: string) => {
  // 检查是否已经打开了这个文件
  const existingTab = openTabs.value.find((tab) => tab.logFile.objName === logFile.objName);

  if (existingTab) {
    // 如果已经打开，切换到该tab并更新内容
    activeTab.value = existingTab.id;
    existingTab.content = content;
  } else {
    // 创建新tab
    const newTab: LogTab = {
      id: generateTabId(logFile),
      name: truncateFileName(logFile.name),
      fullName: logFile.name,
      content: content,
      logFile: logFile,
    };

    openTabs.value.push(newTab);
    activeTab.value = newTab.id;
  }
};

// 处理Tab点击
const handleTabClick = (tab: any) => {
  // 这里可以添加额外的Tab点击逻辑
  console.log(`切换到Tab: ${tab.props.name}`);
};

// 显示Tab右键菜单
const showTabContextMenu = (event: MouseEvent, tab: LogTab) => {
  // 简化实现：直接显示确认对话框
  ElMessageBox.confirm(`确定要关闭 "${tab.fullName}" 吗？`, "关闭Tab", {
    confirmButtonText: "关闭",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      removeTab(tab.id);
    })
    .catch(() => {
      // 用户取消操作
    });
};

const logDbClickedHandle = async (row: any, column: any, event: Event) => {
  let logFile = row as LogFile;
  let url: string = "";

  // 显示加载状态
  const loadingMessage = ElMessage({
    message: `正在加载 ${logFile.name}...`,
    type: "info",
    duration: 0,
    showClose: true,
  });

  try {
    await PTApi.getFileDownloadUrl(logFile.objName)
      .then((data: AxiosResponse) => {
        console.log("data:", data);
        url = data as unknown as string;
        console.log("file url", url);
      })
      .catch()
      .finally();

    const url_match = url.match(/https?:\/\/[^/]+(\/.+)/);
    if (url_match !== null) {
      await PTApi.downloadFile(url_match[1]).then(async (response: AxiosResponse) => {
        try {
          // 解压 gzip 数据
          const inflatedData = pako.inflate(new Uint8Array(response.data));
          // 创建解压后的 Blob
          const tarBuffer = new Blob([inflatedData], { type: "application/x-tar" });
          // 将 Blob 转换为 ArrayBuffer
          const arrayBuffer = await tarBuffer.arrayBuffer();
          // 解析 tar 文件
          const files = await Tar(arrayBuffer);
          console.log("Extracted files:", files);

          if (files && files.length > 0) {
            const file = files[files.length - 1];
            // 获取文件的实际内容
            const fileContent = await file.contents;
            // 使用 TextDecoder 解码文件内容
            const decoder = new TextDecoder();
            const content = decoder.decode(fileContent);

            // 添加到Tab中
            addTab(logFile, content);

            // 关闭加载提示，显示成功消息
            loadingMessage.close();
            ElMessage.success(`${logFile.name} 加载完成`);
          }
        } catch (error) {
          console.error("Error processing tar.gz file:", error);
          loadingMessage.close();
          ElMessage.error(`处理文件 ${logFile.name} 时出错: ${error}`);
        }
      });
    } else {
      console.log("download file:can't find match params,url:", url);
      loadingMessage.close();
      ElMessage.error("无法获取文件下载链接");
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    loadingMessage.close();
    ElMessage.error(`下载文件 ${logFile.name} 时出错`);
  }
};

// 添加左右面板宽度控制相关的代码
const leftPanelWidth = ref(0);
const isResizing = ref(false);

// 键盘快捷键处理
const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl+W 关闭当前Tab
  if (e.ctrlKey && e.key === "w" && activeTab.value) {
    e.preventDefault();
    removeTab(activeTab.value);
  }
  // Ctrl+Shift+T 重新打开最近关闭的Tab（如果需要的话）
  // 可以在这里添加更多快捷键
};

// 计算初始宽度（1:3 比例）
onMounted(() => {
  const containerWidth = document.querySelector(".aip-info-container")?.clientWidth || 0;
  leftPanelWidth.value = containerWidth / 4; // 1/4 的宽度

  // 添加键盘事件监听
  document.addEventListener("keydown", handleKeydown);
});

// 清理事件监听器
onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
});

// 处理拖动开始
const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", stopResize);
};

// 处理拖动过程
const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return;

  const container = document.querySelector(".aip-info-container");
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const newWidth = e.clientX - containerRect.left;

  // 设置最小宽度限制
  const minWidth = 200;
  const maxWidth = containerRect.width - 300; // 右侧面板最小宽度 300px

  if (newWidth >= minWidth && newWidth <= maxWidth) {
    leftPanelWidth.value = newWidth;
  }
};

// 处理拖动结束
const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", stopResize);
};
</script>

<style scoped>
.aip-info-container {
  position: relative;
  display: flex;
  gap: 10px;
  height: calc(100vh - 100px);
  overflow: hidden;
}

.left-panel {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  overflow-y: auto;
}

.right-panel {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  height: 100%;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.resize-handle {
  width: 10px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
}

.resize-handle:hover {
  background-color: #409eff;
}

.resize-handle:active {
  background-color: #66b1ff;
}

.empty-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.empty-content {
  color: #909399;
  text-align: center;
}

.empty-content p {
  margin-top: 16px;
  font-size: 14px;
}

.log-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
}

.log-tabs :deep(.el-tabs__header) {
  flex-shrink: 0;
  padding: 0 8px;
  margin: 0;
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
}

.log-tabs :deep(.el-tabs__nav-wrap) {
  background: transparent;
  border-bottom: none;
}

.log-tabs :deep(.el-tabs__content) {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.log-tabs :deep(.el-tab-pane) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 确保LogViewer在Tab中能占满空间 */
.tab-content :deep(.log-viewer) {
  display: flex;
  flex: 1;
  height: 100%;
}

/* 确保MonacoEditor在LogViewer中能占满空间 */
.tab-content :deep(.monaco-container) {
  flex: 1;
  height: 100%;
  min-height: 200px;
}

.tab-label-container {
  display: flex;
  gap: 6px;
  align-items: center;
  max-width: 200px;
}

.tab-icon {
  flex-shrink: 0;
  color: #909399;
}

.tab-label {
  display: inline-block;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-tabs :deep(.el-tabs__item) {
  max-width: 250px;
  padding: 0 12px;
}

.log-tabs :deep(.el-tabs__item.is-active) {
  background: #fff;
  border-bottom-color: #fff;
}

.rich-text-panel {
  display: flex;
  flex-direction: column;
  width: 300px;
  border-left: 1px solid #dcdfe6;
}

.rich-text-header {
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.rich-text-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.rich-text-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

.action-item {
  margin-bottom: 8px;
  line-height: 1.5;
}

.action-item .time {
  margin-right: 8px;
  color: #909399;
}

.action-item .action {
  margin-right: 8px;
  color: #409eff;
}

.action-item .text {
  color: #606266;
  word-break: break-all;
}
</style>
