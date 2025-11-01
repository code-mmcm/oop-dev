import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

// Icon components
const QuestionIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zm0-8h14V7H7v2z"/>
  </svg>
);

const HeadsetIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h4v1h-7v2h6c1.66 0 3-1.34 3-3V10c0-4.97-4.03-9-9-9z"/>
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

interface FAQItem {
  question: string;
  answer: string;
}

const HelpAndSupport: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketIssue, setTicketIssue] = useState('');

  const faqItems: FAQItem[] = [
    {
      question: 'How do I manage a booking?',
      answer: 'You can manage your bookings through the booking dashboard. From there, you can view details, modify dates, and cancel if needed.'
    },
    {
      question: 'What is the cancellation policy?',
      answer: 'Cancellations made more than 48 hours before check-in receive a full refund. Cancellations within 48 hours are subject to a 50% fee.'
    },
    {
      question: 'How do guest issues get resolved?',
      answer: 'Guest issues are handled by our support team. Contact us via email or phone, and we will assist you promptly to resolve any concerns.'
    },
    {
      question: 'What are the check-in and check-out times?',
      answer: 'Check-in is available from 3:00 PM onwards, and check-out is before 11:00 AM. Early check-in or late check-out may be available upon request.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(ticketEmail)) {
      alert('Please enter a valid email address (e.g., yourname@gmail.com)');
      return;
    }
    
    // Handle ticket submission logic here
    console.log('Ticket submitted:', { email: ticketEmail, issue: ticketIssue });
    // Reset form
    setTicketEmail('');
    setTicketIssue('');
    // You can add a success message or API call here
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4"
            style={{ color: '#1F2937', fontFamily: 'Poppins' }}
          >
            How can we help you?
          </h1>
          <p 
            className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 px-2"
            style={{ fontFamily: 'Poppins' }}
          >
            Find answers to your questions, step-by-step guides, and contact information.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8 sm:mb-16">
          <div className="relative">
            <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search for topics or questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300"
              style={{
                fontFamily: 'Poppins',
                '--tw-ring-color': '#549F74',
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* FAQ Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4E9DC' }}>
                  <QuestionIcon />
                </div>
                <h2 
                  className="text-lg sm:text-xl md:text-2xl font-bold"
                  style={{ color: '#1F2937', fontFamily: 'Poppins' }}
                >
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full flex items-center justify-between text-left py-2 hover:text-gray-900 transition-colors"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      <span className="text-gray-700 font-medium pr-2 sm:pr-4 text-sm sm:text-base">{item.question}</span>
                      <span className={`transform transition-transform flex-shrink-0 ${expandedFAQ === index ? 'rotate-180' : ''}`}>
                        <ChevronDownIcon />
                      </span>
                    </button>
                    {expandedFAQ === index && (
                      <div 
                        className="mt-2 text-gray-600 pl-0 text-sm sm:text-base"
                        style={{ fontFamily: 'Poppins' }}
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4E9DC' }}>
                  <CreditCardIcon />
                </div>
                <h2 
                  className="text-lg sm:text-xl md:text-2xl font-bold"
                  style={{ color: '#1F2937', fontFamily: 'Poppins' }}
                >
                  Payment Methods
                </h2>
              </div>
              <p 
                className="text-sm sm:text-base text-gray-600 mb-4"
                style={{ fontFamily: 'Poppins' }}
              >
                We are continuously working to expand our payment options to provide more flexibility for you and your clients.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <InfoIcon />
                </div>
                <p 
                  className="text-sm sm:text-base text-gray-800 font-medium"
                  style={{ fontFamily: 'Poppins' }}
                >
                  Important: Cash only for now
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* How to Book Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4E9DC' }}>
                  <ListIcon />
                </div>
                <h2 
                  className="text-lg sm:text-xl md:text-2xl font-bold"
                  style={{ color: '#1F2937', fontFamily: 'Poppins' }}
                >
                  How to Book
                </h2>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 text-sm sm:text-base" style={{ backgroundColor: '#0B5858' }}>
                    <span className="font-semibold" style={{ fontFamily: 'Poppins' }}>1</span>
                  </div>
                  <div>
                    <h3 
                      className="text-sm sm:text-base font-semibold mb-1"
                      style={{ color: '#1F2937', fontFamily: 'Poppins' }}
                    >
                      Search for Availability
                    </h3>
                    <p 
                      className="text-xs sm:text-sm text-gray-600"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      Use the main dashboard to enter dates and location to find available homestays.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 text-sm sm:text-base" style={{ backgroundColor: '#0B5858' }}>
                    <span className="font-semibold" style={{ fontFamily: 'Poppins' }}>2</span>
                  </div>
                  <div>
                    <h3 
                      className="text-sm sm:text-base font-semibold mb-1"
                      style={{ color: '#1F2937', fontFamily: 'Poppins' }}
                    >
                      Fill Guest Details
                    </h3>
                    <p 
                      className="text-xs sm:text-sm text-gray-600"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      Enter all required information for the primary guest and any additional occupants.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 text-sm sm:text-base" style={{ backgroundColor: '#0B5858' }}>
                    <span className="font-semibold" style={{ fontFamily: 'Poppins' }}>3</span>
                  </div>
                  <div>
                    <h3 
                      className="text-sm sm:text-base font-semibold mb-1"
                      style={{ color: '#1F2937', fontFamily: 'Poppins' }}
                    >
                      Confirm Payment Method
                    </h3>
                    <p 
                      className="text-xs sm:text-sm text-gray-600"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      Review the payment details and confirm the booking. An email confirmation will be sent.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Support Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4E9DC' }}>
                  <HeadsetIcon />
                </div>
                <h2 
                  className="text-lg sm:text-xl md:text-2xl font-bold"
                  style={{ color: '#1F2937', fontFamily: 'Poppins' }}
                >
                  Contact Support
                </h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <EmailIcon />
                  <a 
                    href="mailto:support@kelsey.homestay"
                    className="text-sm sm:text-base font-medium hover:underline break-all"
                    style={{ color: '#0B5858', fontFamily: 'Poppins' }}
                  >
                    support@kelsey.homestay
                  </a>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <PhoneIcon />
                  <span 
                    className="text-sm sm:text-base text-gray-800"
                    style={{ fontFamily: 'Poppins' }}
                  >
                    +1 (555) 123-4567 (9am-5pm EST)
                  </span>
                </div>
              </div>
            </div>

            {/* Submit a Ticket Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <h3 
                className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center"
                style={{ color: '#1F2937', fontFamily: 'Poppins' }}
              >
                Submit a Ticket
              </h3>
              <form onSubmit={handleSubmitTicket} className="space-y-3 sm:space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Your Email Address"
                    value={ticketEmail}
                    onChange={(e) => setTicketEmail(e.target.value)}
                    required
                    pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                    title="Please enter a valid email address (e.g., yourname@gmail.com, user@yahoo.com)"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300"
                    style={{
                      fontFamily: 'Poppins',
                      '--tw-ring-color': '#549F74',
                    } as React.CSSProperties}
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Describe your issue..."
                    value={ticketIssue}
                    onChange={(e) => setTicketIssue(e.target.value)}
                    required
                    rows={5}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 resize-y"
                    style={{
                      fontFamily: 'Poppins',
                      '--tw-ring-color': '#549F74',
                    } as React.CSSProperties}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 sm:py-3 rounded-lg text-sm sm:text-base text-white font-semibold transition-all duration-300 hover:opacity-90"
                  style={{ 
                    backgroundColor: '#0B5858',
                    fontFamily: 'Poppins' 
                  }}
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HelpAndSupport;

