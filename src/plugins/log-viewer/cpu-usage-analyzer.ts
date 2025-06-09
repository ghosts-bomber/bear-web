import type { Plugin, PluginResult } from "@/types/plugin";

interface CpuUsageData {
  time: number;
  usage: number;
}

interface CpuPeakData {
  time: number;
  usage: number;
  timeStr: string;
}

interface CpuAnalysisResult {
  cpuId: number;
  data: CpuUsageData[];
  peaks: CpuPeakData[];
  avgUsage: number;
  maxUsage: number;
  peakCount: number;
}

const cpuUsageAnalyzerPlugin: Plugin = {
  id: "cpu-usage-analyzer",
  name: "CPU使用率分析",
  description: "分析日志中的CPU使用率数据，检测峰值并绘制折线图",
  process: async (content: string): Promise<PluginResult> => {
    const lines = content.split("\n");

    // 时间转换函数
    const convertStrToTime = (timeStr: string): number => {
      const parts = timeStr.split(":");
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    };

    const convertTimeToStr = (time: number): string => {
      const hour = Math.floor(time / 3600);
      const minute = Math.floor((time % 3600) / 60);
      const second = time % 60;
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
    };

    // 初始化数据结构
    const cpuUsage: number[][] = Array(12)
      .fill(null)
      .map(() => []);
    const timePoints: number[] = [];

    const startTime = "00:00:00";
    const endTime = "23:59:59";
    const startInt = convertStrToTime(startTime);
    const endInt = convertStrToTime(endTime);

    let needEnd = true;
    let timeMatches = 0;
    let usageMatches = 0;

    // 解析日志数据 - 严格按照Python逻辑
    for (const line of lines) {
      // 检测CPU时间戳行 - 'cpu 0'
      if (line.includes("cpu 0")) {
        try {
          // Python逻辑: tp = line.split()[1].split("][")[0].split(".")[0]
          const parts = line.split(" ");
          if (parts.length > 1) {
            const timePart = parts[1].split("][")[0].split(".")[0];
            const time = convertStrToTime(timePart);

            if (time < startInt || time > endInt) {
              needEnd = false;
              continue;
            }
            needEnd = true;
            timePoints.push(time);
            timeMatches++;
          }
        } catch (error) {
          console.warn("时间解析错误:", line, error);
          continue;
        }
      }

      // 检测CPU使用率行 - 'and system'
      if (line.includes("and system") && needEnd) {
        try {
          // Python逻辑:
          // cpu_id = int(line.split()[2])
          // usage = float(line.split()[6].split("and")[0][:-1])
          const parts = line.split(" ");
          if (parts.length > 6) {
            const cpuId = parseInt(parts[2]);
            const usageStr = parts[6].split("and")[0];
            // 移除最后一个字符（通常是%）
            const usage = parseFloat(usageStr.slice(0, -1));

            if (cpuId >= 0 && cpuId < 12 && !isNaN(usage)) {
              // Python中是 usage * 100，说明原始数据是小数形式
              cpuUsage[cpuId].push(usage * 100);
              usageMatches++;
            }
          }
        } catch (error) {
          console.warn("CPU使用率解析错误:", line, error);
          continue;
        }
      }
    }

    // 分析每个CPU的数据
    const analysisResults: CpuAnalysisResult[] = [];
    let totalPeaks = 0;
    let maxOverallUsage = 0;
    let avgOverallUsage = 0;
    let totalDataPoints = 0;

    for (let cpuId = 0; cpuId < 12; cpuId++) {
      const data: CpuUsageData[] = [];
      const peaks: CpuPeakData[] = [];

      // 构建数据点
      for (let j = 0; j < Math.min(cpuUsage[cpuId].length, timePoints.length); j++) {
        data.push({
          time: timePoints[j],
          usage: cpuUsage[cpuId][j],
        });
      }

      // 峰值检测 - 严格按照Python逻辑
      for (let j = 1; j < cpuUsage[cpuId].length - 1; j++) {
        const current = cpuUsage[cpuId][j];
        const prev = cpuUsage[cpuId][j - 1];
        const next = cpuUsage[cpuId][j + 1];

        // Python逻辑: if cpu_usage[i][j] > 90 and cpu_usage[i][j-1] < cpu_usage[i][j] and cpu_usage[i][j] >= cpu_usage[i][j+1] and j < len(time):
        if (current > 90 && prev < current && current >= next && j < timePoints.length) {
          peaks.push({
            time: timePoints[j],
            usage: current,
            timeStr: convertTimeToStr(timePoints[j]),
          });
        }
      }

      // 统计信息
      const usages = cpuUsage[cpuId];
      const avgUsage = usages.length > 0 ? usages.reduce((a, b) => a + b, 0) / usages.length : 0;
      const maxUsage = usages.length > 0 ? Math.max(...usages) : 0;

      analysisResults.push({
        cpuId,
        data,
        peaks,
        avgUsage,
        maxUsage,
        peakCount: peaks.length,
      });

      totalPeaks += peaks.length;
      maxOverallUsage = Math.max(maxOverallUsage, maxUsage);
      avgOverallUsage += avgUsage;
      totalDataPoints += usages.length;
    }

    avgOverallUsage = totalDataPoints > 0 ? avgOverallUsage / 12 : 0;

    // 数据验证和调试信息
    const debugInfo = {
      totalLines: lines.length,
      timeMatches,
      usageMatches,
      timePointsFound: timePoints.length,
      dataPointsPerCpu: cpuUsage.map((cpu, index) => ({ cpu: index, points: cpu.length })),
      hasData: timePoints.length > 0 && totalDataPoints > 0,
      sampleLines: lines.slice(0, 5).map((line) => line.substring(0, 100)),
    };

    // 生成ECharts配置
    const generateEChartsConfig = (): any => {
      if (timePoints.length === 0 || totalDataPoints === 0) {
        return {
          title: {
            text: "无CPU数据",
            left: "center",
            subtext: `解析了${lines.length}行，找到${timeMatches}个时间点，${usageMatches}个使用率数据`,
          },
          xAxis: { type: "category", data: [] },
          yAxis: { type: "value" },
          series: [],
        };
      }

      // 为每个CPU生成series
      const series: any[] = [];
      const colors = [
        "#5470c6",
        "#91cc75",
        "#fac858",
        "#ee6666",
        "#73c0de",
        "#3ba272",
        "#fc8452",
        "#9a60b4",
        "#ea7ccc",
        "#5470c6",
        "#91cc75",
        "#fac858",
      ];

      for (let cpuId = 0; cpuId < 12; cpuId++) {
        const cpuData = analysisResults[cpuId].data;
        const cpuPeaks = analysisResults[cpuId].peaks;

        if (cpuData.length === 0) continue;

        // 主折线数据 - 直接使用时间字符串和使用率
        const lineData = cpuData.map((point) => [convertTimeToStr(point.time), point.usage]);

        // CPU折线
        series.push({
          name: `CPU ${cpuId}`,
          type: "line",
          data: lineData,
          smooth: false,
          lineStyle: { width: 2, color: colors[cpuId] },
          symbol: "circle",
          symbolSize: 4,
          connectNulls: false,
        });

        // 峰值点
        if (cpuPeaks.length > 0) {
          const peakData = cpuPeaks.map((peak) => [peak.timeStr, peak.usage]);
          series.push({
            name: `CPU ${cpuId} 峰值`,
            type: "scatter",
            data: peakData,
            itemStyle: { color: "#ff4757" },
            symbolSize: 8,
            showInLegend: false,
            z: 10,
          });
        }
      }

      // 生成x轴数据
      const allTimes = [...new Set(timePoints.map(convertTimeToStr))].sort();

      return {
        title: {
          text: "CPU使用率趋势图",
          left: "center",
          textStyle: { fontSize: 16, fontWeight: "bold" },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            label: { backgroundColor: "#6a7985" },
          },
        },
        legend: {
          data: Array.from({ length: 12 }, (_, i) => `CPU ${i}`),
          top: 40,
          type: "scroll",
        },
        grid: {
          left: "5%",
          right: "5%",
          bottom: "15%",
          top: "20%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: allTimes,
          axisLabel: {
            rotate: 45,
            fontSize: 10,
          },
          boundaryGap: false,
        },
        yAxis: {
          type: "value",
          name: "使用率 (%)",
          min: 0,
          max: 110,
          interval: 10,
          axisLabel: {
            formatter: "{value}%",
          },
          splitLine: {
            lineStyle: { type: "dashed" },
          },
        },
        series:
          series.length > 0
            ? series.map((item, index) => {
                if (index === 0) {
                  return {
                    ...item,
                    markLine: {
                      silent: true,
                      lineStyle: { color: "#ff4757", type: "dashed", width: 2 },
                      data: [{ yAxis: 90, name: "峰值阈值 90%" }],
                    },
                  };
                }
                return item;
              })
            : series,
        dataZoom: [
          {
            type: "slider",
            show: true,
            xAxisIndex: [0],
            start: 0,
            end: 100,
            height: 30,
          },
          {
            type: "inside",
            xAxisIndex: [0],
            start: 0,
            end: 100,
          },
        ],
      };
    };

    // 生成分析报告
    const severity = totalPeaks > 10 ? "critical" : totalPeaks > 5 ? "warning" : "normal";
    const severityText =
      severity === "critical" ? "严重" : severity === "warning" ? "警告" : "正常";
    const severityColor =
      severity === "critical" ? "#f56c6c" : severity === "warning" ? "#e6a23c" : "#67c23a";

    const summary = `检测到 ${totalPeaks} 个CPU使用率峰值，${totalDataPoints} 个数据点，${debugInfo.hasData ? "数据解析正常" : "数据解析异常"}`;

    const html = `
      <div class="plugin-result cpu-usage-analysis">
        <h3>📊 CPU使用率分析报告</h3>
        
        <div class="analysis-summary" style="border-color: ${severityColor}">
          <div class="summary-header">
            <span class="status-icon">${totalPeaks > 0 ? "⚠️" : "✅"}</span>
            <span class="status-text">
              ${totalPeaks > 0 ? `检测到 ${totalPeaks} 个CPU使用率峰值` : "未检测到异常CPU使用率"}
            </span>
            <span class="severity-badge" style="background-color: ${severityColor}">
              ${severityText}
            </span>
          </div>
          
          <div class="overall-stats">
            <div class="stat-card">
              <div class="stat-label">平均使用率</div>
              <div class="stat-value">${avgOverallUsage.toFixed(1)}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">最高使用率</div>
              <div class="stat-value ${maxOverallUsage > 90 ? "high" : ""}">${maxOverallUsage.toFixed(1)}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">峰值总数</div>
              <div class="stat-value ${totalPeaks > 5 ? "high" : ""}">${totalPeaks}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">数据点数</div>
              <div class="stat-value">${totalDataPoints}</div>
            </div>
          </div>
        </div>
        
        <!-- 图表占位符 -->
        <div class="chart-placeholder" style="border: 1px solid #ddd; border-radius: 4px; padding: 40px; text-align: center; margin: 20px 0; background: #f9f9f9;">
          <div style="font-size: 24px; margin-bottom: 10px;">📊</div>
          <div style="font-size: 16px; color: #666; margin-bottom: 10px;">图表功能开发中</div>
          <div style="font-size: 14px; color: #999;">已解析 ${totalDataPoints} 个数据点，检测到 ${totalPeaks} 个峰值</div>
          ${
            !debugInfo.hasData
              ? `
            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
              <strong>⚠️ 数据解析问题</strong><br>
              请检查日志格式是否包含 'cpu 0' 和 'and system' 关键字
            </div>
          `
              : ""
          }
        </div>
        
        ${
          totalPeaks > 0
            ? `
          <div class="peak-analysis">
            <h4>🔥 峰值分析</h4>
            <div class="peak-summary">
              ${analysisResults
                .filter((r) => r.peakCount > 0)
                .map(
                  (result) => `
                <div class="peak-item">
                  <strong>CPU ${result.cpuId}:</strong> ${result.peakCount} 个峰值
                  ${result.peaks
                    .map(
                      (peak) =>
                        `<span class="peak-time">${peak.timeStr} (${peak.usage.toFixed(1)}%)</span>`
                    )
                    .join(" ")}
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
        
        <div class="analysis-info">
          <h4>💡 分析说明</h4>
          <div class="info-content">
            <p><strong>峰值检测规则:</strong> CPU使用率 > 90% 且为局部最大值</p>
            <p><strong>时间范围:</strong> ${startTime} - ${endTime}</p>
            <p><strong>监控核心:</strong> CPU 0-11 (共12个核心)</p>
            
            <div class="debug-info">
              <h5>📋 解析统计</h5>
              <div class="debug-stats">
                <span class="debug-item">总行数: ${debugInfo.totalLines}</span>
                <span class="debug-item">时间匹配: ${debugInfo.timeMatches}</span>
                <span class="debug-item">使用率匹配: ${debugInfo.usageMatches}</span>
                <span class="debug-item">时间点: ${debugInfo.timePointsFound}</span>
                <span class="debug-item">数据点: ${totalDataPoints}</span>
                <span class="debug-item">有效数据: ${debugInfo.hasData ? "是" : "否"}</span>
              </div>
              
              ${
                debugInfo.sampleLines.length > 0
                  ? `
                <details class="sample-lines" style="margin-top: 8px;">
                  <summary>示例日志行</summary>
                  <div style="font-family: monospace; font-size: 12px; margin-top: 4px;">
                    ${debugInfo.sampleLines
                      .map(
                        (line, i) =>
                          `<div style="margin: 2px 0; color: #666;">${i + 1}: ${line}...</div>`
                      )
                      .join("")}
                  </div>
                </details>
              `
                  : ""
              }
              
              <details class="cpu-data-details">
                <summary>各CPU数据点详情</summary>
                <div class="cpu-data-grid">
                  ${debugInfo.dataPointsPerCpu
                    .map(
                      (info) =>
                        `<span class="cpu-data-item">CPU${info.cpu}: ${info.points}点</span>`
                    )
                    .join("")}
                </div>
              </details>
            </div>
            
            ${
              totalPeaks > 10
                ? `
              <div class="warning-box critical">
                <strong>⚠️ 严重警告:</strong> 检测到大量CPU使用率峰值，可能存在系统性能问题
              </div>
            `
                : totalPeaks > 5
                  ? `
              <div class="warning-box warning">
                <strong>⚠️ 注意:</strong> 检测到较多CPU使用率峰值，建议关注系统负载
              </div>
            `
                  : `
              <div class="info-box normal">
                <strong>✅ 正常:</strong> CPU使用率在正常范围内
              </div>
            `
            }
          </div>
        </div>
        
        <div class="analysis-time">
          <small>分析完成时间: ${new Date().toLocaleString()}</small>
        </div>
      </div>
    `;

    return {
      type: "mixed",
      summary,
      html,
      chart: {
        type: "echarts",
        option: generateEChartsConfig(),
      },
    };
  },
};

export default cpuUsageAnalyzerPlugin;
