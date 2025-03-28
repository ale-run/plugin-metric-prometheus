import { Plugin } from '@ale-run/runtime';
export default class PrometheusMetricPlugin extends Plugin {
    activate(): Promise<void>;
    deactivate(): Promise<void>;
}
