'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Send, X } from 'lucide-react';

interface InterestedModalProps {
  isOpen: boolean;
  onClose: () => void;
  startupId: string;
  startupTitle: string;
  userId?: string;
  onSuccess?: () => void;
}

const InterestedModal: React.FC<InterestedModalProps> = ({
  isOpen,
  onClose,
  startupId,
  startupTitle,
  userId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    message: '',
    investmentAmount: '',
    investmentType: '',
    experience: '',
    timeline: '',
    preferredContact: 'email',
    linkedin: '',
    website: '',
    location: '',
    howDidYouHear: '',
    consentToContact: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (!formData.consentToContact) {
      newErrors.consentToContact = 'You must consent to be contacted';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // First, mark as interested
      const interestedRes = await fetch(`/api/interested?id=${startupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!interestedRes.ok) {
        throw new Error('Failed to mark as interested');
      }

      // Then, send the form data (you might want to create a separate API endpoint for this)
      const formRes = await fetch('/api/interested-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId,
          startupTitle,
          userId,
          ...formData
        }),
      });

      if (!formRes.ok) {
        const errorData = await formRes.json();
        throw new Error(errorData.message || 'Failed to submit form');
      }

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        role: '',
        message: '',
        investmentAmount: '',
        investmentType: '',
        experience: '',
        timeline: '',
        preferredContact: 'email',
        linkedin: '',
        website: '',
        location: '',
        howDidYouHear: '',
        consentToContact: false
      });
      setErrors({});
      
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Error submitting interested form:', error);
      setErrors({ submit: 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        role: '',
        message: '',
        investmentAmount: '',
        investmentType: '',
        experience: '',
        timeline: '',
        preferredContact: 'email',
        linkedin: '',
        website: '',
        location: '',
        howDidYouHear: '',
        consentToContact: false
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-[22px] shadow-200 border-[5px] border-black max-w-6xl w-full max-h-[90vh] relative animate-fade-in overflow-hidden flex flex-col">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 z-10"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="p-6 overflow-y-auto flex-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Heart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Show Interest</h2>
              <p className="text-sm text-gray-600">Express your interest in "{startupTitle}"</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Basic Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className={errors.name ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className={errors.email ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Row 2: Professional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Company/Organization
              </label>
              <Input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Your company name"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Your Role/Title
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="">Select your role</option>
                <option value="investor">Investor</option>
                <option value="angel-investor">Angel Investor</option>
                <option value="vc">Venture Capitalist</option>
                <option value="founder">Startup Founder</option>
                <option value="entrepreneur">Entrepreneur</option>
                <option value="advisor">Advisor</option>
                <option value="mentor">Mentor</option>
                <option value="employee">Employee</option>
                <option value="student">Student</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, Country"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Row 3: Investment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="investmentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Investment Amount
              </label>
              <Input
                id="investmentAmount"
                name="investmentAmount"
                type="text"
                value={formData.investmentAmount}
                onChange={handleInputChange}
                placeholder="e.g., $10,000 - $50,000"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="investmentType" className="block text-sm font-medium text-gray-700 mb-1">
                Investment Type
              </label>
              <select
                id="investmentType"
                name="investmentType"
                value={formData.investmentType}
                onChange={handleInputChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="">Select investment type</option>
                <option value="equity">Equity Investment</option>
                <option value="loan">Loan/Debt</option>
                <option value="partnership">Partnership</option>
                <option value="advisory">Advisory Role</option>
                <option value="mentorship">Mentorship</option>
                <option value="collaboration">Collaboration</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-1">
                Timeline
              </label>
              <select
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="">Select timeline</option>
                <option value="immediate">Immediate (within 1 month)</option>
                <option value="short-term">Short-term (1-3 months)</option>
                <option value="medium-term">Medium-term (3-6 months)</option>
                <option value="long-term">Long-term (6+ months)</option>
                <option value="exploring">Just exploring</option>
              </select>
            </div>
          </div>

          {/* Row 4: Contact & Social */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="preferredContact" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Contact Method
              </label>
              <select
                id="preferredContact"
                name="preferredContact"
                value={formData.preferredContact}
                onChange={handleInputChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="linkedin">LinkedIn</option>
                <option value="any">Any method</option>
              </select>
            </div>

            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn Profile
              </label>
              <Input
                id="linkedin"
                name="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/yourprofile"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website/Portfolio
              </label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Row 5: Experience & Message */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                Relevant Experience
              </label>
              <Textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="Tell us about your relevant experience, previous investments, or expertise..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Tell us why you're interested in this startup and how you can help..."
                rows={3}
                className={errors.message ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
            </div>
          </div>

          {/* Row 6: How did you hear about us */}
          <div>
            <label htmlFor="howDidYouHear" className="block text-sm font-medium text-gray-700 mb-1">
              How did you hear about us?
            </label>
            <select
              id="howDidYouHear"
              name="howDidYouHear"
              value={formData.howDidYouHear}
              onChange={handleInputChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            >
              <option value="">Select an option</option>
              <option value="search">Search Engine</option>
              <option value="social-media">Social Media</option>
              <option value="referral">Referral</option>
              <option value="event">Event/Conference</option>
              <option value="news">News/Media</option>
              <option value="direct">Direct</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="consentToContact"
              name="consentToContact"
              checked={formData.consentToContact}
              onChange={handleInputChange}
              className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <div className="flex-1">
              <label htmlFor="consentToContact" className="text-sm text-gray-700">
                I consent to be contacted by the startup team regarding my interest. *
              </label>
              {errors.consentToContact && <p className="text-red-500 text-xs mt-1">{errors.consentToContact}</p>}
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Interest
                </>
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InterestedModal;
