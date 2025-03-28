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
exports.PrometheusApi = void 0;
const runtime_1 = require("@ale-run/runtime");
const prometheus_query_1 = require("prometheus-query");
const logger = runtime_1.Logger.getLogger('app:PrometheusApi');
class PrometheusApi {
    getPrometheusDriver(env) {
        const url = env.PROMETHEUS_URL;
        // const username = env['PROMETHEUS_USERNAME'];
        // const password = env['PROMETHEUS_PASSWORD'];
        const prom = new prometheus_query_1.PrometheusDriver({
            endpoint: url
            // auth
        });
        return prom;
    }
    rangeQuery(env, query, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prom = this.getPrometheusDriver(env);
                logger.debug(`query=${query} options=`, options);
                const res = yield prom.rangeQuery(query, options.from, options.to, this.toPeriod(options.interval), '30s');
                return res.result;
            }
            catch (err) {
                logger.error('rangeQuery Error ===============================================');
                logger.error(query);
                logger.error(err);
            }
        });
    }
    getCpuMetricData(env, namespace, deployName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // core단위를 millicore 단위로 변경
            const query = `sum (rate(container_cpu_usage_seconds_total{container != "", namespace="${namespace}", pod=~"${deployName}-.*"}[${options.interval}])) * 1000`;
            const result = yield this.rangeQuery(env, query, options);
            const metricData = this.toMetricData(result, deployName);
            return metricData;
        });
    }
    getCpuLimitMetricData(env, namespace, deployName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // core단위를 millicore 단위로 변경
            const query = `sum (kube_pod_container_resource_limits{resource="cpu",namespace="${namespace}", pod=~"${deployName}-.*"}) * 1000`;
            const result = yield this.rangeQuery(env, query, options);
            const metricData = this.toMetricData(result, deployName);
            return metricData;
        });
    }
    getMemoryMetricData(env, namespace, deployName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `sum (container_memory_usage_bytes{container != "", namespace="${namespace}", pod=~"${deployName}-.*"}) / 1024 / 1024`;
            const result = yield this.rangeQuery(env, query, options);
            const metricData = this.toMetricData(result, deployName);
            return metricData;
        });
    }
    getMemoryLimitMetricData(env, namespace, deployName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `sum (kube_pod_container_resource_limits{resource="memory",namespace="${namespace}", pod=~"${deployName}-.*"}) / 1024 / 1024`;
            const result = yield this.rangeQuery(env, query, options);
            const metricData = this.toMetricData(result, deployName);
            return metricData;
        });
    }
    getInboudMetricData(env, namespace, deployName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // prometheus의 traffic은 초당 사용량
            // influxdb의 traffic은 interval 기간 사용량의 합
            // 단위를 맞추기 위해 prometheus 사용량 * interval(sec) 으로 변경
            const query = `sum (rate(container_network_receive_bytes_total{namespace="${namespace}", pod=~"${deployName}-.*"}[${options.interval}])) * ${this.toPeriod(options.interval)}`;
            const result = yield this.rangeQuery(env, query, options);
            const metricData = this.toMetricData(result, deployName);
            return metricData;
        });
    }
    getOutboudMetricData(env, namespace, deployName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `sum (rate(container_network_transmit_bytes_total{namespace="${namespace}", pod=~"${deployName}-.*"}[${options.interval}])) * ${this.toPeriod(options.interval)}`;
            const result = yield this.rangeQuery(env, query, options);
            const metricData = this.toMetricData(result, deployName);
            return metricData;
        });
    }
    toPeriod(unit) {
        const regex = new RegExp('([0-9]{0,2})(m|h|d)');
        const match = regex.exec(unit);
        const time = match[1] !== '' ? Number(match[1]) : 1;
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
    toMetricData(result, deployName) {
        if (result === undefined)
            return;
        // Metric {
        //   name: undefined,
        //   labels: { pod: 'deploy-httpbin-httpbin-abcdefghi-12345' }
        // }
        // [ SampleValue { time: 2025-03-05T15:00:00.000Z, value: 77639680 } ]
        const dates = [];
        const series = [];
        result.forEach((vector, index) => {
            const itemValues = [];
            for (const vectorValue of vector.values) {
                if (index === 0)
                    dates.push(vectorValue.time);
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
exports.PrometheusApi = PrometheusApi;
//# sourceMappingURL=PrometheusApi.js.map