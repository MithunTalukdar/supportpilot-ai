import { Router } from 'express';
import multer from 'multer';
import { OrgRole } from '@prisma/client';
import { kbController } from './kb.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { requireOrgRole } from '../../middleware/rbac.middleware.js';
import { MAX_DOCUMENT_BYTE_SIZE } from './document.validator.js';

export const kbRouter = Router({ mergeParams: true });

// Configure in-memory upload storage with file size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_BYTE_SIZE,
    files: 1,
  },
});

// All document management routes require authenticated staff (OWNER or AGENT)
kbRouter.use(authenticateUser, resolveTenantContext, requireOrgRole(OrgRole.OWNER, OrgRole.AGENT));

// 1. Upload and index document
kbRouter.post('/', upload.single('file'), (req, res, next) => {
  kbController.upload(req, res).catch(next);
});

// 2. List documents
kbRouter.get('/', (req, res, next) => {
  kbController.list(req, res).catch(next);
});

// 3. Vector similarity search playground
kbRouter.post('/search', (req, res, next) => {
  kbController.search(req, res).catch(next);
});

// 4. Inspect document details and chunk previews
kbRouter.get('/:docId', (req, res, next) => {
  kbController.get(req, res).catch(next);
});

// 5. Reprocess / retry document
kbRouter.post('/:docId/retry', (req, res, next) => {
  kbController.reprocess(req, res).catch(next);
});

// 6. Delete document and purge vector chunks
kbRouter.delete('/:docId', (req, res, next) => {
  kbController.delete(req, res).catch(next);
});
