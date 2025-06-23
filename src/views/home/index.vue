<template>
  <div class="home-container">
    <div class="home-content">
      <!-- Navigation Cards -->
      <div class="navigation-section">
        <div class="section-header">
          <h2 class="section-title">功能模块</h2>
          <p class="section-subtitle">选择您需要的功能模块开始工作</p>
        </div>

        <div class="nav-grid">
          <!-- AIP/GC Analysis -->
          <div class="nav-card aip" @click="navigateTo('/aipgc')">
            <div class="card-background">
              <div class="card-pattern" />
            </div>
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="48" color="#67C23A">
                  <DataAnalysis />
                </el-icon>
              </div>
              <div class="card-info">
                <h3 class="card-title">AIP/GC 分析</h3>
                <p class="card-description">智能问题诊断与故障分析</p>
                <div class="card-features">
                  <span class="feature-tag">实时监控</span>
                  <span class="feature-tag">智能诊断</span>
                  <span class="feature-tag">快速定位</span>
                </div>
              </div>
              <div class="card-action">
                <el-button type="success" size="large">
                  立即使用
                  <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </div>

          <!-- Recorder Management -->
          <div class="nav-card recorder" @click="navigateTo('/recorder')">
            <div class="card-background">
              <div class="card-pattern" />
            </div>
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="48" color="#E6A23C">
                  <VideoCamera />
                </el-icon>
              </div>
              <div class="card-info">
                <h3 class="card-title">记录器管理</h3>
                <p class="card-description">数据记录与回放功能</p>
                <div class="card-features">
                  <span class="feature-tag">数据记录</span>
                  <span class="feature-tag">历史回放</span>
                  <span class="feature-tag">批量管理</span>
                </div>
              </div>
              <div class="card-action">
                <el-button type="warning" size="large">
                  立即使用
                  <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </div>

          <!-- Log Analysis -->
          <div class="nav-card logs" @click="navigateTo('/log')">
            <div class="card-background">
              <div class="card-pattern" />
            </div>
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="48" color="#F56C6C">
                  <Document />
                </el-icon>
              </div>
              <div class="card-info">
                <h3 class="card-title">日志分析</h3>
                <p class="card-description">实时日志查看与分析</p>
                <div class="card-features">
                  <span class="feature-tag">实时监控</span>
                  <span class="feature-tag">智能分析</span>
                  <span class="feature-tag">可视化图表</span>
                </div>
              </div>
              <div class="card-action">
                <el-button type="danger" size="large">
                  立即使用
                  <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                </el-button>
              </div>
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
  DataBoard,
} from "@element-plus/icons-vue";

const router = useRouter();

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<style scoped lang="scss">
.home-container {
  min-height: 100vh;
  padding: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.home-content {
  width: 100%;
  padding: 0;
}

.hero-section {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 60px 40px;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  opacity: 0.1;
}

.floating-elements {
  position: relative;
  width: 100%;
  height: 100%;
}

.element {
  position: absolute;
  background: radial-gradient(circle, rgb(255 255 255 / 30%) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}

.element-1 {
  top: 20%;
  left: 10%;
  width: 200px;
  height: 200px;
  animation-delay: 0s;
}

.element-2 {
  top: 60%;
  right: 15%;
  width: 150px;
  height: 150px;
  animation-delay: 2s;
}

.element-3 {
  bottom: 20%;
  left: 60%;
  width: 100px;
  height: 100px;
  animation-delay: 4s;
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

.hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 800px;
  text-align: center;
}

.brand-section {
  margin-bottom: 50px;
}

.brand-icon {
  margin-bottom: 30px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.brand-title {
  margin: 0 0 20px;
  font-size: 48px;
  font-weight: 700;
  color: white;
  text-shadow: 0 4px 20px rgb(0 0 0 / 30%);
  letter-spacing: 2px;
}

.brand-subtitle {
  margin: 0;
  font-size: 20px;
  font-weight: 300;
  line-height: 1.6;
  color: rgb(255 255 255 / 90%);
}

.stats-overview {
  display: flex;
  gap: 60px;
  justify-content: center;
  margin-top: 40px;
}

.stat-item {
  color: white;
  text-align: center;
}

.stat-number {
  margin-bottom: 8px;
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 2px 10px rgb(0 0 0 / 30%);
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
}

.navigation-section {
  padding: 80px 40px;
  background: #f8fafc;
}

.section-header {
  margin-bottom: 60px;
  text-align: center;
}

.section-title {
  margin: 0 0 16px;
  font-size: 36px;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.section-subtitle {
  margin: 0;
  font-size: 18px;
  font-weight: 400;
  color: #64748b;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.nav-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 8px 40px rgb(0 0 0 / 8%);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.nav-card:hover {
  box-shadow: 0 20px 60px rgb(0 0 0 / 15%);
  transform: translateY(-8px);
}

.card-background {
  position: absolute;
  inset: 0;
  opacity: 0.05;
}

.card-pattern {
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to right, currentcolor 1px, transparent 1px),
    linear-gradient(to bottom, currentcolor 1px, transparent 1px);
  background-size: 20px 20px;
}

.nav-card.aip .card-pattern {
  color: #67c23a;
}

.nav-card.recorder .card-pattern {
  color: #e6a23c;
}

.nav-card.logs .card-pattern {
  color: #f56c6c;
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  padding: 40px;
}

.card-icon {
  align-self: flex-start;
  padding: 16px;
  background: rgb(0 0 0 / 5%);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.nav-card:hover .card-icon {
  transform: scale(1.1);
}

.card-info {
  flex: 1;
}

.card-title {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  transition: color 0.3s ease;
}

.card-description {
  margin: 0 0 20px;
  font-size: 16px;
  line-height: 1.6;
  color: #64748b;
}

.card-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  background: #f1f5f9;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.nav-card.aip:hover .feature-tag {
  color: #67c23a;
  background: rgb(103 194 58 / 10%);
}

.nav-card.recorder:hover .feature-tag {
  color: #e6a23c;
  background: rgb(230 162 60 / 10%);
}

.nav-card.logs:hover .feature-tag {
  color: #f56c6c;
  background: rgb(245 108 108 / 10%);
}

.card-action {
  margin-top: auto;
}

.features-section {
  padding: 80px 40px;
  background: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  padding: 32px 24px;
  text-align: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: white;
  box-shadow: 0 12px 40px rgb(0 0 0 / 10%);
  transform: translateY(-4px);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: rgb(64 158 255 / 10%);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1);
}

.feature-card h4 {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.feature-card p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
}

/* 响应式设计 */
@media (width <= 1200px) {
  .hero-section {
    padding: 40px 30px;
  }

  .navigation-section {
    padding: 60px 30px;
  }

  .features-section {
    padding: 60px 30px;
  }

  .nav-grid {
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 30px;
  }
}

@media (width <= 768px) {
  .hero-section {
    min-height: 60vh;
    padding: 30px 20px;
  }

  .brand-title {
    font-size: 36px;
  }

  .brand-subtitle {
    font-size: 18px;
  }

  .stats-overview {
    gap: 40px;
  }

  .navigation-section {
    padding: 50px 20px;
  }

  .features-section {
    padding: 50px 20px;
  }

  .section-title {
    font-size: 28px;
  }

  .section-subtitle {
    font-size: 16px;
  }

  .nav-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .card-content {
    padding: 32px 24px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (width <= 480px) {
  .hero-section {
    padding: 20px 15px;
  }

  .brand-title {
    font-size: 28px;
  }

  .stats-overview {
    flex-direction: column;
    gap: 20px;
  }

  .navigation-section {
    padding: 40px 15px;
  }

  .features-section {
    padding: 40px 15px;
  }

  .card-content {
    padding: 24px 20px;
  }

  .feature-card {
    padding: 24px 20px;
  }
}
</style>
