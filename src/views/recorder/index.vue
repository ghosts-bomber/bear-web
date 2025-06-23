<template>
  <div class="recorder-container">
    <!-- Background decorations -->
    <div class="bg-decoration decoration-1" />
    <div class="bg-decoration decoration-2" />
    <div class="bg-decoration decoration-3" />

    <div class="recorder-content">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-icon">
          <el-icon size="48" color="#e6a23c">
            <VideoCamera />
          </el-icon>
        </div>
        <div class="header-text">
          <h1 class="page-title">记录器管理</h1>
          <p class="page-subtitle">数据记录与回放功能管理中心</p>
        </div>
      </div>

      <!-- Statistics Dashboard -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="32" color="#e6a23c"><Files /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ mockRecords.length }}</div>
              <div class="stat-label">总记录数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="32" color="#67c23a"><VideoPlay /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ activeRecords }}</div>
              <div class="stat-label">活跃记录</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="32" color="#409eff"><Coin /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ totalStorage }}</div>
              <div class="stat-label">存储空间</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="32" color="#f56c6c"><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatDuration(totalDuration) }}</div>
              <div class="stat-label">总时长</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="actions-section">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon size="20" color="#e6a23c"><Setting /></el-icon>
            快速操作
          </h2>
        </div>
        <div class="actions-grid">
          <div class="action-card" @click="startRecording">
            <div class="action-icon recording">
              <el-icon size="32"><VideoCamera /></el-icon>
            </div>
            <h3>开始录制</h3>
            <p class="action-description">创建新的数据记录</p>
            <el-button type="primary" size="large" :loading="isRecording" class="action-button">
              {{ isRecording ? "录制中..." : "开始录制" }}
            </el-button>
          </div>

          <div class="action-card" @click="uploadFile">
            <div class="action-icon upload">
              <el-icon size="32"><Upload /></el-icon>
            </div>
            <h3>上传文件</h3>
            <p class="action-description">上传本地记录文件</p>
            <el-button size="large" class="action-button">选择文件</el-button>
          </div>

          <div class="action-card" @click="importDirectory">
            <div class="action-icon import">
              <el-icon size="32"><Folder /></el-icon>
            </div>
            <h3>批量导入</h3>
            <p class="action-description">导入记录文件目录</p>
            <el-button size="large" class="action-button">选择目录</el-button>
          </div>
        </div>
      </div>

      <!-- Records Management -->
      <div class="records-section">
        <div class="section-header">
          <div class="header-left">
            <h2 class="section-title">
              <el-icon size="20" color="#e6a23c"><Document /></el-icon>
              记录管理
            </h2>
            <div class="record-stats">
              <el-tag size="small" type="info">共 {{ mockRecords.length }} 条记录</el-tag>
            </div>
          </div>
          <div class="header-right">
            <el-input v-model="searchTerm" placeholder="搜索记录..." class="search-input" clearable>
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-dropdown @command="handleSort">
              <el-button>
                排序
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="name">按名称</el-dropdown-item>
                  <el-dropdown-item command="date">按日期</el-dropdown-item>
                  <el-dropdown-item command="size">按大小</el-dropdown-item>
                  <el-dropdown-item command="duration">按时长</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div v-if="filteredRecords.length === 0" class="empty-state">
          <div class="empty-content">
            <el-icon size="64" color="#c0c4cc"><DocumentCopy /></el-icon>
            <h3 class="empty-text">暂无记录</h3>
            <p class="empty-subtext">点击上方按钮开始创建或导入记录</p>
          </div>
        </div>

        <div v-else class="records-grid">
          <div
            v-for="record in filteredRecords"
            :key="record.id"
            class="record-card"
            @click="viewRecord(record)"
          >
            <div class="record-header">
              <div class="record-icon">
                <el-icon size="20" color="#e6a23c">
                  <component :is="getRecordIcon(record.type)" />
                </el-icon>
              </div>
              <div class="record-info">
                <div class="record-name">{{ record.name }}</div>
                <div class="record-type">{{ record.type }}</div>
              </div>
              <div class="record-menu">
                <el-dropdown @command="(command) => handleRecordAction(command, record)">
                  <el-icon><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="view">查看详情</el-dropdown-item>
                      <el-dropdown-item command="download">下载</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <div v-if="record.status === 'recording'" class="record-progress">
              <el-progress
                :percentage="record.progress || 0"
                :stroke-width="6"
                :show-text="false"
                color="#e6a23c"
              />
              <span class="progress-text">录制中 {{ record.progress || 0 }}%</span>
            </div>

            <div class="record-details">
              <div class="detail-row">
                <div class="detail-item">
                  <span class="info-label">文件大小</span>
                  <span class="info-value">{{ formatFileSize(record.size) }}</span>
                </div>
                <div class="detail-item">
                  <span class="info-label">录制时长</span>
                  <span class="info-value">{{ formatDuration(record.duration) }}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-item">
                  <span class="info-label">创建时间</span>
                  <span class="info-value">{{ formatDate(record.createdAt) }}</span>
                </div>
                <div class="detail-item">
                  <span class="info-label">状态</span>
                  <el-tag :type="getStatusType(record.status)" size="small" class="status-tag">
                    {{ getStatusText(record.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
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
  ArrowDown,
  DocumentCopy,
  MoreFilled,
  Files,
  Coin,
  Clock,
} from "@element-plus/icons-vue";

defineOptions({
  name: "Recorder",
});

interface RecordItem {
  id: number;
  name: string;
  type: string;
  size: number;
  duration: number;
  createdAt: Date;
  status: "completed" | "recording" | "error";
  progress?: number;
}

const searchTerm = ref("");
const isRecording = ref(false);

// Mock数据
const mockRecords = ref<RecordItem[]>([
  {
    id: 1,
    name: "Vehicle_Test_20241201_001",
    type: "CAN数据",
    size: 524288000,
    duration: 3600,
    createdAt: new Date("2024-12-01 09:30:00"),
    status: "completed",
  },
  {
    id: 2,
    name: "Sensor_Log_20241201_002",
    type: "传感器数据",
    size: 1073741824,
    duration: 7200,
    createdAt: new Date("2024-12-01 11:15:00"),
    status: "recording",
    progress: 67,
  },
  {
    id: 3,
    name: "GPS_Track_20241130_005",
    type: "GPS轨迹",
    size: 104857600,
    duration: 1800,
    createdAt: new Date("2024-11-30 16:45:00"),
    status: "completed",
  },
  {
    id: 4,
    name: "Error_Log_20241130_003",
    type: "错误日志",
    size: 20971520,
    duration: 900,
    createdAt: new Date("2024-11-30 14:20:00"),
    status: "error",
  },
]);

// 计算属性
const filteredRecords = computed(() => {
  if (!searchTerm.value) return mockRecords.value;
  return mockRecords.value.filter(
    (record) =>
      record.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const activeRecords = computed(
  () => mockRecords.value.filter((record) => record.status === "recording").length
);

const totalStorage = computed(() => {
  const total = mockRecords.value.reduce((sum, record) => sum + record.size, 0);
  return formatFileSize(total);
});

const totalDuration = computed(() =>
  mockRecords.value.reduce((sum, record) => sum + record.duration, 0)
);

// 方法
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusType = (status: string): string => {
  const statusMap: Record<string, string> = {
    completed: "success",
    recording: "warning",
    error: "danger",
  };
  return statusMap[status] || "info";
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    completed: "已完成",
    recording: "录制中",
    error: "错误",
  };
  return statusMap[status] || "未知";
};

const getRecordIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    CAN数据: Cpu,
    传感器数据: DataAnalysis,
    GPS轨迹: VideoPlay,
    错误日志: Document,
  };
  return iconMap[type] || Document;
};

// 事件处理
const startRecording = () => {
  isRecording.value = true;
  ElMessage.success("开始录制...");

  // 模拟录制过程
  setTimeout(() => {
    isRecording.value = false;
    const newRecord: RecordItem = {
      id: Date.now(),
      name: `New_Record_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, "_")}`,
      type: "CAN数据",
      size: Math.floor(Math.random() * 1000000000),
      duration: Math.floor(Math.random() * 7200),
      createdAt: new Date(),
      status: "completed",
    };
    mockRecords.value.unshift(newRecord);
    ElMessage.success("录制完成！");
  }, 3000);
};

const uploadFile = () => {
  ElMessage.info("文件上传功能");
};

const importDirectory = () => {
  ElMessage.info("目录导入功能");
};

const viewRecord = (record: RecordItem) => {
  ElMessage.info(`查看记录：${record.name}`);
};

const handleSort = (command: string) => {
  ElMessage.info(`按${command}排序`);
};

const handleRecordAction = (command: string, record: RecordItem) => {
  switch (command) {
    case "view":
      ElMessage.info(`查看：${record.name}`);
      break;
    case "download":
      ElMessage.info(`下载：${record.name}`);
      break;
    case "delete":
      ElMessageBox.confirm(`确定要删除记录 "${record.name}" 吗？`, "删除确认", {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          const index = mockRecords.value.findIndex((r) => r.id === record.id);
          if (index > -1) {
            mockRecords.value.splice(index, 1);
            ElMessage.success("删除成功");
          }
        })
        .catch(() => {
          ElMessage.info("已取消删除");
        });
      break;
  }
};

onMounted(() => {
  // 组件初始化
});
</script>

<style scoped lang="scss">
.recorder-container {
  position: relative;
  min-height: 100vh;
  padding: 40px 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #fef7e7 0%, #fceabb 100%);
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

.page-header {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 32px;
  margin-bottom: 50px;
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
  background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
  border-radius: 20px;
  box-shadow: 0 8px 20px rgb(230 162 60 / 30%);
}

.header-text {
  flex: 1;
}

.page-title {
  margin: 0 0 8px;
  font-size: 36px;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.stat-card {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 24px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 8px 30px rgb(0 0 0 / 12%);
  transform: translateY(-4px);
}

.stat-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgb(230 162 60 / 10%), rgb(245 108 108 / 10%));
  border-radius: 16px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  color: #1e293b;
}

.stat-label {
  margin-top: 4px;
  font-size: 14px;
  color: #64748b;
}

.actions-section,
.records-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
}

.record-stats {
  display: flex;
  gap: 8px;
}

.search-input {
  width: 200px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.action-card {
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
}

.action-card:hover {
  box-shadow: 0 12px 40px rgb(0 0 0 / 15%);
  transform: translateY(-6px);
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  color: white;
  border-radius: 20px;

  &.recording {
    background: linear-gradient(135deg, #67c23a, #85ce61);
  }

  &.upload {
    background: linear-gradient(135deg, #409eff, #66b1ff);
  }

  &.import {
    background: linear-gradient(135deg, #e6a23c, #f7ba2a);
  }
}

.action-card h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.action-description {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.5;
  color: #64748b;
}

.action-button {
  width: 100%;
  font-weight: 600;
}

.records-section {
  padding: 32px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 24px;
}

.record-card {
  padding: 24px;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.record-card:hover {
  background: white;
  border-color: #e6a23c;
  box-shadow: 0 8px 25px rgb(230 162 60 / 15%);
  transform: translateY(-2px);
}

.record-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.record-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgb(230 162 60 / 10%);
  border-radius: 8px;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-name {
  margin-bottom: 4px;
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-type {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.record-menu {
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.record-menu:hover {
  background-color: rgb(0 0 0 / 5%);
}

.record-progress {
  margin-bottom: 16px;

  .progress-text {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #e6a23c;
  }
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.status-tag {
  align-self: flex-start;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.empty-content {
  color: #94a3b8;
}

.empty-text {
  margin: 20px 0 8px;
  font-size: 18px;
  color: #64748b;
}

.empty-subtext {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* 响应式设计 */
@media (width <= 1200px) {
  .recorder-content {
    padding: 30px;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .records-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
}

@media (width <= 768px) {
  .recorder-content {
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
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .records-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    justify-content: space-between;
    width: 100%;
  }

  .search-input {
    flex: 1;
    max-width: none;
  }

  .detail-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

@media (width <= 480px) {
  .page-header {
    padding: 20px;
  }

  .records-section {
    padding: 20px;
  }

  .record-card {
    padding: 16px;
  }
}
</style>
