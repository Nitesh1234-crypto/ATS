import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { QueueService } from '../services/queue.service';
import { FileService } from '../services/file.service';
import { ScoringRequest } from '../types';

const ScoreInputSchema = z.object({
  jd_text: z.string().min(10).optional(),
  candidate_name: z.string().optional(),
  candidate_email: z.string().email().optional(),
  job_title: z.string().optional(),
  target_seniority: z.string().optional(),
});

export async function scoreResumeAgainstJob(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const parseResult = ScoreInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: parseResult.error.flatten() 
      });
    }

    const { jd_text, ...metadata } = parseResult.data;
    
    // Handle JD file or text
    let jdFile: Express.Multer.File | undefined;
    if (req.files && Array.isArray(req.files)) {
      jdFile = req.files.find(f => f.fieldname === 'jd') as Express.Multer.File;
    }

    if (!jd_text && !jdFile) {
      return res.status(400).json({ error: 'Either JD file or JD text is required' });
    }

    // Upload resume file
    const resumePath = await FileService.uploadFile(req.file, 'resumes');
    
    // Upload JD file if provided
    let jdPath: string | undefined;
    if (jdFile) {
      jdPath = await FileService.uploadFile(jdFile, 'job-descriptions');
    }

    const scoringRequest: ScoringRequest = {
      resume: req.file,
      jd: jdFile,
      jd_text,
      metadata,
    };

    // Add job to queue
    const jobId = await QueueService.addScoringJob(scoringRequest);
    
    // Store job metadata 
    const jobData = {
      id: jobId,
      status: 'pending',
      request: scoringRequest,
      created_at: new Date(),
      updated_at: new Date(),
    };

   //this jobData will be stored in database in future !!
    console.log('Job created:', jobData);

    res.status(202).json({ 
      request_id: jobId,
      status: 'pending',
      message: 'Scoring job queued successfully'
    });

  } catch (error) {
    console.error('Error in scoreResumeAgainstJob:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getScoringResult(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    const status = await QueueService.getJobStatus(requestId);
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (status === 'completed') {
      const result = await QueueService.getJobResult(requestId);
      return res.json({
        request_id: requestId,
        status: 'completed',
        result

      });
    }

    // Return pending status
    res.json({
      request_id: requestId,
      status: 'pending',
      message: 'Job is still being processed'
    });

  } catch (error) {
    console.error('Error in getScoringResult:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getVersions(req: Request, res: Response) {
  res.json({
    service: 'ats-scoring-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dependencies: {
      node: process.version,
      express: '5.1.0',
    }
  });
} 