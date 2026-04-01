import React from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import Button from '../Button';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300 shadow-2xl">
        <div className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <button 
              onClick={onClose}
              className="mt-1 text-primary hover:text-primary-hover transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="space-y-2">
              <h2 className="text-text-main font-bold text-xl leading-tight">
                Find something that isn't working as expected?
              </h2>
              <p className="text-text-muted text-sm">
                We appreciate you helping us build Igra Studios into the best app it can be!
              </p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Description */}
            <div className="space-y-3">
              <label className="text-text-main font-semibold block text-sm">
                What isn't working as expected?
              </label>
              <p className="text-text-muted text-xs leading-relaxed">
                Please use as many descriptors as possible to expedite a fix. What were you doing when you found the bug? How might we replicate it?
              </p>
              <textarea 
                className="w-full bg-bg-dark border-b border-border p-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary resize-none min-h-28 text-sm transition-colors"
                placeholder="Type here..."
              ></textarea>
            </div>

            {/* Upload Zone */}
            <div className="space-y-3">
              <label className="text-text-main font-semibold block text-sm">
                Upload screenshots if applicable
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-all group">
                <Upload size={24} className="text-text-muted group-hover:text-primary transition-colors" />
                <p className="text-text-muted text-sm">
                  Drop files here to upload (or <span className="text-primary">click</span>)
                </p>
              </div>
            </div>

            {/* Follow up */}
            <div className="space-y-3 pt-2">
              <label className="text-text-main font-semibold block text-sm">
                Would you like us to follow up with you on this report?
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="follow-up" className="accent-primary w-4 h-4" defaultChecked />
                  <span className="text-text-main text-sm">Yes, please</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="follow-up" className="accent-primary w-4 h-4" />
                  <span className="text-text-main text-sm">No, thanks</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <Button variant="primary" fullWidth className="py-3 rounded-xl font-semibold mt-4">
              Send bug report
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BugReportModal;
