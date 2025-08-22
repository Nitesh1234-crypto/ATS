"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const bullmq_1 = require("bullmq");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const scoringQueue = new bullmq_1.Queue('resume-scoring', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
    },
});
// Create worker to process jobs
const worker = new bullmq_1.Worker('resume-scoring', async (job) => {
    console.log('Received job:', job.id, 'with data:', job.data);
    let { resume, jd, jd_text, metadata } = job.data;
    console.log('Processing scoring job:', { resume, jd, jd_text, metadata });
    try {
        if (resume?.buffer) {
            if (resume.buffer.data) {
                resume = {
                    ...resume,
                    buffer: Buffer.from(resume.buffer.data),
                };
            }
            else if (Buffer.isBuffer(resume.buffer)) {
                resume = {
                    ...resume,
                    buffer: resume.buffer,
                };
            }
            // Call Python ML service
            const result = await callMLService(resume, jd, jd_text, metadata);
            return result;
        }
    }
    catch (error) {
        console.error('EEEEEEError processing scoring job:', error);
        throw error;
    }
}, {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
    },
});
worker.on("ready", () => console.log("Worker connected to Redis and listening..."));
class QueueService {
    static async addScoringJob(request) {
        console.log("Adding job to queue:", { resume: request.resume, jd: request.jd, jd_text: request.jd_text, metadata: request.metadata });
        const job = await scoringQueue.add('resume-scoring', request, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
        return job.id || 'unknown';
    }
    static async getJobStatus(jobId) {
        const job = await scoringQueue.getJob(jobId);
        if (!job)
            return null;
        const state = await job.getState();
        return state;
    }
    static async getJobResult(jobId) {
        const job = await scoringQueue.getJob(jobId);
        if (!job)
            return null;
        return job.returnvalue;
    }
}
exports.QueueService = QueueService;
async function callMLService(resume, jd, jd_text, metadata) {
    console.log('Calling ML service with:');
    const form = new form_data_1.default();
    // Attach resume file
    form.append('resume', resume.buffer, {
        filename: resume.originalname,
        contentType: resume.mimetype,
    });
    // Attach JD (either file or text)
    // if (jd) {
    // const jdFilePath = path.join(os.tmpdir(), jd.originalname);
    // fs.writeFileSync(jdFilePath, jd.buffer);
    // form.append("jd", fs.createReadStream(jdFilePath), jd.originalname);
    // } 
    if (jd_text) {
        form.append('jd_text', jd_text);
    }
    // Attach metadata fields
    if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
            if (value) {
                form.append(key, value);
            }
        });
    }
    // Call FastAPI ML service
    const response = await axios_1.default.post(`${process.env.ML_SERVICE_URL || 'http://ats-model:8001'}/api/v1/scoring/analyze`, form, { headers: form.getHeaders() });
    return response.data;
}
exports.default = scoringQueue;
