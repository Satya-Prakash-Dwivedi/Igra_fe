import React from 'react';
import { User, Moon, Youtube, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen">
      <div className="max-w-2xl mx-auto bg-bg-card border border-border rounded-xl p-8 shadow-2xl relative animate-in fade-in slide-in-from-bottom-4 duration-500">
        <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
          {/* Profile Photo */}
          <div className="space-y-4">
            <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Profile photo or logo</label>
            <div className="flex flex-col items-center w-fit gap-4">
              <div className="w-24 h-24 rounded-full border-2 border-border overflow-hidden bg-bg-dark flex items-center justify-center shadow-lg group cursor-pointer hover:border-primary transition-all">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-text-muted group-hover:text-primary transition-colors" />
                )}
              </div>
              <button className="flex items-center gap-1.5 text-text-muted hover:text-error text-xs transition-colors">
                <X size={14} /> Clear
              </button>
            </div>
          </div>

          {/* Form Fields - Underline Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider">First</label>
              <input 
                type="text" 
                defaultValue={user?.name?.split(' ')[0] || ''}
                className="w-full bg-transparent border-b border-border py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Last</label>
              <input 
                type="text" 
                defaultValue={user?.name?.split(' ')[1] || ''}
                className="w-full bg-transparent border-b border-border py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-text-muted text-sm font-medium uppercase tracking-wider">DBA / Company</label>
            <input 
              type="text" 
              placeholder="Type here..."
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
              className="w-full bg-transparent border-b border-border py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide">
              Change my email
            </Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide">
              Change my password
            </Button>
          </div>

          {/* Notifications */}
          <div className="space-y-4 pt-2">
            <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Notifications preferences</label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="accent-primary w-4 h-4 rounded" />
              <span className="text-text-main text-sm">Send new notifications to my email</span>
            </label>
          </div>

          {/* Save Button */}
          <Button variant="primary" className="px-10 py-3 rounded-lg font-bold shadow-xl shadow-primary/20 mt-4">
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
