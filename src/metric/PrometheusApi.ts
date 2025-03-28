import { AnyObject, Logger, MetricData, MetricFilter } from '@ale-run/runtime';
import { PrometheusDriver, RangeVector } from 'prometheus-query';

const logger = Logger.getLogger('app:PrometheusApi');

export class PrometheusApi {
  private getPrometheusDriver(env: AnyObject): PrometheusDriver {
    const url = env.PROMETHEUS_URL;
    // const username = env['PROMETHEUS_USERNAME'];
    // const password = env['PROMETHEUS_PASSWORD'];

    const prom = new PrometheusDriver({
      endpoint: url
      // auth
    });
    return prom;
  }

  public async rangeQuery(env: AnyObject, query: string, options: MetricFilter): Promise<RangeVector[]> {
    try {
      const prom = this.getPrometheusDriver(env);

      logger.debug(`query=${query} options=`, options);
      const res = await prom.rangeQuery(query, options.from, options.to, this.toPeriod(options.interval), '30s');
      return res.result;
    } catch (err) {
      logger.error('rangeQuery Error ===============================================');
      logger.error(query);
      logger.error(err);
    }
  }

  public async getCpuMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData> {
    // core단위를 millicore 단위로 변경
    const query = `sum (rate(container_cpu_usage_seconds_total{container != "", namespace="${namespace}", pod=~"${deployName}-.*"}[${options.interval}])) * 1000`;

    const result = await this.rangeQuery(env, query, options);
    const metricData = this.toMetricData(result, deployName);
    return metricData;
  }

  public async getCpuLimitMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData> {
    // core단위를 millicore 단위로 변경
    const query = `sum (kube_pod_container_resource_limits{resource="cpu",namespace="${namespace}", pod=~"${deployName}-.*"}) * 1000`;

    const result = await this.rangeQuery(env, query, options);
    const metricData = this.toMetricData(result, deployName);
    return metricData;
  }

  public async getMemoryMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData> {
    const query = `sum (container_memory_usage_bytes{container != "", namespace="${namespace}", pod=~"${deployName}-.*"}) / 1024 / 1024`;

    const result = await this.rangeQuery(env, query, options);
    const metricData = this.toMetricData(result, deployName);
    return metricData;
  }

  public async getMemoryLimitMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData> {
    const query = `sum (kube_pod_container_resource_limits{resource="memory",namespace="${namespace}", pod=~"${deployName}-.*"}) / 1024 / 1024`;

    const result = await this.rangeQuery(env, query, options);
    const metricData = this.toMetricData(result, deployName);
    return metricData;
  }

  public async getInboudMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData> {
    // prometheus의 traffic은 초당 사용량
    // influxdb의 traffic은 interval 기간 사용량의 합
    // 단위를 맞추기 위해 prometheus 사용량 * interval(sec) 으로 변경
    const query = `sum (rate(container_network_receive_bytes_total{namespace="${namespace}", pod=~"${deployName}-.*"}[${options.interval}])) * ${this.toPeriod(options.interval)}`;

    const result = await this.rangeQuery(env, query, options);
    const metricData = this.toMetricData(result, deployName);
    return metricData;
  }

  public async getOutboudMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData> {
    const query = `sum (rate(container_network_transmit_bytes_total{namespace="${namespace}", pod=~"${deployName}-.*"}[${options.interval}])) * ${this.toPeriod(options.interval)}`;

    const result = await this.rangeQuery(env, query, options);
    const metricData = this.toMetricData(result, deployName);
    return metricData;
  }

  private toPeriod(unit: string): number {
    const regex = new RegExp('([0-9]{0,2})(m|h|d)');
    const match = regex.exec(unit);
    const time: number = match[1] !== '' ? Number(match[1]) : 1;
    const timeUnit = match[2];

    switch (timeUnit) {
      case 'm':
        return time * 60;
      case 'h':
        return time * 60 * 60;
      case 'd':
        return time * 24 * 60 * 60;
      default:
        return 10 * 60;
    }
  }

  private toMetricData(result: RangeVector[], deployName: string): MetricData {
    if (result === undefined) return;

    // Metric {
    //   name: undefined,
    //   labels: { pod: 'deploy-httpbin-httpbin-abcdefghi-12345' }
    // }
    // [ SampleValue { time: 2025-03-05T15:00:00.000Z, value: 77639680 } ]

    const dates = [];
    const series = [];

    result.forEach((vector: RangeVector, index: number) => {
      const itemValues = [];

      for (const vectorValue of vector.values) {
        if (index === 0) dates.push(vectorValue.time);
        itemValues.push(vectorValue.value);
      }

      const item = {
        name: deployName,
        values: itemValues
      };

      series.push(item);
    });

    const metricData = {
      total: dates.length,
      dates,
      series
    };

    return metricData;
  }
}
