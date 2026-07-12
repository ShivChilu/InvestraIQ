import { ShieldCheck, Globe, Link, TrendingUp, Briefcase, FileText, MapPin, Building, Landmark } from 'lucide-react';

export function VerifiedProfileCard({ profile }) {
  if (!profile) return null;

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

  // Robust check to filter out all unavailable placeholders
  const isVerified = (field) => {
    if (!field || !field.value) return false;
    const val = String(field.value).trim().toLowerCase();
    
    return !(
      val === '' ||
      val === 'unknown' ||
      val === 'n/a' ||
      val === 'none' ||
      val === 'not available' ||
      val === 'null' ||
      val === 'undefined' ||
      val.includes('information not available') ||
      val.includes('no official website found') ||
      val.includes('no linkedin page found') ||
      val.includes('no investor relations page found') ||
      val.includes('no newsroom page found') ||
      val.includes('no verified information') ||
      val.includes('verified information unavailable') ||
      val.startsWith('verified info') ||
      val.includes('no official page found') ||
      val.includes('no page found')
    );
  };

  const renderVerifiedLink = (label, field, icon) => {
    if (!isVerified(field)) return null; // Hide completely if unavailable
    const Icon = icon;

    return (
      <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850/60 flex flex-col justify-between hover:border-slate-800 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-bold">
            <Icon size={12} className="text-slate-400" />
            {label}
          </span>
          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck size={9} />
            <span>Verified Link</span>
          </span>
        </div>

        <div className="min-h-8 flex items-center">
          <a 
            href={field.value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-emerald-400 hover:text-emerald-350 underline font-semibold truncate max-w-full block"
          >
            {field.value}
          </a>
        </div>
      </div>
    );
  };

  // Check if there is any data to render in the card
  const hasHQ = isVerified(headquarters);
  const hasIndustry = isVerified(industry) || isVerified(sector);
  const hasOwnership = isVerified(companyType);
  const hasDesc = isVerified(description);
  
  const hasLinks = isVerified(officialWebsite) || 
                   isVerified(linkedin) || 
                   isVerified(investorRelations) || 
                   isVerified(careers) || 
                   isVerified(newsroom);

  // If no fields are verified, hide the entire profile section
  if (!hasHQ && !hasIndustry && !hasOwnership && !hasDesc && !hasLinks) {
    return null;
  }

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
          <h3 className="font-bold text-sm text-white font-outfit">
            {isVerified(companyName) ? `Profile: ${companyName.value}` : 'Company Details'}
          </h3>
          <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest block uppercase">
            AUDITED BY AI VERIFICATION AGENT
          </span>
        </div>
      </div>

      {/* Basic Profile Details Grid */}
      {(hasHQ || hasIndustry || hasOwnership) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Headquarters */}
          {hasHQ && (
            <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850/30 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Corporate HQ</span>
                <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                  <span>{headquarters.value}</span>
                </span>
              </div>
            </div>
          )}

          {/* Sector / Industry */}
          {hasIndustry && (
            <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850/30 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Sector / Industry</span>
                <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Building size={13} className="text-slate-400 flex-shrink-0" />
                  <span>
                    {isVerified(sector) && sector.value !== industry?.value
                      ? `${sector.value} / ${industry?.value || ''}`
                      : (industry?.value || sector.value)}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Company Type */}
          {hasOwnership && (
            <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850/30 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Ownership Structure</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Landmark size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="uppercase">{companyType.value} Entity</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {hasDesc && (
        <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850/30 mb-6">
          <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1.5">Business Overview & Mission</span>
          <p className="text-xs text-slate-350 leading-relaxed font-medium">
            {description.value}
          </p>
        </div>
      )}

      {/* Verified Links Grid */}
      {hasLinks && (
        <div id="tour-external-sources">
          <h4 className="text-[10px] font-mono text-slate-450 uppercase mb-3 tracking-wider font-bold">
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
      )}
    </div>
  );
}

export default VerifiedProfileCard;
