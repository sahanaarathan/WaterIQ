import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BrainCircuit,
  CheckCircle2,
  Droplets,
  Gauge,
  LayoutDashboard,
  Map,
  Network,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
  ArrowUpRight,
  CircleAlert,
  Clock3,
  Database,
  Server,
  Radio,
  Search,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./App.css";

type SensorData = {
  ph: number;
  turbidity: number;
  tds: number;
  temperature: number;
  conductivity: number;
  flow_rate: number;
  pressure: number;
};

type Prediction = {
  water_quality: string;
  water_quality_confidence: number;
  leak_status: string;
  leak_confidence: number;
  safety_score: number;
  leak_risk: number;
};

type HistoryPoint = SensorData & {
  time: string;
  safety: number;
  quality: string;
  leak: string;
};

type EventItem = {
  id: number;
  time: string;
  message: string;
  type: "safe" | "warning" | "critical" | "leak";
};

type Page =
  | "command"
  | "quality"
  | "leak"
  | "analytics"
  | "alerts"
  | "infrastructure";

const initialSensors: SensorData = {
  ph: 7.2,
  turbidity: 2.4,
  tds: 430,
  temperature: 27,
  conductivity: 680,
  flow_rate: 50,
  pressure: 3.2,
};

const initialPrediction: Prediction = {
  water_quality: "SAFE",
  water_quality_confidence: 0,
  leak_status: "NORMAL",
  leak_confidence: 0,
  safety_score: 90,
  leak_risk: 10,
};

const zones = [
  {
    name: "North Reservoir",
    status: "SAFE",
    value: 96,
    flow: "Stable",
    pressure: "3.4 bar",
  },
  {
    name: "Central Pipeline",
    status: "SAFE",
    value: 91,
    flow: "Stable",
    pressure: "3.1 bar",
  },
  {
    name: "East Distribution",
    status: "WARNING",
    value: 67,
    flow: "Irregular",
    pressure: "2.4 bar",
  },
  {
    name: "South Network",
    status: "SAFE",
    value: 94,
    flow: "Stable",
    pressure: "3.3 bar",
  },
];

const qualityDistribution = [
  { name: "Safe", value: 60 },
  { name: "Warning", value: 22 },
  { name: "Critical", value: 10 },
  { name: "Leak Scenario", value: 8 },
];

function App() {
  const [page, setPage] = useState<Page>("command");

  const [sensors, setSensors] =
    useState<SensorData>(initialSensors);

  const [prediction, setPrediction] =
    useState<Prediction>(initialPrediction);

  const [history, setHistory] =
    useState<HistoryPoint[]>([]);

  const [running, setRunning] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [lastUpdate, setLastUpdate] =
    useState("Waiting for analysis");

  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 1,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      message: "WaterIQ system initialized",
      type: "safe",
    },
    {
      id: 2,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      message: "AI monitoring engine ready",
      type: "safe",
    },
    {
      id: 3,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      message: "Sensor simulation ready",
      type: "safe",
    },
  ]);

  const addEvent = (
    message: string,
    type: EventItem["type"] = "safe"
  ) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setEvents((previous) => {
      if (
        previous.length > 0 &&
        previous[0].message === message
      ) {
        return previous;
      }

      return [
        {
          id: Date.now(),
          time,
          message,
          type,
        },
        ...previous,
      ].slice(0, 20);
    });
  };

  const analyzeWater = async (
    reading: SensorData
  ) => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reading),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Backend request failed"
        );
      }

      const data = await response.json();

      const quality =
        data.water_quality ??
        data.quality_status ??
        data.water_status ??
        "SAFE";

      const qualityConfidence = Number(
        data.quality_confidence ??
          data.water_quality_confidence ??
          0
      );

      const leakStatus =
        data.leak_status ??
        data.leak_prediction ??
        "NORMAL";

      const leakConfidence = Number(
        data.leak_confidence ?? 0
      );

      const safetyScore = Number(
        data.safety_score ?? 90
      );

      const leakRisk = Number(
        data.leak_risk ?? 10
      );

      const result: Prediction = {
        water_quality: quality,
        water_quality_confidence:
          qualityConfidence,
        leak_status: leakStatus,
        leak_confidence:
          leakConfidence,
        safety_score: safetyScore,
        leak_risk: leakRisk,
      };

      setPrediction(result);

      const now = new Date();

      const point: HistoryPoint = {
        ...reading,
        time: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        safety: safetyScore,
        quality,
        leak: leakStatus,
      };

      setHistory((previous) => [
        ...previous.slice(-29),
        point,
      ]);

      setLastUpdate(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      if (quality === "CRITICAL") {
        addEvent(
          "CRITICAL water quality detected",
          "critical"
        );
      } else if (quality === "WARNING") {
        addEvent(
          "Water quality warning detected",
          "warning"
        );
      } else if (
        quality === "SAFE" &&
        leakStatus === "NORMAL"
      ) {
        addEvent(
          "Water and infrastructure operating normally",
          "safe"
        );
      }

      if (leakStatus === "LEAK") {
        addEvent(
          "Potential pipeline leak detected",
          "leak"
        );
      }
    } catch (error) {
      console.error(error);

      setLastUpdate(
        "Backend connection error"
      );

      addEvent(
        "Unable to connect to AI backend",
        "critical"
      );
    } finally {
      setLoading(false);
    }
  };

  const generateSensorReading =
    (): SensorData => {
      const scenario = Math.random();

      if (scenario < 0.6) {
        return {
          ph: Number(
            (
              6.8 +
              Math.random() * 0.8
            ).toFixed(2)
          ),
          turbidity: Number(
            (
              1.5 +
              Math.random() * 2
            ).toFixed(2)
          ),
          tds: Math.round(
            350 +
              Math.random() * 150
          ),
          temperature: Number(
            (
              25 +
              Math.random() * 4
            ).toFixed(2)
          ),
          conductivity: Math.round(
            550 +
              Math.random() * 250
          ),
          flow_rate: Number(
            (
              45 +
              Math.random() * 12
            ).toFixed(2)
          ),
          pressure: Number(
            (
              2.8 +
              Math.random() * 0.8
            ).toFixed(2)
          ),
        };
      }

      if (scenario < 0.82) {
        return {
          ph: Number(
            (
              6.0 +
              Math.random() * 1.8
            ).toFixed(2)
          ),
          turbidity: Number(
            (
              5 +
              Math.random() * 5
            ).toFixed(2)
          ),
          tds: Math.round(
            500 +
              Math.random() * 250
          ),
          temperature: Number(
            (
              27 +
              Math.random() * 5
            ).toFixed(2)
          ),
          conductivity: Math.round(
            750 +
              Math.random() * 350
          ),
          flow_rate: Number(
            (
              42 +
              Math.random() * 15
            ).toFixed(2)
          ),
          pressure: Number(
            (
              2.3 +
              Math.random() * 0.7
            ).toFixed(2)
          ),
        };
      }

      if (scenario < 0.92) {
        return {
          ph: Number(
            (
              4.5 +
              Math.random() * 2
            ).toFixed(2)
          ),
          turbidity: Number(
            (
              12 +
              Math.random() * 10
            ).toFixed(2)
          ),
          tds: Math.round(
            850 +
              Math.random() * 450
          ),
          temperature: Number(
            (
              30 +
              Math.random() * 5
            ).toFixed(2)
          ),
          conductivity: Math.round(
            1100 +
              Math.random() * 600
          ),
          flow_rate: Number(
            (
              45 +
              Math.random() * 10
            ).toFixed(2)
          ),
          pressure: Number(
            (
              2.5 +
              Math.random() * 0.6
            ).toFixed(2)
          ),
        };
      }

      return {
        ph: Number(
          (
            6.8 +
            Math.random() * 0.8
          ).toFixed(2)
        ),
        turbidity: Number(
          (
            1.5 +
            Math.random() * 2
          ).toFixed(2)
        ),
        tds: Math.round(
          350 +
            Math.random() * 150
        ),
        temperature: Number(
          (
            25 +
            Math.random() * 4
          ).toFixed(2)
        ),
        conductivity: Math.round(
          550 +
            Math.random() * 250
        ),
        flow_rate: Number(
          75 +
            Math.random() * 25
        ).toFixed(2),
        pressure: Number(
          (
            1.0 +
            Math.random() * 0.8
          ).toFixed(2),
        ),
      } as SensorData;
    };

  const runAnalysis = () => {
    analyzeWater(sensors);
  };

  const toggleSimulation = () => {
    setRunning((previous) => !previous);
  };

  useEffect(() => {
    if (!running) {
      return;
    }

    const run = async () => {
      const nextReading =
        generateSensorReading();

      setSensors(nextReading);

      await analyzeWater(nextReading);
    };

    run();

    const interval = setInterval(
      run,
      4000
    );

    return () =>
      clearInterval(interval);
  }, [running]);

  const qualityClass =
    prediction.water_quality.toLowerCase();

  const leakClass =
    prediction.leak_status.toLowerCase();

  const aiExplanation = useMemo(() => {
    if (
      prediction.water_quality ===
      "CRITICAL"
    ) {
      return "The AI detected abnormal water-quality conditions. Elevated turbidity, dissolved solids or related sensor patterns are contributing to the critical classification.";
    }

    if (
      prediction.water_quality ===
      "WARNING"
    ) {
      return "The AI detected sensor values outside the preferred operating range. Continued monitoring is recommended.";
    }

    if (
      prediction.leak_status === "LEAK"
    ) {
      return "The infrastructure model detected an abnormal relationship between flow rate and pressure, indicating a possible pipeline leak.";
    }

    return "Current sensor patterns are within the learned safe operating range. Water quality and infrastructure conditions are currently stable.";
  }, [prediction]);

  const navigate = (nextPage: Page) => {
    setPage(nextPage);
  };

  const pageTitles: Record<
    Page,
    { title: string; subtitle: string }
  > = {
    command: {
      title:
        "Water Intelligence Command Center",
      subtitle:
        "Real-time AI monitoring of water quality and infrastructure health",
    },
    quality: {
      title: "Water Quality Intelligence",
      subtitle:
        "AI-powered analysis of environmental water parameters",
    },
    leak: {
      title: "Leak Detection Center",
      subtitle:
        "AI-powered infrastructure anomaly detection",
    },
    analytics: {
      title: "Advanced Analytics",
      subtitle:
        "Historical patterns, model performance and system intelligence",
    },
    alerts: {
      title: "Real-Time Alert Center",
      subtitle:
        "Monitor critical events and AI-generated warnings",
    },
    infrastructure: {
      title: "Infrastructure Network",
      subtitle:
        "Live health overview of monitored water distribution zones",
    },
  };

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">
            <Droplets size={22} />
          </div>

          <div>
            <div className="logo-text">
              WaterIQ
            </div>

            <div className="logo-subtitle">
              AI Water Intelligence
            </div>
          </div>
        </div>

        <nav className="nav">

          <NavButton
            active={page === "command"}
            icon={
              <LayoutDashboard size={18} />
            }
            label="Command Center"
            onClick={() =>
              navigate("command")
            }
          />

          <NavButton
            active={page === "quality"}
            icon={
              <Droplets size={18} />
            }
            label="Water Quality"
            onClick={() =>
              navigate("quality")
            }
          />

          <NavButton
            active={page === "leak"}
            icon={
              <Network size={18} />
            }
            label="Leak Detection"
            onClick={() =>
              navigate("leak")
            }
          />

          <NavButton
            active={page === "analytics"}
            icon={
              <BarChart3 size={18} />
            }
            label="Analytics"
            onClick={() =>
              navigate("analytics")
            }
          />

          <NavButton
            active={page === "alerts"}
            icon={
              <Bell size={18} />
            }
            label="Alerts"
            badge={
              events.filter(
                (event) =>
                  event.type ===
                    "critical" ||
                  event.type === "leak"
              ).length
            }
            onClick={() =>
              navigate("alerts")
            }
          />

          <NavButton
            active={
              page === "infrastructure"
            }
            icon={
              <Map size={18} />
            }
            label="Infrastructure"
            onClick={() =>
              navigate("infrastructure")
            }
          />

        </nav>

        <div className="sidebar-bottom">

          <div className="system-status">

            <div className="system-status-title">
              SYSTEM STATUS
            </div>

            <div className="system-status-row">
              <span className="online-dot"></span>
              AI Engine Online
            </div>

            <div className="system-status-row">
              <Radio size={14} />
              Live telemetry ready
            </div>

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        <header className="header">

          <div>

            <h1>
              {pageTitles[page].title}
            </h1>

            <p>
              {pageTitles[page].subtitle}
            </p>

          </div>

          <div className="header-status">
            <span className="online-dot"></span>
            System Operational
          </div>

        </header>

        {page === "command" && (
          <CommandCenter
            sensors={sensors}
            setSensors={setSensors}
            prediction={prediction}
            history={history}
            running={running}
            loading={loading}
            lastUpdate={lastUpdate}
            events={events}
            toggleSimulation={
              toggleSimulation
            }
            runAnalysis={runAnalysis}
            aiExplanation={
              aiExplanation
            }
          />
        )}

        {page === "quality" && (
          <WaterQualityPage
            sensors={sensors}
            prediction={prediction}
            history={history}
            loading={loading}
            runAnalysis={runAnalysis}
          />
        )}

        {page === "leak" && (
          <LeakDetectionPage
            sensors={sensors}
            prediction={prediction}
            history={history}
            loading={loading}
            runAnalysis={runAnalysis}
          />
        )}

        {page === "analytics" && (
          <AnalyticsPage
            history={history}
            prediction={prediction}
          />
        )}

        {page === "alerts" && (
          <AlertsPage
            events={events}
          />
        )}

        {page === "infrastructure" && (
          <InfrastructurePage
            prediction={prediction}
            sensors={sensors}
          />
        )}

        <div className="bottom-status">

          <span>
            Last AI update:{" "}
            <strong>
              {lastUpdate}
            </strong>
          </span>

          <span>
            <span className="online-dot"></span>
            WaterIQ AI Engine Operational
          </span>

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   NAV BUTTON
========================================================= */

function NavButton({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      {icon}

      <span>{label}</span>

      {badge !== undefined &&
        badge > 0 && (
          <span className="nav-badge">
            {badge}
          </span>
        )}
    </button>
  );
}


/* =========================================================
   COMMAND CENTER
========================================================= */

function CommandCenter({
  sensors,
  setSensors,
  prediction,
  history,
  running,
  loading,
  lastUpdate,
  events,
  toggleSimulation,
  runAnalysis,
  aiExplanation,
}: {
  sensors: SensorData;
  setSensors: React.Dispatch<
    React.SetStateAction<SensorData>
  >;
  prediction: Prediction;
  history: HistoryPoint[];
  running: boolean;
  loading: boolean;
  lastUpdate: string;
  events: EventItem[];
  toggleSimulation: () => void;
  runAnalysis: () => void;
  aiExplanation: string;
}) {
  const qualityClass =
    prediction.water_quality.toLowerCase();

  const leakClass =
    prediction.leak_status.toLowerCase();

  return (
    <>

      <section className="dashboard-grid">

        <KpiCard
          icon={<ShieldCheck size={21} />}
          title="Water Safety"
          value={`${prediction.safety_score}`}
          unit="/100"
          status={
            prediction.water_quality
          }
          statusClass={qualityClass}
        />

        <KpiCard
          icon={<Waves size={21} />}
          title="Water Quality"
          value={
            prediction.water_quality
          }
          status={`Confidence ${prediction.water_quality_confidence.toFixed(
            1
          )}%`}
          statusClass="normal"
        />

        <KpiCard
          icon={<Network size={21} />}
          title="Leak Risk"
          value={`${prediction.leak_risk}%`}
          status={
            prediction.leak_status
          }
          statusClass={
            prediction.leak_status ===
            "LEAK"
              ? "critical"
              : "normal"
          }
        />

        <KpiCard
          icon={<BrainCircuit size={21} />}
          title="AI Monitoring"
          value="ACTIVE"
          status="Random Forest Engine"
          statusClass="safe"
        />

      </section>

      <section className="section">

        <div className="section-header">

          <div>
            <h2 className="section-title">
              Live Sensor Intelligence
            </h2>

            <div className="section-subtitle">
              Simulated field sensor
              telemetry
            </div>
          </div>

          <button
            className="simulation-button"
            onClick={
              toggleSimulation
            }
          >
            {running ? (
              <>
                <Pause size={15} />
                Stop Live Monitoring
              </>
            ) : (
              <>
                <Play size={15} />
                Start Live Monitoring
              </>
            )}
          </button>

        </div>

        <div className="sensor-panel">

          <div className="sensor-grid">

            <Sensor
              icon={
                <Activity size={15} />
              }
              label="pH"
              value={sensors.ph}
              onChange={(value) =>
                setSensors({
                  ...sensors,
                  ph: value,
                })
              }
            />

            <Sensor
              icon={
                <Waves size={15} />
              }
              label="Turbidity"
              value={
                sensors.turbidity
              }
              onChange={(value) =>
                setSensors({
                  ...sensors,
                  turbidity: value,
                })
              }
            />

            <Sensor
              icon={
                <Droplets size={15} />
              }
              label="TDS"
              value={sensors.tds}
              onChange={(value) =>
                setSensors({
                  ...sensors,
                  tds: value,
                })
              }
            />

            <Sensor
              icon={
                <Thermometer size={15} />
              }
              label="Temperature"
              value={
                sensors.temperature
              }
              onChange={(value) =>
                setSensors({
                  ...sensors,
                  temperature: value,
                })
              }
            />

            <Sensor
              icon={
                <Zap size={15} />
              }
              label="Conductivity"
              value={
                sensors.conductivity
              }
              onChange={(value) =>
                setSensors({
                  ...sensors,
                  conductivity: value,
                })
              }
            />

            <Sensor
              icon={
                <TrendingUp size={15} />
              }
              label="Flow Rate"
              value={
                sensors.flow_rate
              }
              onChange={(value) =>
                setSensors({
                  ...sensors,
                  flow_rate: value,
                })
              }
            />

            <Sensor
              icon={
                <Gauge size={15} />
              }
              label="Pressure"
              value={
                sensors.pressure
              }
              onChange={(value) =>
                setSensors({
                  ...sensors,
                  pressure: value,
                })
              }
            />

          </div>

          <button
            className="analysis-button"
            onClick={runAnalysis}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw
                  size={16}
                  className="spin"
                />
                Analyzing...
              </>
            ) : (
              <>
                <BrainCircuit size={16} />
                Run AI Analysis
              </>
            )}
          </button>

        </div>

      </section>

      <section className="two-column section">

        <div className="chart-container">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                Safety Intelligence
              </h2>

              <div className="section-subtitle">
                AI safety score over time
              </div>
            </div>

            <div className="live-badge">
              <span></span>
              LIVE
            </div>

          </div>

          <SafetyChart
            history={history}
          />

        </div>

        <NetworkHealth />

      </section>

      <section className="two-column section">

        <div className="result-card">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                AI Decision Intelligence
              </h2>

              <div className="section-subtitle">
                Explainable model output
              </div>
            </div>

            <BrainCircuit
              size={20}
            />

          </div>

          <div className="ai-explanation">

            <div
              className={`explanation-status ${qualityClass}`}
            >

              {prediction.water_quality ===
              "SAFE" ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertTriangle
                  size={20}
                />
              )}

              <div>
                <strong>
                  Water classified as{" "}
                  {
                    prediction.water_quality
                  }
                </strong>

                <span>
                  Model confidence:{" "}
                  {prediction.water_quality_confidence.toFixed(
                    1
                  )}
                  %
                </span>
              </div>

            </div>

            <p>
              {aiExplanation}
            </p>

          </div>

        </div>

        <EventPanel events={events} />

      </section>

    </>
  );
}


/* =========================================================
   WATER QUALITY
========================================================= */

function WaterQualityPage({
  sensors,
  prediction,
  history,
  loading,
  runAnalysis,
}: {
  sensors: SensorData;
  prediction: Prediction;
  history: HistoryPoint[];
  loading: boolean;
  runAnalysis: () => void;
}) {
  const parameters = [
    {
      name: "pH Level",
      value: sensors.ph,
      unit: "",
      icon: <Activity />,
      safe: sensors.ph >= 6.5 && sensors.ph <= 8.5,
    },
    {
      name: "Turbidity",
      value: sensors.turbidity,
      unit: " NTU",
      icon: <Waves />,
      safe: sensors.turbidity < 5,
    },
    {
      name: "TDS",
      value: sensors.tds,
      unit: " ppm",
      icon: <Droplets />,
      safe: sensors.tds < 600,
    },
    {
      name: "Temperature",
      value: sensors.temperature,
      unit: " °C",
      icon: <Thermometer />,
      safe:
        sensors.temperature >= 20 &&
        sensors.temperature <= 32,
    },
    {
      name: "Conductivity",
      value: sensors.conductivity,
      unit: " μS/cm",
      icon: <Zap />,
      safe: sensors.conductivity < 1000,
    },
  ];

  return (
    <>

      <section className="dashboard-grid">

        <KpiCard
          icon={<ShieldCheck />}
          title="AI Safety Score"
          value={`${prediction.safety_score}`}
          unit="/100"
          status={
            prediction.water_quality
          }
          statusClass={
            prediction.water_quality.toLowerCase()
          }
        />

        <KpiCard
          icon={<BrainCircuit />}
          title="Model Confidence"
          value={`${prediction.water_quality_confidence.toFixed(
            1
          )}%`}
          status="Random Forest"
          statusClass="normal"
        />

        <KpiCard
          icon={<Droplets />}
          title="Current Quality"
          value={
            prediction.water_quality
          }
          status="AI Classification"
          statusClass={
            prediction.water_quality.toLowerCase()
          }
        />

        <KpiCard
          icon={<Database />}
          title="Telemetry Points"
          value={`${history.length}`}
          status="Recorded readings"
          statusClass="normal"
        />

      </section>

      <section className="section">

        <div className="section-header">

          <div>
            <h2 className="section-title">
              Water Parameter Analysis
            </h2>

            <div className="section-subtitle">
              Current simulated field
              measurements
            </div>
          </div>

          <button
            className="analysis-button compact"
            onClick={runAnalysis}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="spin" />
                Analyzing
              </>
            ) : (
              <>
                <BrainCircuit />
                Analyze Quality
              </>
            )}
          </button>

        </div>

        <div className="parameter-grid">

          {parameters.map(
            (parameter) => (
              <div
                className="parameter-card"
                key={parameter.name}
              >

                <div className="parameter-icon">
                  {parameter.icon}
                </div>

                <div className="parameter-info">

                  <span>
                    {parameter.name}
                  </span>

                  <strong>
                    {parameter.value}
                    {parameter.unit}
                  </strong>

                  <small
                    className={
                      parameter.safe
                        ? "safe-text"
                        : "warning-text"
                    }
                  >
                    {parameter.safe
                      ? "Within range"
                      : "Attention required"}
                  </small>

                </div>

              </div>
            )
          )}

        </div>

      </section>

      <section className="two-column section">

        <div className="chart-container">

          <div className="section-header">
            <div>
              <h2 className="section-title">
                Quality Safety Trend
              </h2>
              <div className="section-subtitle">
                Historical AI safety score
              </div>
            </div>
          </div>

          <SafetyChart
            history={history}
          />

        </div>

        <div className="result-card">

          <div className="section-header">
            <div>
              <h2 className="section-title">
                AI Assessment
              </h2>
              <div className="section-subtitle">
                Current classification
              </div>
            </div>

            <ShieldCheck />
          </div>

          <div className="large-status">
            <div
              className={`large-status-icon ${prediction.water_quality.toLowerCase()}`}
            >
              {prediction.water_quality ===
              "SAFE" ? (
                <CheckCircle2 />
              ) : (
                <AlertTriangle />
              )}
            </div>

            <strong>
              {prediction.water_quality}
            </strong>

            <span>
              Confidence{" "}
              {prediction.water_quality_confidence.toFixed(
                1
              )}
              %
            </span>
          </div>

          <div className="insight-box">
            <BrainCircuit />
            <span>
              The Random Forest model
              continuously evaluates
              multiple water-quality
              parameters together instead
              of relying on a single
              threshold.
            </span>
          </div>

        </div>

      </section>

    </>
  );
}


/* =========================================================
   LEAK DETECTION
========================================================= */

function LeakDetectionPage({
  sensors,
  prediction,
  history,
  loading,
  runAnalysis,
}: {
  sensors: SensorData;
  prediction: Prediction;
  history: HistoryPoint[];
  loading: boolean;
  runAnalysis: () => void;
}) {
  return (
    <>

      <section className="dashboard-grid">

        <KpiCard
          icon={<Network />}
          title="Leak Risk"
          value={`${prediction.leak_risk}%`}
          status={
            prediction.leak_status
          }
          statusClass={
            prediction.leak_status ===
            "LEAK"
              ? "critical"
              : "normal"
          }
        />

        <KpiCard
          icon={<BrainCircuit />}
          title="Detection Confidence"
          value={`${prediction.leak_confidence.toFixed(
            1
          )}%`}
          status="Infrastructure model"
          statusClass="normal"
        />

        <KpiCard
          icon={<TrendingUp />}
          title="Flow Rate"
          value={`${sensors.flow_rate}`}
          unit=" L/min"
          status="Live sensor"
          statusClass="normal"
        />

        <KpiCard
          icon={<Gauge />}
          title="Pressure"
          value={`${sensors.pressure}`}
          unit=" bar"
          status="Live sensor"
          statusClass="normal"
        />

      </section>

      <section className="two-column section">

        <div className="result-card leak-main-card">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                Infrastructure AI Status
              </h2>

              <div className="section-subtitle">
                Flow-pressure relationship
                analysis
              </div>
            </div>

            <button
              className="analysis-button compact"
              onClick={runAnalysis}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <BrainCircuit />
                  Run Detection
                </>
              )}
            </button>

          </div>

          <div className="leak-status-display">

            <div
              className={`leak-ring ${
                prediction.leak_status ===
                "LEAK"
                  ? "danger"
                  : "safe"
              }`}
            >
              <Network size={42} />
              <strong>
                {prediction.leak_risk}%
              </strong>
              <span>
                Risk
              </span>
            </div>

            <div className="leak-details">

              <span className="eyebrow">
                AI CLASSIFICATION
              </span>

              <h3>
                {prediction.leak_status ===
                "LEAK"
                  ? "Potential Leak Detected"
                  : "Pipeline Operating Normally"}
              </h3>

              <p>
                {prediction.leak_status ===
                "LEAK"
                  ? "The model detected an abnormal flow-pressure pattern that may indicate water loss."
                  : "Current flow and pressure patterns remain within the learned normal operating range."}
              </p>

            </div>

          </div>

        </div>

        <div className="result-card">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                Live Pipeline Metrics
              </h2>

              <div className="section-subtitle">
                Current infrastructure
                telemetry
              </div>
            </div>

            <Activity />

          </div>

          <div className="metric-list">

            <MetricRow
              label="Flow Rate"
              value={`${sensors.flow_rate} L/min`}
              icon={<TrendingUp />}
            />

            <MetricRow
              label="Pressure"
              value={`${sensors.pressure} bar`}
              icon={<Gauge />}
            />

            <MetricRow
              label="Pressure Stability"
              value={
                sensors.pressure > 2.3
                  ? "Stable"
                  : "Low"
              }
              icon={<Activity />}
            />

            <MetricRow
              label="Network State"
              value={
                prediction.leak_status ===
                "LEAK"
                  ? "Investigate"
                  : "Normal"
              }
              icon={<Network />}
            />

          </div>

        </div>

      </section>

      <section className="section chart-container">

        <div className="section-header">

          <div>
            <h2 className="section-title">
              Infrastructure Risk Trend
            </h2>

            <div className="section-subtitle">
              AI leak-risk monitoring over
              recent readings
            </div>
          </div>

          <div className="live-badge">
            <span></span>
            LIVE
          </div>

        </div>

        <LeakChart history={history} />

      </section>

    </>
  );
}


/* =========================================================
   ANALYTICS
========================================================= */

function AnalyticsPage({
  history,
  prediction,
}: {
  history: HistoryPoint[];
  prediction: Prediction;
}) {
  const chartData =
    history.length > 0
      ? history
      : [
          {
            time: "Now",
            safety: prediction.safety_score,
          },
        ];

  return (
    <>

      <section className="dashboard-grid">

        <KpiCard
          icon={<TrendingUp />}
          title="Average Safety"
          value={`${Math.round(
            history.length
              ? history.reduce(
                  (sum, item) =>
                    sum + item.safety,
                  0
                ) / history.length
              : prediction.safety_score
          )}`}
          unit="/100"
          status="Current dataset"
          statusClass="safe"
        />

        <KpiCard
          icon={<Database />}
          title="Readings Analyzed"
          value={`${history.length}`}
          status="Live telemetry"
          statusClass="normal"
        />

        <KpiCard
          icon={<BrainCircuit />}
          title="Water Model"
          value="RF"
          status="Random Forest"
          statusClass="normal"
        />

        <KpiCard
          icon={<Network />}
          title="Leak Model"
          value="RF"
          status="Random Forest"
          statusClass="normal"
        />

      </section>

      <section className="two-column section">

        <div className="chart-container">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                Safety Analytics
              </h2>

              <div className="section-subtitle">
                AI safety score progression
              </div>
            </div>

          </div>

          <div className="chart-wrapper analytics-chart">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={chartData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 10,
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="safety"
                  strokeWidth={3}
                  fillOpacity={0.18}
                />

              </AreaChart>
            </ResponsiveContainer>

          </div>

        </div>

        <div className="chart-container">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                Scenario Distribution
              </h2>

              <div className="section-subtitle">
                Simulation profile
              </div>
            </div>

          </div>

          <div className="pie-wrapper">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>

                <Pie
                  data={
                    qualityDistribution
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {qualityDistribution.map(
                    (_, index) => (
                      <Cell
                        key={index}
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>

          </div>

        </div>

      </section>

      <section className="section">

        <div className="section-header">

          <div>
            <h2 className="section-title">
              Model Intelligence
            </h2>

            <div className="section-subtitle">
              WaterIQ machine-learning
              architecture
            </div>
          </div>

        </div>

        <div className="analytics-cards">

          <InsightCard
            icon={<BrainCircuit />}
            title="Water Quality Model"
            value="Random Forest"
            description="Analyzes pH, turbidity, TDS, temperature and conductivity."
          />

          <InsightCard
            icon={<Network />}
            title="Leak Detection Model"
            value="Random Forest"
            description="Evaluates flow rate and pressure relationships to detect anomalies."
          />

          <InsightCard
            icon={<ShieldCheck />}
            title="Decision Layer"
            value="AI Safety Score"
            description="Converts model predictions into an easy-to-understand operational score."
          />

        </div>

      </section>

    </>
  );
}


/* =========================================================
   ALERTS
========================================================= */

function AlertsPage({
  events,
}: {
  events: EventItem[];
}) {
  const critical = events.filter(
    (event) =>
      event.type === "critical"
  );

  const warnings = events.filter(
    (event) =>
      event.type === "warning"
  );

  const leaks = events.filter(
    (event) =>
      event.type === "leak"
  );

  return (
    <>

      <section className="dashboard-grid">

        <KpiCard
          icon={<CircleAlert />}
          title="Critical Alerts"
          value={`${critical.length}`}
          status="Requires attention"
          statusClass={
            critical.length
              ? "critical"
              : "safe"
          }
        />

        <KpiCard
          icon={<AlertTriangle />}
          title="Warnings"
          value={`${warnings.length}`}
          status="Monitoring"
          statusClass={
            warnings.length
              ? "warning"
              : "safe"
          }
        />

        <KpiCard
          icon={<Network />}
          title="Leak Events"
          value={`${leaks.length}`}
          status="Infrastructure"
          statusClass={
            leaks.length
              ? "critical"
              : "safe"
          }
        />

        <KpiCard
          icon={<Bell />}
          title="Total Events"
          value={`${events.length}`}
          status="AI event stream"
          statusClass="normal"
        />

      </section>

      <section className="section result-card">

        <div className="section-header">

          <div>
            <h2 className="section-title">
              Alert Center
            </h2>

            <div className="section-subtitle">
              Real-time AI generated events
            </div>
          </div>

          <div className="live-badge">
            <span></span>
            MONITORING
          </div>

        </div>

        <div className="alert-list">

          {events.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={34} />
              <strong>
                No active alerts
              </strong>
              <span>
                WaterIQ has not detected
                any abnormal events.
              </span>
            </div>
          ) : (
            events.map((event) => (
              <div
                className={`alert-row ${event.type}`}
                key={event.id}
              >

                <div className="alert-icon">
                  {event.type ===
                  "critical" ? (
                    <CircleAlert />
                  ) : event.type ===
                    "leak" ? (
                    <Network />
                  ) : event.type ===
                    "warning" ? (
                    <AlertTriangle />
                  ) : (
                    <CheckCircle2 />
                  )}
                </div>

                <div className="alert-content">

                  <strong>
                    {event.message}
                  </strong>

                  <span>
                    AI monitoring event
                  </span>

                </div>

                <div className="alert-time">
                  <Clock3 size={13} />
                  {event.time}
                </div>

              </div>
            ))
          )}

        </div>

      </section>

    </>
  );
}


/* =========================================================
   INFRASTRUCTURE
========================================================= */

function InfrastructurePage({
  prediction,
  sensors,
}: {
  prediction: Prediction;
  sensors: SensorData;
}) {
  const healthyZones =
    zones.filter(
      (zone) =>
        zone.status === "SAFE"
    ).length;

  return (
    <>

      <section className="dashboard-grid">

        <KpiCard
          icon={<Map />}
          title="Monitored Zones"
          value={`${zones.length}`}
          status="Active infrastructure"
          statusClass="normal"
        />

        <KpiCard
          icon={<CheckCircle2 />}
          title="Healthy Zones"
          value={`${healthyZones}`}
          status="Operating normally"
          statusClass="safe"
        />

        <KpiCard
          icon={<AlertTriangle />}
          title="Attention Zones"
          value={`${zones.length - healthyZones}`}
          status="Requires monitoring"
          statusClass="warning"
        />

        <KpiCard
          icon={<Server />}
          title="Network State"
          value={
            prediction.leak_status ===
            "LEAK"
              ? "ALERT"
              : "ONLINE"
          }
          status={`${sensors.flow_rate} L/min live flow`}
          statusClass={
            prediction.leak_status ===
            "LEAK"
              ? "critical"
              : "safe"
          }
        />

      </section>

      <section className="section">

        <div className="section-header">

          <div>
            <h2 className="section-title">
              Infrastructure Network
            </h2>

            <div className="section-subtitle">
              AI health status by
              distribution zone
            </div>
          </div>

          <div className="header-status">
            <span className="online-dot"></span>
            Network Online
          </div>

        </div>

        <div className="infrastructure-grid">

          {zones.map((zone) => (
            <div
              className="infrastructure-card"
              key={zone.name}
            >

              <div className="infrastructure-card-top">

                <div className="zone-map-icon">
                  <Map />
                </div>

                <span
                  className={`zone-status ${zone.status.toLowerCase()}`}
                >
                  {zone.status}
                </span>

              </div>

              <h3>
                {zone.name}
              </h3>

              <div className="health-number">
                {zone.value}
                <span>/100</span>
              </div>

              <div className="zone-bar">
                <div
                  className={`zone-fill ${zone.status.toLowerCase()}`}
                  style={{
                    width: `${zone.value}%`,
                  }}
                />
              </div>

              <div className="infrastructure-details">

                <span>
                  <TrendingUp />
                  {zone.flow}
                </span>

                <span>
                  <Gauge />
                  {zone.pressure}
                </span>

              </div>

            </div>
          ))}

        </div>

      </section>

      <section className="two-column section">

        <div className="result-card">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                Network Intelligence
              </h2>

              <div className="section-subtitle">
                AI infrastructure summary
              </div>
            </div>

            <BrainCircuit />

          </div>

          <div className="network-summary">

            <div className="network-summary-number">
              {healthyZones}
              <span>
                /{zones.length}
              </span>
            </div>

            <div>
              <strong>
                Zones operating normally
              </strong>

              <p>
                WaterIQ continuously
                evaluates flow, pressure
                and quality telemetry to
                identify infrastructure
                anomalies.
              </p>
            </div>

          </div>

        </div>

        <div className="result-card">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                Live Network Metrics
              </h2>

              <div className="section-subtitle">
                Current telemetry
              </div>
            </div>

            <Radio />

          </div>

          <div className="metric-list">

            <MetricRow
              icon={<Droplets />}
              label="Water Quality"
              value={
                prediction.water_quality
              }
            />

            <MetricRow
              icon={<Network />}
              label="Leak Status"
              value={
                prediction.leak_status
              }
            />

            <MetricRow
              icon={<TrendingUp />}
              label="Flow Rate"
              value={`${sensors.flow_rate} L/min`}
            />

            <MetricRow
              icon={<Gauge />}
              label="Pressure"
              value={`${sensors.pressure} bar`}
            />

          </div>

        </div>

      </section>

    </>
  );
}


/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function KpiCard({
  icon,
  title,
  value,
  unit,
  status,
  statusClass,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit?: string;
  status: string;
  statusClass: string;
}) {
  return (
    <div className="card kpi-card">

      <div className="card-header">

        <div className="card-icon">
          {icon}
        </div>

        <div>

          <div className="card-title">
            {title}
          </div>

          <div
            className={`card-value ${statusClass}`}
          >
            {value}

            {unit && (
              <span className="card-unit">
                {unit}
              </span>
            )}
          </div>

        </div>

      </div>

      <div
        className={`card-status ${statusClass}`}
      >
        <span className="card-status-dot"></span>
        {status}
      </div>

    </div>
  );
}


function Sensor({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="sensor">

      <label>
        <span className="sensor-label-icon">
          {icon}
        </span>

        {label}
      </label>

      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
      />

    </div>
  );
}


function SafetyChart({
  history,
}: {
  history: HistoryPoint[];
}) {
  if (history.length === 0) {
    return (
      <div className="chart-wrapper">
        <div className="chart-empty">
          <Activity size={28} />
          <strong>
            Waiting for live telemetry
          </strong>
          <span>
            Start live monitoring to
            generate AI intelligence data.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-wrapper">

      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart data={history}>

          <defs>
            <linearGradient
              id="safetyGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#0891b2"
                stopOpacity={0.25}
              />

              <stop
                offset="95%"
                stopColor="#0891b2"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="time"
            tick={{
              fontSize: 10,
            }}
          />

          <YAxis
            domain={[0, 100]}
          />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="safety"
            stroke="#0891b2"
            fill="url(#safetyGradient)"
            strokeWidth={3}
          />

        </AreaChart>
      </ResponsiveContainer>

    </div>
  );
}


function LeakChart({
  history,
}: {
  history: HistoryPoint[];
}) {
  const data =
    history.length > 0
      ? history.map((item) => ({
          time: item.time,
          risk:
            item.leak === "LEAK"
              ? 85
              : 10,
        }))
      : [
          {
            time: "Now",
            risk: 10,
          },
        ];

  return (
    <div className="chart-wrapper">

      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart data={data}>

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="time"
            tick={{
              fontSize: 10,
            }}
          />

          <YAxis
            domain={[0, 100]}
          />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="risk"
            stroke="#0891b2"
            fillOpacity={0.15}
            strokeWidth={3}
          />

        </AreaChart>

      </ResponsiveContainer>

    </div>
  );
}


function NetworkHealth() {
  return (
    <div className="chart-container">

      <div className="section-header">

        <div>
          <h2 className="section-title">
            Network Health
          </h2>

          <div className="section-subtitle">
            Infrastructure zones
          </div>
        </div>

      </div>

      <div className="zone-list">

        {zones.map((zone) => (
          <div
            className="zone"
            key={zone.name}
          >

            <div className="zone-top">

              <div className="zone-name">

                <span
                  className={`zone-dot ${zone.status.toLowerCase()}`}
                ></span>

                {zone.name}

              </div>

              <span
                className={`zone-status ${zone.status.toLowerCase()}`}
              >
                {zone.status}
              </span>

            </div>

            <div className="zone-bar">

              <div
                className={`zone-fill ${zone.status.toLowerCase()}`}
                style={{
                  width: `${zone.value}%`,
                }}
              />

            </div>

            <div className="zone-score">
              Health score{" "}
              {zone.value}/100
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}


function EventPanel({
  events,
}: {
  events: EventItem[];
}) {
  return (
    <div className="result-card">

      <div className="section-header">

        <div>
          <h2 className="section-title">
            Recent Events
          </h2>

          <div className="section-subtitle">
            AI monitoring activity
          </div>
        </div>

        <Bell size={19} />

      </div>

      <div className="event-list">

        {events.slice(0, 6).map(
          (event) => (
            <div
              className="event"
              key={event.id}
            >

              <div
                className={`event-icon ${event.type}`}
              >
                <Activity size={13} />
              </div>

              <span>
                {event.message}
              </span>

              <small>
                {event.time}
              </small>

            </div>
          )
        )}

      </div>

    </div>
  );
}


function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="metric-row">

      <div className="metric-row-icon">
        {icon}
      </div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function InsightCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="insight-card">

      <div className="insight-icon">
        {icon}
      </div>

      <div>

        <span className="eyebrow">
          {title}
        </span>

        <h3>
          {value}
        </h3>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}


export default App;
