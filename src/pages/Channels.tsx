import React, { useState } from 'react';
import { Radio, Plus, User, Youtube, Trash2, X } from 'lucide-react';
import Button from '../components/Button';
import { cn } from '../components/Button';

const Channels: React.FC = () => {
  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedPace, setSelectedPace] = useState('Slow');
  const [selectedTone, setSelectedTone] = useState('Funny');

  const paces = [
    { label: 'Slow', icon: '🐌' },
    { label: 'Normal', icon: '🚶' },
    { label: 'Fast', icon: '💨' },
    { label: 'Super', icon: '⚡' },
  ];

  const tones = [
    { label: 'Funny', icon: '🤸' },
    { label: 'Elegant', icon: '🦊' },
    { label: 'Serious', icon: '🚩' },
    { label: 'Casual', icon: '🧑' },
    { label: 'Professional', icon: '👷' },
    { label: 'Informational', icon: '📺' },
  ];

  if (isDetailView) {
    return (
      <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen">
        <div className="max-w-3xl mx-auto bg-bg-card border border-border rounded-xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-text-main font-bold text-2xl">Channel defaults</h1>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="text-text-muted border-border hover:bg-bg-dark"
                onClick={() => setIsDetailView(false)}
              >
                Back
              </Button>
              <Button variant="primary" className="bg-error hover:bg-red-700 text-white flex items-center gap-2">
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          </div>

          <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
            {/* Logo Upload */}
            <div className="space-y-4">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Upload a logo</label>
              <div className="flex flex-col items-center w-fit gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-primary transition-all group overflow-hidden">
                  <User size={32} className="text-text-muted group-hover:text-primary transition-colors" />
                </div>
                <button className="flex items-center gap-1.5 text-text-muted hover:text-error text-sm transition-colors">
                  <X size={14} /> Clear
                </button>
              </div>
            </div>

            {/* Name & Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Name</label>
                <input 
                  type="text" 
                  placeholder="Channel Name"
                  className="w-full bg-transparent border-b border-border py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-text-muted text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                  <Youtube size={16} className="text-primary" /> Channel link
                </label>
                <input 
                  type="text" 
                  placeholder="https://www.youtube.com/@yourchannel"
                  className="w-full bg-transparent border-b border-border py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Brand Colors */}
            <div className="space-y-4">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Brand colors</label>
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-12 h-12 rounded border border-border bg-[#22c55e] cursor-pointer relative shadow-sm hover:scale-105 transition-transform">
                    <div className="absolute bottom-0 right-0 p-0.5 bg-bg-card/80 rounded-tl">
                      <div className="w-2 h-2 border-r border-b border-text-main rotate-45"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pace Selector */}
            <div className="space-y-4">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Pace</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {paces.map((pace) => (
                  <button
                    key={pace.label}
                    onClick={() => setSelectedPace(pace.label)}
                    className={cn(
                      "p-6 rounded-xl border flex flex-col items-center gap-3 transition-all duration-200 shadow-sm",
                      selectedPace === pace.label 
                        ? "bg-primary border-primary text-white scale-[1.02]" 
                        : "bg-bg-dark border-border text-text-main hover:border-primary/50"
                    )}
                  >
                    <span className="text-3xl">{pace.icon}</span>
                    <span className="font-bold text-sm">{pace.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div className="space-y-4">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Tone</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tones.map((tone) => (
                  <button
                    key={tone.label}
                    onClick={() => setSelectedTone(tone.label)}
                    className={cn(
                      "p-5 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 shadow-sm",
                      selectedTone === tone.label 
                        ? "bg-primary/10 border-primary text-text-main" 
                        : "bg-bg-dark border-border text-text-muted hover:border-primary/30"
                    )}
                  >
                    <span className="text-2xl">{tone.icon}</span>
                    <span className="font-semibold text-sm">{tone.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Section */}
            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <h3 className="text-text-main font-bold text-lg leading-tight">Tell us about your channel</h3>
                <p className="text-text-muted text-xs leading-relaxed max-w-2xl">
                  Help us replicate what makes your channel special. How do you typically edit? What's your sense of humor, pace, and is there anything else we should know?
                </p>
              </div>
              <textarea 
                className="w-full bg-bg-dark border-b border-border py-3 px-4 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary resize-none min-h-[120px] text-sm transition-colors shadow-inner"
                placeholder="Type here..."
              ></textarea>
            </div>

            {/* Save Button */}
            <Button variant="primary" fullWidth className="py-4 text-base font-bold rounded-xl mt-6 shadow-xl shadow-primary/20">
              Save changes
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-text-main font-bold text-2xl md:text-3xl">My Channels</h1>
        <Button className="flex items-center gap-2" onClick={() => setIsDetailView(true)}>
          <Plus size={18} />
          New Channel
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-bg-card border border-border rounded-2xl p-12">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <Radio size={32} />
        </div>
        <h2 className="text-text-main font-bold text-xl mb-2">No channels yet</h2>
        <p className="text-text-muted text-sm max-w-sm mb-8 leading-relaxed">
          Add your YouTube or social channels here to set default brand colors, editing pace, and tone for your orders.
        </p>
        <Button className="px-8 py-3 rounded-xl font-bold" onClick={() => setIsDetailView(true)}>
          + Add your first channel
        </Button>
      </div>
    </div>
  );
};

export default Channels;
