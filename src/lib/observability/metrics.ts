type Metric = {
  name: string;
  value: number;
  tags?: Record<string, string>;
};

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export const startTimer = () => now();

export const endTimer = (start: number) => now() - start;

export const recordMetric = (metric: Metric) => {
  if (typeof window === "undefined") {
    return;
  }
  const current = window.sessionStorage.getItem("rxlab-metrics");
  const parsed = current ? (JSON.parse(current) as Metric[]) : [];
  parsed.push(metric);
  window.sessionStorage.setItem("rxlab-metrics", JSON.stringify(parsed));
};
