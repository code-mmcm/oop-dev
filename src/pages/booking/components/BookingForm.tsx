import React, { useState, useEffect } from 'react';
import type { BookingFormData, BookingStep } from '../../../types/booking';
import StayDetailsStep from './StayDetailsStep';
import ClientInfoStep from './ClientInfoStep';
import AdditionalServicesStep from './AdditionalServicesStep';
import PaymentInfoStep from './PaymentInfoStep';
import ConfirmationStep from './ConfirmationStep';

interface BookingFormProps {
  listingId?: string;
  pricePerNight?: number;
  priceUnit?: string;
  extraGuestFeePerPerson?: number;
  baseGuests?: number;
  onCancel: () => void;
  onComplete: (formData: BookingFormData) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ listingId, pricePerNight, priceUnit, extraGuestFeePerPerson, baseGuests, onCancel, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Initial form data filled out with all commonly-referenced fields so child steps
  // can safely read/update them without TS/runtime issues.
  const [formData, setFormData] = useState<BookingFormData>({
    // Listing and Stay Details
    listingId: listingId,
    pricePerNight: pricePerNight,
    priceUnit: priceUnit,
    extraGuestFeePerPerson: extraGuestFeePerPerson,
    baseGuests: baseGuests,
    checkInDate: '',
    checkInTime: '12:00',
    checkOutDate: '',
    checkOutTime: '12:00',
    numberOfGuests: 1,
    extraGuests: 0,

    // Client Info
    firstName: '',
    lastName: '',
    email: '',
    nickname: '',
    dateOfBirth: '',
    referredBy: '',
    gender: 'male',
    preferredContactNumber: '',
    contactType: 'mobile',

    // Additional Services
    additionalServices: [],
    requestDescription: '',

    // Payment Info (include all fields used by PaymentInfoStep and others)
    paymentMethod: 'bank_transfer',
    cardNumber: '',
    nameOnCard: '',
    cvvCode: '',
    expirationDate: '',
    agreeToTerms: false,

    // Bank transfer fields
    bankName: '',
    bankAccountNumber: '',
    depositorName: '',
    bankReceiptUploaded: false,
    bankReceiptFileName: '',

    // Company / billing fields
    companyName: '',
    billingContact: '',
    billingEmail: '',
    poNumber: '',
    billingDocumentUploaded: false,
    billingDocumentFileName: '',

    // Cash payer fields
    cashPayerName: '',
    cashPayerContact: ''
  });

  const steps: BookingStep[] = [
    { id: 'stay-details', title: 'Stay Details', completed: false, active: true },
    { id: 'client-info', title: 'Client Info', completed: false, active: false },
    { id: 'additional-services', title: 'Additional Services', completed: false, active: false },
    { id: 'payment-info', title: 'Payment Info', completed: false, active: false },
    { id: 'confirmation', title: 'Confirmation', completed: false, active: false }
  ];

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Update formData when pricing props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      listingId,
      pricePerNight,
      priceUnit,
      extraGuestFeePerPerson,
      baseGuests
    }));
  }, [listingId, pricePerNight, priceUnit, extraGuestFeePerPerson, baseGuests]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete(formData);
  };

  const getCurrentStepComponent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StayDetailsStep
            formData={formData}
            listingId={listingId}
            onUpdate={updateFormData}
            onNext={nextStep}
            onCancel={onCancel}
          />
        );
      case 1:
        return (
          <ClientInfoStep
            formData={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
            onCancel={onCancel}
          />
        );
      case 2:
        return (
          <AdditionalServicesStep
            formData={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
            onCancel={onCancel}
          />
        );
      case 3:
        return (
          <PaymentInfoStep
            formData={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
            onCancel={onCancel}
          />
        );
      case 4:
        return (
          <ConfirmationStep
            formData={formData}
            onConfirm={handleComplete}
            onBack={prevStep}
            onCancel={onCancel}
          />
        );
      default:
        return null;
    }
  };

  const getUpdatedSteps = (): BookingStep[] => {
    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStep,
      active: index === currentStep
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 pb-8 min-h-[calc(100vh-5rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0B5858] mb-6" style={{ fontFamily: 'Poppins' }}>
              Booking Information Form
            </h1>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
                {getUpdatedSteps().map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed
                            ? 'bg-[#0B5858] text-white'
                            : step.active
                            ? 'bg-white border-2 border-[#0B5858] text-[#0B5858]'
                            : 'bg-gray-300 text-white'
                        }`}
                      >
                        {step.completed ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : step.active ? (
                          <div className="w-2 h-2 rounded-full bg-[#0B5858]" />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-xs mt-2 ${step.active ? 'text-[#0B5858] font-medium' : 'text-gray-500'}`}
                        style={{ fontFamily: 'Poppins' }}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 ${step.completed ? 'bg-[#0B5858]' : 'bg-gray-300'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-6">{getCurrentStepComponent()}</div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;