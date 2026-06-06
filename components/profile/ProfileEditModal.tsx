'use client';

import { useState } from 'react';
import Modal from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: {
    name: string;
    bio: string;
    image?: string;
  };
  onProfileUpdate?: (updatedProfile: any) => void;
}

const ProfileEditModal = ({ isOpen, onClose, currentProfile, onProfileUpdate }: ProfileEditModalProps) => {
  const [formData, setFormData] = useState({
    name: currentProfile?.name || '',
    bio: currentProfile?.bio || '',
    image: currentProfile?.image || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens with new data
  useState(() => {
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        bio: currentProfile.bio || '',
        image: currentProfile.image || ''
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          bio: formData.bio.trim(),
          image: formData.image || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess(true);
      
      // Call the callback to update parent component
      if (onProfileUpdate) {
        onProfileUpdate(data.user);
      }

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
                 <div className="flex items-center justify-between">
           <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
         </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border-[3px] border-green-300 rounded-[22px]">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Profile updated successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border-[3px] border-red-300 rounded-[22px]">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <img
                  src={formData.image || '/default-avatar.png'}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Click the camera icon to upload a new profile picture
            </p>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your name"
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              {formData.bio.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProfileEditModal;
