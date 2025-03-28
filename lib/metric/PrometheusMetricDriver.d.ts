import { ClusterMetricDriver, IDeployment, MetricItem, MetricFilter, MetricData } from '@ale-run/runtime';
export declare class PrometheusMetricDriver extends ClusterMetricDriver {
    private readonly prometheusApi;
    getMetricItems(deployment: IDeployment): Promise<MetricItem[]>;
    getMetric(deployment: IDeployment, name: string, options: MetricFilter): Promise<MetricData>;
}
