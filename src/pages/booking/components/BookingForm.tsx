import React, { useEffect, useRef, useState } from 'react';
import type { BookingFormData, BookingStep } from '../../../types/booking';
import StayDetailsStep from './StayDetailsStep';
import ClientInfoStep from './ClientInfoStep';
import AdditionalServicesStep from './AdditionalServicesStep';
import PaymentInfoStep from './PaymentInfoStep';
import ConfirmationStep from './ConfirmationStep';

interface BookingFormProps {
  onCancel: () => void;
  onComplete: (formData: BookingFormData) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onCancel, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Initial form data filled out with all commonly-referenced fields so child steps
  // can safely read/update them without TS/runtime issues.
  const [formData, setFormData] = useState<BookingFormData>({
    // Stay Details
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
          />
        );
      case 2:
        return (
          <AdditionalServicesStep
            formData={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
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

  // refs for scrolling/centering
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  // center active step when it changes (smooth)
  useEffect(() => {
    const container = containerRef.current;
    const activeEl = stepRefs.current[currentStep];
    if (!container || !activeEl) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const currentScrollLeft = container.scrollLeft;
    const offset = activeRect.left - containerRect.left;
    const target = currentScrollLeft + offset - (containerRect.width / 2) + (activeRect.width / 2);

    const maxScroll = container.scrollWidth - container.clientWidth;
    const clamped = Math.max(0, Math.min(maxScroll, target));
    container.scrollTo({ left: clamped, behavior: 'smooth' });
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 pb-8 min-h-[calc(100vh-5rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5 sm:mb-8 md:mb-4 pl-4 sm:pl-6 lg:pl-8">
            <h1
              // Increased default (mobile) size to make header more readable on phones.
              // Desktop sizes unchanged (sm: and md: keep previous proportions).
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B5858] mb-6"
              style={{ fontFamily: 'Poppins' }}
            >
              Booking Information Form
            </h1>

            {/* Stepper */}
            <div className="relative">
              <style>{`
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }

                /* transition styles */
                .step-circle { transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease; }
                .step-circle-active { transform: scale(1.12); } /* subtle scale on active */
                .connector { transition: background-color 160ms ease; }
              `}</style>

              <div
                ref={containerRef}
                className="hide-scrollbar overflow-x-auto scroll-smooth"
              >
                <div className="flex items-center gap-3 sm:gap-6 w-full min-w-0">
                  {getUpdatedSteps().map((step, index) => (
                    <React.Fragment key={step.id}>
                      <div
                        ref={el => { stepRefs.current[index] = el; }}
                        className="flex-shrink-0 w-1/3 sm:flex-1 sm:w-1/5 min-w-[72px] sm:min-w-0"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`step-circle rounded-full flex items-center justify-center ${
                              step.completed
                                ? 'bg-[#0B5858] text-white'
                                : step.active
                                ? 'bg-white border-2 border-[#0B5858] text-[#0B5858]'
                                : 'bg-white border-2 border-gray-300 text-gray-500'
                            } ${step.active ? 'step-circle-active' : ''} w-8 h-8 sm:w-9 sm:h-9`}
                            aria-hidden
                          >
                            {step.completed ? (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : step.active ? (
                              <div className="w-3.5 h-3.5 sm:w-3 sm:h-3 rounded-full bg-[#0B5858]" />
                            ) : (
                              // inactive: keep circle only (no number)
                              <div className="w-2.5 h-2.5 sm:w-2.5 sm:h-2.5 rounded-full bg-transparent" />
                            )}
                          </div>

                          {/* Labels:
                              - Mobile (sm:hidden): stacked words, tighter spacing
                              - Desktop (shown on sm+): single-line label with added top margin to separate from circle
                           */}
                          <div className="mt-1 sm:mt-3 text-[12px] sm:text-[13px] text-center" style={{ fontFamily: 'Poppins', lineHeight: 1 }}>
                            {/* mobile stacked words */}
                            <div className="sm:hidden">
                              {step.title.split(' ').map((word, wi) => (
                                <span
                                  key={wi}
                                  className={`${step.active ? 'text-[#0B5858] font-medium' : 'text-gray-500'} block`}
                                >
                                  {word}
                                </span>
                              ))}
                            </div>

                            {/* desktop single line */}
                            <div className="hidden sm:block">
                              <span className={`${step.active ? 'text-[#0B5858] font-medium' : 'text-gray-500'}`}>
                                {step.title}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* connector: visible on all breakpoints, thickness adjusts by breakpoint */}
                      {index < steps.length - 1 && (
                        <div
                          className={`connector flex-shrink flex-grow h-1 sm:h-[2px] min-w-[12px] ${index < currentStep ? 'bg-[#0B5858]' : 'bg-gray-300'}`}
                          aria-hidden
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
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