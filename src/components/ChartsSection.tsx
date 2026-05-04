import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GitHubAnalytics } from '../types/github';
import { getGitHubStyleColor } from '../utils/githubColors';
import { formatNumber } from '../utils/format';

const repoSliceColors = [
  '#111111',
  '#2563eb',
  '#dc2626',
  '#059669',
  '#d97706',
  '#0891b2',
  '#4f46e5',
  '#ea580c',
  '#475569',
  '#be123c',
];

interface ChartsSectionProps {
  analytics: GitHubAnalytics;
  theme: 'light' | 'dark';
}

export function ChartsSection({ analytics, theme }: ChartsSectionProps) {
  const axisColor = theme === 'dark' ? '#9e9e9e' : '#7a7a7a';
  const gridColor = theme === 'dark' ? '#2a2a2a' : '#e8e8e8';
  const summaryGridColor = theme === 'dark' ? '#262626' : '#ececec';
  const secondaryBarColor = theme === 'dark' ? '#c8c8c8' : '#4d4d4d';
  const tertiaryBarColor = theme === 'dark' ? '#8c8c8c' : '#7d7d7d';
  const lineColor = theme === 'dark' ? '#f2f2f2' : '#111111';
  const lineDotColor = theme === 'dark' ? '#090909' : '#ffffff';
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
    border: `1px solid ${theme === 'dark' ? '#2d2d2d' : '#d9d9d9'}`,
    borderRadius: '14px',
    color: theme === 'dark' ? '#f5f5f5' : '#101010',
  };
  const tooltipItemStyle = {
    color: theme === 'dark' ? '#f5f5f5' : '#101010',
  };

  return (
    <section className="charts-grid">
      <PieChartCard
        title="Repos per Language"
        description="Repository count grouped by primary language."
        data={analytics.reposPerLanguageChart.slice(0, 10)}
        dataKey="value"
        nameKey="language"
        tooltipStyle={tooltipStyle}
        tooltipItemStyle={tooltipItemStyle}
      />

      <PieChartCard
        title="Stars per Language"
        description="Public stars aggregated by each repository's primary language."
        data={analytics.starsPerLanguageChart}
        dataKey="value"
        nameKey="language"
        valueLabel="Stars"
        tooltipStyle={tooltipStyle}
        tooltipItemStyle={tooltipItemStyle}
      />

      <PieChartCard
        title="Commits per Language"
        description="Contributor commit totals aggregated from all public repositories."
        data={analytics.commitsPerLanguageChart}
        dataKey="value"
        nameKey="language"
        valueLabel="Commits"
        tooltipStyle={tooltipStyle}
        tooltipItemStyle={tooltipItemStyle}
      />

      <MetricChartCard
        title="Commits per Repo"
        description="Top 10 repositories by available contributor commit totals."
        data={analytics.commitsPerRepoChart}
        dataKey="value"
        nameKey="name"
        valueLabel="Commits"
        barColor={tertiaryBarColor}
        axisColor={axisColor}
        gridColor={gridColor}
        tooltipStyle={tooltipStyle}
        tooltipItemStyle={tooltipItemStyle}
        className="chart-card-wide"
      />

      <PieChartCard
        title="Stars per Repo"
        description="Top 10 public repositories ranked by stars."
        data={analytics.starsPerRepoChart}
        dataKey="value"
        nameKey="name"
        valueLabel="Stars"
        tooltipStyle={tooltipStyle}
        tooltipItemStyle={tooltipItemStyle}
        className="chart-card-wide"
      />

      <article className="chart-card chart-card-wide">
        <div className="panel-head">
          <span className="section-label">Commits per Month</span>
          <p>Last 12 full months through the previous month, aggregated from all public repositories.</p>
        </div>
        <div className="chart-wrap chart-wrap-line">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={analytics.monthlyCommitsChart}
              margin={{ top: 8, right: 8, left: -12, bottom: 8 }}
            >
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} stroke={axisColor} />
              <YAxis tickLine={false} axisLine={false} stroke={axisColor} />
              <Tooltip
                formatter={(value: number) => [formatNumber(value), 'Commits']}
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
              />
              <Line
                type="monotone"
                dataKey="commits"
                stroke={lineColor}
                strokeWidth={2.4}
                dot={{ r: 3.5, fill: lineColor, stroke: lineDotColor, strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: lineColor, stroke: lineDotColor, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="chart-card summary-card">
        <div className="panel-head">
          <span className="section-label">Summary metrics</span>
          <p>A quick quantitative snapshot of the profile.</p>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics.summaryMetrics}
              layout="vertical"
              margin={{ top: 8, right: 12, left: 18, bottom: 8 }}
            >
              <CartesianGrid stroke={summaryGridColor} horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} stroke={axisColor} />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={88}
                stroke={axisColor}
              />
              <Tooltip
                formatter={(value: number) => [formatNumber(value), 'Value']}
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
              />
              <Bar dataKey="value" fill={secondaryBarColor} radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}

type MetricChartDatum =
  | GitHubAnalytics['reposPerLanguageChart'][number]
  | GitHubAnalytics['commitsPerRepoChart'][number];

function getPieSliceColor<T extends MetricChartDatum>(
  item: T,
  index: number,
  nameKey: Extract<keyof T, string>,
): string {
  const itemName = item[nameKey];

  if (nameKey === 'language') {
    return getGitHubStyleColor(typeof itemName === 'string' ? itemName : 'Unknown');
  }

  return repoSliceColors[index % repoSliceColors.length];
}

interface PieChartCardProps<T extends MetricChartDatum> {
  title: string;
  description: string;
  data: T[];
  dataKey: Extract<keyof T, string>;
  nameKey: Extract<keyof T, string>;
  valueLabel?: string;
  tooltipStyle: {
    backgroundColor: string;
    border: string;
    borderRadius: string;
    color: string;
  };
  tooltipItemStyle: {
    color: string;
  };
  className?: string;
}

function PieChartCard<T extends MetricChartDatum>({
  title,
  description,
  data,
  dataKey,
  nameKey,
  valueLabel = 'Value',
  tooltipStyle,
  tooltipItemStyle,
  className,
}: PieChartCardProps<T>) {
  return (
    <article className={className ? `chart-card ${className}` : 'chart-card'}>
      <div className="panel-head">
        <span className="section-label">{title}</span>
        <p>{description}</p>
      </div>
      {data.length > 0 ? (
        <>
          <div className="chart-wrap chart-wrap-pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <Pie
                  data={data}
                  dataKey={dataKey}
                  nameKey={nameKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={false}
                >
                  {data.map((item, index) => {
                    const itemName = item[nameKey];
                    const displayName =
                      typeof itemName === 'string' ? itemName : `Item ${index + 1}`;

                    return (
                      <Cell
                        key={`${title}-${displayName}-${index}`}
                        fill={getPieSliceColor(item, index, nameKey)}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatNumber(value), valueLabel]}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend" aria-label={`${title} legend`}>
            {data.map((item, index) => {
              const itemName = item[nameKey];
              const itemValue = item[dataKey];
              const displayName =
                typeof itemName === 'string' ? itemName : `Item ${index + 1}`;
              const displayValue =
                typeof itemValue === 'number' ? formatNumber(itemValue) : String(itemValue);

              return (
                <span className="legend-item" key={`${title}-legend-${displayName}-${index}`}>
                  <span
                    className="legend-swatch"
                    aria-hidden="true"
                    style={{ backgroundColor: getPieSliceColor(item, index, nameKey) }}
                  />
                  <span>{`${displayName}: ${displayValue}`}</span>
                </span>
              );
            })}
          </div>
        </>
      ) : (
        <div className="chart-empty">
          GitHub did not return enough public commit data for this chart.
        </div>
      )}
    </article>
  );
}

interface MetricChartCardProps<T extends MetricChartDatum> {
  title: string;
  description: string;
  data: T[];
  dataKey: Extract<keyof T, string>;
  nameKey: Extract<keyof T, string>;
  valueLabel: string;
  barColor: string;
  axisColor: string;
  gridColor: string;
  tooltipStyle: {
    backgroundColor: string;
    border: string;
    borderRadius: string;
    color: string;
  };
  tooltipItemStyle: {
    color: string;
  };
  className?: string;
}

function MetricChartCard<T extends MetricChartDatum>({
  title,
  description,
  data,
  dataKey,
  nameKey,
  valueLabel,
  barColor,
  axisColor,
  gridColor,
  tooltipStyle,
  tooltipItemStyle,
  className,
}: MetricChartCardProps<T>) {
  const usesTechnologyPalette = nameKey === 'language' || data.some((item) => 'language' in item);

  return (
    <article className={className ? `chart-card ${className}` : 'chart-card'}>
      <div className="panel-head">
        <span className="section-label">{title}</span>
        <p>{description}</p>
      </div>
      {data.length > 0 ? (
        <div className="chart-wrap chart-wrap-bars">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid stroke={gridColor} horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} stroke={axisColor} />
              <YAxis
                type="category"
                dataKey={nameKey}
                tickLine={false}
                axisLine={false}
                width={118}
                stroke={axisColor}
              />
              <Tooltip
                formatter={(value: number) => [formatNumber(value), valueLabel]}
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
              />
              <Bar dataKey={dataKey} fill={barColor} radius={[0, 10, 10, 0]}>
                {usesTechnologyPalette
                  ? data.map((item, index) => {
                      const itemName = item[nameKey];
                      const technologyName =
                        typeof itemName === 'string'
                          ? itemName
                          : typeof item.language === 'string'
                            ? item.language
                            : 'Unknown';

                      return (
                        <Cell
                          key={`${title}-${technologyName}-${index}`}
                          fill={getGitHubStyleColor(technologyName)}
                        />
                      );
                    })
                  : null}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">
          GitHub did not return enough public commit data for this chart.
        </div>
      )}
    </article>
  );
}
