import React, { useReducer, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Info, 
  Video, 
  Image as ImageIcon, 
  Play, 
  StopCircle, 
  Mic, 
  FileText, 
  Search, 
  LayoutGrid, 
  UserCircle, 
  Phone, 
  Eye, 
  MessageSquareDot,
  MonitorPlay,
  Smartphone,
  Square,
  Maximize2,
  Upload,
  Clock,
  Star,
  Check,
  X
} from 'lucide-react';
import Button, { cn } from '../components/Button';

// --- Types ---

type ServiceInstance = {
  id: string;
  serviceKey: string;
  fields: Record<string, any>;
};

type WizardState = {
  step: 1 | 2 | 3 | 4;
  services: ServiceInstance[];
  deadline: string;
  projectTitle: string;
  additionalNotes: string;
};

type Action = 
  | { type: 'SET_STEP'; step: 1 | 2 | 3 | 4 }
  | { type: 'ADD_SERVICE'; serviceKey: string }
  | { type: 'REMOVE_SERVICE'; id: string }
  | { type: 'INCREMENT_SERVICE'; serviceKey: string }
  | { type: 'UPDATE_SERVICE_FIELD'; id: string; field: string; value: any }
  | { type: 'SET_DEADLINE'; deadline: string }
  | { type: 'SET_PROJECT_TITLE'; title: string }
  | { type: 'SET_NOTES'; notes: string };

// --- Data ---

const SERVICE_CATALOG = [
  { key: 'video', name: 'Video', icon: <Video size={20} />, price: 100, pricingText: '20 credits per minute of raw footage (min. 100 credits)' },
  { key: 'thumbnail', name: 'Thumbnail Design', icon: <ImageIcon size={20} />, price: 50, pricingText: '50 credits per thumbnail' },
  { key: 'customIntro', name: 'Custom Intro', icon: <Play size={20} />, price: 100, pricingText: 'Starting at 100 credits' },
  { key: 'customOutro', name: 'Custom Outro', icon: <StopCircle size={20} />, price: 100, pricingText: 'Starting at 100 credits' },
  { key: 'aiVoiceover', name: 'AI Voiceover', icon: <Mic size={20} />, price: 50, pricingText: '10 credits per minute (min. 50 credits)' },
  { key: 'scriptWriting', name: 'Script Writing', icon: <FileText size={20} />, price: 100, pricingText: '100 credits per 500 words' },
  { key: 'videoSEO', name: 'Video SEO', icon: <Search size={20} />, price: 100, pricingText: '100 credits per video' },
  { key: 'channelBanner', name: 'Channel Banner', icon: <LayoutGrid size={20} />, price: 150, pricingText: '150 credits' },
  { key: 'logoDesign', name: 'Logo Design', icon: <UserCircle size={20} />, price: 100, pricingText: '100 credits' },
  { key: 'imageRetouching', name: 'Image Retouching', icon: <LayoutGrid size={20} />, price: 100, pricingText: '100 credits' },
  { key: 'consultationCall', name: 'Consultation Call', icon: <Phone size={20} />, price: 100, pricingText: '100 credits per 15 minutes' },
  { key: 'footageReview', name: 'Footage Review', icon: <Eye size={20} />, price: 50, pricingText: '10 credits per minute (min. 50 credits)' },
  { key: 'customRequest', name: 'Custom Request', icon: <MessageSquareDot size={20} />, price: 0, pricingText: 'Let us know what you need' },
];

const THUMBNAIL_STYLES = [
  { label: 'Mr Beast Exaggerated', color: 'bg-red-500/20' },
  { label: 'Headshot', color: 'bg-blue-500/20' },
  { label: 'Quote', color: 'bg-yellow-500/20' },
  { label: 'The 10/10 Rule', color: 'bg-purple-500/20' },
  { label: 'Before & After', color: 'bg-green-500/20' },
];

const initialState: WizardState = {
  step: 1,
  services: [],
  deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().split('T')[0],
  projectTitle: '',
  additionalNotes: '',
};

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.step };
    case 'ADD_SERVICE': {
      const count = state.services.filter(s => s.serviceKey === action.serviceKey).length;
      return {
        ...state,
        services: [...state.services, {
          id: `${action.serviceKey}-${count}`,
          serviceKey: action.serviceKey,
          fields: { pace: 'Normal', tone: [] }
        }]
      };
    }
    case 'REMOVE_SERVICE': return { ...state, services: state.services.filter(s => s.id !== action.id) };
    case 'INCREMENT_SERVICE': {
      const count = state.services.filter(s => s.serviceKey === action.serviceKey).length;
      return {
        ...state,
        services: [...state.services, {
          id: `${action.serviceKey}-${count}`,
          serviceKey: action.serviceKey,
          fields: { pace: 'Normal', tone: [] }
        }]
      };
    }
    case 'UPDATE_SERVICE_FIELD': return {
      ...state,
      services: state.services.map(s => s.id === action.id ? { ...s, fields: { ...s.fields, [action.field]: action.value } } : s)
    };
    case 'SET_DEADLINE': return { ...state, deadline: action.deadline };
    case 'SET_PROJECT_TITLE': return { ...state, projectTitle: action.title };
    case 'SET_NOTES': return { ...state, additionalNotes: action.notes };
    default: return state;
  }
}

// --- Main Page Component ---

const NewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hoveredPricing, setHoveredPricing] = useState<string | null>(null);

  const totalCredits = useMemo(() => {
    return state.services.reduce((acc, s) => {
      const catalogItem = SERVICE_CATALOG.find(c => c.key === s.serviceKey);
      return acc + (catalogItem?.price || 0);
    }, 0);
  }, [state.services]);

  const handleBack = () => {
    if (state.step === 1) navigate('/orders');
    else dispatch({ type: 'SET_STEP', step: (state.step - 1) as any });
  };

  // --- Configuration UI Helpers ---

  const UnderlineInput = ({ id, field, placeholder, type = "text" }: any) => (
    <input 
      type={type} 
      placeholder={placeholder}
      className="w-full bg-transparent border-b border-border py-2 text-text-main focus:outline-none focus:border-primary transition-colors"
      onChange={(e) => dispatch({ type: 'UPDATE_SERVICE_FIELD', id, field, value: e.target.value })}
    />
  );

  const PillSelector = ({ id, field, options, multi = false }: any) => {
    const instance = state.services.find(s => s.id === id);
    const currentValue = instance?.fields[field] || (multi ? [] : '');

    const toggle = (opt: string) => {
      let newValue;
      if (multi) {
        newValue = currentValue.includes(opt) 
          ? currentValue.filter((v: string) => v !== opt) 
          : [...currentValue, opt];
      } else {
        newValue = opt;
      }
      dispatch({ type: 'UPDATE_SERVICE_FIELD', id, field, value: newValue });
    };

    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium border transition-all",
              (multi ? currentValue.includes(opt) : currentValue === opt)
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-text-muted hover:border-primary"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  };

  // --- Step Content ---

  const renderStep1 = () => (
    <div className="animate-in fade-in duration-500 space-y-10">
      <div className="space-y-2">
        <h2 className="text-text-main font-bold text-2xl">Let's get started!</h2>
        <p className="text-text-muted text-sm italic">Choose how you'd like to start your order.</p>
      </div>

      <div 
        className="group border-2 border-primary bg-bg-card rounded-2xl p-10 cursor-pointer hover:bg-bg-dark transition-all shadow-2xl shadow-primary/5 flex flex-col items-center gap-4 text-center"
        onClick={() => dispatch({ type: 'SET_STEP', step: 2 })}
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Plus size={32} />
        </div>
        <div>
          <h3 className="text-text-main font-bold text-xl uppercase tracking-tighter">New Order</h3>
          <p className="text-text-muted text-sm">Start a new order from scratch</p>
        </div>
      </div>

      <div className="space-y-4 pt-10">
        <h3 className="text-text-main font-semibold text-lg">Or, pick up where you left off</h3>
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Draft orders</p>
        <div className="space-y-3">
          {["(untitled)", "Video", "Video"].map((title, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-xl px-6 py-4 flex items-center justify-between hover:border-primary transition-all group cursor-pointer shadow-sm">
              <div className="flex flex-col">
                <span className="text-text-main font-bold text-sm">{title}</span>
                <span className="text-text-muted text-xs">Edited {i === 0 ? '3 days ago' : 'a month ago'} · <span className="uppercase font-bold text-[10px]">Draft</span></span>
              </div>
              <Trash2 size={18} className="text-error opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-in fade-in duration-500 space-y-10 pb-32">
      <h2 className="text-text-main font-bold text-3xl">What can we do for you?</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICE_CATALOG.map(service => {
          const instances = state.services.filter(s => s.serviceKey === service.key);
          return (
            <div key={service.key} className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all">
              <div className="flex justify-between items-start">
                <div className="text-primary">{service.icon}</div>
                <Info size={16} className="text-text-muted hover:text-text-main cursor-pointer" />
              </div>
              <div className="space-y-1 min-h-[60px]">
                <h3 className="text-text-main font-bold text-sm leading-tight">{service.name}</h3>
                <p className="text-text-muted text-[10px] leading-relaxed line-clamp-2">{service.pricingText}</p>
              </div>
              {instances.length === 0 ? (
                <Button 
                  variant="outline" 
                  fullWidth 
                  className="py-2 border-primary text-primary hover:bg-primary/5 text-[10px] font-bold uppercase tracking-widest"
                  onClick={() => dispatch({ type: 'ADD_SERVICE', serviceKey: service.key })}
                >
                  <Plus size={14} className="mr-1" /> Add {service.name}
                </Button>
              ) : (
                <div className="flex items-center justify-between bg-bg-dark rounded-xl px-3 py-2 border border-border">
                  <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Quantity {instances.length}</span>
                  <button 
                    onClick={() => dispatch({ type: 'INCREMENT_SERVICE', serviceKey: service.key })}
                    className="bg-primary text-white rounded-lg w-8 h-8 flex items-center justify-center font-bold shadow-lg"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Panels */}
      <div className="space-y-8 pt-10">
        {state.services.map((instance, idx) => {
          const service = SERVICE_CATALOG.find(c => c.key === instance.serviceKey);
          const typeInstances = state.services.filter(s => s.serviceKey === instance.serviceKey);
          const pos = typeInstances.findIndex(s => s.id === instance.id) + 1;

          return (
            <div key={instance.id} className="bg-bg-card border border-primary/30 rounded-2xl p-8 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                  <h3 className="text-text-main font-bold text-xl">
                    {service?.name} {typeInstances.length > 1 ? `(${pos} of ${typeInstances.length})` : ''}
                  </h3>
                  <p className="text-text-muted text-sm">{service?.pricingText}</p>
                </div>
                <button 
                  onClick={() => dispatch({ type: 'REMOVE_SERVICE', id: instance.id })}
                  className="text-text-muted hover:text-error text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  ✕ Remove
                </button>
              </div>

              {/* Service Specific Fields */}
              <div className="space-y-10">
                {instance.serviceKey === 'video' && (
                  <>
                    <div className="space-y-4">
                      <label className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Do you have raw footage?</label>
                      <div className="flex gap-4">
                        {['Yes, I have raw footage', 'No, need footage (+100 cr)'].map(opt => (
                          <button key={opt} className={cn(
                            "px-6 py-2 rounded-full text-sm font-bold border transition-all",
                            opt.includes('Yes') ? "bg-success/10 border-success text-success" : "border-border text-text-muted hover:border-error"
                          )}>{opt}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Horizontal (16:9)', icon: <MonitorPlay /> },
                        { label: 'Vertical (9:16)', icon: <Smartphone /> },
                        { label: 'Square (1:1)', icon: <Square /> },
                        { label: 'Other', icon: <Maximize2 /> },
                      ].map(ratio => (
                        <div key={ratio.label} className="border border-border rounded-2xl p-4 flex flex-col items-center gap-3 cursor-pointer hover:border-primary transition-all">
                          <div className="text-text-muted">{ratio.icon}</div>
                          <span className="text-text-main text-[10px] font-bold uppercase text-center">{ratio.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Raw footage length (min)</label>
                        <UnderlineInput id={instance.id} field="rawLength" placeholder="30" type="number" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Desired video length (min)</label>
                        <UnderlineInput id={instance.id} field="finalLength" placeholder="5" type="number" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Tone & Pace</label>
                      <PillSelector id={instance.id} field="tone" options={['Funny', 'Serious', 'Professional', 'Elegant', 'Casual', 'Informational']} multi />
                      <PillSelector id={instance.id} field="pace" options={['Slow', 'Normal', 'Fast', 'Super']} />
                    </div>
                  </>
                )}

                {instance.serviceKey === 'thumbnail' && (
                  <div className="space-y-8">
                    <label className="text-text-muted text-[10px] font-bold uppercase tracking-widest block">Select a style</label>
                    <div className="grid grid-cols-5 gap-3">
                      {THUMBNAIL_STYLES.map(style => (
                        <div key={style.label} className="flex flex-col gap-2 group cursor-pointer">
                          <div className={cn("h-24 w-full rounded-xl border border-border transition-all group-hover:border-primary", style.color)}></div>
                          <span className="text-[9px] text-text-muted font-bold text-center uppercase group-hover:text-text-main">{style.label}</span>
                        </div>
                      ))}
                    </div>
                    <UnderlineInput id={instance.id} field="sketch" placeholder="Sketch your idea (optional)" />
                  </div>
                )}

                {(instance.serviceKey === 'customIntro' || instance.serviceKey === 'customOutro') && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Duration</label>
                      <input type="range" min="0" max="30" step="0.5" className="w-full accent-primary" />
                      <p className="text-center text-text-main font-bold">15 seconds</p>
                    </div>
                    <div className="space-y-4">
                      <label className="text-text-muted text-[10px] font-bold uppercase tracking-widest block">Complexity</label>
                      {['Simple', 'Moderate', 'Complex'].map(c => (
                        <div key={c} className="bg-bg-dark border border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary transition-colors">
                          <div className="w-4 h-4 rounded-full border border-border" />
                          <span className="text-text-main font-bold text-sm">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Upload Zone for all panels */}
                <div className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center gap-3 hover:border-primary transition-all cursor-pointer group">
                  <Upload size={32} className="text-text-muted group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <p className="text-text-main text-sm font-bold">Drag & drop your files or browse</p>
                    <p className="text-primary text-xs mt-1 hover:underline">Or provide a link to your files →</p>
                  </div>
                </div>

                <div className="border-t border-border pt-6 flex items-center justify-between">
                  <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Instance Credits</span>
                  <div className="text-right">
                    <p className="text-text-main font-bold text-xl">{service?.price} credits</p>
                    <p className="text-text-muted text-xs">(${service?.price} USD)</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-dark border-t border-border px-8 py-6 flex items-center justify-between z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div>
          <span className="text-text-main font-bold text-2xl tracking-tighter">{totalCredits} credits</span>
          <span className="text-text-muted text-sm ml-2 font-medium">(${totalCredits} USD)</span>
        </div>
        <Button 
          className="px-14 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/20"
          disabled={state.services.length === 0}
          onClick={() => dispatch({ type: 'SET_STEP', step: 3 })}
        >
          Next →
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
      <h2 className="text-text-main font-bold text-3xl">Finalize your order</h2>
      
      <div className="bg-bg-card border border-border rounded-3xl p-10 flex flex-col gap-12 shadow-2xl">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="text-primary" size={24} />
            <h3 className="text-text-main font-bold text-xl">Set a deadline</h3>
          </div>
          <p className="text-text-muted text-sm">Rush order pricing applies for dates sooner than 72 hours in advance.</p>
          <input 
            type="date" 
            className="w-full bg-transparent border-b border-border py-3 text-text-main text-xl focus:outline-none focus:border-primary" 
            defaultValue={state.deadline}
          />
        </section>

        <section className="space-y-4">
          <label className="text-text-main font-bold text-xl">Project title</label>
          <input 
            type="text" 
            placeholder="My awesome project"
            className="w-full bg-transparent border-b border-border py-3 text-text-main text-2xl focus:outline-none focus:border-primary"
            onChange={(e) => dispatch({ type: 'SET_PROJECT_TITLE', title: e.target.value })}
          />
        </section>

        <section className="space-y-4">
          <label className="text-text-main font-bold text-xl leading-tight">Any additional requirements?</label>
          <textarea 
            placeholder="Add a note..."
            className="w-full bg-transparent border-b border-border py-3 text-text-main text-lg focus:outline-none focus:border-primary resize-none min-h-[120px]"
          ></textarea>
        </section>

        <section className="bg-bg-dark border border-border rounded-2xl p-8 space-y-6">
          <div className="space-y-1">
            <h4 className="text-text-main font-bold text-xl">Add a channel</h4>
            <p className="text-text-muted text-sm">Want to use the same tone, pace, and flow in future videos?</p>
          </div>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 py-3 px-8 rounded-xl font-bold">
            Edit Channel Defaults
          </Button>
        </section>

        <Button 
          fullWidth 
          className="py-5 text-xl font-bold rounded-2xl shadow-xl mt-4"
          disabled={!state.projectTitle}
          onClick={() => dispatch({ type: 'SET_STEP', step: 4 })}
        >
          Next
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in zoom-in duration-500 pb-24">
      <h2 className="text-text-main font-bold text-4xl tracking-tighter">Ready to create your order?</h2>

      <div className="bg-bg-card border border-border rounded-3xl p-10 shadow-2xl">
        <h3 className="text-text-main font-bold text-2xl mb-10 border-b border-border pb-6">Your project</h3>
        <div className="space-y-8">
          {state.services.map((instance, i) => {
            const service = SERVICE_CATALOG.find(c => c.key === instance.serviceKey);
            return (
              <div key={instance.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className="bg-primary/10 text-primary rounded-2xl w-12 h-12 flex items-center justify-center text-lg font-black shadow-inner">
                    {i + 1}
                  </div>
                  <span className="text-text-main font-bold text-xl">{service?.name}</span>
                </div>
                <span className="text-text-main font-black text-xl">{service?.price} cr</span>
              </div>
            );
          })}
        </div>

        <div className="mt-16 pt-10 border-t border-border flex items-center justify-between">
          <span className="text-text-main font-black text-3xl uppercase tracking-tighter">Total credits</span>
          <div className="text-right">
            <span className="text-text-muted text-xl mr-4 font-bold">(${totalCredits} USD)</span>
            <span className="text-primary font-black text-6xl">{totalCredits}</span>
          </div>
        </div>

        <div className="flex gap-6 mt-16">
          <button 
            className="w-1/3 border-2 border-border text-text-main rounded-2xl py-5 font-black uppercase tracking-widest hover:border-primary transition-all shadow-xl"
            onClick={() => navigate('/orders')}
          >
            Save & return
          </button>
          <Button 
            className="flex-1 py-5 text-2xl font-black rounded-2xl shadow-[0_20px_50px_rgba(225,29,72,0.3)] animate-pulse hover:animate-none"
            onClick={() => window.location.href = 'https://www.paypal.com/checkoutnow'}
          >
            Pay {totalCredits} credits
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 border-t border-border pt-10">
          {["🎧 Team Online 24/7", "⚡ Professional & Fast", "✓ Satisfaction Guarantee", "📈 10K+ Projects Complete"].map(b => (
            <div key={b} className="border border-border rounded-full px-6 py-2.5 text-text-muted text-[10px] font-black tracking-widest uppercase bg-bg-dark shadow-inner">
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 md:p-10 bg-bg-dark min-h-screen">
      {/* Progress Bar Header */}
      <div className="max-w-5xl mx-auto flex items-center gap-6 mb-16">
        <button 
          onClick={handleBack}
          className="p-3 bg-bg-card border border-border rounded-full text-primary hover:bg-bg-dark transition-all shadow-2xl active:scale-90"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 bg-bg-card border border-border rounded-[2rem] px-10 py-6 flex items-center justify-between shadow-2xl relative overflow-hidden">
          {steps.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                  state.step === i + 1 ? "text-text-main border-b-4 border-primary pb-1" : state.step > i + 1 ? "text-primary" : "text-text-muted"
                )}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-[2px] mx-6 transition-all duration-1000",
                  state.step > i + 1 ? "bg-primary shadow-[0_0_15px_primary]" : "bg-border"
                )}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {state.step === 1 && renderStep1()}
        {state.step === 2 && renderStep2()}
        {state.step === 3 && renderStep3()}
        {state.step === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default NewOrderPage;
