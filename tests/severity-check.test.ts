// =============================================================================
// MaaSwara — Severity Check Tests
// Tests for the deterministic safety net (Flag #1)
// =============================================================================

import { describe, it, expect } from 'vitest';
import { forceSeverityCheck, shouldOverride } from '@/lib/triage/severity-check';

describe('forceSeverityCheck', () => {
  // =========================================================================
  // RED keyword detection — English
  // =========================================================================
  describe('English RED keywords', () => {
    it('detects "bleeding" and returns RED', () => {
      const result = forceSeverityCheck('I have been bleeding since morning');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
      expect(result!.matched_keywords).toContain('bleeding');
    });

    it('detects "convulsion" and returns RED', () => {
      const result = forceSeverityCheck('My sister had a convulsion');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });

    it('detects "can\'t breathe" and returns RED', () => {
      const result = forceSeverityCheck("I can't breathe properly");
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });

    it('detects "water broke" and returns RED', () => {
      const result = forceSeverityCheck('My water broke early');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });

    it('detects "blurred vision" and returns RED', () => {
      const result = forceSeverityCheck('I have blurred vision and headache');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });

    it('detects "baby not moving" and returns RED', () => {
      const result = forceSeverityCheck('My baby not moving today');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });

    it('detects "severe pain" and returns RED', () => {
      const result = forceSeverityCheck('I have severe pain in my abdomen');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });
  });

  // =========================================================================
  // RED keyword detection — Hindi
  // =========================================================================
  describe('Hindi RED keywords', () => {
    it('detects "खून" (blood) and returns RED', () => {
      const result = forceSeverityCheck('मुझे खून आ रहा है');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
      expect(result!.source_language).toBe('hi');
    });

    it('detects "दौरा" (seizure) and returns RED', () => {
      const result = forceSeverityCheck('मुझे दौरा पड़ा');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });

    it('detects "सांस नहीं" (can\'t breathe) and returns RED', () => {
      const result = forceSeverityCheck('सांस नहीं आ रही');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });

    it('detects "सिर दर्द" (headache) and returns RED', () => {
      const result = forceSeverityCheck('मेरे सिर दर्द बहुत तेज है');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });
  });

  // =========================================================================
  // RED keyword detection — Swahili
  // =========================================================================
  describe('Swahili RED keywords', () => {
    it('detects "damu" (blood) and returns RED', () => {
      const result = forceSeverityCheck('Ninatoka damu');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
      expect(result!.source_language).toBe('sw');
    });

    it('detects "kifafa" (seizure) and returns RED', () => {
      const result = forceSeverityCheck('Nina kifafa');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });
  });

  // =========================================================================
  // RED keyword detection — Yoruba
  // =========================================================================
  describe('Yoruba RED keywords', () => {
    it('detects "ẹjẹ" (blood) and returns RED', () => {
      const result = forceSeverityCheck('Mo ri ẹjẹ');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
      expect(result!.source_language).toBe('yo');
    });
  });

  // =========================================================================
  // RED keyword detection — Hausa
  // =========================================================================
  describe('Hausa RED keywords', () => {
    it('detects "jini" (blood) and returns RED', () => {
      const result = forceSeverityCheck('Ina ganin jini');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
      expect(result!.source_language).toBe('ha');
    });
  });

  // =========================================================================
  // RED keyword detection — Bhojpuri
  // =========================================================================
  describe('Bhojpuri RED keywords', () => {
    it('detects "खून" (blood) in Bhojpuri context and returns RED', () => {
      const result = forceSeverityCheck('हमरा खून आ रहल बा');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });
  });

  // =========================================================================
  // GREEN conversations — no keywords
  // =========================================================================
  describe('GREEN conversations (no danger keywords)', () => {
    it('returns null for normal pregnancy discomfort', () => {
      const result = forceSeverityCheck('I feel a little tired today');
      expect(result).toBeNull();
    });

    it('returns null for mild nausea', () => {
      const result = forceSeverityCheck('I have morning sickness');
      expect(result).toBeNull();
    });

    it('returns null for normal Hindi conversation', () => {
      const result = forceSeverityCheck('मुझे थोड़ी थकान हो रही है');
      expect(result).toBeNull();
    });

    it('returns null for greetings', () => {
      const result = forceSeverityCheck('Namaste, kaise hain aap?');
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // YELLOW keyword detection
  // =========================================================================
  describe('YELLOW keywords', () => {
    it('detects "swelling" and returns YELLOW', () => {
      const result = forceSeverityCheck('I have some swelling in my feet');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('YELLOW');
    });

    it('detects "vomiting" and returns YELLOW', () => {
      const result = forceSeverityCheck('I keep vomiting all day');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('YELLOW');
    });
  });

  // =========================================================================
  // Mixed-language transcripts
  // =========================================================================
  describe('Mixed-language transcripts', () => {
    it('detects RED keywords even in mixed-language text', () => {
      const transcript = 'Hello, mera sar bahut dard kar raha hai and I have been bleeding';
      const result = forceSeverityCheck(transcript);
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });
  });

  // =========================================================================
  // Case insensitivity
  // =========================================================================
  describe('Case insensitivity', () => {
    it('detects RED keywords regardless of case', () => {
      const result = forceSeverityCheck('I am BLEEDING heavily');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('RED');
    });
  });
});

// =============================================================================
// shouldOverride tests
// =============================================================================
describe('shouldOverride', () => {
  it('allows upgrading GREEN to RED', () => {
    expect(shouldOverride('GREEN', 'RED')).toBe(true);
  });

  it('allows upgrading GREEN to YELLOW', () => {
    expect(shouldOverride('GREEN', 'YELLOW')).toBe(true);
  });

  it('allows upgrading YELLOW to RED', () => {
    expect(shouldOverride('YELLOW', 'RED')).toBe(true);
  });

  it('does NOT downgrade RED to GREEN', () => {
    expect(shouldOverride('RED', 'GREEN')).toBe(false);
  });

  it('does NOT downgrade RED to YELLOW', () => {
    expect(shouldOverride('RED', 'YELLOW')).toBe(false);
  });

  it('does NOT downgrade YELLOW to GREEN', () => {
    expect(shouldOverride('YELLOW', 'GREEN')).toBe(false);
  });

  it('does NOT override same severity', () => {
    expect(shouldOverride('RED', 'RED')).toBe(false);
    expect(shouldOverride('GREEN', 'GREEN')).toBe(false);
  });
});
