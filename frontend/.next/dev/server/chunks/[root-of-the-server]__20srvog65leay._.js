module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/app/ai/[...segments]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>proxy,
    "POST",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$ignis_openapi$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ignis_openapi.json.[json].cjs [app-route] (ecmascript)");
;
const routes = __TURBOPACK__imported__module__$5b$project$5d2f$ignis_openapi$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].paths;
async function proxy(request, { params }) {
    const path = "/ai/" + (await params).segments.join("/");
    if (!Object.hasOwn(routes, path) || !Object.hasOwn(routes[path], request.method.toLowerCase())) return Response.json({
        detail: "Unknown API route or method"
    }, {
        status: 404
    });
    const url = new URL(path, new URL(process.env.IGNIS_API_ORIGIN || "http://127.0.0.1:8001").origin);
    url.search = request.nextUrl.search;
    const headers = new Headers();
    const content = request.headers.get("content-type");
    if (content) headers.set("content-type", content);
    const mode = request.headers.get("x-ignis-mode");
    if (mode === "ollama" || mode === "nim" || mode === "nim-mixed") {
        headers.set("X-IGNIS-Chat-Backend", mode === "ollama" ? "ollama" : "nim");
        headers.set("X-IGNIS-Embed-Backend", mode === "nim" ? "nim" : "ollama");
        if (mode !== "ollama" && (path.startsWith("/ai/ask") || path.startsWith("/ai/vision/") || path === "/ai/inference/test")) {
            if (!process.env.IGNIS_NIM_API_KEY) return Response.json({
                detail: "Configure IGNIS_NIM_API_KEY on the frontend server to use NVIDIA inference."
            }, {
                status: 503
            });
            headers.set("Authorization", "Bearer " + process.env.IGNIS_NIM_API_KEY);
        }
    }
    try {
        const init = {
            method: request.method,
            headers,
            cache: "no-store",
            redirect: "error",
            signal: AbortSignal.any([
                request.signal,
                AbortSignal.timeout(300000)
            ])
        };
        if (request.body) {
            init.body = request.body;
            init.duplex = "half";
        }
        const upstream = await fetch(url, init);
        return new Response(upstream.body, {
            status: upstream.status,
            headers: {
                "Content-Type": upstream.headers.get("content-type") || "application/json",
                "Cache-Control": "no-store"
            }
        });
    } catch  {
        return Response.json({
            detail: "FastAPI is unreachable or timed out. Check the backend service."
        }, {
            status: 503
        });
    }
}
;
}),
"[project]/ignis_openapi.json.[json].cjs [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = JSON.parse("{\"openapi\":\"3.1.0\",\"info\":{\"title\":\"IGNIS AI Service\",\"version\":\"2.0\"},\"paths\":{\"/ai/health\":{\"get\":{\"summary\":\"Health\",\"operationId\":\"health_ai_health_get\",\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}}}}},\"/ai/inference/status\":{\"get\":{\"summary\":\"Inference Status\",\"operationId\":\"inference_status_ai_inference_status_get\",\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}}}}},\"/ai/inference/test\":{\"post\":{\"summary\":\"Inference Test\",\"description\":\"Verify NIM API key and/or local Ollama for the backends sent in request headers.\",\"operationId\":\"inference_test_ai_inference_test_post\",\"parameters\":[{\"name\":\"scope\",\"in\":\"query\",\"required\":false,\"schema\":{\"type\":\"string\",\"pattern\":\"^(all|nim|ollama)$\",\"default\":\"all\",\"title\":\"Scope\"}}],\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/ask\":{\"post\":{\"summary\":\"Ask\",\"operationId\":\"ask_ai_ask_post\",\"requestBody\":{\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/Question\"}}},\"required\":true},\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/data/variables\":{\"get\":{\"tags\":[\"IGNIS hybrid science\"],\"summary\":\"Api Variables\",\"operationId\":\"api_variables_ai_data_variables_get\",\"parameters\":[{\"name\":\"dataset_prefix\",\"in\":\"query\",\"required\":false,\"schema\":{\"type\":\"string\",\"default\":\"ZARM-\",\"title\":\"Dataset Prefix\"}}],\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/data/experiments\":{\"get\":{\"tags\":[\"IGNIS hybrid science\"],\"summary\":\"Api Experiments\",\"operationId\":\"api_experiments_ai_data_experiments_get\",\"parameters\":[{\"name\":\"dataset_prefix\",\"in\":\"query\",\"required\":false,\"schema\":{\"type\":\"string\",\"default\":\"ZARM-\",\"title\":\"Dataset Prefix\"}},{\"name\":\"limit\",\"in\":\"query\",\"required\":false,\"schema\":{\"type\":\"integer\",\"default\":30,\"title\":\"Limit\"}}],\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/data/compare\":{\"post\":{\"tags\":[\"IGNIS hybrid science\"],\"summary\":\"Api Compare\",\"operationId\":\"api_compare_ai_data_compare_post\",\"requestBody\":{\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/CompareRequest\"}}},\"required\":true},\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/ask-hybrid\":{\"post\":{\"tags\":[\"IGNIS hybrid science\"],\"summary\":\"Api Ask Hybrid\",\"operationId\":\"api_ask_hybrid_ai_ask_hybrid_post\",\"requestBody\":{\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HybridQuestion\"}}},\"required\":true},\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/vision/image\":{\"post\":{\"tags\":[\"IGNIS AI Vision\"],\"summary\":\"Analyze Image\",\"description\":\"Describe a supplied flame image; experiment_code is user metadata, not verified.\",\"operationId\":\"analyze_image_ai_vision_image_post\",\"requestBody\":{\"content\":{\"multipart/form-data\":{\"schema\":{\"$ref\":\"#/components/schemas/Body_analyze_image_ai_vision_image_post\"}}},\"required\":true},\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/vision/video\":{\"post\":{\"tags\":[\"IGNIS AI Vision\"],\"summary\":\"Analyze Video\",\"description\":\"Sample four video frames and describe them with one Gemma 4 request.\",\"operationId\":\"analyze_video_ai_vision_video_post\",\"requestBody\":{\"content\":{\"multipart/form-data\":{\"schema\":{\"$ref\":\"#/components/schemas/Body_analyze_video_ai_vision_video_post\"}}},\"required\":true},\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/vision/store-image\":{\"post\":{\"tags\":[\"IGNIS Stage 4 — Multimodal RAG\"],\"summary\":\"Store Image\",\"operationId\":\"store_image_ai_vision_store_image_post\",\"requestBody\":{\"content\":{\"multipart/form-data\":{\"schema\":{\"$ref\":\"#/components/schemas/Body_store_image_ai_vision_store_image_post\"}}},\"required\":true},\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/vision/store-video\":{\"post\":{\"tags\":[\"IGNIS Stage 4 — Multimodal RAG\"],\"summary\":\"Store Video\",\"operationId\":\"store_video_ai_vision_store_video_post\",\"requestBody\":{\"content\":{\"multipart/form-data\":{\"schema\":{\"$ref\":\"#/components/schemas/Body_store_video_ai_vision_store_video_post\"}}},\"required\":true},\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/vision/search\":{\"get\":{\"tags\":[\"IGNIS Stage 4 — Multimodal RAG\"],\"summary\":\"Search Visual\",\"operationId\":\"search_visual_ai_vision_search_get\",\"parameters\":[{\"name\":\"q\",\"in\":\"query\",\"required\":true,\"schema\":{\"type\":\"string\",\"title\":\"Q\"}},{\"name\":\"limit\",\"in\":\"query\",\"required\":false,\"schema\":{\"type\":\"integer\",\"default\":4,\"title\":\"Limit\"}}],\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/ask-multimodal\":{\"post\":{\"tags\":[\"IGNIS Stage 4 — Multimodal RAG\"],\"summary\":\"Ask Multimodal\",\"operationId\":\"ask_multimodal_ai_ask_multimodal_post\",\"requestBody\":{\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/MultiQuestion\"}}},\"required\":true},\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}},\"/ai/mission/health\":{\"get\":{\"tags\":[\"Mission Advisor\"],\"summary\":\"Mission Health\",\"operationId\":\"mission_health_ai_mission_health_get\",\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}}}}},\"/ai/mission/analyze\":{\"post\":{\"tags\":[\"Mission Advisor\"],\"summary\":\"Mission Analyze\",\"operationId\":\"mission_analyze_ai_mission_analyze_post\",\"requestBody\":{\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/MissionRequest\"}}},\"required\":true},\"responses\":{\"200\":{\"description\":\"Successful Response\",\"content\":{\"application/json\":{\"schema\":{}}}},\"422\":{\"description\":\"Validation Error\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/HTTPValidationError\"}}}}}}}},\"components\":{\"schemas\":{\"Body_analyze_image_ai_vision_image_post\":{\"properties\":{\"file\":{\"type\":\"string\",\"contentMediaType\":\"application/octet-stream\",\"title\":\"File\"},\"experiment_code\":{\"anyOf\":[{\"type\":\"string\"},{\"type\":\"null\"}],\"title\":\"Experiment Code\"}},\"type\":\"object\",\"required\":[\"file\"],\"title\":\"Body_analyze_image_ai_vision_image_post\"},\"Body_analyze_video_ai_vision_video_post\":{\"properties\":{\"file\":{\"type\":\"string\",\"contentMediaType\":\"application/octet-stream\",\"title\":\"File\"},\"experiment_code\":{\"anyOf\":[{\"type\":\"string\"},{\"type\":\"null\"}],\"title\":\"Experiment Code\"}},\"type\":\"object\",\"required\":[\"file\"],\"title\":\"Body_analyze_video_ai_vision_video_post\"},\"Body_store_image_ai_vision_store_image_post\":{\"properties\":{\"file\":{\"type\":\"string\",\"contentMediaType\":\"application/octet-stream\",\"title\":\"File\"},\"experiment_code\":{\"anyOf\":[{\"type\":\"string\"},{\"type\":\"null\"}],\"title\":\"Experiment Code\"},\"source_url\":{\"anyOf\":[{\"type\":\"string\"},{\"type\":\"null\"}],\"title\":\"Source Url\"}},\"type\":\"object\",\"required\":[\"file\"],\"title\":\"Body_store_image_ai_vision_store_image_post\"},\"Body_store_video_ai_vision_store_video_post\":{\"properties\":{\"file\":{\"type\":\"string\",\"contentMediaType\":\"application/octet-stream\",\"title\":\"File\"},\"experiment_code\":{\"anyOf\":[{\"type\":\"string\"},{\"type\":\"null\"}],\"title\":\"Experiment Code\"},\"source_url\":{\"anyOf\":[{\"type\":\"string\"},{\"type\":\"null\"}],\"title\":\"Source Url\"}},\"type\":\"object\",\"required\":[\"file\"],\"title\":\"Body_store_video_ai_vision_store_video_post\"},\"CompareRequest\":{\"properties\":{\"variable_name\":{\"type\":\"string\",\"maxLength\":150,\"minLength\":1,\"title\":\"Variable Name\"},\"experiment_codes\":{\"items\":{\"type\":\"string\"},\"type\":\"array\",\"maxItems\":25,\"minItems\":1,\"title\":\"Experiment Codes\"},\"dataset_prefix\":{\"type\":\"string\",\"maxLength\":60,\"title\":\"Dataset Prefix\",\"default\":\"ZARM-\"}},\"type\":\"object\",\"required\":[\"variable_name\",\"experiment_codes\"],\"title\":\"CompareRequest\"},\"HTTPValidationError\":{\"properties\":{\"detail\":{\"items\":{\"$ref\":\"#/components/schemas/ValidationError\"},\"type\":\"array\",\"title\":\"Detail\"}},\"type\":\"object\",\"title\":\"HTTPValidationError\"},\"HybridQuestion\":{\"properties\":{\"question\":{\"type\":\"string\",\"maxLength\":1500,\"minLength\":3,\"title\":\"Question\"},\"dataset_prefix\":{\"type\":\"string\",\"maxLength\":60,\"title\":\"Dataset Prefix\",\"default\":\"ZARM-\"},\"variable_name\":{\"anyOf\":[{\"type\":\"string\",\"maxLength\":150},{\"type\":\"null\"}],\"title\":\"Variable Name\"},\"experiment_codes\":{\"items\":{\"type\":\"string\"},\"type\":\"array\",\"maxItems\":25,\"title\":\"Experiment Codes\"},\"max_experiments\":{\"type\":\"integer\",\"maximum\":20.0,\"minimum\":1.0,\"title\":\"Max Experiments\",\"default\":8},\"top_k_papers\":{\"type\":\"integer\",\"maximum\":8.0,\"minimum\":1.0,\"title\":\"Top K Papers\",\"default\":4}},\"type\":\"object\",\"required\":[\"question\"],\"title\":\"HybridQuestion\"},\"MissionRequest\":{\"properties\":{\"environment\":{\"type\":\"string\",\"enum\":[\"pressurized_lunar_rover\",\"lunar_habitat\",\"mars_habitat\",\"spacecraft\",\"space_station\"],\"title\":\"Environment\",\"default\":\"pressurized_lunar_rover\"},\"research_focus\":{\"type\":\"string\",\"enum\":[\"suppression\",\"prevention\",\"detection\"],\"title\":\"Research Focus\",\"default\":\"suppression\"},\"oxygen_percent\":{\"type\":\"number\",\"maximum\":100.0,\"minimum\":0.0,\"title\":\"Oxygen Percent\",\"default\":32.0},\"pressure_psi\":{\"type\":\"number\",\"maximum\":30.0,\"exclusiveMinimum\":0.0,\"title\":\"Pressure Psi\",\"default\":12.2},\"fuel_material\":{\"anyOf\":[{\"type\":\"string\",\"maxLength\":120},{\"type\":\"null\"}],\"title\":\"Fuel Material\"},\"max_results\":{\"type\":\"integer\",\"maximum\":25.0,\"minimum\":1.0,\"title\":\"Max Results\",\"default\":10},\"include_external_research\":{\"type\":\"boolean\",\"title\":\"Include External Research\",\"default\":true}},\"type\":\"object\",\"title\":\"MissionRequest\"},\"MultiQuestion\":{\"properties\":{\"question\":{\"type\":\"string\",\"maxLength\":1500,\"minLength\":3,\"title\":\"Question\"},\"experiment_codes\":{\"items\":{\"type\":\"string\"},\"type\":\"array\",\"maxItems\":10,\"title\":\"Experiment Codes\"},\"top_k_papers\":{\"type\":\"integer\",\"maximum\":6.0,\"minimum\":1.0,\"title\":\"Top K Papers\",\"default\":4},\"top_k_visual\":{\"type\":\"integer\",\"maximum\":6.0,\"minimum\":1.0,\"title\":\"Top K Visual\",\"default\":3}},\"type\":\"object\",\"required\":[\"question\"],\"title\":\"MultiQuestion\"},\"Question\":{\"properties\":{\"question\":{\"type\":\"string\",\"title\":\"Question\"}},\"type\":\"object\",\"required\":[\"question\"],\"title\":\"Question\"},\"ValidationError\":{\"properties\":{\"loc\":{\"items\":{\"anyOf\":[{\"type\":\"string\"},{\"type\":\"integer\"}]},\"type\":\"array\",\"title\":\"Location\"},\"msg\":{\"type\":\"string\",\"title\":\"Message\"},\"type\":{\"type\":\"string\",\"title\":\"Error Type\"},\"input\":{\"title\":\"Input\"},\"ctx\":{\"type\":\"object\",\"title\":\"Context\"}},\"type\":\"object\",\"required\":[\"loc\",\"msg\",\"type\"],\"title\":\"ValidationError\"}}}}");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__20srvog65leay._.js.map