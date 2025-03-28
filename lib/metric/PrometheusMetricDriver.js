"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusMetricDriver = void 0;
const runtime_1 = require("@ale-run/runtime");
const PrometheusApi_1 = require("./PrometheusApi");
const logger = runtime_1.Logger.getLogger('app:PrometheusMetricDriver');
class PrometheusMetricDriver extends runtime_1.ClusterMetricDriver {
    constructor() {
        super(...arguments);
        this.prometheusApi = new PrometheusApi_1.PrometheusApi();
    }
    getMetricItems(deployment) {
        return __awaiter(this, void 0, void 0, function* () {
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
                }
            ];
        });
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
    getMetric(deployment, name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            logger.debug(`[METRIC][${deployment.name}]metricName=${name}`);
            if (this.cluster.env.PROMETHEUS_URL === undefined) {
                throw new Error(`[METRIC]environments(PROMETHEUS_URL, PROMETHEUS_USERNAME, PROMETHEUS_PASSWORD) are required`);
            }
            const statObjects = (_b = (_a = deployment.stat) === null || _a === void 0 ? void 0 : _a.objects) === null || _b === void 0 ? void 0 : _b.filter((o) => (o.kind === 'Deployment' ? o : null));
            if (statObjects === undefined || statObjects.length === 0) {
                logger.warn(`[METRIC][${deployment.name}]statObject not found!`);
                return;
            }
            const statObject = statObjects[0];
            logger.info(`[METRIC][${deployment.name}]metricName=${name} statObject=`, statObject);
            let metricData;
            switch (name) {
                case 'cpu':
                    metricData = yield this.prometheusApi.getCpuMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
                    break;
                case 'cpu-limit':
                    metricData = yield this.prometheusApi.getCpuLimitMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
                    break;
                case 'memory':
                    metricData = yield this.prometheusApi.getMemoryMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
                    break;
                case 'memory-limit':
                    metricData = yield this.prometheusApi.getMemoryLimitMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
                    break;
                case 'inboud':
                    metricData = yield this.prometheusApi.getInboudMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
                    break;
                case 'outbound':
                    metricData = yield this.prometheusApi.getOutboudMetricData(this.cluster.env, statObject.namespace, statObject.name, options);
                    break;
                default:
                    logger.warn(`[METRIC][${deployment.name}]metricName=${name} undefined item`);
                    return;
            }
            logger.info(`[METRIC]`, metricData);
            return metricData;
        });
    }
}
exports.PrometheusMetricDriver = PrometheusMetricDriver;
//# sourceMappingURL=PrometheusMetricDriver.js.map