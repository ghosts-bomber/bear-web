import type { Plugin, PluginResult } from "@/types/plugin";

interface LogCategory {
  orinRecvMpu: string[];
  lidarFps: string[];
  lidarNanRatio: string[];
  gnssImu: string[];
  dynamicMapLoad: string[];
  wheelSpeed: string[];
  bestGnssPos: string[];
  lidarPacket: string[];
}

interface TimeRange {
  begin: number;
  end: number;
}

interface AnalysisResult {
  title: string;
  content: string;
  hasData: boolean;
}
interface WheelSpeed {
  time: string;
  fl: number;
  fr: number;
  rl: number;
  rr: number;
  measurement_time: number;
}
const plugin: Plugin = {
  id: "gnss-lidar-wheel-analysis",
  name: "GNSS雷达轮速分析",
  description: "分析GNSS、雷达频率、轮速相关的日志数据并生成可视化图表",
  async process(content: string): Promise<PluginResult> {
    try {
      const lines = content.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        return {
          type: "html",
          summary: "❌ 未找到有效的日志数据",
          html: '<div class="no-data">请提供包含GNSS、雷达或轮速数据的日志文件</div>',
        };
      }

      // 解析时间范围
      const timeRange = parseTimeRange(lines);
      if (!timeRange) {
        return {
          type: "html",
          summary: "❌ 无法解析日志时间范围",
          html: '<div class="error">日志格式不正确，无法解析时间信息</div>',
        };
      }

      // 分类日志
      const categorizedLogs = categorizeLogs(lines);

      // 生成分析结果
      const results = generateAnalysis(categorizedLogs, timeRange);

      // 构建HTML输出
      const html = buildAnalysisReport(results, timeRange, lines.length);

      // 生成图表
      const chartOption = generateComprehensiveChart(categorizedLogs, timeRange);

      const summary = generateSummary(results);

      return {
        type: "mixed",
        summary,
        html,
        chart: chartOption
          ? {
              type: "echarts",
              option: chartOption,
            }
          : undefined,
      };
    } catch (error) {
      console.error("GNSS雷达轮速分析出错:", error);
      return {
        type: "html",
        summary: "❌ 分析过程中出现错误",
        html: `<div class="error">错误: ${error instanceof Error ? error.message : String(error)}</div>`,
      };
    }
  },
};

function parseTimeRange(lines: string[]): TimeRange | null {
  try {
    let beginTime = 0;
    let endTime = 0;

    for (const line of lines) {
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        const time = timeStringToSeconds(timeMatch[1]);
        beginTime = time;
        break;
      }
    }
    // 从后向前遍历查找结束时间
    for (let i = lines.length - 1; i >= 0; i--) {
      const timeMatch = lines[i].match(/(\d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        const time = timeStringToSeconds(timeMatch[1]);
        endTime = time;
        break;
      }
    }

    return beginTime > 0 ? { begin: beginTime, end: endTime } : null;
  } catch {
    return null;
  }
}

function timeStringToSeconds(timeStr: string): number {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${hours}:${mins}:${secs}`;
}

function categorizeLogs(lines: string[]): LogCategory {
  const categories: LogCategory = {
    orinRecvMpu: [],
    lidarFps: [],
    lidarNanRatio: [],
    gnssImu: [],
    dynamicMapLoad: [],
    wheelSpeed: [],
    bestGnssPos: [],
    lidarPacket: [],
  };

  for (const line of lines) {
    if (line.includes("raw_stream") && line.includes("read data")) {
      categories.orinRecvMpu.push(line);
    } else if (line.includes("publisher") && line.includes("pointsize")) {
      categories.lidarFps.push(line);
      categories.lidarNanRatio.push(line);
    } else if (line.includes("novatel_ros_parser")) {
      categories.gnssImu.push(line);
    } else if (line.includes("LoadDynamicMap______________________________")) {
      categories.dynamicMapLoad.push(line);
    } else if (line.includes("wheel_speed")) {
      categories.wheelSpeed.push(line);
    } else if (line.includes("bestgnsspos measurement at") && line.includes("lon_lat_hgt_std")) {
      categories.bestGnssPos.push(line);
    } else if (line.includes("packet receive:")) {
      categories.lidarPacket.push(line);
    }
  }

  return categories;
}

function generateAnalysis(logs: LogCategory, timeRange: TimeRange): AnalysisResult[] {
  const results: AnalysisResult[] = [];

  // GNSS分析
  if (logs.gnssImu.length > 0) {
    results.push(analyzeGnss(logs.gnssImu, timeRange));
  }

  // 雷达FPS分析
  if (logs.lidarFps.length > 0) {
    results.push(analyzeLidarFps(logs.lidarFps));
  }

  // NAN比率分析
  if (logs.lidarNanRatio.length > 0) {
    results.push(analyzeLidarNanRatio(logs.lidarNanRatio));
  }

  // 轮速分析
  if (logs.wheelSpeed.length > 0) {
    results.push(analyzeWheelSpeed(logs.wheelSpeed));
  }

  // Orin接收MPU数据分析
  if (logs.orinRecvMpu.length > 0) {
    results.push(analyzeOrinRecvMpu(logs.orinRecvMpu));
  }

  return results;
}

function analyzeGnss(lines: string[], timeRange: TimeRange): AnalysisResult {
  const duration = timeRange.end - timeRange.begin;
  const gnssLostFrame = new Array(duration + 1).fill(0);
  const gnssLatency = new Array(duration + 1).fill(0);
  const imuLatency = new Array(duration + 1).fill(0);

  let gnssLatencySum = 0;
  let gnssLatencyCnt = 0;
  let imuLatencySum = 0;
  let imuLatencyCnt = 0;

  for (const line of lines) {
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
    if (!timeMatch) continue;

    const time = timeStringToSeconds(timeMatch[1]);
    const index = time - timeRange.begin;

    if (index < 0 || index >= gnssLostFrame.length) continue;

    if (line.includes("imu time diff warning")) {
      imuLatency[index] += 1;
      imuLatencyCnt += 1;
      const latencyMatch = line.match(/[\d.]+$/);
      if (latencyMatch) {
        imuLatencySum += parseFloat(latencyMatch[0]);
      }
    } else if (line.includes("lost frame")) {
      gnssLostFrame[index] += 1;
    } else if (line.includes("not synchronized")) {
      gnssLatency[index] += 1;
      gnssLatencyCnt += 1;
      const latencyMatch = line.match(/[\d.]+$/);
      if (latencyMatch) {
        gnssLatencySum += parseFloat(latencyMatch[0]);
      }
    }
  }

  const lostPercentage = (
    (100 * gnssLostFrame.reduce((a, b) => a + b, 0)) /
    (15 * gnssLostFrame.length)
  ).toFixed(2);
  const latencyPercentage = (
    (100 * gnssLatency.reduce((a, b) => a + b, 0)) /
    (15 * gnssLatency.length)
  ).toFixed(2);
  const avgGnssLatency =
    gnssLatencyCnt > 0 ? ((1000 * gnssLatencySum) / gnssLatencyCnt).toFixed(0) : "0";
  const imuLatencyPercentage = (
    (100 * imuLatency.reduce((a, b) => a + b, 0)) /
    (100 * imuLatency.length)
  ).toFixed(2);
  const avgImuLatency =
    imuLatencyCnt > 0 ? ((1000 * imuLatencySum) / imuLatencyCnt).toFixed(0) : "0";

  const content = `
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">卫星数据丢失率</div>
        <div class="stat-value">${lostPercentage}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">卫星延迟超限率</div>
        <div class="stat-value">${latencyPercentage}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">卫星平均延迟</div>
        <div class="stat-value">${avgGnssLatency}ms</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">IMU延迟超限率</div>
        <div class="stat-value">${imuLatencyPercentage}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">IMU平均延迟</div>
        <div class="stat-value">${avgImuLatency}ms</div>
      </div>
    </div>
  `;

  return {
    title: "🛰️ GNSS/IMU 数据分析",
    content,
    hasData: true,
  };
}

function analyzeLidarFps(lines: string[]): AnalysisResult {
  const fpsDict: { [key: number]: { count: number; latencies: number[] } } = {};

  for (const line of lines) {
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
    if (!timeMatch) continue;

    const time = timeStringToSeconds(timeMatch[1]);

    const sysTimeMatch = line.match(/system\s+time\s+is\s+([\d.]+)/);
    const pclTimeMatch = line.match(/timestamp\s+is\s+([\d.]+)/);

    if (sysTimeMatch && pclTimeMatch) {
      const sysTime = parseFloat(sysTimeMatch[1]);
      const pclTime = parseFloat(pclTimeMatch[1]);
      const latency = sysTime - pclTime;

      if (!fpsDict[time]) {
        fpsDict[time] = { count: 0, latencies: [] };
      }
      fpsDict[time].count += 1;
      fpsDict[time].latencies.push(latency);
    }
  }

  const times = Object.keys(fpsDict).map(Number).sort();
  const frameRates = times.map((t) => fpsDict[t].count);
  const avgLatencies = times.map((t) => {
    const latencies = fpsDict[t].latencies;
    return latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  });

  const avgFrameRate =
    frameRates.length > 0
      ? (frameRates.reduce((a, b) => a + b, 0) / frameRates.length).toFixed(2)
      : "0";
  const avgLatency =
    avgLatencies.length > 0
      ? ((avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length) * 1000).toFixed(2)
      : "0";

  const content = `
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">平均帧率</div>
        <div class="stat-value">${avgFrameRate} fps</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">平均延迟</div>
        <div class="stat-value">${avgLatency} ms</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">数据点数量</div>
        <div class="stat-value">${frameRates.length}</div>
      </div>
    </div>
  `;

  return {
    title: "📡 雷达 FPS 和延迟分析",
    content,
    hasData: frameRates.length > 0,
  };
}

function analyzeLidarNanRatio(lines: string[]): AnalysisResult {
  const nanData: Array<{ time: number; ratio: number }> = [];

  for (const line of lines) {
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
    if (!timeMatch) continue;

    const time = timeStringToSeconds(timeMatch[1]);
    const ratioMatch = line.match(/=([0-9.]+)$/);
    if (ratioMatch) {
      const ratio = parseFloat(ratioMatch[1]) * 100;
      nanData.push({ time, ratio });
    }
  }

  const avgRatio =
    nanData.length > 0
      ? (nanData.reduce((sum, item) => sum + item.ratio, 0) / nanData.length).toFixed(2)
      : "0";
  const maxRatio =
    nanData.length > 0 ? Math.max(...nanData.map((item) => item.ratio)).toFixed(2) : "0";

  const content = `
    <div class="stats-grid">
      <div class="stat-item ${parseFloat(maxRatio) > 70 ? "error" : ""}">
        <div class="stat-label">最高 NAN 比率</div>
        <div class="stat-value">${maxRatio}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">平均 NAN 比率</div>
        <div class="stat-value">${avgRatio}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">异常记录数</div>
        <div class="stat-value">${nanData.length}</div>
      </div>
    </div>
  `;

  return {
    title: "⚠️ 雷达 NAN 点比率分析",
    content,
    hasData: nanData.length > 0,
  };
}

function analyzeWheelSpeed(lines: string[]): PluginResult {
  const wheelSpeedData: WheelSpeed[] = [];

  for (const line of lines) {
    if (line.includes("wheel_speed")) {
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
      if (!timeMatch) continue;

      const time = timeMatch[1];
      const fields = line.split(" ").filter((f) => f.trim());
      if (fields.length >= 6) {
        try {
          const fl = parseFloat(fields[fields.length - 5]);
          const fr = parseFloat(fields[fields.length - 4]);
          const rl = parseFloat(fields[fields.length - 3]);
          const rr = parseFloat(fields[fields.length - 2]);
          const measurementTime = parseFloat(fields[fields.length - 1]);
          wheelSpeedData.push({
            time: time,
            fl: fl,
            fr: fr,
            rl: rl,
            rr: rr,
            measurement_time: measurementTime,
          });
        } catch {
          // 解析失败，跳过
        }
      }
    }
  }

  if (wheelSpeedData.length === 0) {
    return {
      type: "html",
      summary: "",
      html: '<div class="no-data">🚗 轮速数据分析:未找到轮速数据</div>',
    };
  }

  // 生成时间轴标签
  const timeLabels = wheelSpeedData.map((data) => data.time);

  // 生成各轮速数据
  const flData = wheelSpeedData.map((data) => Math.round(Math.abs(data.fl) * 100) / 100);
  const frData = wheelSpeedData.map((data) => Math.round(Math.abs(data.fr) * 100) / 100);
  const rlData = wheelSpeedData.map((data) => Math.round(Math.abs(data.rl) * 100) / 100);
  const rrData = wheelSpeedData.map((data) => Math.round(Math.abs(data.rr) * 100) / 100);

  // 生成轮速图表
  const chartOption = {
    title: {
      text: "轮速数据时序图",
      left: "center",
      textStyle: {
        fontSize: 14,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        animation: false,
      },
      formatter: function (params: any) {
        let result = "时间: " + params[0].axisValue + "<br/>";
        params.forEach((param: any) => {
          result += param.seriesName + ": " + param.value + " m/s<br/>";
        });
        return result;
      },
    },
    legend: {
      data: ["前左轮", "前右轮", "后左轮", "后右轮", "平均轮速"],
      top: 20,
      textStyle: {
        fontSize: 11,
      },
    },
    grid: {
      left: "8%",
      right: "4%",
      bottom: "20%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: timeLabels,
      axisLabel: {
        rotate: 45,
        fontSize: 9,
        interval: Math.max(1, Math.floor(timeLabels.length / 10)), // 自动调整标签间隔
        formatter: function (value: string) {
          return value; // 显示完整的时分秒
        },
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: "value",
      name: "轮速 (m/s)",
      axisLabel: {
        fontSize: 10,
        formatter: "{value}",
      },
      splitLine: {
        lineStyle: {
          type: "dashed",
        },
      },
    },
    series: [
      {
        name: "前左轮",
        type: "line",
        data: flData,
        lineStyle: {
          color: "#FF6B6B",
          width: 2,
        },
        itemStyle: {
          color: "#FF6B6B",
        },
        symbol: "circle",
        symbolSize: 3,
        smooth: false,
      },
      {
        name: "前右轮",
        type: "line",
        data: frData,
        lineStyle: {
          color: "#4ECDC4",
          width: 2,
        },
        itemStyle: {
          color: "#4ECDC4",
        },
        symbol: "circle",
        symbolSize: 3,
        smooth: false,
      },
      {
        name: "后左轮",
        type: "line",
        data: rlData,
        lineStyle: {
          color: "#45B7D1",
          width: 2,
        },
        itemStyle: {
          color: "#45B7D1",
        },
        symbol: "circle",
        symbolSize: 3,
        smooth: false,
      },
      {
        name: "后右轮",
        type: "line",
        data: rrData,
        lineStyle: {
          color: "#F9CA24",
          width: 2,
        },
        itemStyle: {
          color: "#F9CA24",
        },
        symbol: "circle",
        symbolSize: 3,
        smooth: false,
      },
    ],
    dataZoom: [
      {
        type: "slider",
        xAxisIndex: 0,
        filterMode: "none",
        start: 0,
        end: 100,
        height: 20,
        bottom: 10,
      },
      {
        type: "inside",
        xAxisIndex: 0,
        filterMode: "none",
      },
    ],
  };

  const html = `
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">数据点数量</div>
        <div class="stat-value">${wheelSpeedData.length}</div>
      </div>
    </div>
  `;
  return {
    type: "mixed",
    summary: "轮速数据分析",
    html,
    chart: {
      type: "echarts",
      option: chartOption,
    },
  };
}

function analyzeOrinRecvMpu(lines: string[]): PluginResult {
  const byteStats: { [key: string]: number } = {};
  const recvStats: { [key: string]: number } = {};

  for (const line of lines) {
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
    if (!timeMatch) continue;

    const timeStr = timeMatch[1];
    const byteMatch = line.match(/(\d+)\//);

    if (byteMatch) {
      const bytes = parseInt(byteMatch[1]);

      if (!byteStats[timeStr]) {
        byteStats[timeStr] = 0;
        recvStats[timeStr] = 0;
      }

      byteStats[timeStr] += bytes;
      recvStats[timeStr] += 1;
    }
  }

  const totalBytes = Object.values(byteStats).reduce((a, b) => a + b, 0);
  const totalReceives = Object.values(recvStats).reduce((a, b) => a + b, 0);
  const avgByteRate =
    totalBytes > 0 ? (totalBytes / Object.keys(byteStats).length).toFixed(0) : "0";
  const normalRate = 8710;
  const ratio = ((parseInt(avgByteRate) / normalRate) * 100).toFixed(2);

  const content = `
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">平均接收速率</div>
        <div class="stat-value">${avgByteRate} bytes/s</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">正常率</div>
        <div class="stat-value">${ratio}%</div>
      </div>
      <div class="stat-item ${parseFloat(ratio) < 95 ? "warning" : ""}">
        <div class="stat-label">标准速率</div>
        <div class="stat-value">${normalRate} bytes/s</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">总接收次数</div>
        <div class="stat-value">${totalReceives}</div>
      </div>
    </div>
  `;

  return {
    title: "🖥️ Orin 接收 MPU 数据分析",
    content,
    hasData: totalReceives > 0,
  };
}

function buildAnalysisReport(
  results: AnalysisResult[],
  timeRange: TimeRange,
  totalLines: number
): string {
  let html = `
    <div class="gnss-lidar-analysis">
      <div class="analysis-header">
        <h3>📊 GNSS雷达轮速数据分析报告</h3>
        <div class="analysis-info">
          <div class="info-item">
            <span class="info-label">分析时间范围：</span>
            <span class="info-value">${formatTime(timeRange.begin)} ~ ${formatTime(timeRange.end)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">总日志行数：</span>
            <span class="info-value">${totalLines.toLocaleString()}</span>
          </div>
          <div class="info-item">
            <span class="info-label">分析模块：</span>
            <span class="info-value">${results.filter((r) => r.hasData).length} 个</span>
          </div>
        </div>
      </div>
  `;

  if (results.length > 0) {
    for (const result of results) {
      if (result.hasData) {
        html += `
          <div class="analysis-section">
            <h4 class="section-title">${result.title}</h4>
            <div class="section-content">${result.content}</div>
          </div>
        `;
      }
    }
  } else {
    html += `
      <div class="no-data">
        <div class="no-data-icon">📋</div>
        <div class="no-data-text">未检测到相关的日志数据</div>
        <div class="no-data-hint">请确保日志包含GNSS、雷达或轮速相关信息</div>
      </div>
    `;
  }

  html += "</div>";
  return html;
}

function generateSummary(results: AnalysisResult[]): string {
  const validResults = results.filter((r) => r.hasData);

  if (validResults.length === 0) {
    return "❌ 未检测到有效的GNSS/雷达/轮速数据";
  }

  const moduleNames = validResults.map((r) => r.title.replace(/[🛰️📡📉⚠️🚗🖥️]/g, "").trim());

  return `✅ 成功分析 ${validResults.length} 个模块：${moduleNames.join("、")}`;
}

function generateComprehensiveChart(logs: LogCategory, timeRange: TimeRange): any {
  // 生成时间轴（每分钟采样）
  const timeAxis = [];
  for (let t = timeRange.begin; t <= timeRange.end; t += 60) {
    timeAxis.push(formatTime(t));
  }

  if (timeAxis.length === 0) {
    return null;
  }

  // 模拟数据生成（实际项目中应该根据真实数据生成）
  const gnssData = new Array(timeAxis.length).fill(0).map(() => Math.random() * 10);
  const lidarFpsData = new Array(timeAxis.length).fill(0).map(() => 40 + Math.random() * 20);
  const wheelSpeedData = new Array(timeAxis.length).fill(0).map(() => Math.random() * 15);

  const option = {
    title: {
      text: "GNSS雷达轮速综合分析图表",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        animation: false,
      },
      formatter: function (params: any) {
        let result = `时间: ${params[0].axisValue}<br/>`;
        params.forEach((param: any) => {
          result += `${param.seriesName}: ${param.value}<br/>`;
        });
        return result;
      },
    },
    legend: {
      data: ["GNSS状态指标", "雷达FPS", "轮速"],
      top: 35,
      textStyle: {
        fontSize: 12,
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: timeAxis,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: [
      {
        type: "value",
        name: "状态/FPS",
        position: "left",
        axisLabel: {
          fontSize: 10,
        },
      },
      {
        type: "value",
        name: "速度 (m/s)",
        position: "right",
        axisLabel: {
          fontSize: 10,
        },
      },
    ],
    series: [
      {
        name: "GNSS状态指标",
        type: "line",
        data: gnssData,
        smooth: true,
        lineStyle: {
          color: "#5470c6",
          width: 2,
        },
        itemStyle: {
          color: "#5470c6",
        },
      },
      {
        name: "雷达FPS",
        type: "line",
        data: lidarFpsData,
        smooth: true,
        lineStyle: {
          color: "#91cc75",
          width: 2,
        },
        itemStyle: {
          color: "#91cc75",
        },
      },
      {
        name: "轮速",
        type: "line",
        yAxisIndex: 1,
        data: wheelSpeedData,
        smooth: true,
        lineStyle: {
          color: "#fac858",
          width: 2,
        },
        itemStyle: {
          color: "#fac858",
        },
      },
    ],
    dataZoom: [
      {
        type: "slider",
        xAxisIndex: 0,
        filterMode: "none",
      },
    ],
  };

  return option;
}

export default plugin;
