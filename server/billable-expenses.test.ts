import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

// Mock user for testing
const mockUser = {
  id: 1,
  openId: "test-openid",
  name: "Billable Test User",
  email: "billable@example.com",
  role: "user" as const,
};

describe('Billable Expense Workflow', () => {
  const testUserId = mockUser.id;
  let testClientId: number;
  let testCategoryId: number;
  let testExpenseId1: number;
  let testExpenseId2: number;
  let testInvoiceId: number;

  beforeAll(async () => {

    // Create test client
    const client = await db.createClient({
      userId: testUserId,
      name: 'Test Client for Billable',
      email: 'billable-client@example.com',
    });
    testClientId = client.id;

    // Create test expense category
    const category = await db.createExpenseCategory({
      userId: testUserId,
      name: 'Billable Services',
    });
    testCategoryId = category.id;
  });

  it('should create billable expenses with client assignment', async () => {
    const expense1 = await db.createExpense({
      userId: testUserId,
      categoryId: testCategoryId,
      amount: '500.00',
      taxAmount: '50.00',
      date: new Date(),
      description: 'Consulting services',
      vendor: 'John Doe Consulting',
      paymentMethod: 'credit_card',
      isBillable: true,
      clientId: testClientId,
    });

    testExpenseId1 = expense1.id;

    expect(expense1.isBillable).toBe(true);
    expect(expense1.clientId).toBe(testClientId);
    expect(expense1.invoiceId).toBeNull();
  });

  it('should create non-billable expense', async () => {
    const expense = await db.createExpense({
      userId: testUserId,
      categoryId: testCategoryId,
      amount: '100.00',
      date: new Date(),
      description: 'Office supplies',
      isBillable: false,
    });

    expect(expense.success).toBe(true);
  });

  it('should fetch unbilled expenses for a specific client', async () => {
    // Create another billable expense for the same client
    const expense2 = await db.createExpense({
      userId: testUserId,
      categoryId: testCategoryId,
      amount: '300.00',
      taxAmount: '30.00',
      date: new Date(),
      description: 'Design work',
      vendor: 'Design Studio',
      isBillable: true,
      clientId: testClientId,
    });

    testExpenseId2 = expense2.id;

    const unbilledExpenses = await db.getBillableUnlinkedExpenses(testUserId, testClientId);

    expect(unbilledExpenses.length).toBeGreaterThanOrEqual(2);
    
    const expense1Result = unbilledExpenses.find(e => e.id === testExpenseId1);
    const expense2Result = unbilledExpenses.find(e => e.id === testExpenseId2);

    expect(expense1Result).toBeDefined();
    expect(expense1Result?.description).toBe('Consulting services');
    expect(expense1Result?.amount).toBe('500.00');
    expect(expense1Result?.taxAmount).toBe('50.00');
    expect(expense1Result?.vendor).toBe('John Doe Consulting');
    expect(expense1Result?.clientName).toBe('Test Client for Billable');

    expect(expense2Result).toBeDefined();
    expect(expense2Result?.description).toBe('Design work');
  });

  it('should fetch all unbilled expenses when no client specified', async () => {
    const allUnbilledExpenses = await db.getBillableUnlinkedExpenses(testUserId);

    expect(allUnbilledExpenses.length).toBeGreaterThanOrEqual(2);
    
    const hasExpense1 = allUnbilledExpenses.some(e => e.id === testExpenseId1);
    const hasExpense2 = allUnbilledExpenses.some(e => e.id === testExpenseId2);

    expect(hasExpense1).toBe(true);
    expect(hasExpense2).toBe(true);
  });

  it('should not include non-billable expenses in unbilled list', async () => {
    const unbilledExpenses = await db.getBillableUnlinkedExpenses(testUserId, testClientId);
    
    const hasNonBillable = unbilledExpenses.some(e => e.description === 'Office supplies');
    expect(hasNonBillable).toBe(false);
  });

  it('should link expense to invoice', async () => {
    // Create a test invoice
    const invoice = await db.createInvoice({
      userId: testUserId,
      clientId: testClientId,
      invoiceNumber: `TEST-BILLABLE-${Date.now()}`,
      status: 'draft',
      subtotal: '550.00',
      taxRate: '10',
      taxAmount: '50.00',
      total: '550.00',
      amountPaid: '0',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    testInvoiceId = invoice.id;

    // Link expense to invoice
    const result = await db.linkExpenseToInvoice(testExpenseId1, testInvoiceId, testUserId);

    expect(result.success).toBe(true);

    // Verify expense is linked
    const linkedExpense = await db.getExpenseById(testExpenseId1, testUserId);
    expect(linkedExpense?.invoiceId).toBe(testInvoiceId);
  });

  it('should not return linked expenses in unbilled list', async () => {
    const unbilledExpenses = await db.getBillableUnlinkedExpenses(testUserId, testClientId);
    
    // testExpenseId1 is now linked, should not appear
    const hasLinkedExpense = unbilledExpenses.some(e => e.id === testExpenseId1);
    expect(hasLinkedExpense).toBe(false);

    // testExpenseId2 is still unlinked, should appear
    const hasUnlinkedExpense = unbilledExpenses.some(e => e.id === testExpenseId2);
    expect(hasUnlinkedExpense).toBe(true);
  });

  it('should link multiple expenses to same invoice', async () => {
    // Link second expense to same invoice
    const result = await db.linkExpenseToInvoice(testExpenseId2, testInvoiceId, testUserId);

    expect(result.success).toBe(true);

    // Verify both expenses are linked
    const expense1 = await db.getExpenseById(testExpenseId1, testUserId);
    const expense2 = await db.getExpenseById(testExpenseId2, testUserId);

    expect(expense1?.invoiceId).toBe(testInvoiceId);
    expect(expense2?.invoiceId).toBe(testInvoiceId);
  });

  it('should not allow linking non-billable expense', async () => {
    // Create non-billable expense
    await db.createExpense({
      userId: testUserId,
      categoryId: testCategoryId,
      amount: '50.00',
      date: new Date(),
      description: 'Non-billable expense',
      isBillable: false,
    });

    // Get the expense by description to find its ID
    const expenses = await db.getExpensesByUserId(testUserId);
    const nonBillable = expenses.find(e => e.description === 'Non-billable expense');
    
    if (!nonBillable) throw new Error('Non-billable expense not found');

    // Attempt to link non-billable expense
    await expect(
      db.linkExpenseToInvoice(nonBillable.id, testInvoiceId, testUserId)
    ).rejects.toThrow('Expense not found or not billable');
  });

  it('should verify expense has invoiceId after linking', async () => {
    // Verify both linked expenses have correct invoiceId
    const expense1 = await db.getExpenseById(testExpenseId1, testUserId);
    const expense2 = await db.getExpenseById(testExpenseId2, testUserId);

    expect(expense1?.invoiceId).toBe(testInvoiceId);
    expect(expense2?.invoiceId).toBe(testInvoiceId);
    expect(expense1?.isBillable).toBe(true);
    expect(expense2?.isBillable).toBe(true);
  });
});
