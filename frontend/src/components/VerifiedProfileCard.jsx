import { ShieldCheck, Info, Globe, Link, TrendingUp, Briefcase, FileText, MapPin, Building, Landmark } from 'lucide-react';

export function VerifiedProfileCard({ profile }) {
  const {
    companyName,
    officialWebsite,
    linkedin,
    investorRelations,
    careers,
    newsroom,
    headquarters,
    sector,
    industry,
    companyType,
    description
  } = profile;

  // Helper to check if field is valid
  const isVerified = (field) => {
    return field && 
           field.value && 
           field.value !== 'Unknown' && 
           field.value !== 'Verified information unavailable.' && 
           !field.value.startsWith('Verified info');
  };

  const renderVerifiedLink = (label, field, icon) => {
    const Icon = icon;
    const isValid = isVerified(field);

    return (
      <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850/60 flex flex-col justify-between hover:border-slate-800 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Icon size={12} className="text-slate-400" />
            {label}
          </span>
          {isValid ? (
            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={9} />
              <span>Verified Source</span>
            </span>
          ) : (
            <span className="text-[9px] font-mono text-slate-600 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded-full">
              Unavailable
            </span>
          )}
        </div>

        <div className="min-h-8 flex items-center">
          {isValid ? (
            <a 
              href={field.value} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-emerald-400 hover:text-emerald-350 underline font-semibold truncate max-w-full block"
            >
              {field.value}
            </a>
          ) : (
            <span className="text-xs text-rose-450 italic font-mono text-[10px]">
              {field?.value || 'Verified information unavailable.'}
            </span>
          )}
        </div>

        {isValid && (
          <div className="mt-3 pt-2.5 border-t border-slate-900 text-[9px] font-mono text-slate-500 space-y-0.5">
            <div><span className="text-slate-600">Retrieved From:</span> {field.retrievedFrom}</div>
            <div><span className="text-slate-600">Verified By:</span> {field.verifiedBy}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="tour-company-profile" className="glass-panel p-6 mb-8 relative overflow-hidden border border-emerald-500/10">
      {/* Background visual indicator */}
      <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none">
        <ShieldCheck size={140} className="text-emerald-400" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-850 pb-4 mb-6">
        <div className="bg-emerald-500/15 p-2 rounded-lg text-emerald-400 border border-emerald-500/20">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h3 className="font-bold text-sm text-white font-outfit">Verified Profile: {companyName.value}</h3>
          <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest block uppercase">
            AUDITED BY AI VERIFICATION AGENT • HTTP STATUS VERIFIER
          </span>
        </div>
      </div>

      {/* Basic Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* Headquarters */}
        <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850/30 flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Corporate HQ</span>
            {isVerified(headquarters) ? (
              <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                <span>{headquarters.value}</span>
              </span>
            ) : (
              <span className="text-xs text-rose-450 italic font-mono text-[10px]">
                {headquarters?.value || 'Verified information unavailable.'}
              </span>
            )}
          </div>
          {isVerified(headquarters) && (
            <div className="mt-4 pt-2 border-t border-slate-900/50 text-[8px] font-mono text-slate-500">
              Retrieved: {headquarters.retrievedFrom}
            </div>
          )}
        </div>

        {/* Industry */}
        <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850/30 flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Sector / Industry</span>
            {isVerified(industry) ? (
              <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Building size={13} className="text-slate-400 flex-shrink-0" />
                <span>
                  {isVerified(sector) && sector.value !== industry.value
                    ? `${sector.value} / ${industry.value}`
                    : industry.value}
                </span>
              </span>
            ) : (
              <span className="text-xs text-rose-450 italic font-mono text-[10px]">
                {industry?.value || 'Verified information unavailable.'}
              </span>
            )}
          </div>
          {isVerified(industry) && (
            <div className="mt-4 pt-2 border-t border-slate-900/50 text-[8px] font-mono text-slate-500">
              Retrieved: {industry.retrievedFrom}
            </div>
          )}
        </div>

        {/* Company Type */}
        <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850/30 flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Ownership Structure</span>
            {isVerified(companyType) ? (
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <Landmark size={13} className="text-slate-400 flex-shrink-0" />
                <span className="uppercase">{companyType.value} Entity</span>
              </span>
            ) : (
              <span className="text-xs text-rose-450 italic font-mono text-[10px]">
                {companyType?.value || 'Verified information unavailable.'}
              </span>
            )}
          </div>
          {isVerified(companyType) && (
            <div className="mt-4 pt-2 border-t border-slate-900/50 text-[8px] font-mono text-slate-500">
              Retrieved: {companyType.retrievedFrom}
            </div>
          )}
        </div>

      </div>

      {/* Description */}
      <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850/30 mb-6">
        <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1.5">Business Overview & Mission</span>
        {isVerified(description) ? (
          <p className="text-xs text-slate-350 leading-relaxed font-medium">
            {description.value}
          </p>
        ) : (
          <p className="text-xs text-rose-450 italic font-mono text-[10px]">
            {description?.value || 'Verified information unavailable.'}
          </p>
        )}
        {isVerified(description) && (
          <div className="mt-3 pt-2 border-t border-slate-900/50 text-[8px] font-mono text-slate-550 flex items-center gap-1.5">
            <Info size={10} />
            <span>Retrieved from: {description.retrievedFrom} • Verified by: {description.verifiedBy}</span>
          </div>
        )}
      </div>

      {/* Verified Links Grid */}
      <div id="tour-external-sources">
        <h4 className="text-[10px] font-mono text-slate-450 uppercase mb-3 tracking-wider">
          Audited External Channels & Landing Pages
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {renderVerifiedLink('Official Web', officialWebsite, Globe)}
          {renderVerifiedLink('LinkedIn Page', linkedin, Link)}
          {renderVerifiedLink('Investor Relations', investorRelations, TrendingUp)}
          {renderVerifiedLink('Careers / Jobs', careers, Briefcase)}
          {renderVerifiedLink('Corporate News', newsroom, FileText)}
        </div>
      </div>
    </div>
  );
}
export default VerifiedProfileCard;
