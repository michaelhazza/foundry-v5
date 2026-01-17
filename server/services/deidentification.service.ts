// PII detection patterns
const PII_PATTERNS = {
  // Email addresses
  emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // Phone numbers (various formats)
  phones: /(?:\+?1[-.\s]?)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,

  // Credit card numbers
  creditCards: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,

  // Social Security Numbers
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,

  // Common name patterns (simplified - names are hardest to detect)
  // This is a basic approach - production systems should use NER models
  names: null, // Will use a different approach

  // Addresses (simplified US format)
  addresses: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|circle|cir)\.?(?:\s*,?\s*(?:apt|apartment|suite|ste|unit|#)\.?\s*\d+)?(?:\s*,?\s*[\w\s]+,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)?/gi,
};

// Placeholder generators
function generatePlaceholder(type: string, index: number): string {
  const placeholders: Record<string, (i: number) => string> = {
    email: (i) => `[EMAIL_${i}]`,
    phone: (i) => `[PHONE_${i}]`,
    creditCard: (i) => `[CREDIT_CARD_${i}]`,
    ssn: (i) => `[SSN_${i}]`,
    name: (i) => `[NAME_${i}]`,
    address: (i) => `[ADDRESS_${i}]`,
    company: (i) => `[COMPANY_${i}]`,
    custom: (i) => `[CUSTOM_${i}]`,
  };

  return placeholders[type]?.(index) || `[PII_${index}]`;
}

export interface DeidentificationConfig {
  detectNames: boolean;
  detectEmails: boolean;
  detectPhones: boolean;
  detectAddresses: boolean;
  detectCompanies: boolean;
  detectCreditCards: boolean;
  detectSsn: boolean;
}

export interface CustomRule {
  name: string;
  pattern: string;
  replacement: string;
  isEnabled: boolean;
}

export interface EntityMapping {
  entityType: string;
  originalValue: string;
  replacementValue: string;
  occurrences: number;
}

export interface DeidentificationResult {
  text: string;
  stats: Record<string, number>;
  entityMappings: EntityMapping[];
}

export const deidentificationService = {
  /**
   * Deidentify text based on configuration
   */
  deidentify(
    text: string,
    config: DeidentificationConfig,
    customRules: CustomRule[] = [],
    existingMappings: Map<string, string> = new Map()
  ): DeidentificationResult {
    let processedText = text;
    const stats: Record<string, number> = {};
    const newMappings: EntityMapping[] = [];
    const counters: Record<string, number> = {};

    // Helper to get or create placeholder
    const getPlaceholder = (type: string, value: string): string => {
      const key = `${type}:${value}`;
      if (existingMappings.has(key)) {
        return existingMappings.get(key)!;
      }

      counters[type] = (counters[type] || 0) + 1;
      const placeholder = generatePlaceholder(type, counters[type]);
      existingMappings.set(key, placeholder);

      // Track for returning
      const existing = newMappings.find(
        (m) => m.entityType === type && m.originalValue === value
      );
      if (existing) {
        existing.occurrences++;
      } else {
        newMappings.push({
          entityType: type,
          originalValue: value,
          replacementValue: placeholder,
          occurrences: 1,
        });
      }

      return placeholder;
    };

    // Process emails
    if (config.detectEmails) {
      const matches = text.match(PII_PATTERNS.emails) || [];
      stats.emails = matches.length;
      processedText = processedText.replace(PII_PATTERNS.emails, (match) =>
        getPlaceholder('email', match)
      );
    }

    // Process phone numbers
    if (config.detectPhones) {
      const matches = text.match(PII_PATTERNS.phones) || [];
      stats.phones = matches.length;
      processedText = processedText.replace(PII_PATTERNS.phones, (match) =>
        getPlaceholder('phone', match)
      );
    }

    // Process credit cards
    if (config.detectCreditCards) {
      const matches = text.match(PII_PATTERNS.creditCards) || [];
      stats.creditCards = matches.length;
      processedText = processedText.replace(PII_PATTERNS.creditCards, (match) =>
        getPlaceholder('creditCard', match)
      );
    }

    // Process SSNs
    if (config.detectSsn) {
      const matches = text.match(PII_PATTERNS.ssn) || [];
      stats.ssn = matches.length;
      processedText = processedText.replace(PII_PATTERNS.ssn, (match) =>
        getPlaceholder('ssn', match)
      );
    }

    // Process addresses
    if (config.detectAddresses) {
      const matches = text.match(PII_PATTERNS.addresses) || [];
      stats.addresses = matches.length;
      processedText = processedText.replace(PII_PATTERNS.addresses, (match) =>
        getPlaceholder('address', match.trim())
      );
    }

    // Process custom rules
    let customRuleCount = 0;
    for (const rule of customRules) {
      if (!rule.isEnabled) continue;

      try {
        const regex = new RegExp(rule.pattern, 'gi');
        const matches = processedText.match(regex) || [];
        customRuleCount += matches.length;
        processedText = processedText.replace(regex, rule.replacement);
      } catch {
        // Invalid regex, skip
      }
    }
    if (customRuleCount > 0) {
      stats.customRules = customRuleCount;
    }

    return {
      text: processedText,
      stats,
      entityMappings: newMappings,
    };
  },

  /**
   * Preview deidentification on sample text
   */
  preview(
    sampleText: string,
    config: DeidentificationConfig,
    customRules: CustomRule[] = []
  ): { original: string; deidentified: string; stats: Record<string, number> } {
    const result = this.deidentify(sampleText, config, customRules);
    return {
      original: sampleText,
      deidentified: result.text,
      stats: result.stats,
    };
  },
};
