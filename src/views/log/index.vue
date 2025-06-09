<template>
  <div class="log-analysis-container">
    <!-- Background decorations -->
    <div class="bg-decoration decoration-1" />
    <div class="bg-decoration decoration-2" />
    <div class="bg-decoration decoration-3" />

    <div class="log-content">
      <!-- Header Section -->
      <div class="log-header">
        <div class="header-icon">
          <el-icon size="60" color="#F56C6C">
            <Document />
          </el-icon>
        </div>
        <h1 class="log-title">日志分析中心</h1>
        <p class="log-subtitle">实时日志查看与分析，多维度数据可视化</p>
      </div>

      <!-- Quick Actions -->
      <div class="actions-grid">
        <div class="action-card">
          <div class="action-icon">
            <el-icon size="32" color="#409eff"><Upload /></el-icon>
          </div>
          <h3>上传日志</h3>
          <p>支持多种格式的日志文件上传</p>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleLogUpload"
            accept=".log,.txt,.json"
            class="upload-component"
          >
            <el-button type="primary" size="large">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
          </el-upload>
        </div>

        <div class="action-card">
          <div class="action-icon">
            <el-icon size="32" color="#67c23a"><Connection /></el-icon>
          </div>
          <h3>实时连接</h3>
          <p>连接到实时日志流进行监控</p>
          <el-button type="success" size="large" :loading="isConnecting" @click="connectRealTime">
            <el-icon><Connection /></el-icon>
            {{ isConnecting ? "连接中..." : "实时连接" }}
          </el-button>
        </div>

        <div class="action-card">
          <div class="action-icon">
            <el-icon size="32" color="#e6a23c"><DataAnalysis /></el-icon>
          </div>
          <h3>智能分析</h3>
          <p>AI驱动的日志内容深度分析</p>
          <el-button type="warning" size="large" :disabled="!hasLogContent" @click="startAnalysis">
            <el-icon><DataAnalysis /></el-icon>
            开始分析
          </el-button>
        </div>
      </div>

      <!-- Main Editor Area -->
      <div class="editor-section">
        <div class="editor-header">
          <div class="header-left">
            <h3 class="editor-title">
              <el-icon size="20" color="#f56c6c"><Document /></el-icon>
              日志编辑器
            </h3>
            <div class="editor-stats">
              <span class="stat-item">行数: {{ lineCount }}</span>
              <span class="stat-item">大小: {{ formatFileSize(contentSize) }}</span>
              <span class="stat-item">编码: UTF-8</span>
            </div>
          </div>
          <div class="header-right">
            <el-button-group>
              <el-button size="small" @click="clearContent">
                <el-icon><Delete /></el-icon>
                清空
              </el-button>
              <el-button size="small" @click="copyContent">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
              <el-button size="small" @click="downloadContent">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
            </el-button-group>
            <el-dropdown @command="handleThemeChange">
              <el-button size="small">
                <el-icon><Setting /></el-icon>
                主题
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="vs-dark">深色主题</el-dropdown-item>
                  <el-dropdown-item command="vs">浅色主题</el-dropdown-item>
                  <el-dropdown-item command="hc-black">高对比度</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="editor-container">
          <div id="monaco" ref="monacoRef" class="monaco-editor" />

          <!-- Analysis Panel -->
          <div v-if="showAnalysisPanel" class="analysis-panel">
            <div class="panel-header">
              <h4>分析结果</h4>
              <el-button size="small" text @click="closeAnalysisPanel">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="panel-content">
              <div class="analysis-tabs">
                <el-tabs v-model="activeAnalysisTab" type="card">
                  <el-tab-pane label="错误统计" name="errors">
                    <div class="analysis-section">
                      <div class="metric-card">
                        <div class="metric-number">{{ analysisResults.errorCount }}</div>
                        <div class="metric-label">错误数量</div>
                      </div>
                      <div class="metric-card">
                        <div class="metric-number">{{ analysisResults.warningCount }}</div>
                        <div class="metric-label">警告数量</div>
                      </div>
                      <div class="metric-card">
                        <div class="metric-number">{{ analysisResults.infoCount }}</div>
                        <div class="metric-label">信息数量</div>
                      </div>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="时间分布" name="timeline">
                    <div class="chart-container">
                      <div ref="timelineChart" class="chart" />
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="关键词" name="keywords">
                    <div class="keywords-section">
                      <el-tag
                        v-for="keyword in analysisResults.keywords"
                        :key="keyword.word"
                        :type="getKeywordType(keyword.level)"
                        class="keyword-tag"
                      >
                        {{ keyword.word }} ({{ keyword.count }})
                      </el-tag>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Tools -->
      <div class="tools-section">
        <div class="tools-header">
          <h3>快速工具</h3>
        </div>
        <div class="tools-grid">
          <div class="tool-card" @click="searchInLogs">
            <el-icon size="24" color="#409eff"><Search /></el-icon>
            <span>搜索日志</span>
          </div>
          <div class="tool-card" @click="filterLogs">
            <el-icon size="24" color="#67c23a"><Filter /></el-icon>
            <span>过滤内容</span>
          </div>
          <div class="tool-card" @click="exportLogs">
            <el-icon size="24" color="#e6a23c"><Download /></el-icon>
            <span>导出数据</span>
          </div>
          <div class="tool-card" @click="shareLogs">
            <el-icon size="24" color="#f56c6c"><Share /></el-icon>
            <span>分享链接</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import * as monaco from "monaco-editor";
import {
  Document,
  Upload,
  Connection,
  DataAnalysis,
  Delete,
  CopyDocument,
  Download,
  Setting,
  ArrowDown,
  Close,
  Search,
  Filter,
  Share,
} from "@element-plus/icons-vue";

defineOptions({
  name: "Log",
});

// Monaco Editor props (keeping compatibility)
const props = defineProps({
  code: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    default: "plaintext",
  },
  line: {
    type: Number,
    default: 0,
  },
});

// Reactive data
const monacoRef = ref();
const uploadRef = ref();
const timelineChart = ref();
const isConnecting = ref(false);
const showAnalysisPanel = ref(false);
const activeAnalysisTab = ref("errors");
const currentTheme = ref("vs-dark");

let editor: any = null;

// Sample analysis results
const analysisResults = ref({
  errorCount: 12,
  warningCount: 34,
  infoCount: 156,
  keywords: [
    { word: "ERROR", count: 12, level: "high" },
    { word: "WARNING", count: 34, level: "medium" },
    { word: "INFO", count: 156, level: "low" },
    { word: "TIMEOUT", count: 8, level: "high" },
    { word: "SUCCESS", count: 203, level: "low" },
  ],
});

// Computed properties
const hasLogContent = computed(() => {
  return editor && editor.getValue().trim().length > 0;
});

const lineCount = computed(() => {
  if (!editor) return 0;
  return editor.getModel()?.getLineCount() || 0;
});

const contentSize = computed(() => {
  if (!editor) return 0;
  return new Blob([editor.getValue()]).size;
});

// Methods
const init = () => {
  if (!monacoRef.value) return;

  editor = monaco.editor.create(monacoRef.value, {
    value: props.code || generateSampleLog(),
    language: props.language,
    theme: currentTheme.value,
    automaticLayout: true,
    lineHeight: 24,
    tabSize: 2,
    minimap: {
      enabled: true,
    },
    readOnly: false,
    fontSize: 14,
    wordWrap: "on",
    scrollBeyondLastLine: false,
    renderWhitespace: "selection",
    lineNumbers: "on",
    folding: true,
  });

  // Add event listeners
  editor.onDidChangeModelContent(() => {
    // Content changed
  });
};

const generateSampleLog = () => {
  return `[2024-01-15 10:30:15] INFO: Application started successfully
[2024-01-15 10:30:16] INFO: Database connection established
[2024-01-15 10:30:17] INFO: Loading configuration files...
[2024-01-15 10:30:18] WARNING: Configuration file 'config.local.json' not found, using defaults
[2024-01-15 10:30:19] INFO: Server listening on port 8080
[2024-01-15 10:32:45] INFO: User authentication successful for user: admin@example.com
[2024-01-15 10:33:12] ERROR: Failed to connect to external API: timeout after 30s
[2024-01-15 10:33:13] WARNING: Retrying API connection (attempt 1/3)
[2024-01-15 10:33:45] ERROR: Failed to connect to external API: timeout after 30s
[2024-01-15 10:33:46] WARNING: Retrying API connection (attempt 2/3)
[2024-01-15 10:34:18] ERROR: Failed to connect to external API: timeout after 30s
[2024-01-15 10:34:19] ERROR: API connection failed after 3 attempts, falling back to cached data
[2024-01-15 10:35:00] INFO: Processing user request: GET /api/data
[2024-01-15 10:35:01] INFO: Request processed successfully in 120ms
[2024-01-15 10:36:30] WARNING: High memory usage detected: 85% of available memory in use
[2024-01-15 10:37:15] INFO: Garbage collection completed, memory usage now at 65%
[2024-01-15 10:40:00] INFO: Scheduled task 'data-backup' started
[2024-01-15 10:42:30] INFO: Scheduled task 'data-backup' completed successfully
[2024-01-15 10:45:00] ERROR: Database query timeout: SELECT * FROM large_table WHERE created_at > '2024-01-01'
[2024-01-15 10:45:01] WARNING: Query optimization may be required for large_table`;
};

const handleLogUpload = (file: any) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (editor && content) {
      editor.setValue(content);
      ElMessage.success(`已加载文件: ${file.name}`);
    }
  };
  reader.readAsText(file.raw);
};

const connectRealTime = () => {
  isConnecting.value = true;
  ElMessage.info("正在建立实时连接...");
  // Simulate connection
  setTimeout(() => {
    isConnecting.value = false;
    ElMessage.success("实时连接已建立");
  }, 2000);
};

const startAnalysis = () => {
  if (!hasLogContent.value) {
    ElMessage.warning("请先加载日志内容");
    return;
  }

  ElMessage.info("开始分析日志内容...");
  showAnalysisPanel.value = true;

  // Simulate analysis
  setTimeout(() => {
    ElMessage.success("日志分析完成");
    initTimelineChart();
  }, 1000);
};

const clearContent = () => {
  if (editor) {
    editor.setValue("");
    ElMessage.success("内容已清空");
  }
};

const copyContent = () => {
  if (editor) {
    const content = editor.getValue();
    navigator.clipboard.writeText(content).then(() => {
      ElMessage.success("内容已复制到剪贴板");
    });
  }
};

const downloadContent = () => {
  if (editor) {
    const content = editor.getValue();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("文件下载已开始");
  }
};

const handleThemeChange = (theme: string) => {
  currentTheme.value = theme;
  if (editor) {
    monaco.editor.setTheme(theme);
  }
  ElMessage.success(`已切换到${theme}主题`);
};

const closeAnalysisPanel = () => {
  showAnalysisPanel.value = false;
};

const initTimelineChart = () => {
  nextTick(() => {
    if (!timelineChart.value) return;
    // Here you would initialize a chart library like ECharts
    timelineChart.value.innerHTML =
      '<div style="text-align: center; padding: 40px; color: #999;">时间分布图表 (演示)</div>';
  });
};

const searchInLogs = () => {
  ElMessage.info("搜索功能开发中...");
};

const filterLogs = () => {
  ElMessage.info("过滤功能开发中...");
};

const exportLogs = () => {
  ElMessage.info("导出功能开发中...");
};

const shareLogs = () => {
  ElMessage.info("分享功能开发中...");
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getKeywordType = (level: string): string => {
  switch (level) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "info";
  }
};

onMounted(() => {
  nextTick(() => {
    init();
  });
});
</script>

<style scoped lang="scss">
.log-analysis-container {
  position: relative;
  min-height: 100vh;
  padding: 40px 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f2f5 0%, #fce4ec 100%);
}

.bg-decoration {
  position: absolute;
  border-radius: 50%;
  opacity: 0.04;
  animation: float 12s ease-in-out infinite;
}

.decoration-1 {
  top: 10%;
  right: 20%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, #f56c6c 0%, transparent 70%);
  animation-delay: 0s;
}

.decoration-2 {
  bottom: 15%;
  left: 15%;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, #409eff 0%, transparent 70%);
  animation-delay: 4s;
}

.decoration-3 {
  top: 50%;
  left: 30%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, #67c23a 0%, transparent 70%);
  animation-delay: 8s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.log-content {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
}

.log-header {
  margin-bottom: 50px;
  text-align: center;
}

.header-icon {
  margin-bottom: 20px;
  animation: glow 3s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    filter: drop-shadow(0 0 5px rgb(245 108 108 / 30%));
    transform: scale(1);
  }

  to {
    filter: drop-shadow(0 0 15px rgb(245 108 108 / 60%));
    transform: scale(1.05);
  }
}

.log-title {
  margin: 0 0 15px;
  font-size: 48px;
  font-weight: 700;
  color: #2c3e50;
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.log-subtitle {
  margin: 0;
  font-size: 18px;
  line-height: 1.6;
  color: #7f8c8d;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.action-card {
  padding: 30px;
  text-align: center;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
}

.action-card:hover {
  box-shadow: 0 25px 50px rgb(0 0 0 / 15%);
  transform: translateY(-8px);
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  margin: 0 auto 20px;
  background: rgb(245 108 108 / 10%);
  border-radius: 50%;
}

.action-card h3 {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
}

.action-card p {
  margin: 0 0 25px;
  font-size: 14px;
  line-height: 1.5;
  color: #7f8c8d;
}

.upload-component {
  width: 100%;
}

.editor-section {
  margin-bottom: 40px;
  overflow: hidden;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgb(0 0 0 / 8%);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.header-left {
  display: flex;
  gap: 30px;
  align-items: center;
}

.editor-title {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.editor-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  font-size: 12px;
  color: #909399;
}

.header-right {
  display: flex;
  gap: 15px;
  align-items: center;
}

.editor-container {
  display: flex;
  height: 600px;
}

.monaco-editor {
  flex: 1;
  height: 100%;
}

.analysis-panel {
  display: flex;
  flex-direction: column;
  width: 350px;
  background: #f8f9fa;
  border-left: 1px solid #e9ecef;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: #fff;
  border-bottom: 1px solid #e9ecef;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.panel-content {
  flex: 1;
  overflow: hidden;
}

.analysis-tabs {
  height: 100%;
}

.analysis-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  padding: 20px;
}

.metric-card {
  padding: 20px;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
}

.metric-number {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: #2c3e50;
}

.metric-label {
  margin-top: 8px;
  font-size: 14px;
  color: #7f8c8d;
}

.chart-container {
  height: 300px;
  padding: 20px;
}

.chart {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 8px;
}

.keywords-section {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 20px;
}

.keyword-tag {
  margin: 0;
}

.tools-section {
  padding: 30px;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgb(0 0 0 / 8%);
}

.tools-header h3 {
  margin: 0 0 25px;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  padding: 25px;
  cursor: pointer;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.tool-card:hover {
  background: #fff;
  border-color: #f56c6c;
  box-shadow: 0 10px 25px rgb(245 108 108 / 15%);
  transform: translateY(-3px);
}

.tool-card span {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

/* 响应式设计 */
@media (width <= 1200px) {
  .editor-container {
    flex-direction: column;
  }

  .analysis-panel {
    width: 100%;
    height: 300px;
    border-top: 1px solid #e9ecef;
    border-left: none;
  }
}

@media (width <= 768px) {
  .log-analysis-container {
    padding: 20px 15px;
  }

  .log-title {
    font-size: 32px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .editor-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .editor-stats {
    justify-content: space-between;
  }

  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Element Plus 覆盖样式 */
:deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow: auto;
}

:deep(.el-tab-pane) {
  height: 100%;
}
</style>
