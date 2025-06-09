<template>
  <div class="recorder-container">
    <!-- Background decorations -->
    <div class="bg-decoration decoration-1" />
    <div class="bg-decoration decoration-2" />
    <div class="bg-decoration decoration-3" />

    <div class="recorder-content">
      <!-- Header Section -->
      <div class="recorder-header">
        <div class="header-icon">
          <el-icon size="60" color="#E6A23C">
            <VideoCamera />
          </el-icon>
        </div>
        <h1 class="recorder-title">记录器管理</h1>
        <p class="recorder-subtitle">数据记录与回放功能，完整的操作历史追踪</p>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="28" color="#409eff"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ totalRecords }}</div>
            <div class="stat-label">总记录数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="28" color="#67c23a"><VideoPlay /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ activeRecords }}</div>
            <div class="stat-label">活跃记录</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="28" color="#f56c6c"><Timer /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ formatFileSize(totalSize) }}</div>
            <div class="stat-label">存储空间</div>
          </div>
        </div>
      </div>

      <!-- Main Actions -->
      <div class="actions-section">
        <div class="action-card">
          <div class="action-header">
            <div class="action-icon">
              <el-icon size="32" color="#E6A23C"><Plus /></el-icon>
            </div>
            <h3>新建记录</h3>
          </div>
          <p class="action-description">创建新的数据记录会话</p>
          <el-button
            type="primary"
            size="large"
            :loading="isRecording"
            class="action-button"
            @click="startRecording"
          >
            <el-icon><VideoCamera /></el-icon>
            {{ isRecording ? "录制中..." : "开始录制" }}
          </el-button>
        </div>

        <div class="action-card">
          <div class="action-header">
            <div class="action-icon">
              <el-icon size="32" color="#409eff"><Upload /></el-icon>
            </div>
            <h3>上传记录</h3>
          </div>
          <p class="action-description">上传已有的记录文件</p>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileSelect"
            accept=".log,.rec,.dat"
            class="upload-area"
          >
            <el-button size="large" class="action-button">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
          </el-upload>
        </div>

        <div class="action-card">
          <div class="action-header">
            <div class="action-icon">
              <el-icon size="32" color="#67c23a"><Folder /></el-icon>
            </div>
            <h3>导入目录</h3>
          </div>
          <p class="action-description">批量导入记录文件目录</p>
          <el-button size="large" class="action-button" @click="importDirectory">
            <el-icon><Folder /></el-icon>
            选择目录
          </el-button>
        </div>
      </div>

      <!-- Records List -->
      <div class="records-section">
        <div class="section-header">
          <h3 class="section-title">
            <el-icon size="20" color="#909399"><List /></el-icon>
            记录列表
          </h3>
          <div class="section-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索记录..."
              size="small"
              style="width: 200px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button size="small" @click="refreshList">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>

        <div class="records-grid">
          <div
            v-for="record in filteredRecords"
            :key="record.id"
            class="record-card"
            @click="viewRecord(record)"
          >
            <div class="record-header">
              <div class="record-icon">
                <el-icon size="24" :color="getRecordStatusColor(record.status)">
                  <component :is="getRecordIcon(record.type)" />
                </el-icon>
              </div>
              <div class="record-meta">
                <div class="record-name">{{ record.name }}</div>
                <div class="record-time">{{ formatTime(record.createTime) }}</div>
              </div>
              <el-dropdown trigger="click" @command="handleRecordAction">
                <el-icon class="record-menu"><More /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'play', record }">
                      <el-icon><VideoPlay /></el-icon>
                      播放
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'download', record }">
                      <el-icon><Download /></el-icon>
                      下载
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', record }" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="record-info">
              <div class="info-item">
                <span class="info-label">大小:</span>
                <span class="info-value">{{ formatFileSize(record.size) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">时长:</span>
                <span class="info-value">{{ formatDuration(record.duration) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">状态:</span>
                <el-tag :type="getStatusTagType(record.status)" size="small">
                  {{ getStatusText(record.status) }}
                </el-tag>
              </div>
            </div>

            <div v-if="record.status === 'recording'" class="record-progress">
              <el-progress
                :percentage="record.progress || 0"
                :stroke-width="4"
                :show-text="false"
                status="success"
              />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredRecords.length === 0" class="empty-state">
          <div class="empty-content">
            <el-icon size="64" color="#c0c4cc"><DocumentRemove /></el-icon>
            <p class="empty-text">暂无记录数据</p>
            <p class="empty-subtext">点击上方按钮开始创建或上传记录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  VideoCamera,
  Document,
  VideoPlay,
  Timer,
  Plus,
  Upload,
  Folder,
  List,
  Search,
  Refresh,
  More,
  Download,
  Delete,
  DocumentRemove,
  Cpu,
  DataAnalysis,
  Setting,
} from "@element-plus/icons-vue";

defineOptions({
  name: "Recorder",
});

interface RecordItem {
  id: string;
  name: string;
  type: "video" | "audio" | "data";
  status: "recording" | "completed" | "error" | "paused";
  size: number;
  duration: number;
  createTime: string;
  progress?: number;
}

// 响应式数据
const isRecording = ref(false);
const searchKeyword = ref("");
const uploadRef = ref();

// 模拟数据
const records = ref<RecordItem[]>([
  {
    id: "1",
    name: "AIP-2024-001 系统诊断记录",
    type: "data",
    status: "completed",
    size: 1024 * 1024 * 150, // 150MB
    duration: 3600, // 1小时
    createTime: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "GC-2024-002 垃圾回收分析",
    type: "data",
    status: "recording",
    size: 1024 * 1024 * 80, // 80MB
    duration: 1800, // 30分钟
    createTime: "2024-01-15T14:20:00Z",
    progress: 65,
  },
  {
    id: "3",
    name: "DC-2024-003 数据中心监控",
    type: "video",
    status: "completed",
    size: 1024 * 1024 * 300, // 300MB
    duration: 7200, // 2小时
    createTime: "2024-01-14T16:45:00Z",
  },
]);

// 计算属性
const totalRecords = computed(() => records.value.length);
const activeRecords = computed(() => records.value.filter((r) => r.status === "recording").length);
const totalSize = computed(() => records.value.reduce((sum, r) => sum + r.size, 0));

const filteredRecords = computed(() => {
  if (!searchKeyword.value) return records.value;
  return records.value.filter((record) =>
    record.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

// 方法
const startRecording = () => {
  isRecording.value = true;
  ElMessage.success("开始录制...");
  // 模拟录制过程
  setTimeout(() => {
    isRecording.value = false;
    ElMessage.success("录制完成");
  }, 3000);
};

const handleFileSelect = (file: any) => {
  ElMessage.success(`已选择文件: ${file.name}`);
  // 处理文件上传逻辑
};

const importDirectory = () => {
  ElMessage.info("目录导入功能开发中...");
};

const viewRecord = (record: RecordItem) => {
  ElMessage.info(`查看记录: ${record.name}`);
};

const refreshList = () => {
  ElMessage.success("列表已刷新");
};

const handleRecordAction = ({ action, record }: { action: string; record: RecordItem }) => {
  switch (action) {
    case "play":
      ElMessage.success(`播放: ${record.name}`);
      break;
    case "download":
      ElMessage.success(`下载: ${record.name}`);
      break;
    case "delete":
      ElMessageBox.confirm(`确定要删除记录 "${record.name}" 吗？`, "确认删除", {
        type: "warning",
      })
        .then(() => {
          const index = records.value.findIndex((r) => r.id === record.id);
          if (index > -1) {
            records.value.splice(index, 1);
            ElMessage.success("删除成功");
          }
        })
        .catch(() => {});
      break;
  }
};

// 工具函数
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatTime = (timeString: string): string => {
  const date = new Date(timeString);
  return date.toLocaleString("zh-CN");
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    : `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const getRecordIcon = (type: string) => {
  switch (type) {
    case "video":
      return VideoPlay;
    case "audio":
      return VideoCamera;
    case "data":
      return DataAnalysis;
    default:
      return Document;
  }
};

const getRecordStatusColor = (status: string): string => {
  switch (status) {
    case "recording":
      return "#E6A23C";
    case "completed":
      return "#67C23A";
    case "error":
      return "#F56C6C";
    case "paused":
      return "#909399";
    default:
      return "#909399";
  }
};

const getStatusTagType = (status: string): string => {
  switch (status) {
    case "recording":
      return "warning";
    case "completed":
      return "success";
    case "error":
      return "danger";
    case "paused":
      return "info";
    default:
      return "info";
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case "recording":
      return "录制中";
    case "completed":
      return "已完成";
    case "error":
      return "错误";
    case "paused":
      return "已暂停";
    default:
      return "未知";
  }
};

onMounted(() => {
  // 初始化逻辑
});
</script>

<style scoped lang="scss">
.recorder-container {
  position: relative;
  min-height: 100vh;
  padding: 40px 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #fff5e6 0%, #ffe4b3 100%);
}

.bg-decoration {
  position: absolute;
  border-radius: 50%;
  opacity: 0.03;
  animation: float 10s ease-in-out infinite;
}

.decoration-1 {
  top: 15%;
  right: 15%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #e6a23c 0%, transparent 70%);
  animation-delay: 0s;
}

.decoration-2 {
  bottom: 20%;
  left: 10%;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, #f56c6c 0%, transparent 70%);
  animation-delay: 3s;
}

.decoration-3 {
  top: 40%;
  left: 25%;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, #67c23a 0%, transparent 70%);
  animation-delay: 6s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-25px) rotate(180deg);
  }
}

.recorder-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

.recorder-header {
  margin-bottom: 50px;
  text-align: center;
}

.header-icon {
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-10px);
  }

  60% {
    transform: translateY(-5px);
  }
}

.recorder-title {
  margin: 0 0 15px;
  font-size: 48px;
  font-weight: 700;
  color: #2c3e50;
  background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
  background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.recorder-subtitle {
  margin: 0;
  font-size: 18px;
  line-height: 1.6;
  color: #7f8c8d;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 25px;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 15px 35px rgb(0 0 0 / 12%);
  transform: translateY(-5px);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgb(230 162 60 / 10%);
  border-radius: 12px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: #2c3e50;
}

.stat-label {
  margin-top: 5px;
  font-size: 14px;
  color: #7f8c8d;
}

.actions-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 50px;
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

.action-header {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  background: rgb(230 162 60 / 10%);
  border-radius: 50%;
}

.action-card h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
}

.action-description {
  margin: 0 0 25px;
  font-size: 14px;
  line-height: 1.5;
  color: #7f8c8d;
}

.action-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 25px;
}

.upload-area {
  width: 100%;
}

.records-section {
  padding: 30px;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgb(0 0 0 / 8%);
}

.section-header {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 25px;
}

.section-title {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.section-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.record-card {
  padding: 20px;
  cursor: pointer;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.record-card:hover {
  background: #fff;
  border-color: #e6a23c;
  box-shadow: 0 10px 25px rgb(230 162 60 / 15%);
  transform: translateY(-3px);
}

.record-header {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
}

.record-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  background: rgb(230 162 60 / 10%);
  border-radius: 8px;
}

.record-meta {
  flex: 1;
  min-width: 0;
}

.record-name {
  margin-bottom: 4px;
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-time {
  font-size: 12px;
  color: #909399;
}

.record-menu {
  padding: 5px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.record-menu:hover {
  background-color: rgb(0 0 0 / 5%);
}

.record-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: #909399;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.record-progress {
  margin-top: 10px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.empty-content {
  text-align: center;
}

.empty-text {
  margin: 20px 0 10px;
  font-size: 18px;
  color: #909399;
}

.empty-subtext {
  margin: 0;
  font-size: 14px;
  color: #c0c4cc;
}

/* 响应式设计 */
@media (width <= 768px) {
  .recorder-container {
    padding: 20px 15px;
  }

  .recorder-title {
    font-size: 32px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-section {
    grid-template-columns: 1fr;
  }

  .records-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
