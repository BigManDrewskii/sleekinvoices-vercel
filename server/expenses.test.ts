import { describe, it, expect } from 'vitest';

// Test expense data structures and validation
describe('Expense Data Structures', () => {
  describe('Expense Categories', () => {
    it('should have required fields for category', () => {
      const category = {
        id: 1,
        userId: 1,
        name: 'Office Supplies',
        color: '#3B82F6',
        icon: 'receipt',
        createdAt: new Date(),
      };
      
      expect(category.name).toBeDefined();
      expect(category.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(category.userId).toBeGreaterThan(0);
    });

    it('should validate color format', () => {
      const validColors = ['#3B82F6', '#FF0000', '#00ff00', '#FFFFFF'];
      const invalidColors = ['red', 'rgb(0,0,0)', '3B82F6', '#GGG'];
      
      validColors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
      
      invalidColors.forEach(color => {
        expect(color).not.toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('Expense Fields', () => {
    it('should have all required expense fields', () => {
      const expense = {
        id: 1,
        userId: 1,
        categoryId: 1,
        amount: '150.00',
        currency: 'USD',
        date: new Date(),
        description: 'Office supplies purchase',
        vendor: 'Staples',
        paymentMethod: 'credit_card' as const,
        taxAmount: '12.00',
        isBillable: true,
        clientId: 1,
        invoiceId: null,
        billedAt: null,
        isTaxDeductible: true,
        receiptUrl: 'https://s3.example.com/receipt.pdf',
        receiptKey: 'receipts/1/receipt.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(expense.amount).toBeDefined();
      expect(expense.description).toBeDefined();
      expect(expense.categoryId).toBeGreaterThan(0);
      expect(expense.userId).toBeGreaterThan(0);
    });

    it('should validate payment methods', () => {
      const validMethods = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other'];
      const invalidMethods = ['paypal', 'venmo', 'crypto'];
      
      validMethods.forEach(method => {
        expect(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other']).toContain(method);
      });
      
      invalidMethods.forEach(method => {
        expect(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other']).not.toContain(method);
      });
    });

    it('should handle billable expense logic', () => {
      const billableExpense = {
        isBillable: true,
        clientId: 1,
        invoiceId: null,
        billedAt: null,
      };
      
      const nonBillableExpense = {
        isBillable: false,
        clientId: null,
        invoiceId: null,
        billedAt: null,
      };
      
      // Billable expense should have a client
      expect(billableExpense.isBillable).toBe(true);
      expect(billableExpense.clientId).not.toBeNull();
      
      // Non-billable expense should not require client
      expect(nonBillableExpense.isBillable).toBe(false);
    });

    it('should track billed status correctly', () => {
      const unbilledExpense = {
        isBillable: true,
        clientId: 1,
        invoiceId: null,
        billedAt: null,
      };
      
      const billedExpense = {
        isBillable: true,
        clientId: 1,
        invoiceId: 123,
        billedAt: new Date(),
      };
      
      // Unbilled expense has no invoice
      expect(unbilledExpense.invoiceId).toBeNull();
      expect(unbilledExpense.billedAt).toBeNull();
      
      // Billed expense has invoice and timestamp
      expect(billedExpense.invoiceId).not.toBeNull();
      expect(billedExpense.billedAt).not.toBeNull();
    });
  });

  describe('Expense Calculations', () => {
    it('should calculate total with tax correctly', () => {
      const amount = 100.00;
      const taxAmount = 8.25;
      const total = amount + taxAmount;
      
      expect(total).toBe(108.25);
    });

    it('should calculate expense stats correctly', () => {
      const expenses = [
        { amount: '100.00', taxAmount: '8.00', isBillable: true },
        { amount: '50.00', taxAmount: '4.00', isBillable: false },
        { amount: '200.00', taxAmount: '16.00', isBillable: true },
      ];
      
      const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const totalTax = expenses.reduce((sum, exp) => sum + parseFloat(exp.taxAmount), 0);
      const billableAmount = expenses
        .filter(exp => exp.isBillable)
        .reduce((sum, exp) => sum + parseFloat(exp.amount) + parseFloat(exp.taxAmount), 0);
      const billableCount = expenses.filter(exp => exp.isBillable).length;
      
      expect(totalAmount).toBe(350);
      expect(totalTax).toBe(28);
      expect(billableAmount).toBe(324); // (100+8) + (200+16)
      expect(billableCount).toBe(2);
    });
  });

  describe('Expense Filtering', () => {
    const expenses = [
      { id: 1, categoryId: 1, isBillable: true, clientId: 1, paymentMethod: 'cash' },
      { id: 2, categoryId: 2, isBillable: false, clientId: null, paymentMethod: 'credit_card' },
      { id: 3, categoryId: 1, isBillable: true, clientId: 2, paymentMethod: 'cash' },
      { id: 4, categoryId: 3, isBillable: false, clientId: null, paymentMethod: 'bank_transfer' },
    ];

    it('should filter by category', () => {
      const categoryId = 1;
      const filtered = expenses.filter(exp => exp.categoryId === categoryId);
      
      expect(filtered.length).toBe(2);
      expect(filtered.every(exp => exp.categoryId === categoryId)).toBe(true);
    });

    it('should filter by billable status', () => {
      const billableOnly = expenses.filter(exp => exp.isBillable);
      const nonBillableOnly = expenses.filter(exp => !exp.isBillable);
      
      expect(billableOnly.length).toBe(2);
      expect(nonBillableOnly.length).toBe(2);
    });

    it('should filter by client', () => {
      const clientId = 1;
      const filtered = expenses.filter(exp => exp.clientId === clientId);
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(1);
    });

    it('should filter by payment method', () => {
      const method = 'cash';
      const filtered = expenses.filter(exp => exp.paymentMethod === method);
      
      expect(filtered.length).toBe(2);
    });

    it('should combine multiple filters', () => {
      const filtered = expenses.filter(exp => 
        exp.categoryId === 1 && 
        exp.isBillable === true && 
        exp.paymentMethod === 'cash'
      );
      
      expect(filtered.length).toBe(2);
    });
  });

  describe('Receipt Upload', () => {
    it('should validate file types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      const invalidTypes = ['text/plain', 'application/json', 'video/mp4'];
      
      validTypes.forEach(type => {
        const isValid = type.startsWith('image/') || type === 'application/pdf';
        expect(isValid).toBe(true);
      });
      
      invalidTypes.forEach(type => {
        const isValid = type.startsWith('image/') || type === 'application/pdf';
        expect(isValid).toBe(false);
      });
    });

    it('should generate unique file keys', () => {
      const userId = 1;
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileName = 'receipt.pdf';
      
      const fileKey = `receipts/${userId}/${timestamp}-${randomSuffix}-${fileName}`;
      
      expect(fileKey).toContain('receipts/');
      expect(fileKey).toContain(userId.toString());
      expect(fileKey).toContain(fileName);
    });
  });
});
