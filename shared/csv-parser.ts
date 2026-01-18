/**
 * CSV Parser Utility for Client Import
 * Handles parsing CSV files with validation and error reporting
 */

export interface ParsedClient {
  name: string;
  email?: string;
  companyName?: string;
  address?: string;
  phone?: string;
  notes?: string;
  vatNumber?: string;
}

export interface ParseError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ParseResult {
  success: boolean;
  clients: ParsedClient[];
  errors: ParseError[];
  totalRows: number;
  validRows: number;
  duplicates: string[]; // Email addresses that appear multiple times
}

// Required and optional column mappings
const COLUMN_MAPPINGS: Record<string, keyof ParsedClient> = {
  name: "name",
  "client name": "name",
  client_name: "name",
  "contact name": "name",
  contact_name: "name",
  email: "email",
  "email address": "email",
  email_address: "email",
  company: "companyName",
  "company name": "companyName",
  company_name: "companyName",
  organization: "companyName",
  address: "address",
  "street address": "address",
  street_address: "address",
  "full address": "address",
  phone: "phone",
  "phone number": "phone",
  phone_number: "phone",
  telephone: "phone",
  mobile: "phone",
  notes: "notes",
  note: "notes",
  comments: "notes",
  vat: "vatNumber",
  "vat number": "vatNumber",
  vat_number: "vatNumber",
  "tax id": "vatNumber",
  tax_id: "vatNumber",
};

/**
 * Parse a CSV string into an array of client objects
 */
export function parseCSV(csvContent: string): ParseResult {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

  if (lines.length === 0) {
    return {
      success: false,
      clients: [],
      errors: [{ row: 0, field: "file", message: "CSV file is empty" }],
      totalRows: 0,
      validRows: 0,
      duplicates: [],
    };
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());

  // Map headers to client fields
  const columnMap: Map<number, keyof ParsedClient> = new Map();
  let hasNameColumn = false;

  headers.forEach((header, index) => {
    const mappedField = COLUMN_MAPPINGS[header];
    if (mappedField) {
      columnMap.set(index, mappedField);
      if (mappedField === "name") {
        hasNameColumn = true;
      }
    }
  });

  if (!hasNameColumn) {
    return {
      success: false,
      clients: [],
      errors: [
        {
          row: 1,
          field: "header",
          message:
            'Missing required "name" column. Expected column headers: name, email, company, address, phone, notes, vat number',
        },
      ],
      totalRows: lines.length - 1,
      validRows: 0,
      duplicates: [],
    };
  }

  const clients: ParsedClient[] = [];
  const errors: ParseError[] = [];
  const seenEmails = new Map<string, number>(); // email -> first row number
  const duplicates: string[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const client: ParsedClient = { name: "" };
    let hasError = false;

    // Map values to client fields
    columnMap.forEach((field, index) => {
      const value = values[index]?.trim() || "";
      if (value) {
        (client as any)[field] = value;
      }
    });

    // Validate required fields
    if (!client.name) {
      errors.push({
        row: i + 1,
        field: "name",
        message: "Name is required",
      });
      hasError = true;
    }

    // Validate email format if provided
    if (client.email && !isValidEmail(client.email)) {
      errors.push({
        row: i + 1,
        field: "email",
        message: "Invalid email format",
        value: client.email,
      });
      hasError = true;
    }

    // Check for duplicate emails
    if (client.email) {
      const normalizedEmail = client.email.toLowerCase();
      if (seenEmails.has(normalizedEmail)) {
        duplicates.push(client.email);
        errors.push({
          row: i + 1,
          field: "email",
          message: `Duplicate email (first seen in row ${seenEmails.get(normalizedEmail)})`,
          value: client.email,
        });
      } else {
        seenEmails.set(normalizedEmail, i + 1);
      }
    }

    // Validate phone format if provided (basic validation)
    if (client.phone && !isValidPhone(client.phone)) {
      errors.push({
        row: i + 1,
        field: "phone",
        message: "Invalid phone format",
        value: client.phone,
      });
      // Phone errors are warnings, not blocking
    }

    // Validate VAT number format if provided
    if (client.vatNumber && !isValidVATFormat(client.vatNumber)) {
      errors.push({
        row: i + 1,
        field: "vatNumber",
        message: "Invalid VAT number format (expected format: XX123456789)",
        value: client.vatNumber,
      });
      // VAT errors are warnings, not blocking
    }

    if (!hasError) {
      clients.push(client);
    }
  }

  return {
    success:
      errors.filter(e => e.field === "name" || e.field === "email").length ===
      0,
    clients,
    errors,
    totalRows: lines.length - 1,
    validRows: clients.length,
    duplicates: Array.from(new Set(duplicates)),
  };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Basic phone validation (allows various formats)
 */
function isValidPhone(phone: string): boolean {
  // Allow digits, spaces, dashes, parentheses, and plus sign
  const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
  // Must have at least 7 digits
  const digitsOnly = phone.replace(/\D/g, "");
  return phoneRegex.test(phone) && digitsOnly.length >= 7;
}

/**
 * Basic VAT number format validation
 */
function isValidVATFormat(vat: string): boolean {
  // EU VAT format: 2 letters followed by 8-12 characters (letters/digits)
  const vatRegex = /^[A-Z]{2}[A-Z0-9]{8,12}$/i;
  return vatRegex.test(vat.replace(/\s/g, ""));
}

/**
 * Generate a sample CSV template
 */
export function generateSampleCSV(): string {
  const headers = [
    "Name",
    "Email",
    "Company Name",
    "Address",
    "Phone",
    "Notes",
    "VAT Number",
  ];
  const sampleRows = [
    [
      "John Smith",
      "john@example.com",
      "Acme Corp",
      "123 Main St, New York, NY 10001",
      "+1 (555) 123-4567",
      "VIP client",
      "",
    ],
    [
      "Jane Doe",
      "jane@company.com",
      "Tech Solutions Ltd",
      "456 Oak Ave, San Francisco, CA 94102",
      "555-987-6543",
      "Monthly retainer",
      "DE123456789",
    ],
    [
      "Bob Wilson",
      "bob@startup.io",
      "Startup Inc",
      "789 Pine Rd, Austin, TX 78701",
      "",
      "New client",
      "",
    ],
  ];

  const csvLines = [
    headers.join(","),
    ...sampleRows.map(row =>
      row
        .map(cell =>
          cell.includes(",") || cell.includes('"')
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        )
        .join(",")
    ),
  ];

  return csvLines.join("\n");
}

/**
 * Convert parsed clients to CSV for download
 */
export function clientsToCSV(clients: ParsedClient[]): string {
  const headers = [
    "Name",
    "Email",
    "Company Name",
    "Address",
    "Phone",
    "Notes",
    "VAT Number",
  ];

  const rows = clients.map(client =>
    [
      client.name,
      client.email || "",
      client.companyName || "",
      client.address || "",
      client.phone || "",
      client.notes || "",
      client.vatNumber || "",
    ]
      .map(cell =>
        cell.includes(",") || cell.includes('"') || cell.includes("\n")
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      )
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
