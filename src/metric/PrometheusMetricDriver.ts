import { ClusterMetricDriver, IDeployment, MetricItem, MetricFilter, MetricData, Logger, AnyObject } from '@ale-run/runtime';
import { PrometheusApi } from './PrometheusApi';


const logger = Logger.getLogger('app:PrometheusMetricDriver');

export class PrometheusMetricDriver extends ClusterMetricDriver {

  private readonly prometheusApi: PrometheusApi = new PrometheusApi();

  public async getMetricItems(deployment: IDeployment): Promise<MetricItem[]> {

    return [
      {
        name: 'cpu',
        title: 'CPU',
        unit: 'm'
      },
      {
        name: 'cpu-limit',
        title: 'CPU Limit',
        unit: 'm'
      },
      {
        name: 'memory',
        title: 'Memory',
        unit: 'MB'
      },
      {
        name: 'memory-limit',
        title: 'Memory Limit',
        unit: 'MB'
      },

      {
        name: 'inboud',
        title: 'Network IN',
        unit: 'b'
      },
      {
        name: 'outbound',
        title: 'Network OUT',
        unit: 'b'
      },
    ];
  }

  // deploymnet.stat.objects
  // [
  //   { kind: 'Namespace', name: 'ale-ns-abcdefg' },
  //   {
  //     kind: 'Deployment',
  //     name: 'deploy-httpbin-httpbin',
  //     namespace: 'ale-ns-abcdefg'
  //   },
  //   {
  //     kind: 'Pod',
  //     name: 'deploy-httpbin-httpbin-abcdefghi-12345',
  //     namespace: 'ale-ns-abcdefg'
  //   },
  //   {
  //     kind: 'Service',
  //     name: 'httpbin',
  //     namespace: 'ale-ns-abcdefg'
  //   }
  // ]

  public async getMetric(deployment: IDeployment, name: string, options: MetricFilter): Promise<MetricData> {

    logger.debug(`[METRIC][${deployment.name}]metricName=${name}`);

    if (this.cluster.env.PROMETHEUS_URL === undefined) {
      throw new Error(`[METRIC]environments(PROMETHEUS_URL, PROMETHEUS_USERNAME, PROMETHEUS_PASSWORD) are required`);
    }

    const statObjects = deployment.stat?.objects?.filter((o) => (o.kind === 'Deployment' ? o : null));
    if (statObjects === undefined || statObjects.length === 0) {
      logger.warn(`[METRIC][${deployment.name}]statObject not found!`);
      return;
    }

    const statObject = statObjects[0];

    logger.info(`[METRIC][${deployment.name}]metricName=${name} statObject=`, statObject);

    let metricData: MetricData;

    switch (name) {
      case 'cpu':
        metricData = await this.prometheusApi.getCpuMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
        break;
      case 'cpu-limit':
        metricData = await this.prometheusApi.getCpuLimitMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
        break;
      case 'memory':
        metricData = await this.prometheusApi.getMemoryMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
        break;
      case 'memory-limit':
        metricData = await this.prometheusApi.getMemoryLimitMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
        break;
      case 'inboud':
        metricData = await this.prometheusApi.getInboudMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
        break;
      case 'outbound':
        metricData = await this.prometheusApi.getOutboudMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
        break;
      default:
        logger.warn(`[METRIC][${deployment.name}]metricName=${name} undefined item`);
        return;
    }

    logger.info(`[METRIC]`, metricData);
    return metricData;

  }

}
