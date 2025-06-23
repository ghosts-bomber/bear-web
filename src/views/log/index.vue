<template>
  <div class="log-analysis-container">
    <!-- Background decorations -->
    <div class="bg-decoration decoration-1" />
    <div class="bg-decoration decoration-2" />
    <div class="bg-decoration decoration-3" />

    <div class="log-content">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-icon">
          <el-icon size="48" color="#f56c6c">
            <Document />
          </el-icon>
        </div>
        <div class="header-text">
          <h1 class="page-title">日志分析中心</h1>
          <p class="page-subtitle">实时日志查看与智能分析平台</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon error">
              <el-icon size="28"><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ errorCount }}</div>
              <div class="stat-label">错误数量</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon warning">
              <el-icon size="28"><WarnTriangleFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ warningCount }}</div>
              <div class="stat-label">警告数量</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon info">
              <el-icon size="28"><InfoFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ infoCount }}</div>
              <div class="stat-label">信息数量</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon success">
              <el-icon size="28"><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ isConnected ? "在线" : "离线" }}</div>
              <div class="stat-label">连接状态</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Editor Section -->
      <div class="editor-section">
        <div class="editor-header">
          <div class="header-left">
            <div class="editor-title">
              <el-icon size="20" color="#f56c6c"><Edit /></el-icon>
              日志编辑器
            </div>
            <div class="connection-status">
              <el-tag :type="isConnected ? 'success' : 'danger'" size="small">
                {{ isConnected ? "已连接" : "未连接" }}
              </el-tag>
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
            <el-select
              v-model="selectedTheme"
              size="small"
              style="width: 120px"
              @change="changeTheme"
            >
              <el-option label="VS Dark" value="vs-dark" />
              <el-option label="VS Light" value="vs" />
              <el-option label="High Contrast" value="hc-black" />
            </el-select>
          </div>
        </div>

        <div class="editor-container">
          <div class="editor-main">
            <div ref="monacoContainer" class="monaco-container" />
          </div>

          <div class="analysis-panel" :class="{ hidden: !showAnalysisPanel }">
            <div class="panel-header">
              <h4>分析面板</h4>
              <el-button size="small" text @click="toggleAnalysisPanel">
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
            </div>

            <div class="panel-content">
              <el-tabs v-model="activeAnalysisTab" class="analysis-tabs">
                <el-tab-pane label="统计" name="stats">
                  <div class="stats-content">
                    <div class="metric-grid">
                      <div class="metric-card">
                        <div class="metric-number">{{ errorCount }}</div>
                        <div class="metric-label">错误</div>
                      </div>
                      <div class="metric-card">
                        <div class="metric-number">{{ warningCount }}</div>
                        <div class="metric-label">警告</div>
                      </div>
                      <div class="metric-card">
                        <div class="metric-number">{{ infoCount }}</div>
                        <div class="metric-label">信息</div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="时间线" name="timeline">
                  <div class="chart-container">
                    <div ref="timelineChart" class="chart">
                      <div class="chart-placeholder">
                        <el-icon size="32" color="#c0c4cc"><TrendCharts /></el-icon>
                        <p>时间线图表</p>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="关键词" name="keywords">
                  <div class="keywords-section">
                    <div v-for="keyword in commonKeywords" :key="keyword" class="keyword-tag">
                      {{ keyword }}
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
        </div>
      </div>

      <!-- Tools and Actions -->
      <div class="tools-section">
        <div class="tools-grid">
          <!-- File Upload -->
          <div class="tool-card" @click="uploadLogFile">
            <div class="tool-icon">
              <el-icon size="32" color="#409eff"><Upload /></el-icon>
            </div>
            <h3>上传日志</h3>
            <p>从本地上传日志文件</p>
          </div>

          <!-- Real-time Connection -->
          <div class="tool-card" @click="toggleConnection">
            <div class="tool-icon">
              <el-icon size="32" :color="isConnected ? '#67c23a' : '#f56c6c'">
                <Connection />
              </el-icon>
            </div>
            <h3>{{ isConnected ? "断开连接" : "实时连接" }}</h3>
            <p>{{ isConnected ? "停止实时日志流" : "连接到实时日志流" }}</p>
          </div>

          <!-- Generate Sample -->
          <div class="tool-card" @click="generateSampleLog">
            <div class="tool-icon">
              <el-icon size="32" color="#e6a23c"><Magic /></el-icon>
            </div>
            <h3>生成示例</h3>
            <p>生成示例日志内容</p>
          </div>

          <!-- Search -->
          <div class="tool-card" @click="showSearchDialog">
            <div class="tool-icon">
              <el-icon size="32" color="#909399"><Search /></el-icon>
            </div>
            <h3>高级搜索</h3>
            <p>搜索和过滤日志内容</p>
          </div>

          <!-- Export -->
          <div class="tool-card" @click="exportLogs">
            <div class="tool-icon">
              <el-icon size="32" color="#606266"><Share /></el-icon>
            </div>
            <h3>导出分析</h3>
            <p>导出分析结果报告</p>
          </div>

          <!-- Settings -->
          <div class="tool-card" @click="showSettings">
            <div class="tool-icon">
              <el-icon size="32" color="#909399"><Setting /></el-icon>
            </div>
            <h3>设置</h3>
            <p>配置分析参数和偏好</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as monaco from "monaco-editor";
import {
  Document,
  Edit,
  Delete,
  CopyDocument,
  Download,
  ArrowLeft,
  Upload,
  Connection,
  Magic,
  Search,
  Share,
  Setting,
  Warning,
  WarnTriangleFilled,
  InfoFilled,
  CircleCheck,
  TrendCharts,
} from "@element-plus/icons-vue";

const monacoContainer = ref<HTMLElement>();
const timelineChart = ref<HTMLElement>();
let monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null;

// 响应式数据
const selectedTheme = ref("vs-dark");
const showAnalysisPanel = ref(true);
const activeAnalysisTab = ref("stats");
const isConnected = ref(false);
const errorCount = ref(12);
const warningCount = ref(35);
const infoCount = ref(128);

const commonKeywords = ref([
  "ERROR",
  "WARNING",
  "INFO",
  "DEBUG",
  "TRACE",
  "Exception",
  "Failed",
  "Success",
  "Timeout",
  "Connection",
]);

// 示例日志内容
const sampleLogContent = `[2024-12-01 09:30:15] INFO  Application started successfully
[2024-12-01 09:30:16] DEBUG Loading configuration from config.yml
[2024-12-01 09:30:17] INFO  Database connection established
[2024-12-01 09:30:18] WARN  Memory usage is at 85%
[2024-12-01 09:30:19] ERROR Failed to connect to external service
[2024-12-01 09:30:20] INFO  Retrying connection in 5 seconds
[2024-12-01 09:30:25] INFO  Connection restored successfully
[2024-12-01 09:30:26] DEBUG Processing user request: GET /api/users
[2024-12-01 09:30:27] INFO  Request completed in 245ms
[2024-12-01 09:30:28] WARN  Rate limit approaching for IP 192.168.1.100
[2024-12-01 09:30:29] ERROR Validation failed for user input
[2024-12-01 09:30:30] INFO  User session created: session_123456`;

// 方法
const initMonaco = async () => {
  if (!monacoContainer.value) return;

  // 设置Monaco编辑器的worker
  self.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
      if (label === "json") {
        return "./monaco-editor/esm/vs/language/json/json.worker.js";
      }
      if (label === "css" || label === "scss" || label === "less") {
        return "./monaco-editor/esm/vs/language/css/css.worker.js";
      }
      if (label === "html" || label === "handlebars" || label === "razor") {
        return "./monaco-editor/esm/vs/language/html/html.worker.js";
      }
      if (label === "typescript" || label === "javascript") {
        return "./monaco-editor/esm/vs/language/typescript/ts.worker.js";
      }
      return "./monaco-editor/esm/vs/editor/editor.worker.js";
    },
  };

  monacoEditor = monaco.editor.create(monacoContainer.value, {
    value: "",
    language: "plaintext",
    theme: selectedTheme.value,
    fontSize: 14,
    lineNumbers: "on",
    wordWrap: "on",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: { enabled: true },
    readOnly: false,
  });

  // 监听内容变化
  monacoEditor.onDidChangeModelContent(() => {
    updateLogAnalysis();
  });
};

const changeTheme = (theme: string) => {
  if (monacoEditor) {
    monaco.editor.setTheme(theme);
  }
};

const updateLogAnalysis = () => {
  if (!monacoEditor) return;

  const content = monacoEditor.getValue();
  const lines = content.split("\n");

  let errors = 0;
  let warnings = 0;
  let infos = 0;

  lines.forEach((line) => {
    if (line.includes("ERROR")) errors++;
    else if (line.includes("WARN")) warnings++;
    else if (line.includes("INFO")) infos++;
  });

  errorCount.value = errors;
  warningCount.value = warnings;
  infoCount.value = infos;
};

const clearContent = () => {
  if (monacoEditor) {
    monacoEditor.setValue("");
    ElMessage.success("内容已清空");
  }
};

const copyContent = async () => {
  if (monacoEditor) {
    const content = monacoEditor.getValue();
    try {
      await navigator.clipboard.writeText(content);
      ElMessage.success("内容已复制到剪贴板");
    } catch (error) {
      ElMessage.error("复制失败");
    }
  }
};

const downloadContent = () => {
  if (monacoEditor) {
    const content = monacoEditor.getValue();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `log_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ElMessage.success("日志文件已下载");
  }
};

const toggleAnalysisPanel = () => {
  showAnalysisPanel.value = !showAnalysisPanel.value;
};

const toggleConnection = () => {
  isConnected.value = !isConnected.value;
  if (isConnected.value) {
    ElMessage.success("已连接到实时日志流");
    // 模拟实时日志
    simulateRealTimeLog();
  } else {
    ElMessage.info("已断开连接");
  }
};

const simulateRealTimeLog = () => {
  if (!isConnected.value || !monacoEditor) return;

  const logTypes = ["INFO", "WARN", "ERROR", "DEBUG"];
  const messages = [
    "User login successful",
    "Database query executed",
    "Cache miss detected",
    "Request timeout",
    "Memory cleanup completed",
    "Configuration updated",
  ];

  const addLogLine = () => {
    if (!isConnected.value) return;

    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const logLine = `[${timestamp}] ${logType.padEnd(5)} ${message}\n`;

    if (monacoEditor) {
      const currentValue = monacoEditor.getValue();
      monacoEditor.setValue(currentValue + logLine);

      // 自动滚动到底部
      const lineCount = monacoEditor.getModel()?.getLineCount() || 0;
      monacoEditor.revealLine(lineCount);
    }

    setTimeout(addLogLine, Math.random() * 3000 + 1000); // 1-4秒随机间隔
  };

  addLogLine();
};

const uploadLogFile = () => {
  ElMessage.info("文件上传功能");
};

const generateSampleLog = () => {
  if (monacoEditor) {
    monacoEditor.setValue(sampleLogContent);
    ElMessage.success("示例日志已生成");
  }
};

const showSearchDialog = () => {
  ElMessage.info("高级搜索功能");
};

const exportLogs = () => {
  ElMessage.info("导出分析功能");
};

const showSettings = () => {
  ElMessage.info("设置功能");
};

onMounted(async () => {
  await nextTick();
  await initMonaco();
});

onBeforeUnmount(() => {
  if (monacoEditor) {
    monacoEditor.dispose();
  }
  isConnected.value = false;
});
</script>

<style scoped lang="scss">
.log-analysis-container {
  min-height: 100vh;
  padding: 0;
  background: linear-gradient(135deg, #fef2f2 0%, #fce7e7 100%);
}

.log-content {
  width: 100%;
  padding: 40px;
}

.page-header {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 32px;
  margin-bottom: 40px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
}

.header-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  color: white;
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  border-radius: 20px;
  box-shadow: 0 8px 20px rgb(245 108 108 / 30%);
}

.header-text {
  flex: 1;
}

.page-title {
  margin: 0 0 8px;
  font-size: 36px;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  margin: 0;
  font-size: 16px;
  color: #64748b;
}

.stats-section {
  margin-bottom: 40px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 20px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 8px 30px rgb(0 0 0 / 12%);
  transform: translateY(-2px);
}

.stat-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  color: white;
  border-radius: 12px;

  &.error {
    background: linear-gradient(135deg, #f56c6c, #ff4757);
  }

  &.warning {
    background: linear-gradient(135deg, #e6a23c, #ffa726);
  }

  &.info {
    background: linear-gradient(135deg, #409eff, #42a5f5);
  }

  &.success {
    background: linear-gradient(135deg, #67c23a, #66bb6a);
  }
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: #1e293b;
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.editor-section {
  margin-bottom: 40px;
  overflow: hidden;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.header-left {
  display: flex;
  gap: 20px;
  align-items: center;
}

.editor-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.connection-status {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.editor-container {
  display: flex;
  height: 500px;
}

.editor-main {
  flex: 1;
  min-width: 0;
}

.monaco-container {
  width: 100%;
  height: 100%;
}

.analysis-panel {
  display: flex;
  flex-direction: column;
  width: 320px;
  background: #f8f9fa;
  border-left: 1px solid #e9ecef;
  transition: all 0.3s ease;

  &.hidden {
    width: 0;
    overflow: hidden;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e9ecef;

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }
}

.panel-content {
  flex: 1;
  overflow: hidden;
}

.analysis-tabs {
  height: 100%;

  :deep(.el-tabs__header) {
    padding: 0 16px;
    margin: 0;
  }

  :deep(.el-tabs__content) {
    height: calc(100% - 40px);
    padding: 0;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    padding: 16px;
  }
}

.stats-content {
  padding: 0;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.metric-card {
  padding: 12px;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
}

.metric-number {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: #1e293b;
}

.metric-label {
  margin-top: 4px;
  font-size: 11px;
  color: #64748b;
}

.chart-container {
  height: 200px;
  padding: 16px;
}

.chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: white;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
}

.chart-placeholder {
  color: #9ca3af;
  text-align: center;

  p {
    margin: 8px 0 0;
    font-size: 14px;
  }
}

.keywords-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
}

.keyword-tag {
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  background: #e5e7eb;
  border-radius: 4px;
}

.tools-section {
  padding: 32px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.tool-card:hover {
  background: white;
  border-color: #f56c6c;
  box-shadow: 0 8px 25px rgb(245 108 108 / 15%);
  transform: translateY(-2px);
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgb(245 108 108 / 10%);
  border-radius: 16px;
}

.tool-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.tool-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: #64748b;
}

/* 响应式设计 */
@media (width <= 1200px) {
  .log-content {
    padding: 30px;
  }

  .editor-container {
    flex-direction: column;
    height: auto;
  }

  .editor-main {
    height: 400px;
  }

  .analysis-panel {
    width: 100%;
    height: 250px;
    border-top: 1px solid #e9ecef;
    border-left: none;

    &.hidden {
      width: 100%;
      height: 0;
    }
  }
}

@media (width <= 768px) {
  .log-content {
    padding: 20px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .page-title {
    font-size: 28px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .editor-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-right {
    justify-content: space-between;
    width: 100%;
  }
}

@media (width <= 480px) {
  .page-header {
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .tools-section {
    padding: 20px;
  }
}
</style>
