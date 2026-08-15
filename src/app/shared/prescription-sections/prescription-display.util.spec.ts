import { IPrescriptionDocument, blankPrescriptionContent } from '@core/interfaces/prescriptions/prescription.interface';
import { formatPatientInfoBlock } from './prescription-display.util';

function makeDoc(overrides: Partial<IPrescriptionDocument['patient']> = {}): IPrescriptionDocument {
  return {
    prescriptionId: 1,
    displayCode: 'RX-2026-0001',
    consultationId: 1,
    status: 'Draft',
    language: 'En',
    savedAt: null,
    finalizedAt: null,
    content: blankPrescriptionContent(),
    patient: {
      patientId: 1,
      name: 'Rahim Uddin',
      phone: '01700000000',
      dateOfBirth: null,
      age: null,
      gender: 'Male',
      bloodGroup: 'APositive',
      allergyPresetId: null,
      allergyOtherText: null,
      savedHistory: null,
      ...overrides,
    },
    doctor: {
      doctorId: 1,
      fullName: 'Dr. Sabrina',
      qualification: null,
      department: null,
      licenseNumber: null,
      signatureUrl: null,
      preferredTemplateId: null,
    },
    templateId: 1,
    templateType: 'Classic',
    templateConfig: {} as any,
    hospitalSettings: {} as any,
  };
}

describe('formatPatientInfoBlock', () => {
  it('formats age from a provided plain age when no DOB is present', () => {
    const result = formatPatientInfoBlock(makeDoc({ age: 34 }));
    expect(result.age).toBe('34y');
  });

  it('formats blood group into a short symbol', () => {
    const result = formatPatientInfoBlock(makeDoc({ bloodGroup: 'ONegative' }));
    expect(result.bloodGroup).toBe('O-');
  });

  it('resolves a known allergy preset id to its label', () => {
    const result = formatPatientInfoBlock(makeDoc({ allergyPresetId: 2 }));
    expect(result.allergies).toBe('Penicillin');
  });

  it('falls back to the free-text allergy when no preset id is set', () => {
    const result = formatPatientInfoBlock(makeDoc({ allergyPresetId: null, allergyOtherText: 'Sulfa drugs' }));
    expect(result.allergies).toBe('Sulfa drugs');
  });

  it('defaults allergies to None when neither preset nor free text is present', () => {
    const result = formatPatientInfoBlock(makeDoc({ allergyPresetId: null, allergyOtherText: null }));
    expect(result.allergies).toBe('None');
  });

  it('uses the prescription display code as the Rx number', () => {
    const result = formatPatientInfoBlock(makeDoc());
    expect(result.rxNo).toBe('RX-2026-0001');
  });

  describe('Bangla language (US-067/068/069)', () => {
    it('renders age in Bangla numerals', () => {
      const result = formatPatientInfoBlock(makeDoc({ age: 34 }), 'bn');
      expect(result.age).toBe('৩৪y');
    });

    it('renders the date in Bangla numerals', () => {
      const result = formatPatientInfoBlock(makeDoc(), 'bn');
      expect(result.date).not.toMatch(/[0-9]/);
    });

    it('localizes gender to Bangla', () => {
      const result = formatPatientInfoBlock(makeDoc({ gender: 'Male' }), 'bn');
      expect(result.sex).toBe('পুরুষ');
    });

    it('resolves a known allergy preset id to its Bangla label', () => {
      const result = formatPatientInfoBlock(makeDoc({ allergyPresetId: 2 }), 'bn');
      expect(result.allergies).toBe('পেনিসিলিন');
    });

    it('never converts identifiers like rxNo or leaves free-text allergy untranslated', () => {
      const result = formatPatientInfoBlock(makeDoc({ allergyPresetId: null, allergyOtherText: 'Sulfa drugs' }), 'bn');
      expect(result.rxNo).toBe('RX-2026-0001');
      expect(result.allergies).toBe('Sulfa drugs');
    });

    it('defaults to English display when no language is passed', () => {
      const result = formatPatientInfoBlock(makeDoc({ age: 34, gender: 'Male' }));
      expect(result.age).toBe('34y');
      expect(result.sex).toBe('Male');
    });
  });
});
