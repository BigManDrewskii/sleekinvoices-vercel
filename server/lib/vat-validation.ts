/**
 * VIES VAT Validation Utility
 * Validates EU VAT numbers using the European Commission's VIES service
 *
 * VIES (VAT Information Exchange System) is the official EU service for
 * validating VAT registration numbers across member states.
 *
 * API Documentation: https://ec.europa.eu/taxation_customs/vies/
 */

// EU country codes that use VIES
const EU_COUNTRY_CODES = [
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "CY", // Cyprus
  "CZ", // Czech Republic
  "DE", // Germany
  "DK", // Denmark
  "EE", // Estonia
  "EL", // Greece (uses EL, not GR)
  "ES", // Spain
  "FI", // Finland
  "FR", // France
  "HR", // Croatia
  "HU", // Hungary
  "IE", // Ireland
  "IT", // Italy
  "LT", // Lithuania
  "LU", // Luxembourg
  "LV", // Latvia
  "MT", // Malta
  "NL", // Netherlands
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SE", // Sweden
  "SI", // Slovenia
  "SK", // Slovakia
] as const;

export type EUCountryCode = (typeof EU_COUNTRY_CODES)[number];

export interface VATValidationResult {
  valid: boolean;
  countryCode?: string;
  vatNumber?: string;
  name?: string;
  address?: string;
  requestDate?: string;
  errorMessage?: string;
}

/**
 * Parse a VAT number into country code and number parts
 */
function parseVATNumber(
  vatNumber: string
): { countryCode: string; number: string } | null {
  // Remove spaces and convert to uppercase
  const cleaned = vatNumber.replace(/\s/g, "").toUpperCase();

  // VAT number must be at least 3 characters (2 letter country code + 1 digit)
  if (cleaned.length < 3) {
    return null;
  }

  // Extract country code (first 2 characters)
  const countryCode = cleaned.substring(0, 2);
  const number = cleaned.substring(2);

  // Greece uses EL in VIES but sometimes GR is used
  const normalizedCountryCode = countryCode === "GR" ? "EL" : countryCode;

  // Validate country code is in EU
  if (!EU_COUNTRY_CODES.includes(normalizedCountryCode as EUCountryCode)) {
    return null;
  }

  return { countryCode: normalizedCountryCode, number };
}

/**
 * Validate a VAT number using the VIES REST API
 *
 * @param vatNumber - Full VAT number including country code (e.g., "DE123456789")
 * @returns Validation result with company details if valid
 */
export async function validateVATNumber(
  vatNumber: string
): Promise<VATValidationResult> {
  // Parse the VAT number
  const parsed = parseVATNumber(vatNumber);

  if (!parsed) {
    return {
      valid: false,
      errorMessage:
        "Invalid VAT number format. Must start with a valid EU country code.",
    };
  }

  const { countryCode, number } = parsed;

  try {
    // Use the VIES REST API (JSON endpoint)
    const url = `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${number}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle specific HTTP errors
      if (response.status === 400) {
        return {
          valid: false,
          countryCode,
          vatNumber: number,
          errorMessage: "Invalid VAT number format for this country.",
        };
      }

      if (response.status === 404) {
        return {
          valid: false,
          countryCode,
          vatNumber: number,
          errorMessage: "VAT number not found in VIES database.",
        };
      }

      return {
        valid: false,
        countryCode,
        vatNumber: number,
        errorMessage: `VIES service error: ${response.status}`,
      };
    }

    const data = await response.json();

    // VIES REST API response structure
    // { isValid: boolean, requestDate: string, userError?: string, name?: string, address?: string }

    if (data.isValid) {
      return {
        valid: true,
        countryCode,
        vatNumber: number,
        name: data.name || undefined,
        address: data.address || undefined,
        requestDate: data.requestDate,
      };
    } else {
      return {
        valid: false,
        countryCode,
        vatNumber: number,
        errorMessage: data.userError || "VAT number is not valid.",
        requestDate: data.requestDate,
      };
    }
  } catch (error) {
    // Handle network errors and timeouts
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          valid: false,
          countryCode,
          vatNumber: number,
          errorMessage: "VIES service timeout. Please try again later.",
        };
      }

      return {
        valid: false,
        countryCode,
        vatNumber: number,
        errorMessage: `Network error: ${error.message}`,
      };
    }

    return {
      valid: false,
      countryCode,
      vatNumber: number,
      errorMessage: "Unknown error occurred during validation.",
    };
  }
}

/**
 * Check if a VAT number format is potentially valid (basic format check)
 * This is a quick client-side check before calling the VIES API
 */
export function isValidVATFormat(vatNumber: string): boolean {
  const parsed = parseVATNumber(vatNumber);
  if (!parsed) return false;

  // Basic length check (most VAT numbers are 8-12 characters after country code)
  if (parsed.number.length < 2 || parsed.number.length > 15) {
    return false;
  }

  // Country-specific format validation
  const formatPatterns: Record<string, RegExp> = {
    AT: /^U\d{8}$/, // Austria: U + 8 digits
    BE: /^0?\d{9,10}$/, // Belgium: 9-10 digits (optional leading 0)
    BG: /^\d{9,10}$/, // Bulgaria: 9-10 digits
    CY: /^\d{8}[A-Z]$/, // Cyprus: 8 digits + letter
    CZ: /^\d{8,10}$/, // Czech: 8-10 digits
    DE: /^\d{9}$/, // Germany: 9 digits
    DK: /^\d{8}$/, // Denmark: 8 digits
    EE: /^\d{9}$/, // Estonia: 9 digits
    EL: /^\d{9}$/, // Greece: 9 digits
    ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/, // Spain: letter/digit + 7 digits + letter/digit
    FI: /^\d{8}$/, // Finland: 8 digits
    FR: /^[A-Z0-9]{2}\d{9}$/, // France: 2 chars + 9 digits
    HR: /^\d{11}$/, // Croatia: 11 digits
    HU: /^\d{8}$/, // Hungary: 8 digits
    IE: /^\d[A-Z0-9+*]\d{5}[A-Z]$|^\d{7}[A-Z]{1,2}$/, // Ireland: various formats
    IT: /^\d{11}$/, // Italy: 11 digits
    LT: /^\d{9}$|^\d{12}$/, // Lithuania: 9 or 12 digits
    LU: /^\d{8}$/, // Luxembourg: 8 digits
    LV: /^\d{11}$/, // Latvia: 11 digits
    MT: /^\d{8}$/, // Malta: 8 digits
    NL: /^\d{9}B\d{2}$/, // Netherlands: 9 digits + B + 2 digits
    PL: /^\d{10}$/, // Poland: 10 digits
    PT: /^\d{9}$/, // Portugal: 9 digits
    RO: /^\d{2,10}$/, // Romania: 2-10 digits
    SE: /^\d{12}$/, // Sweden: 12 digits
    SI: /^\d{8}$/, // Slovenia: 8 digits
    SK: /^\d{10}$/, // Slovakia: 10 digits
  };

  const pattern = formatPatterns[parsed.countryCode];
  if (pattern && !pattern.test(parsed.number)) {
    return false;
  }

  return true;
}

/**
 * Get the list of supported EU country codes
 */
export function getSupportedCountryCodes(): readonly string[] {
  return EU_COUNTRY_CODES;
}
