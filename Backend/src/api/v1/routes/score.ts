import { Router } from 'express';
import { 
  scoreResumeAgainstJob, 
  getScoringResult, 
  getVersions 
} from '../../../controllers/score.controller';
import { uploadResumeAndJD,uploadResume} from '../../../middlewares/upload.middleware';

export const atsRouter = Router();
atsRouter.post('/score', uploadResume, scoreResumeAgainstJob);
atsRouter.get('/score/:requestId', getScoringResult);
atsRouter.get('/versions', getVersions); 