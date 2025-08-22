import { Queue, Worker, Job } from 'bullmq';
import { ScoringJob, ScoringRequest } from '../types';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const scoringQueue = new Queue('resume-scoring', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

// Create worker to process jobs
const worker = new Worker('resume-scoring', async (job: Job) => {
  console.log('Received job:', job.id, 'with data:', job.data);
  let { resume, jd, jd_text, metadata } = job.data as ScoringRequest;
  console.log('Processing scoring job:', {resume, jd, jd_text, metadata});
  
  try {
    if (resume?.buffer) {
      if ((resume.buffer as any).data) {
        resume = {
          ...resume,
          buffer: Buffer.from((resume.buffer as any).data),
        };
    } else if (Buffer.isBuffer(resume.buffer)) {
      resume = {
        ...resume,
        buffer: resume.buffer,
      };
    }

    // Call Python ML service
    const result = await callMLService(resume, jd, jd_text, metadata);
    return result;
  }} catch (error) {
    console.error('EEEEEEError processing scoring job:', error);
    throw error;
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
}

);
worker.on("ready", () => console.log("Worker connected to Redis and listening..."));


export class QueueService {
  static async addScoringJob(request: ScoringRequest): Promise<string> {
    console.log("Adding job to queue:", { resume:request.resume, jd:request.jd, jd_text:request.jd_text, metadata:request.metadata });

    const job = await scoringQueue.add('resume-scoring', request, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    
    return job.id || 'unknown';
  }

  static async getJobStatus(jobId: string): Promise<ScoringJob['status'] | null> {
    const job = await scoringQueue.getJob(jobId);
    if (!job) return null;
    
    const state = await job.getState();
    return state as ScoringJob['status'];
  }

  static async getJobResult(jobId: string): Promise<any> {
    const job = await scoringQueue.getJob(jobId);
    if (!job) return null;
    
    return job.returnvalue;
  }
}

async function callMLService(
  resume: Express.Multer.File,
  jd?: Express.Multer.File,
  jd_text?: string,
  metadata?: any
) {


  console.log('Calling ML service with:')
  const form = new FormData();

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
        form.append(key, value as string);
      }
    });
  }

  // Call FastAPI ML service
  const response = await axios.post(
    `${process.env.ML_SERVICE_URL || 'http://ats-model:8001'}/api/v1/scoring/analyze`,
    form,
    { headers: form.getHeaders() }
  );

  return response.data;
}

export default scoringQueue;
