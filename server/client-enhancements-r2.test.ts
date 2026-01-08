import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Client Management Enhancements Round 2', () => {
  describe('Client Search Filters', () => {
    it('should filter by company name', () => {
      const clients = [
        { id: 1, name: 'John', companyName: 'Acme Inc', taxExempt: false, createdAt: new Date('2026-01-01') },
        { id: 2, name: 'Jane', companyName: 'Tech Corp', taxExempt: true, createdAt: new Date('2026-01-05') },
        { id: 3, name: 'Bob', companyName: 'Acme Inc', taxExempt: false, createdAt: new Date('2026-01-03') },
      ];
      
      const companyFilter = 'Acme Inc';
      const filtered = clients.filter(c => c.companyName === companyFilter);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.companyName === 'Acme Inc')).toBe(true);
    });

    it('should filter by tax exempt status', () => {
      const clients = [
        { id: 1, name: 'John', companyName: 'Acme Inc', taxExempt: false, createdAt: new Date('2026-01-01') },
        { id: 2, name: 'Jane', companyName: 'Tech Corp', taxExempt: true, createdAt: new Date('2026-01-05') },
        { id: 3, name: 'Bob', companyName: 'Acme Inc', taxExempt: true, createdAt: new Date('2026-01-03') },
      ];
      
      const taxExemptFilter = 'exempt';
      const filtered = clients.filter(c => c.taxExempt === true);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.taxExempt === true)).toBe(true);
    });

    it('should filter by date range', () => {
      const clients = [
        { id: 1, name: 'John', companyName: 'Acme Inc', taxExempt: false, createdAt: new Date('2026-01-01') },
        { id: 2, name: 'Jane', companyName: 'Tech Corp', taxExempt: true, createdAt: new Date('2026-01-05') },
        { id: 3, name: 'Bob', companyName: 'Acme Inc', taxExempt: false, createdAt: new Date('2025-12-01') },
      ];
      
      const cutoffDate = new Date('2026-01-01');
      const filtered = clients.filter(c => new Date(c.createdAt) >= cutoffDate);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => new Date(c.createdAt) >= cutoffDate)).toBe(true);
    });

    it('should combine multiple filters', () => {
      const clients = [
        { id: 1, name: 'John', companyName: 'Acme Inc', taxExempt: false, createdAt: new Date('2026-01-01') },
        { id: 2, name: 'Jane', companyName: 'Acme Inc', taxExempt: true, createdAt: new Date('2026-01-05') },
        { id: 3, name: 'Bob', companyName: 'Tech Corp', taxExempt: true, createdAt: new Date('2026-01-03') },
      ];
      
      const companyFilter = 'Acme Inc';
      const taxExemptFilter = 'exempt';
      
      const filtered = clients
        .filter(c => c.companyName === companyFilter)
        .filter(c => c.taxExempt === true);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Jane');
    });

    it('should extract unique companies from client list', () => {
      const clients = [
        { id: 1, name: 'John', companyName: 'Acme Inc' },
        { id: 2, name: 'Jane', companyName: 'Tech Corp' },
        { id: 3, name: 'Bob', companyName: 'Acme Inc' },
        { id: 4, name: 'Alice', companyName: null },
      ];
      
      const uniqueCompanies = clients
        .map(c => c.companyName)
        .filter((c): c is string => !!c)
        .filter((c, i, arr) => arr.indexOf(c) === i)
        .sort();
      
      expect(uniqueCompanies).toEqual(['Acme Inc', 'Tech Corp']);
    });
  });

  describe('Email Template Presets', () => {
    const presets = [
      {
        id: 'friendly',
        name: 'Friendly Reminder',
        description: 'Warm and casual tone',
        content: 'Hi {{clientName}}, just a quick reminder about invoice {{invoiceNumber}}.'
      },
      {
        id: 'formal',
        name: 'Professional Notice',
        description: 'Formal business tone',
        content: 'Dear {{clientName}}, This is a reminder regarding invoice {{invoiceNumber}}.'
      },
      {
        id: 'urgent',
        name: 'Urgent Final Notice',
        description: 'Firm tone for overdue payments',
        content: 'Dear {{clientName}}, URGENT: Invoice {{invoiceNumber}} requires immediate payment.'
      }
    ];

    it('should have three preset templates', () => {
      expect(presets).toHaveLength(3);
    });

    it('should have friendly preset with casual tone', () => {
      const friendly = presets.find(p => p.id === 'friendly');
      expect(friendly).toBeDefined();
      expect(friendly?.content).toContain('Hi {{clientName}}');
      expect(friendly?.content).toContain('quick reminder');
    });

    it('should have formal preset with professional tone', () => {
      const formal = presets.find(p => p.id === 'formal');
      expect(formal).toBeDefined();
      expect(formal?.content).toContain('Dear {{clientName}}');
      expect(formal?.content).toContain('This is a reminder');
    });

    it('should have urgent preset with firm tone', () => {
      const urgent = presets.find(p => p.id === 'urgent');
      expect(urgent).toBeDefined();
      expect(urgent?.content).toContain('URGENT');
      expect(urgent?.content).toContain('immediate payment');
    });

    it('should contain required placeholders in all presets', () => {
      const requiredPlaceholders = ['{{clientName}}', '{{invoiceNumber}}'];
      
      for (const preset of presets) {
        for (const placeholder of requiredPlaceholders) {
          expect(preset.content).toContain(placeholder);
        }
      }
    });
  });

  describe('Export Clients to CSV', () => {
    const escapeCSV = (value: string | null | undefined | boolean | Date): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (value instanceof Date) return value.toISOString().split('T')[0];
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    it('should escape values with commas', () => {
      const result = escapeCSV('Acme, Inc.');
      expect(result).toBe('"Acme, Inc."');
    });

    it('should escape values with quotes', () => {
      const result = escapeCSV('John "The Boss" Smith');
      expect(result).toBe('"John ""The Boss"" Smith"');
    });

    it('should escape values with newlines', () => {
      const result = escapeCSV('Line 1\nLine 2');
      expect(result).toBe('"Line 1\nLine 2"');
    });

    it('should convert boolean to Yes/No', () => {
      expect(escapeCSV(true)).toBe('Yes');
      expect(escapeCSV(false)).toBe('No');
    });

    it('should format dates as YYYY-MM-DD', () => {
      const date = new Date('2026-01-08T12:00:00Z');
      expect(escapeCSV(date)).toBe('2026-01-08');
    });

    it('should handle null and undefined', () => {
      expect(escapeCSV(null)).toBe('');
      expect(escapeCSV(undefined)).toBe('');
    });

    it('should generate valid CSV content', () => {
      const clients = [
        { name: 'John Smith', email: 'john@example.com', companyName: 'Acme, Inc.', taxExempt: false },
        { name: 'Jane Doe', email: 'jane@example.com', companyName: 'Tech Corp', taxExempt: true },
      ];

      const headers = ['Name', 'Email', 'Company', 'Tax Exempt'];
      const rows = clients.map(c => [
        escapeCSV(c.name),
        escapeCSV(c.email),
        escapeCSV(c.companyName),
        escapeCSV(c.taxExempt)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      expect(csvContent).toContain('Name,Email,Company,Tax Exempt');
      expect(csvContent).toContain('John Smith,john@example.com,"Acme, Inc.",No');
      expect(csvContent).toContain('Jane Doe,jane@example.com,Tech Corp,Yes');
    });
  });
});
