<template>
  <div class="aip-search-container">
    <!-- Background decorations -->
    <div class="bg-decoration decoration-1" />
    <div class="bg-decoration decoration-2" />

    <div class="search-content">
      <!-- Header Section -->
      <div class="search-header">
        <div class="header-icon">
          <el-icon size="60" color="#667eea">
            <Search />
          </el-icon>
        </div>
        <h1 class="search-title">AIP/GC 智能搜索</h1>
        <p class="search-subtitle">输入 JIRA 号快速定位问题，支持 AIP、GC、DC 类型查询</p>
      </div>

      <!-- Search Section -->
      <div class="search-section">
        <div class="search-wrapper">
          <el-input
            v-model="input"
            placeholder="输入 JIRA 号码进行搜索..."
            class="search-input"
            size="large"
            @keyup.enter="searchHandle"
          >
            <template #prepend>
              <el-select
                v-model="select"
                placeholder="类型"
                class="search-select"
                popper-class="search-select-dropdown"
              >
                <el-option
                  v-for="item in select_data"
                  :key="item.val"
                  :label="item.key"
                  :value="item.val"
                >
                  <div class="select-option">
                    <span class="option-label">{{ item.key }}</span>
                    <span class="option-desc">{{ getTypeDescription(item.val) }}</span>
                  </div>
                </el-option>
              </el-select>
            </template>
            <template #append>
              <el-button
                type="primary"
                :icon="Search"
                :loading="isSearching"
                class="search-button"
                @click="searchHandle"
              >
                {{ isSearching ? "搜索中..." : "搜索" }}
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <div class="action-label">快速操作：</div>
          <el-button
            v-for="item in select_data"
            :key="item.val"
            size="small"
            :type="select === item.val ? 'primary' : 'default'"
            class="quick-btn"
            @click="selectType(item.val)"
          >
            {{ item.key }}
          </el-button>
        </div>
      </div>

      <!-- Recent Searches -->
      <div v-if="recentSearches.length > 0" class="recent-section">
        <h3 class="section-title">
          <el-icon size="18" color="#909399"><Clock /></el-icon>
          最近搜索
        </h3>
        <div class="recent-items">
          <div
            v-for="(search, index) in recentSearches"
            :key="index"
            class="recent-item"
            @click="quickSearch(search)"
          >
            <div class="recent-content">
              <span class="recent-type">{{ search.type }}</span>
              <span class="recent-code">{{ search.code }}</span>
            </div>
            <el-icon size="14" color="#c0c4cc"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- Help Section -->
      <div class="help-section">
        <h3 class="section-title">
          <el-icon size="18" color="#909399"><QuestionFilled /></el-icon>
          使用说明
        </h3>
        <div class="help-cards">
          <div class="help-card">
            <div class="help-icon">
              <el-icon size="24" color="#409eff"><Document /></el-icon>
            </div>
            <div class="help-content">
              <h4>AIP 分析</h4>
              <p>自动故障诊断分析</p>
            </div>
          </div>
          <div class="help-card">
            <div class="help-icon">
              <el-icon size="24" color="#67c23a"><Cpu /></el-icon>
            </div>
            <div class="help-content">
              <h4>GC 分析</h4>
              <p>垃圾回收性能分析</p>
            </div>
          </div>
          <div class="help-card">
            <div class="help-icon">
              <el-icon size="24" color="#e6a23c"><DataBoard /></el-icon>
            </div>
            <div class="help-content">
              <h4>DC 分析</h4>
              <p>数据中心状态分析</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import {
  Search,
  Clock,
  QuestionFilled,
  ArrowRight,
  Document,
  Cpu,
  DataBoard,
} from "@element-plus/icons-vue";
import PTApi from "@/api/platform";
import { useAipStore } from "@/store";

const select_data = reactive([
  { key: "AIP", val: "AIP" },
  { key: "GC", val: "GC" },
  { key: "DC", val: "DC" },
]);

const input = ref("");
const select = ref("");
const isSearching = ref(false);
const aipStore = useAipStore();
const router = useRouter();

// 最近搜索记录（从localStorage获取）
const recentSearches = ref<Array<{ type: string; code: string }>>([]);

if (select_data.length > 0) {
  select.value = select_data[0].val;
}

// 获取类型描述
const getTypeDescription = (type: string) => {
  const descriptions: Record<string, string> = {
    AIP: "Automotive Issue Process",
    GC: "Garbage Collection",
    DC: "Data Center",
  };
  return descriptions[type] || "";
};

// 选择类型
const selectType = (type: string) => {
  select.value = type;
};

// 保存搜索记录
const saveSearchRecord = (type: string, code: string) => {
  const searchRecord = { type, code };
  const existingIndex = recentSearches.value.findIndex(
    (item) => item.type === type && item.code === code
  );

  if (existingIndex > -1) {
    // 如果已存在，移到最前面
    recentSearches.value.splice(existingIndex, 1);
  }

  recentSearches.value.unshift(searchRecord);

  // 最多保留10条记录
  if (recentSearches.value.length > 10) {
    recentSearches.value = recentSearches.value.slice(0, 10);
  }

  // 保存到localStorage
  localStorage.setItem("aip-recent-searches", JSON.stringify(recentSearches.value));
};

// 快速搜索
const quickSearch = (search: { type: string; code: string }) => {
  select.value = search.type;
  input.value = search.code.replace(`${search.type}-`, "");
  searchHandle();
};

// 主搜索函数
async function searchHandle() {
  if (!input.value.trim()) {
    ElMessage.warning("请输入 JIRA 号码");
    return;
  }

  isSearching.value = true;
  const aipcode = select.value + "-" + input.value.trim();

  console.log("搜索:", aipcode);

  try {
    const data = await PTApi.searchApi(aipcode, select.value);
    console.log("搜索结果:", data);

    if (data.data["contents"].length > 0) {
      console.log("添加信息:", aipcode);
      aipStore.addAipInfo(aipcode, data.data["contents"][0]);

      // 保存搜索记录
      saveSearchRecord(select.value, aipcode);

      ElMessage.success("搜索成功！");
      router.push({ name: "aipInfo", params: { code: aipcode } });
    } else {
      ElMessage.warning("未找到相关信息，请检查 JIRA 号码是否正确");
    }
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败，请重试");
  } finally {
    isSearching.value = false;
  }
}

// 从localStorage加载搜索记录
onMounted(() => {
  try {
    const saved = localStorage.getItem("aip-recent-searches");
    if (saved) {
      recentSearches.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error("加载搜索记录失败:", error);
  }
});
</script>

<style scoped lang="scss">
.aip-search-container {
  position: relative;
  min-height: 100vh;
  padding: 40px 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.bg-decoration {
  position: absolute;
  border-radius: 50%;
  opacity: 0.05;
  animation: float 8s ease-in-out infinite;
}

.decoration-1 {
  top: 10%;
  right: 10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #667eea 0%, transparent 70%);
  animation-delay: 0s;
}

.decoration-2 {
  bottom: 10%;
  left: 10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, #764ba2 0%, transparent 70%);
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-30px) rotate(180deg);
  }
}

.search-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: 50px;
  text-align: center;
}

.header-icon {
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.search-title {
  margin: 0 0 15px;
  font-size: 48px;
  font-weight: 700;
  color: #2c3e50;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.search-subtitle {
  margin: 0;
  font-size: 18px;
  line-height: 1.6;
  color: #7f8c8d;
}

.search-section {
  padding: 40px;
  margin-bottom: 40px;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgb(0 0 0 / 10%);
}

.search-wrapper {
  margin-bottom: 30px;
}

.search-input {
  width: 100%;
}

.search-select {
  width: 120px;
}

.select-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-label {
  font-weight: 500;
  color: #2c3e50;
}

.option-desc {
  font-size: 12px;
  color: #909399;
}

.search-button {
  min-width: 100px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.action-label {
  font-size: 14px;
  font-weight: 500;
  color: #909399;
}

.quick-btn {
  border-radius: 20px;
  transition: all 0.3s ease;
}

.quick-btn:hover {
  transform: translateY(-2px);
}

.recent-section,
.help-section {
  padding: 30px;
  margin-bottom: 30px;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 20px;
  box-shadow: 0 15px 30px rgb(0 0 0 / 8%);
}

.section-title {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.recent-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  cursor: pointer;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.recent-item:hover {
  background: #fff;
  border-color: #667eea;
  box-shadow: 0 8px 20px rgb(102 126 234 / 15%);
  transform: translateY(-2px);
}

.recent-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-type {
  font-size: 12px;
  font-weight: 500;
  color: #909399;
}

.recent-code {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.help-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.help-card {
  display: flex;
  gap: 15px;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.help-card:hover {
  background: #fff;
  border-color: #667eea;
  box-shadow: 0 8px 20px rgb(102 126 234 / 15%);
  transform: translateY(-2px);
}

.help-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: rgb(102 126 234 / 10%);
  border-radius: 12px;
}

.help-content h4 {
  margin: 0 0 5px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.help-content p {
  margin: 0;
  font-size: 14px;
  color: #7f8c8d;
}

/* 响应式设计 */
@media (width <= 768px) {
  .aip-search-container {
    padding: 20px 15px;
  }

  .search-title {
    font-size: 32px;
  }

  .search-subtitle {
    font-size: 16px;
  }

  .search-section {
    padding: 25px 20px;
  }

  .recent-items {
    grid-template-columns: 1fr;
  }

  .help-cards {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-input-group__prepend) {
  background: #fff;
  border-color: #e1e6ef;
  border-radius: 12px 0 0 12px;
}

:deep(.el-input-group__append) {
  padding: 0;
  background: #fff;
  border-color: #e1e6ef;
  border-radius: 0 12px 12px 0;
}

:deep(.el-input__wrapper) {
  border-radius: 0;
  box-shadow: 0 0 0 1px #e1e6ef inset;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #667eea inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #667eea inset;
}

:deep(.el-input__inner) {
  height: 50px;
  padding: 0 20px;
  font-size: 16px;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__inner) {
  background: transparent;
  border: none;
}

:deep(.search-button) {
  height: 50px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

:deep(.search-button:hover) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}
</style>
