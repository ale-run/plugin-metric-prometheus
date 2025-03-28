import { AnyObject, MetricData, MetricFilter } from '@ale-run/runtime';
import { RangeVector } from 'prometheus-query';
export declare class PrometheusApi {
    private getPrometheusDriver;
    rangeQuery(env: AnyObject, query: string, options: MetricFilter): Promise<RangeVector[]>;
    getCpuMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData>;
    getCpuLimitMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData>;
    getMemoryMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData>;
    getMemoryLimitMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData>;
    getInboudMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData>;
    getOutboudMetricData(env: AnyObject, namespace: string, deployName: string, options: MetricFilter): Promise<MetricData>;
    private toPeriod;
    private toMetricData;
}
