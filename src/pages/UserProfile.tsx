import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { resolveApiUrl } from '../utils/urlUtils';
import authService from '../services/authService';
import uploadService from '../services/uploadService';
import { User, Mail, Building, Bell, Camera, X, Youtube, ShieldAlert } from 'lucide-react';
import Button, { cn } from '../components/Button';
import { createLogger, serializeError } from '../services/logger';
import { toast } from 'sonner';

const logger = createLogger('Profile');

const UserProfile: React.FC = () => {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [youtubeChannel, setYoutubeChannel] = useState('');
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [avatar, setAvatar] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (user) {
      const userName = user.name || '';
      const nameParts = userName.split(' ');
      setFirstName(user.firstName || nameParts[0] || '');
      setLastName(user.lastName || nameParts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setCompanyName(user.company?.name || '');
      setYoutubeChannel(user.youtubeChannel || '');
      setNotificationEmail(user.notificationPreferences?.email !== false);
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadService.uploadFile(file);
      setAvatar(url || '');
      toast.success('Avatar uploaded!');
    } catch (err) {
      logger.error('profile.avatar_upload_failed', { error: serializeError(err) });
      toast.error('Failed to upload avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await authService.updateProfile({
        firstName,
        lastName,
        companyName,
        youtubeChannel,
        notificationEmail,
        avatar
      });
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      logger.error('profile.update_failed', { error: serializeError(err) });
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-700">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Accessing Dossier...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 animate-in fade-in duration-500">
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/5 bg-bg-card shadow-2xl">
              {avatar ? (
                <img src={resolveApiUrl(avatar)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-dim/20">
                  <User size={64} />
                </div>
              )}
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
             <button
               type="button"
               onClick={() => fileInputRef.current?.click()}
               className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors"
             >
               Upload New
             </button>
             <span className="text-white/10 text-xs">|</span>
             <button
               type="button"
               onClick={() => setAvatar('')}
               className="text-[11px] font-bold uppercase tracking-widest text-text-dim/60 hover:text-white transition-colors"
             >
               Clear
             </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
        </div>

        {/* Identity Details */}
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {/* First Name */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-dim/40 block">First</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-transparent border-b border-white/5 pb-4 text-white focus:border-primary transition-all outline-none text-base font-medium"
                placeholder="Aman"
              />
            </div>
            
            {/* Last Name */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-dim/40 block">Last</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-transparent border-b border-white/5 pb-4 text-white focus:border-primary transition-all outline-none text-base font-medium"
                placeholder="Dwivedi"
              />
            </div>

            {/* Email */}
            <div className="space-y-3 md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-dim/40 block">Email</label>
              <input 
                type="email" 
                value={email}
                disabled
                className="w-full bg-transparent border-b border-white/5 pb-4 text-white/40 outline-none text-base font-medium cursor-not-allowed"
                placeholder="dwive.disp62@gmail.com"
              />
            </div>

            {/* Company */}
            <div className="space-y-3 md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-dim/40 block">DBA / Company</label>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-transparent border-b border-white/5 pb-4 text-white focus:border-primary transition-all outline-none text-base font-medium"
                placeholder="East Ventures"
              />
            </div>
          </div>

          {/* Social */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3 text-white">
              <Youtube size={18} className="text-primary" />
              <h3 className="font-bold text-base tracking-tight">Have a YouTube channel?</h3>
            </div>
            <p className="text-text-dim/60 text-xs">Help us get a feel for your audience and style.</p>
            <input 
              type="text" 
              value={youtubeChannel}
              onChange={(e) => setYoutubeChannel(e.target.value)}
              className="w-full bg-transparent border-b border-white/5 pb-4 text-white focus:border-primary transition-all outline-none text-sm font-medium"
              placeholder="https://www.youtube.com/@yourchannel"
            />
          </div>

          {/* Notifications */}
          <div className="space-y-6 pt-4">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-dim/40 block">Notifications Preferences</label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.checked)}
                className="w-5 h-5 rounded border-white/10 bg-white/5 accent-primary cursor-pointer transition-all"
              />
              <span className="text-text-dim group-hover:text-white transition-colors text-sm font-medium">Send new notifications to my email</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-8">
            <Button
              type="submit"
              isLoading={isSaving}
              disabled={isUploading}
              className="h-14 rounded-xl w-full text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
      
      <div className="mt-16 flex items-center justify-center gap-2 opacity-20">
         <ShieldAlert size={12} className="text-text-dim" />
         <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Authorized Identity Protocol</span>
      </div>
    </div>
  );
};

export default UserProfile;
