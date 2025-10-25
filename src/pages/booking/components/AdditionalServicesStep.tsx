import React, { useEffect, useMemo, } from 'react';
import type { BookingFormData, AdditionalService } from '../../../types/booking';

interface AdditionalServicesStepProps {
  formData: BookingFormData;
  onUpdate: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const AdditionalServicesStep: React.FC<AdditionalServicesStepProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack,
  onCancel
}) => {
  // Default services: quantity now defaults to 0
  const defaultServices: AdditionalService[] = [
    { id: '1', name: 'Towel', quantity: 0, charge: 100.0 },
    { id: '2', name: 'Pillow', quantity: 0, charge: 0.0 },
    { id: '3', name: 'Blanket', quantity: 0, charge: 0.0 }
  ];

  const availableCatalog: Array<Pick<AdditionalService, 'name' | 'charge'>> = [
    { name: 'Extra Towel', charge: 50.0 },
    { name: 'Airport Transfer', charge: 500.0 },
    { name: 'Breakfast (per pax)', charge: 150.0 },
    { name: 'Cleaning Service', charge: 300.0 },
    { name: 'Baby Crib', charge: 250.0 }
  ];

  // refs / state
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const modalInnerRef = React.useRef<HTMLDivElement | null>(null); // scrollable catalog area
  const [showServicesModal, setShowServicesModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const services = Array.isArray(formData.additionalServices) ? formData.additionalServices : [];

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });

  const calculateTotal = useMemo(() => {
    return services.reduce((total, service) => total + service.quantity * service.charge, 0);
  }, [services]);

  // initialize defaults once
  useEffect(() => {
    if (!Array.isArray(formData.additionalServices) || formData.additionalServices.length === 0) {
      onUpdate({ additionalServices: defaultServices });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // focus search when opened + escape to close
  useEffect(() => {
    if (showServicesModal) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowServicesModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showServicesModal]);

  // lock body scroll while modal open (prevent background scrolling & layout shift)
  useEffect(() => {
    if (!showServicesModal) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [showServicesModal]);

  // Prevent background scroll when modal is open:
  // - Add document-level handlers to block wheel/touchmove events that start outside the modalInnerRef
  // - Use overscroll-behavior on the modal scroll container (via inline style) to prevent scroll chaining
  useEffect(() => {
    if (!showServicesModal) return;

    const onDocWheel = (e: WheelEvent) => {
      const target = e.target as Node;
      if (modalInnerRef.current && modalInnerRef.current.contains(target)) {
        // allow scrolling inside modalInnerRef
        return;
      }
      // block page scroll for wheel events that started outside the modal scroll area
      e.preventDefault();
    };

    const onDocTouchMove = (e: TouchEvent) => {
      const target = e.target as Node;
      if (modalInnerRef.current && modalInnerRef.current.contains(target)) {
        // allow touch move inside modalInnerRef
        return;
      }
      // block page scroll for touchmove events outside the modal scroll area
      e.preventDefault();
    };

    // non-passive listeners so we can preventDefault
    document.addEventListener('wheel', onDocWheel, { passive: false });
    document.addEventListener('touchmove', onDocTouchMove, { passive: false });

    return () => {
      document.removeEventListener('wheel', onDocWheel);
      document.removeEventListener('touchmove', onDocTouchMove);
    };
  }, [showServicesModal]);

  // update helpers
  const updateServices = (updatedServices: AdditionalService[]) => onUpdate({ additionalServices: updatedServices });

  const handleServiceQuantityChange = (serviceId: string, quantity: number) => {
    const updatedServices = services.map(s => (s.id === serviceId ? { ...s, quantity } : s));
    updateServices(updatedServices);
  };

  const handleRemoveService = (serviceId: string) => {
    const updatedServices = services.filter(s => s.id !== serviceId);
    updateServices(updatedServices);
  };

  const MAX_REQUEST_CHARS = 150;

  const countChars = (text?: string) => {
    if (!text) return 0;
    return String(text).length;
  };

  // limit to MAX_REQUEST_CHARS characters (preserve original characters up to the limit)
  const limitToChars = (text: string, maxChars: number) => {
    if (!text) return text;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars);
  };

  const handleRequestDescriptionChange = (description: string) => {
    const limited = limitToChars(description, MAX_REQUEST_CHARS);
    onUpdate({ requestDescription: limited });
  };

  const addServiceFromCatalog = (item: { name: string; charge: number }, quantity = 1) => {
    const existingIndex = services.findIndex(s => s.name === item.name);
    let updated: AdditionalService[];
    if (existingIndex >= 0) {
      updated = services.map((s, idx) => (idx === existingIndex ? { ...s, quantity: s.quantity + quantity } : s));
    } else {
      const newService: AdditionalService = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        name: item.name,
        quantity,
        charge: item.charge
      };
      updated = [...services, newService];
    }
    updateServices(updated);
  };

  const filteredCatalog = availableCatalog.filter(c =>
    c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // derived char count for UI
  const requestCharCount = countChars(formData.requestDescription);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-[#0B5858] mb-1">Additional Services</h2>
      <p className="text-sm text-gray-500 mb-6">Please fill in your additional services to continue</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Services Table */}
        <div>
          <div className="space-y-4 pr-8">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2" style={{ fontFamily: 'Poppins' }}>
              <div>Add-ons Items</div>
              <div className="text-center">Quantity</div>
              <div className="text-right pr-6">Subtotal</div>
            </div>

            {/* Services */}
            {services.map((service) => {
              const subtotal = service.quantity * service.charge;
              return (
                <div key={service.id} className="grid grid-cols-3 gap-4 items-center py-3 px-2 rounded-md hover:bg-gray-50 transition" style={{ fontFamily: 'Poppins' }}>
                  <div className="text-gray-800 font-medium">{service.name}</div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      aria-label={`Decrease ${service.name}`}
                      onClick={() => handleServiceQuantityChange(service.id, Math.max(0, service.quantity - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                      −
                    </button>

                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      value={String(service.quantity)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const qty = digits === '' ? 0 : Math.max(0, parseInt(digits, 10));
                        handleServiceQuantityChange(service.id, qty);
                      }}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                      aria-label={`${service.name} quantity`}
                    />

                    <button
                      type="button"
                      aria-label={`Increase ${service.name}`}
                      onClick={() => handleServiceQuantityChange(service.id, service.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 pr-6">
                    <div className="text-sm text-gray-800 font-medium">{formatCurrency(subtotal)}</div>
                    {service.id !== '1' && service.id !== '2' && service.id !== '3' && (
                      <button onClick={() => handleRemoveService(service.id)} className="text-red-500 hover:text-red-700 ml-2" aria-label={`Remove ${service.name}`} title="Remove service">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div>
              <button
                onClick={() => setShowServicesModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0B5858] text-white rounded-md text-sm hover:bg-[#094b4b]"
                style={{ fontFamily: 'Poppins' }}
              >
                <svg className="w-4 h-4 mr-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Browse catalog
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>Total</span>
              <span className="font-bold text-lg text-gray-800" style={{ fontFamily: 'Poppins' }}>{formatCurrency(calculateTotal)}</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Request Description */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins' }}>Request Description</h3>

          <textarea
            value={formData.requestDescription || ''}
            onChange={(e) => handleRequestDescriptionChange(e.target.value)}
            placeholder="Type here..."
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858] focus:border-transparent resize-none"
            style={{ fontFamily: 'Poppins' }}
            aria-describedby="request-char-count"
          />

          <div id="request-char-count" className="mt-2 text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
            {requestCharCount} / {MAX_REQUEST_CHARS} characters
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button onClick={onCancel} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Poppins' }}>Cancel</button>
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Poppins' }}>Back</button>
        <button onClick={onNext} className="px-6 py-2 bg-[#0B5858] text-white rounded-lg hover:bg-[#0a4a4a] transition-colors" style={{ fontFamily: 'Poppins' }}>Next</button>
      </div>

      {/* Modal / Popout for available services */}
      {showServicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Available services">
          {/* overlay - prevent touch/wheel on overlay itself to stop background scroll */}
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setShowServicesModal(false)}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            aria-hidden
          />

          {/* modal panel */}
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold" style={{ fontFamily: 'Poppins' }}>Available Services</h4>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>Choose items to add to the booking.</p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => window.open('/services', '_blank')} className="text-sm text-[#0B5858] hover:underline" title="Open full services page">Open full page</button>
                <button onClick={() => setShowServicesModal(false)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Close</button>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <input
                ref={searchRef}
                type="search"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                style={{ fontFamily: 'Poppins' }}
              />
              <button onClick={() => setSearchQuery('')} className="px-3 py-2 border border-gray-200 rounded text-sm">Clear</button>
            </div>

            {/* catalog list: this is the scrollable area; modalInnerRef attached here
                - style overscrollBehavior to prevent scroll chaining
            */}
            <div
              ref={modalInnerRef}
              className="space-y-3 max-h-80 overflow-auto"
              style={{ overscrollBehavior: 'contain' }}
            >
              {filteredCatalog.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium" style={{ fontFamily: 'Poppins' }}>{item.name}</div>
                    <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>{formatCurrency(item.charge)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addServiceFromCatalog(item, 1)}
                      className="px-3 py-1 bg-[#0B5858] text-white rounded text-sm hover:bg-[#0a4a4a]"
                      style={{ fontFamily: 'Poppins' }}
                      aria-label={`Add ${item.name}`}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        addServiceFromCatalog(item, 1);
                        setShowServicesModal(false);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      Add & Close
                    </button>
                  </div>
                </div>
              ))}

              {filteredCatalog.length === 0 && (
                <div className="text-center text-gray-500 py-6" style={{ fontFamily: 'Poppins' }}>
                  No services found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdditionalServicesStep;