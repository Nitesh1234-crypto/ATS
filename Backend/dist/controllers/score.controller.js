"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreResumeAgainstJob = scoreResumeAgainstJob;
exports.getScoringResult = getScoringResult;
exports.getVersions = getVersions;
const zod_1 = require("zod");
const queue_service_1 = require("../services/queue.service");
const file_service_1 = require("../services/file.service");
const ScoreInputSchema = zod_1.z.object({
    jd_text: zod_1.z.string().min(10).optional(),
    candidate_name: zod_1.z.string().optional(),
    candidate_email: zod_1.z.string().email().optional(),
    job_title: zod_1.z.string().optional(),
    target_seniority: zod_1.z.string().optional(),
});
async function scoreResumeAgainstJob(req, res) {
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
        let jdFile;
        if (req.files && Array.isArray(req.files)) {
            jdFile = req.files.find(f => f.fieldname === 'jd');
        }
        if (!jd_text && !jdFile) {
            return res.status(400).json({ error: 'Either JD file or JD text is required' });
        }
        // Upload resume file
        const resumePath = await file_service_1.FileService.uploadFile(req.file, 'resumes');
        // Upload JD file if provided
        let jdPath;
        if (jdFile) {
            jdPath = await file_service_1.FileService.uploadFile(jdFile, 'job-descriptions');
        }
        const scoringRequest = {
            resume: req.file,
            jd: jdFile,
            jd_text,
            metadata,
        };
        // Add job to queue
        const jobId = await queue_service_1.QueueService.addScoringJob(scoringRequest);
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
    }
    catch (error) {
        console.error('Error in scoreResumeAgainstJob:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getScoringResult(req, res) {
    try {
        const { requestId } = req.params;
        if (!requestId) {
            return res.status(400).json({ error: 'Request ID is required' });
        }
        const status = await queue_service_1.QueueService.getJobStatus(requestId);
        if (!status) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (status === 'completed') {
            const result = await queue_service_1.QueueService.getJobResult(requestId);
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
    }
    catch (error) {
        console.error('Error in getScoringResult:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getVersions(req, res) {
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
