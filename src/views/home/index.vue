<template>
  <div class="home-container">
    <div class="home-content">
      <!-- Header Section -->
      <div class="header-section">
        <div class="logo-area">
          <div class="logo-icon">
            <el-icon size="48" color="#409eff">
              <Monitor />
            </el-icon>
          </div>
          <h1 class="app-title">数据分析平台</h1>
          <p class="app-subtitle">专业的日志分析与记录管理系统</p>
        </div>
      </div>

      <!-- Navigation Section -->
      <div class="navigation-section">
        <div class="nav-grid">
          <!-- AIP/GC Button -->
          <div class="nav-card" @click="navigateTo('/aipgc')">
            <div class="card-icon">
              <el-icon size="64" color="#67C23A">
                <DataAnalysis />
              </el-icon>
            </div>
            <div class="card-content">
              <h2 class="card-title">AIP/GC 分析</h2>
              <p class="card-description">
                智能问题诊断与故障分析
                <br />
                快速定位系统问题根源
              </p>
            </div>
            <div class="card-arrow">
              <el-icon size="20" color="#909399">
                <ArrowRight />
              </el-icon>
            </div>
          </div>

          <!-- Recorder Button -->
          <div class="nav-card" @click="navigateTo('/recorder')">
            <div class="card-icon">
              <el-icon size="64" color="#E6A23C">
                <VideoCamera />
              </el-icon>
            </div>
            <div class="card-content">
              <h2 class="card-title">记录器管理</h2>
              <p class="card-description">
                数据记录与回放功能
                <br />
                完整的操作历史追踪
              </p>
            </div>
            <div class="card-arrow">
              <el-icon size="20" color="#909399">
                <ArrowRight />
              </el-icon>
            </div>
          </div>

          <!-- Log Button -->
          <div class="nav-card" @click="navigateTo('/log')">
            <div class="card-icon">
              <el-icon size="64" color="#F56C6C">
                <Document />
              </el-icon>
            </div>
            <div class="card-content">
              <h2 class="card-title">日志分析</h2>
              <p class="card-description">
                实时日志查看与分析
                <br />
                多维度数据可视化
              </p>
            </div>
            <div class="card-arrow">
              <el-icon size="20" color="#909399">
                <ArrowRight />
              </el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  Monitor,
  DataAnalysis,
  VideoCamera,
  Document,
  ArrowRight,
  TrendCharts,
  Lightning,
  Star,
} from "@element-plus/icons-vue";

const router = useRouter();

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.home-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.home-container::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: "";
  background: radial-gradient(circle at 20% 80%, rgb(120 119 198 / 30%) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgb(255 255 255 / 10%) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgb(120 119 198 / 20%) 0%, transparent 50%);
}

.home-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
}

.header-section {
  margin-bottom: 60px;
  text-align: center;
}

.logo-area {
  padding: 40px;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgb(0 0 0 / 10%);
}

.logo-icon {
  margin-bottom: 20px;
}

.app-title {
  margin: 0 0 15px;
  font-size: 48px;
  font-weight: 700;
  color: #2c3e50;
  text-shadow: 0 4px 8px rgb(0 0 0 / 10%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.app-subtitle {
  margin: 0;
  font-size: 18px;
  font-weight: 400;
  color: #7f8c8d;
  letter-spacing: 1px;
}

.navigation-section {
  margin-bottom: 60px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  justify-items: center;
}

.nav-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
  padding: 40px 30px;
  overflow: hidden;
  cursor: pointer;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 10%);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.nav-card::before {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  content: "";
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 40%), transparent);
  transition: left 0.6s;
}

.nav-card:hover::before {
  left: 100%;
}

.nav-card:hover {
  border-color: rgb(255 255 255 / 50%);
  box-shadow: 0 25px 50px rgb(0 0 0 / 15%);
  transform: translateY(-10px) scale(1.02);
}

.card-icon {
  margin-bottom: 25px;
  transition: transform 0.3s ease;
}

.nav-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
}

.card-content {
  flex: 1;
  text-align: center;
}

.card-title {
  margin: 0 0 15px;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  transition: color 0.3s ease;
}

.nav-card:hover .card-title {
  color: #667eea;
}

.card-description {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.6;
  color: #7f8c8d;
}

.card-arrow {
  margin-top: 15px;
  transition:
    transform 0.3s ease,
    color 0.3s ease;
}

.nav-card:hover .card-arrow {
  color: #667eea !important;
  transform: translateX(5px);
}

.footer-section {
  text-align: center;
}

.feature-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 50px;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 10%);
}

.feature-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
}

.feature-item span {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

/* 响应式设计 */
@media (width <= 768px) {
  .home-container {
    padding: 15px;
  }

  .app-title {
    font-size: 36px;
  }

  .app-subtitle {
    font-size: 16px;
  }

  .nav-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .nav-card {
    max-width: none;
    padding: 30px 20px;
  }

  .card-title {
    font-size: 20px;
  }

  .feature-highlights {
    gap: 30px;
    padding: 20px;
  }

  .feature-item {
    gap: 8px;
  }
}

@media (width <= 480px) {
  .app-title {
    font-size: 28px;
  }

  .feature-highlights {
    flex-direction: column;
    gap: 20px;
  }

  .card-icon .el-icon {
    font-size: 48px !important;
  }
}
</style>
