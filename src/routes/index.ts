/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Master API Router
 */

import { Router } from 'express';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.ts';
import { validateBody } from '../middleware/validator.middleware.ts';
import { authenticateToken } from '../middleware/auth.middleware.ts';
import { requireBusiness } from '../middleware/business.middleware.ts';
import { authorizeRoles } from '../middleware/role.middleware.ts';

import {
  registerSchema,
  loginSchema,
  createBusinessSchema,
  createInventorySchema,
  adjustStockSchema,
  createProductSchema,
  createCustomerSchema,
  createSupplierSchema,
  createSaleSchema,
  createPurchaseSchema,
  createPaymentSchema,
  createExpenseSchema,
  createCameraSchema,
  logCameraEventSchema,
} from '../validators/schemas.ts';

import { AuthController } from '../controllers/auth.controller.ts';
import { BusinessController } from '../controllers/business.controller.ts';
import { InventoryController } from '../controllers/inventory.controller.ts';
import { ProductController } from '../controllers/product.controller.ts';
import { CustomerController } from '../controllers/customer.controller.ts';
import { SupplierController } from '../controllers/supplier.controller.ts';
import { SaleController } from '../controllers/sale.controller.ts';
import { PurchaseController } from '../controllers/purchase.controller.ts';
import { PaymentController } from '../controllers/payment.controller.ts';
import { ExpenseController } from '../controllers/expense.controller.ts';
import { DashboardController } from '../controllers/dashboard.controller.ts';
import { ReportController } from '../controllers/report.controller.ts';
import { CameraController } from '../controllers/camera.controller.ts';
import { NotificationController, AuditController, TaxController } from '../controllers/misc.controller.ts';
import { TestingController } from '../controllers/testing.controller.ts';
import { DeviceController } from '../controllers/device.controller.ts';
import { AgentController } from '../controllers/agent.controller.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================
const authRouter = Router();
authRouter.post('/register', authRateLimiter, validateBody(registerSchema), AuthController.register);
authRouter.post('/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
authRouter.get('/me', authenticateToken, AuthController.getMe);
apiRouter.use('/auth', authRouter);

// ==========================================
// 2. BUSINESSES ROUTES
// ==========================================
const businessRouter = Router();
businessRouter.post('/', authenticateToken, validateBody(createBusinessSchema), BusinessController.create);
businessRouter.get('/:id', authenticateToken, BusinessController.getById);
businessRouter.patch('/:id', authenticateToken, authorizeRoles('owner', 'boss'), BusinessController.update);
apiRouter.use('/businesses', businessRouter);

// ==========================================
// 3. INVENTORY ROUTES (Imbaho mfite)
// ==========================================
const inventoryRouter = Router();
inventoryRouter.use(authenticateToken, requireBusiness);
inventoryRouter.post('/', authorizeRoles('owner', 'boss', 'manager'), validateBody(createInventorySchema), InventoryController.create);
inventoryRouter.get('/', InventoryController.getAll);
inventoryRouter.get('/:id', InventoryController.getById);
inventoryRouter.post('/:id/adjust', authorizeRoles('owner', 'boss', 'manager', 'worker'), validateBody(adjustStockSchema), InventoryController.adjust);
inventoryRouter.get('/:id/movements', InventoryController.getMovements);
apiRouter.use('/inventory', inventoryRouter);

// ==========================================
// 4. PRODUCTS CATALOG ROUTES
// ==========================================
const productRouter = Router();
productRouter.use(authenticateToken, requireBusiness);
productRouter.post('/', authorizeRoles('owner', 'boss', 'manager'), validateBody(createProductSchema), ProductController.create);
productRouter.get('/', ProductController.getAll);
productRouter.get('/:id', ProductController.getById);
productRouter.patch('/:id', authorizeRoles('owner', 'boss', 'manager'), ProductController.update);
apiRouter.use('/products', productRouter);

// ==========================================
// 5. CUSTOMERS ROUTES (Abakiriya)
// ==========================================
const customerRouter = Router();
customerRouter.use(authenticateToken, requireBusiness);
customerRouter.post('/', validateBody(createCustomerSchema), CustomerController.create);
customerRouter.get('/', CustomerController.getAll);
customerRouter.get('/:id', CustomerController.getById);
customerRouter.patch('/:id', CustomerController.update);
apiRouter.use('/customers', customerRouter);

// ==========================================
// 6. SUPPLIERS ROUTES (Abo tugura ho)
// ==========================================
const supplierRouter = Router();
supplierRouter.use(authenticateToken, requireBusiness);
supplierRouter.post('/', authorizeRoles('owner', 'boss', 'manager', 'accountant'), validateBody(createSupplierSchema), SupplierController.create);
supplierRouter.get('/', SupplierController.getAll);
supplierRouter.get('/:id', SupplierController.getById);
supplierRouter.patch('/:id', authorizeRoles('owner', 'boss', 'manager', 'accountant'), SupplierController.update);
apiRouter.use('/suppliers', supplierRouter);

// ==========================================
// 7. PURCHASES ROUTES (Ibyo twaguze)
// ==========================================
const purchaseRouter = Router();
purchaseRouter.use(authenticateToken, requireBusiness);
purchaseRouter.post('/', authorizeRoles('owner', 'boss', 'manager', 'accountant'), validateBody(createPurchaseSchema), PurchaseController.create);
purchaseRouter.get('/', PurchaseController.getAll);
purchaseRouter.get('/:id', PurchaseController.getById);
apiRouter.use('/purchases', purchaseRouter);

// ==========================================
// 8. SALES ROUTES (Igurisha)
// ==========================================
const saleRouter = Router();
saleRouter.use(authenticateToken, requireBusiness);
saleRouter.post('/', authorizeRoles('owner', 'boss', 'manager', 'worker', 'accountant'), validateBody(createSaleSchema), SaleController.create);
saleRouter.get('/', SaleController.getAll);
saleRouter.get('/:id', SaleController.getById);
apiRouter.use('/sales', saleRouter);

// ==========================================
// 9. PAYMENTS ROUTES (Kwishyura)
// ==========================================
const paymentRouter = Router();
paymentRouter.use(authenticateToken, requireBusiness);
paymentRouter.post('/', authorizeRoles('owner', 'boss', 'accountant', 'manager'), validateBody(createPaymentSchema), PaymentController.create);
paymentRouter.get('/', PaymentController.getAll);
apiRouter.use('/payments', paymentRouter);

// ==========================================
// 10. EXPENSES ROUTES (Amafaranga nakoresheje)
// ==========================================
const expenseRouter = Router();
expenseRouter.use(authenticateToken, requireBusiness);
expenseRouter.post('/', authorizeRoles('owner', 'boss', 'accountant', 'manager'), validateBody(createExpenseSchema), ExpenseController.create);
expenseRouter.get('/', ExpenseController.getAll);
apiRouter.use('/expenses', expenseRouter);

// ==========================================
// 11. DASHBOARD SUMMARY ROUTES (Business yanjye)
// ==========================================
const dashboardRouter = Router();
dashboardRouter.use(authenticateToken, requireBusiness);
dashboardRouter.get('/', DashboardController.getSummary);
apiRouter.use('/dashboard', dashboardRouter);

// ==========================================
// 12. REPORTS ROUTES (Raporo)
// ==========================================
const reportRouter = Router();
reportRouter.use(authenticateToken, requireBusiness);
reportRouter.get('/daily', authorizeRoles('owner', 'boss', 'manager', 'accountant'), ReportController.getDaily);
reportRouter.get('/monthly', authorizeRoles('owner', 'boss', 'accountant'), ReportController.getMonthly);
apiRouter.use('/reports', reportRouter);

// ==========================================
// 13. CAMERAS & MONITORING ROUTES
// ==========================================
const cameraRouter = Router();
cameraRouter.use(authenticateToken, requireBusiness);
cameraRouter.post('/', authorizeRoles('owner', 'boss', 'manager'), validateBody(createCameraSchema), CameraController.create);
cameraRouter.get('/', CameraController.getAll);
cameraRouter.get('/events', CameraController.getEvents);
cameraRouter.get('/:id', CameraController.getById);
cameraRouter.patch('/:id', authorizeRoles('owner', 'boss'), CameraController.update);
cameraRouter.delete('/:id', authorizeRoles('owner', 'boss'), CameraController.delete);
cameraRouter.post('/events', validateBody(logCameraEventSchema), CameraController.logEvent);
apiRouter.use('/cameras', cameraRouter);

// ==========================================
// 14. NOTIFICATIONS ROUTES (Ubutumwa)
// ==========================================
const notificationRouter = Router();
notificationRouter.use(authenticateToken, requireBusiness);
notificationRouter.get('/', NotificationController.getAll);
notificationRouter.patch('/:id/read', NotificationController.markRead);
apiRouter.use('/notifications', notificationRouter);

// ==========================================
// 15. AUDIT LOGS ROUTES (Amateka)
// ==========================================
const auditRouter = Router();
auditRouter.use(authenticateToken, requireBusiness, authorizeRoles('owner', 'boss', 'accountant'));
auditRouter.get('/', AuditController.getLogs);
apiRouter.use('/audit-logs', auditRouter);

// ==========================================
// 16. TAX ESTIMATION ROUTES (Umusoro ugereranyijwe)
// ==========================================
const taxRouter = Router();
taxRouter.use(authenticateToken, requireBusiness, authorizeRoles('owner', 'boss', 'accountant'));
taxRouter.get('/estimate', TaxController.calculateEstimate);
apiRouter.use('/tax', taxRouter);

// ==========================================
// 17. GANZA AGENT OS — AUTONOMOUS AGENT ROUTES
// ==========================================
const agentRouter = Router();
agentRouter.use(authenticateToken);
agentRouter.post('/tasks', AgentController.createTask);
agentRouter.get('/tasks', AgentController.listTasks);
agentRouter.get('/tasks/:id', AgentController.getTask);
agentRouter.post('/tasks/:id/cancel', AgentController.cancelTask);
agentRouter.get('/tasks/:id/evidence', AgentController.getEvidence);
agentRouter.get('/tasks/:id/report', AgentController.getReport);
apiRouter.use('/agent', agentRouter);

// ==========================================
// 18. DEVICE REGISTRY
// ==========================================
const deviceRouter = Router();
deviceRouter.use(authenticateToken);
deviceRouter.post('/register', DeviceController.register);
deviceRouter.get('/', DeviceController.list);
deviceRouter.get('/:id', DeviceController.get);
deviceRouter.post('/:id/heartbeat', DeviceController.heartbeat);
apiRouter.use('/devices', deviceRouter);

// ==========================================
// 19. TESTING CENTER — SOURCE OF TRUTH
// ==========================================
const testingRouter = Router();
testingRouter.use(authenticateToken);
testingRouter.post('/cases', TestingController.createCase);
testingRouter.get('/cases', TestingController.listCases);
testingRouter.get('/cases/:id', TestingController.getCase);
testingRouter.post('/cases/:id/run', TestingController.runTest);
testingRouter.get('/runs', TestingController.listRuns);
testingRouter.get('/runs/:id', TestingController.getRun);
testingRouter.get('/runs/:id/evidence', TestingController.getEvidence);
apiRouter.use('/testing', testingRouter);
