const http = require("http");
const https = require("https");

let jobInFlight = false;
let rerunQueued = false;

const truthy = (value) => ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());

const pipelineEnabled = process.env.DISABLE_AUTO_RECOMMENDATIONS !== "true";
const DEFAULT_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || "http://localhost:8000";
const REBUILD_ENDPOINT =
    process.env.RECOMMENDATION_REBUILD_ENDPOINT || "/api/recommendations/build";

const buildRequestBody = () => {
    const parseNumber = (value, fallback) => {
        if (value === undefined || value === null || value === "") return fallback;
        const num = Number(value);
        return Number.isNaN(num) ? fallback : num;
    };

    return {
        top_n: parseNumber(process.env.RECOMMENDATION_TOP_N, 12),
        cf_weight: parseNumber(process.env.RECOMMENDATION_CF_WEIGHT, 0.6),
        cb_weight: parseNumber(process.env.RECOMMENDATION_CB_WEIGHT, 0.4),
        report: truthy(process.env.RECOMMENDATION_FORCE_REPORT),
    };
};

const callRecommendationService = (reason) => {
    const baseUrl = DEFAULT_SERVICE_URL;
    let serviceUrl;
    try {
        serviceUrl = new URL(REBUILD_ENDPOINT, baseUrl);
    } catch (error) {
        console.error(
            "[recommendations] Invalid RECOMMENDATION_SERVICE_URL or RECOMMENDATION_REBUILD_ENDPOINT",
            error
        );
        return;
    }

    const isHttps = serviceUrl.protocol === "https:";
    const client = isHttps ? https : http;

    const payload = JSON.stringify(buildRequestBody());

    const options = {
        method: "POST",
        hostname: serviceUrl.hostname,
        port: serviceUrl.port || (isHttps ? 443 : 80),
        path: serviceUrl.pathname + serviceUrl.search,
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
        },
        timeout: Number(process.env.RECOMMENDATION_REQUEST_TIMEOUT || 300000),
    };

    console.info(
        `[recommendations] Calling recommendation service at ${serviceUrl.toString()} (${reason})...`
    );

    const req = client.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
            data += chunk.toString();
        });
        res.on("end", () => {
            jobInFlight = false;
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.info(
                    `[recommendations] Recommendation rebuild succeeded with status ${res.statusCode}.`
                );
            } else {
                console.error(
                    `[recommendations] Recommendation rebuild failed with status ${res.statusCode}. Response: ${data}`
                );
            }
            if (rerunQueued) {
                rerunQueued = false;
                setImmediate(() => launchJob("queued-rerun"));
            }
        });
    });

    req.on("error", (error) => {
        jobInFlight = false;
        console.error("[recommendations] Error calling recommendation service:", error);
        if (rerunQueued) {
            const shouldRetry = process.env.RECOMMENDATION_RETRY_ON_ERROR !== "false";
            if (shouldRetry) {
                rerunQueued = false;
                setImmediate(() => launchJob("retry-after-error"));
            }
        }
    });

    req.on("timeout", () => {
        jobInFlight = false;
        req.destroy(new Error("Request timed out"));
    });

    req.write(payload);
    req.end();
};

const launchJob = (reason) => {
    if (!pipelineEnabled) {
        console.warn(
            "[recommendations] Auto pipeline disabled via DISABLE_AUTO_RECOMMENDATIONS."
        );
        return;
    }

    jobInFlight = true;
    console.info(
        `[recommendations] Starting recommendation rebuild via microservice (${reason ||
            "unspecified reason"})...`
    );
    callRecommendationService(reason || "unspecified reason");
};

const triggerRecommendationRebuild = (reason = "manual-trigger") => {
    if (!pipelineEnabled) {
        return;
    }
    if (jobInFlight) {
        rerunQueued = true;
        console.info(
            "[recommendations] Pipeline already running. Queued another run."
        );
        return;
    }
    setImmediate(() => launchJob(reason));
};

module.exports = {
    triggerRecommendationRebuild,
};

