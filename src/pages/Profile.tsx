import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Youtube, X, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button, { cn } from '../components/Button';
import authService from '../services/authService';
import * as uploadApi from '../services/uploadService';
import { createLogger, serializeError } from '../services/logger';

const logger = createLogger('Profile');

interface FormErrors {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  youtubeChannel?: string;
  general?: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [companyName, setCompanyName] = useState(user?.company?.name || '');
  const [youtubeChannel, setYoutubeChannel] = useState(user?.youtubeChannel || '');
  const [notificationEmail, setNotificationEmail] = useState(user?.notificationPreferences?.email ?? true);
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state when user context changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || user.name?.split(' ')[0] || '');
      setLastName(user.lastName || user.name?.split(' ').slice(1).join(' ') || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
      setCompanyName(user.company?.name || '');
      setYoutubeChannel(user.youtubeChannel || '');
      setNotificationEmail(user.notificationPreferences?.email ?? true);
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    // Updated regex to support modern YouTube handles with '@'
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w \.@-]*)*\/?$/;

    if (firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters.';
    }
    if (lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters.';
    }
    // We don't validate avatar URL anymore as it's handled by upload
    if (youtubeChannel && !urlPattern.test(youtubeChannel)) {
      newErrors.youtubeChannel = 'Please enter a valid YouTube URL.';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      logger.warn('profile.validation_failed', { errors: newErrors });
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setErrors({ avatar: 'Please select an image file.' });
      return;
    }

    setIsUploading(true);
    setErrors({});
    
    try {
      // 1. Upload to cloud
      const { assetId, url } = await uploadApi.uploadFile(file, (pct) => {
        logger.info('profile.photo_upload_progress', { progress: pct });
      });

      // 2. The upload is already finalized by uploadFile. 
      // Use the URL from backend if available, otherwise construct fallback.
      const baseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const publicUrl = url || `${baseUrl}/uploads/view/${assetId}`;

      setAvatar(publicUrl);
      setSuccessMessage('Photo uploaded! Remember to save changes.');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      logger.error('profile.photo_upload_failed', { error: serializeError(err) });
      setErrors({ avatar: 'Failed to upload photo. Please try again.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('profile.save_attempted');
    
    setSuccessMessage(null);
    setErrors({});

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const response = await authService.updateProfile({
        firstName,
        lastName,
        avatar,
        companyName,
        youtubeChannel,
        notificationEmail
      });

      if (response.success) {
        updateUser(response.data.user);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      logger.error('profile.update_failed', { error: serializeError(err) });
      
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred.';
      if (err.response?.status === 400) {
        setErrors({ general: errorMessage });
      } else {
        setErrors({ general: 'Failed to save changes. Please try again later.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAvatar = () => {
    setAvatar('');
  };

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen">
      <div className="max-w-2xl mx-auto bg-bg-card border border-border rounded-xl p-8 shadow-2xl relative animate-in fade-in slide-in-from-bottom-4 duration-200">
        
        {successMessage && (
          <div className="absolute top-4 right-8 left-8 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm text-center animate-in fade-in zoom-in duration-300 z-50">
            {successMessage}
          </div>
        )}

        <form className="space-y-10" onSubmit={handleSubmit}>
          {/* Profile Photo */}
          <div className="space-y-4">
            <label className="text-text-muted text-sm font-medium uppercase tracking-wider">
              Profile photo or logo <span className="lowercase opacity-60">(optional)</span>
            </label>
            <div className="flex flex-col items-center w-fit gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-24 h-24 rounded-full border-2 border-border overflow-hidden bg-bg-dark flex items-center justify-center shadow-lg group cursor-pointer hover:border-primary transition-all relative",
                  isUploading && "cursor-wait opacity-80"
                )}
              >
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={40} className="text-text-muted group-hover:text-primary transition-colors" />
                )}
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Upload size={20} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase">Update</span>
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-bg-dark/80 flex items-center justify-center z-20">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:text-primary-hover text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
                  disabled={isUploading || isSaving}
                >
                  Upload New
                </button>
                <button 
                  type="button"
                  onClick={handleClearAvatar}
                  className="flex items-center gap-1.5 text-text-muted hover:text-error text-xs transition-colors disabled:opacity-50"
                  disabled={!avatar || isUploading || isSaving}
                >
                  <X size={14} /> Clear
                </button>
              </div>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            {errors.avatar && <p className="text-xs text-error mt-1">{errors.avatar}</p>}
          </div>

          {/* Form Fields - Underline Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider">First</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={cn(
                  "w-full bg-transparent border-b py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-sm",
                  errors.firstName ? 'border-error' : 'border-border'
                )}
              />
              {errors.firstName && <p className="text-xs text-error mt-1">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Last</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={cn(
                  "w-full bg-transparent border-b py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-sm",
                  errors.lastName ? 'border-error' : 'border-border'
                )}
              />
              {errors.lastName && <p className="text-xs text-error mt-1">{errors.lastName}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={email}
                disabled
                className="w-full bg-transparent border-b border-border py-2 text-text-muted focus:outline-none cursor-not-allowed text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-text-muted text-sm font-medium uppercase tracking-wider">DBA / Company</label>
            <input 
              type="text" 
              placeholder="Igra Studios"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-transparent border-b border-border py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Youtube size={20} className="text-primary" />
              <label className="text-text-main font-bold">Have a YouTube channel?</label>
            </div>
            <p className="text-text-muted text-xs">Help us get a feel for your audience and style.</p>
            <input 
              type="text" 
              placeholder="https://www.youtube.com/@yourchannel"
              value={youtubeChannel}
              onChange={(e) => setYoutubeChannel(e.target.value)}
              className={cn(
                "w-full bg-transparent border-b py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-sm",
                errors.youtubeChannel ? 'border-error' : 'border-border'
              )}
            />
            {errors.youtubeChannel && <p className="text-xs text-error mt-1">{errors.youtubeChannel}</p>}
          </div>

          {/* Notifications */}
          <div className="space-y-4 pt-2">
            <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Notifications preferences</label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={notificationEmail} 
                onChange={(e) => setNotificationEmail(e.target.checked)}
                className="accent-primary w-4 h-4 rounded appearance-none border border-border bg-bg-dark checked:bg-primary checked:border-primary cursor-pointer transition-all flex items-center justify-center after:content-['✓'] after:text-white after:text-[10px] after:hidden checked:after:block" 
              />
              <span className="text-text-main text-sm">Send new notifications to my email</span>
            </label>
          </div>

          {errors.general && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-md text-xs text-error text-center animate-shake">
              {errors.general}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" type="button" className="border-primary text-primary hover:bg-primary/5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide disabled:opacity-50">
              Change my email
            </Button>
            <Button variant="outline" type="button" className="border-primary text-primary hover:bg-primary/5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide disabled:opacity-50">
              Change my password
            </Button>
          </div>

          {/* Save Button */}
          <Button 
            variant="primary" 
            type="submit"
            isLoading={isSaving}
            disabled={isUploading}
            className="px-10 py-3 rounded-lg font-bold shadow-xl shadow-primary/20 mt-4 h-12 w-full md:w-auto transition-transform active:scale-95"
          >
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
