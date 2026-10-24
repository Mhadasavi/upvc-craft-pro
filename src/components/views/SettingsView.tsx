import React, { useState } from 'react';
import {
  AppSettings,
  BusinessProfile,
  Customer,
  Invoice,
  Quotation,
  QuotationNumberFormat,
  MeasurementUnit,
  ProfileFoilColor,
} from '../../types';
import {
  Settings,
  Save,
  Check,
  Building,
  CreditCard,
  ShieldCheck,
  FileText,
  Receipt,
  Package,
  Users,
  Calendar,
  Sparkles,
  HelpCircle,
  Clock,
  Percent,
  Plus,
  Trash2,
  RefreshCw,
  Database,
  Download,
  RotateCcw,
  Sun,
  Moon,
  Upload,
  Camera,
  Printer,
  Languages,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  formatQuotationNumber,
  getNextQuotationNumber,
  dateStringToIso,
  isoToDisplayDate,
  calculateValidUntilDate,
  getFinancialYearString,
} from '../../utils/calculations';
import { exportDatabaseBackup, clearAllStorageData } from '../../utils/storage';
import { ThemeMode } from '../../utils/theme';

type SettingsTab = 'quotation' | 'invoice' | 'product' | 'customer' | 'shop';

interface SettingsViewProps {
  profile: BusinessProfile;
  appSettings: AppSettings;
  quotations: Quotation[];
  invoices: Invoice[];
  customers?: Customer[];
  onUpdateProfile: (p: BusinessProfile) => void;
  onUpdateAppSettings: (s: AppSettings) => void;
  initialTab?: SettingsTab;
  theme?: ThemeMode;
  onSelectTheme?: (t: ThemeMode) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  appSettings,
  quotations,
  invoices,
  customers,
  onUpdateProfile,
  onUpdateAppSettings,
  initialTab = 'quotation',
  theme = 'light',
  onSelectTheme,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [profileData, setProfileData] = useState<BusinessProfile>(profile);
  const [settingsData, setSettingsData] = useState<AppSettings>(appSettings);
  const [isSaved, setIsSaved] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upvc_craft_pro_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all records to default demo data? This will clear locally stored custom quotes, invoices, and settings.'
      )
    ) {
      clearAllStorageData();
      window.location.reload();
    }
  };

  // Test date picker state for quotation date exploration
  const [testDateIso, setTestDateIso] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const handleProfileChange = (field: keyof BusinessProfile, value: any) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        if (dataUrl) {
          const updated = { ...profileData, companyLogoUrl: dataUrl };
          setProfileData(updated);
          onUpdateProfile(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCompanyLogo = () => {
    const updated = { ...profileData, companyLogoUrl: undefined };
    setProfileData(updated);
    onUpdateProfile(updated);
  };

  const handleUserAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        if (dataUrl) {
          const updated = { ...profileData, avatarUrl: dataUrl, logoUrl: dataUrl };
          setProfileData(updated);
          onUpdateProfile(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveUserAvatar = () => {
    const updated = { ...profileData, avatarUrl: undefined, logoUrl: undefined };
    setProfileData(updated);
    onUpdateProfile(updated);
  };

  const handleQuotationSettingChange = (field: keyof AppSettings['quotation'], value: any) => {
    setSettingsData((prev) => ({
      ...prev,
      quotation: {
        ...prev.quotation,
        [field]: value,
      },
    }));
  };

  const handleInvoiceSettingChange = (field: keyof AppSettings['invoice'], value: any) => {
    setSettingsData((prev) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        [field]: value,
      },
    }));
  };

  const handleProductSettingChange = (field: keyof AppSettings['product'], value: any) => {
    setSettingsData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        [field]: value,
      },
    }));
  };

  const handleCustomerSettingChange = (field: keyof AppSettings['customer'], value: any) => {
    setSettingsData((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value,
      },
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateProfile(profileData);
    onUpdateAppSettings(settingsData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleCustomTemplateChange = (val: string) => {
    // If user enters an example like JS-26-27-100, auto-detect the prefix and starting sequence
    const trailingNum = val.match(/^(.*?)(\d+)$/);
    if (trailingNum && !/{SEQ/i.test(val)) {
      const detectedSeq = parseInt(trailingNum[2], 10);
      const prefixMatch = trailingNum[1].match(/^[A-Za-z0-9]+/);
      setSettingsData((prev) => ({
        ...prev,
        quotation: {
          ...prev.quotation,
          customTemplate: val,
          startingSequence: detectedSeq,
          prefix: prefixMatch ? prefixMatch[0] : prev.quotation.prefix,
        },
      }));
    } else {
      handleQuotationSettingChange('customTemplate', val);
    }
  };

  // Real-time sequential preview of the next quotation numbers based on selected settings and test date
  const testDate = new Date(testDateIso);
  const { fullFY, shortFY } = getFinancialYearString(testDate);
  const startSeq = settingsData.quotation.startingSequence || 100;
  const quotePreview1 = formatQuotationNumber(
    startSeq,
    settingsData.quotation.numberFormat,
    settingsData.quotation.prefix,
    settingsData.quotation.customTemplate,
    testDate
  );
  const quotePreview2 = formatQuotationNumber(
    startSeq + 1,
    settingsData.quotation.numberFormat,
    settingsData.quotation.prefix,
    settingsData.quotation.customTemplate,
    testDate
  );
  const quotePreview3 = formatQuotationNumber(
    startSeq + 2,
    settingsData.quotation.numberFormat,
    settingsData.quotation.prefix,
    settingsData.quotation.customTemplate,
    testDate
  );

  const testValidUntil = calculateValidUntilDate(
    isoToDisplayDate(testDateIso),
    settingsData.quotation.defaultValidityDays || 30
  );

  const navTabs = [
    {
      id: 'quotation' as SettingsTab,
      label: language === 'hi' ? 'कोटेशन सेटिंग्स' : 'Quotation Settings',
      icon: FileText,
      badge: language === 'hi' ? 'क्रमांकन एवं तिथियां' : 'Numbering & Dates',
    },
    {
      id: 'invoice' as SettingsTab,
      label: language === 'hi' ? 'इनवॉइस एवं जीएसटी' : 'Invoice & GST',
      icon: Receipt,
      badge: language === 'hi' ? '18% जीएसटी / HSN' : '18% GST / HSN',
    },
    {
      id: 'product' as SettingsTab,
      label: language === 'hi' ? 'उत्पाद एवं दरें' : 'Product & Rates',
      icon: Package,
      badge: language === 'hi' ? 'डिफ़ॉल्ट विनिर्देश' : 'Defaults & Specs',
    },
    {
      id: 'customer' as SettingsTab,
      label: language === 'hi' ? 'ग्राहक डिफ़ॉल्ट्स' : 'Customer Defaults',
      icon: Users,
      badge: language === 'hi' ? 'शहर एवं व्हाट्सएप' : 'City & WhatsApp',
    },
    {
      id: 'shop' as SettingsTab,
      label: language === 'hi' ? 'दुकान की पहचान' : 'Shop Identity',
      icon: Building,
      badge: language === 'hi' ? 'जीएसटी एवं बैंक' : 'GSTIN & Bank',
    },
  ];

  return (
    <div className="max-w-[1520px] mx-auto p-6 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('settings.title')}</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {language === 'hi'
              ? 'कोटेशन क्रमांकन, कैलेंडर तिथियां, इनवॉइस नियम, उत्पाद डिफ़ॉल्ट्स एवं दुकान विवरण कॉन्फ़िगर करें'
              : 'Configure quotation numbering schemes, calendar dates, invoice rules, product defaults, and shop details'}
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          className="h-10 px-5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md cursor-pointer"
          type="button"
        >
          {isSaved ? <Check className="w-4 h-4 stroke-[3]" /> : <Save className="w-4 h-4" />}
          <span>
            {isSaved
              ? (language === 'hi' ? 'सभी सेटिंग्स सहेजी गईं!' : 'All Settings Saved!')
              : (language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes')}
          </span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-2xs flex flex-wrap gap-1.5">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              type="button"
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <div className="flex flex-col text-left">
                <span>{tab.label}</span>
                <span className={`text-[10px] font-normal leading-tight ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  {tab.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-view Content */}
      <div className="text-xs">
        {/* ========================================================= */}
        {/* VIEW 1: QUOTATION SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'quotation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Numbering Format Config */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    #
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Quotation Numbering Format</h3>
                    <p className="text-[11px] text-slate-500">Choose predefined sequential patterns or design your own</p>
                  </div>
                </div>
              </div>

              {/* Predefined Format Options */}
              <div className="flex flex-col gap-2.5">
                <label className="font-bold text-slate-800">Select Number Format Style</label>

                {/* Option 1: Calendar Year */}
                <label
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    settingsData.quotation.numberFormat === 'calendar-year'
                      ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="quoteFormat"
                      checked={settingsData.quotation.numberFormat === 'calendar-year'}
                      onChange={() => handleQuotationSettingChange('numberFormat', 'calendar-year')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Calendar Year (Current)</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                          {settingsData.quotation.prefix}-{new Date().getFullYear()}-1049
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Prefix + Full 4-digit Year + Serial Number (e.g., QUO-2026-1049)
                      </p>
                    </div>
                  </div>
                </label>

                {/* Option 2: Short Financial Year */}
                <label
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    settingsData.quotation.numberFormat === 'short-fy'
                      ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="quoteFormat"
                      checked={settingsData.quotation.numberFormat === 'short-fy'}
                      onChange={() => handleQuotationSettingChange('numberFormat', 'short-fy')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Indian Short FY</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          {settingsData.quotation.prefix}-{shortFY}-1049
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Prefix + 2-digit FY (April-March) + Serial (e.g., QUO-25-26-1049 or QUO-26-27-1049)
                      </p>
                    </div>
                  </div>
                </label>

                {/* Option 3: Full Financial Year */}
                <label
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    settingsData.quotation.numberFormat === 'full-fy'
                      ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="quoteFormat"
                      checked={settingsData.quotation.numberFormat === 'full-fy'}
                      onChange={() => handleQuotationSettingChange('numberFormat', 'full-fy')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Indian Full FY</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                          {settingsData.quotation.prefix}-{fullFY}-1049
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Prefix + Full 4-digit FY + Serial (e.g., QUO-2025-26-1049 or QUO-2026-27-1049)
                      </p>
                    </div>
                  </div>
                </label>

                {/* Option 4: Custom Pattern */}
                <label
                  className={`p-3 rounded-xl border flex flex-col gap-2.5 cursor-pointer transition-all ${
                    settingsData.quotation.numberFormat === 'custom'
                      ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="quoteFormat"
                      checked={settingsData.quotation.numberFormat === 'custom'}
                      onChange={() => handleQuotationSettingChange('numberFormat', 'custom')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Custom Format (User Defined)</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                          Custom Template
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Define your own company-specific pattern using tags like &#123;PREFIX&#125;, &#123;FY&#125;, &#123;SEQ&#125;
                      </p>
                    </div>
                  </div>

                  {settingsData.quotation.numberFormat === 'custom' && (
                    <div className="pt-2 pl-7 border-t border-slate-200/80 flex flex-col gap-2">
                      <label className="font-bold text-slate-800 text-[11px]">Template String</label>
                      <input
                        type="text"
                        value={settingsData.quotation.customTemplate}
                        onChange={(e) => handleCustomTemplateChange(e.target.value)}
                        placeholder="e.g. JS-26-27-100 or {PREFIX}-{FY_SHORT}-{SEQ:3}"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <div className="text-[10px] text-slate-500 flex flex-wrap gap-1.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">&#123;PREFIX&#125;</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">&#123;YYYY&#125;</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">&#123;FY&#125; (2025-26)</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">&#123;FY_SHORT&#125; (25-26)</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">&#123;SEQ&#125;</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">&#123;SEQ:3&#125; (100)</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 font-medium">
                        💡 <strong>Smart Sequential Detection:</strong> Typing an example like <code className="font-bold bg-white px-1 py-0.5 rounded">JS-26-27-100</code> automatically sets the prefix to <strong>JS</strong> and starting sequence to <strong>100</strong>. Each new quote advances sequentially (100 → 101 → 102).
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Prefix and Starting Sequence */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Quotation Prefix</label>
                  <input
                    type="text"
                    value={settingsData.quotation.prefix}
                    onChange={(e) => handleQuotationSettingChange('prefix', e.target.value.toUpperCase())}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="QUO"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Starting Sequence #</label>
                  <input
                    type="number"
                    value={settingsData.quotation.startingSequence}
                    onChange={(e) => handleQuotationSettingChange('startingSequence', parseInt(e.target.value, 10) || 1)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Live Sequential Progression Preview Box */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col gap-2 shadow-md">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Sequential Auto-Increment Preview
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Database Isolated Series
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">1st Quote:</span>
                    <span className="font-mono text-sm font-bold text-blue-400">{quotePreview1}</span>
                  </div>
                  <span className="text-slate-500 font-bold">&rarr;</span>
                  <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">2nd Quote:</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{quotePreview2}</span>
                  </div>
                  <span className="text-slate-500 font-bold">&rarr;</span>
                  <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">3rd Quote:</span>
                    <span className="font-mono text-sm font-bold text-amber-400">{quotePreview3}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-1.5">
                  Every time you hit <span className="text-white font-semibold">"Save Quote"</span>, the next quotation created automatically receives the incremented number without duplicate conflicts.
                </div>
              </div>
            </div>

            {/* Quotation Dates & Calendar Configuration */}
            <div className="flex flex-col gap-6">
              {/* Date & Validity Picker Section */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Quotation Date &amp; Validity</h3>
                      <p className="text-[11px] text-slate-500">Pick any date with calendar popup and configure validity days</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  {/* Calendar Date Exploration */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Interactive Calendar Date Picker</span>
                      </label>
                      <span className="text-[11px] font-mono text-slate-500">Click to open calendar</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Select Date (Calendar View)
                        </label>
                        <input
                          type="date"
                          value={testDateIso}
                          onChange={(e) => setTestDateIso(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Formatted Display
                        </label>
                        <div className="h-10 px-3 rounded-lg border border-slate-200 bg-white flex items-center font-bold text-slate-800 text-xs">
                          {isoToDisplayDate(testDateIso)}
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Quick Dates:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          setTestDateIso(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const yesterday = new Date(Date.now() - 86400000);
                          setTestDateIso(`${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`);
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>

                  {/* Validity Period in Days */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Default Validity (Days)</span>
                      </label>
                      <select
                        value={settingsData.quotation.defaultValidityDays}
                        onChange={(e) => handleQuotationSettingChange('defaultValidityDays', parseInt(e.target.value, 10))}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value={15}>15 Days</option>
                        <option value={30}>30 Days (Standard)</option>
                        <option value={45}>45 Days</option>
                        <option value={60}>60 Days</option>
                        <option value={90}>90 Days</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Calculated Valid Until</label>
                      <div className="h-9 px-3 rounded-lg border border-slate-200 bg-emerald-50/70 text-emerald-900 font-bold flex items-center">
                        {testValidUntil}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Default Delivery Timeline</label>
                    <input
                      type="text"
                      value={settingsData.quotation.defaultDeliveryTimeline}
                      onChange={(e) => handleQuotationSettingChange('defaultDeliveryTimeline', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Default Payment Milestone Terms</label>
                    <input
                      type="text"
                      value={settingsData.quotation.defaultPaymentTerms}
                      onChange={(e) => handleQuotationSettingChange('defaultPaymentTerms', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1 flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Default Print Template</span>
                    </label>
                    <select
                      value={settingsData.quotation.defaultTemplate || 'architectural'}
                      onChange={(e) => handleQuotationSettingChange('defaultTemplate', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="architectural">📐 Architectural CAD Specification (Vector Elevations &amp; Dimensions)</option>
                      <option value="compact">📋 Executive B2B Schedule (Dense Table for Contractors &amp; BOQs)</option>
                      <option value="premium">✨ Luxury Client Proposal (Navy &amp; Gold Presentation with Badges)</option>
                      <option value="workshop">🔨 Workshop Fabrication &amp; Site Slip (Cutting Specs &amp; Zero Pricing)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Warranty & Terms Clauses */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Standard Warranty &amp; Site Clauses</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newTerms = [...profileData.termsAndConditions, 'New warranty or scope clause'];
                      handleProfileChange('termsAndConditions', newTerms);
                    }}
                    className="h-7 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Clause</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {profileData.termsAndConditions.map((term, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 font-bold w-4 shrink-0">{idx + 1}.</span>
                      <input
                        type="text"
                        className="flex-1 h-8 px-2.5 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        value={term}
                        onChange={(e) => {
                          const newTerms = [...profileData.termsAndConditions];
                          newTerms[idx] = e.target.value;
                          handleProfileChange('termsAndConditions', newTerms);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newTerms = profileData.termsAndConditions.filter((_, i) => i !== idx);
                          handleProfileChange('termsAndConditions', newTerms);
                        }}
                        className="w-7 h-7 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Local Database & Persistent Storage Card */}
            <div className="col-span-full bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Database &amp; Persistent Offline Storage</h3>
                    <p className="text-[11px] text-slate-500">Quotations, invoices, custom templates, and sequence counters survive browser refreshes</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Persistent Database Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xl font-bold font-mono text-slate-900">{quotations.length}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Quotations in Database</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xl font-bold font-mono text-slate-900">{invoices.length}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Invoices in Database</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xl font-bold font-mono text-slate-900">{customers ? customers.length : '10+'}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Customers in Database</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 max-w-lg">
                  Every quote you save is automatically indexed. When you create your next quotation, the system increments the sequence without duplicate collision.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Export Database Backup (JSON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="h-8 px-3 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Demo Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: INVOICE & GST SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'invoice' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Tax Invoice Numbering &amp; Defaults</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={settingsData.invoice.prefix}
                    onChange={(e) => handleInvoiceSettingChange('prefix', e.target.value.toUpperCase())}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Next Sequence #</label>
                  <input
                    type="number"
                    value={settingsData.invoice.startingSequence}
                    onChange={(e) => handleInvoiceSettingChange('startingSequence', parseInt(e.target.value, 10) || 1)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-slate-500" />
                    <span>Default GST Rate (%)</span>
                  </label>
                  <input
                    type="number"
                    value={settingsData.invoice.defaultGstRate}
                    onChange={(e) => handleInvoiceSettingChange('defaultGstRate', parseFloat(e.target.value) || 18)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Default HSN / SAC Code</label>
                  <input
                    type="text"
                    value={settingsData.invoice.hsnCode}
                    onChange={(e) => handleInvoiceSettingChange('hsnCode', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Payment Credit Due Period</label>
                <select
                  value={settingsData.invoice.defaultDueDays}
                  onChange={(e) => handleInvoiceSettingChange('defaultDueDays', parseInt(e.target.value, 10))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value={7}>7 Days from Invoice Date</option>
                  <option value={14}>14 Days (Standard)</option>
                  <option value={30}>30 Days Net</option>
                  <option value={0}>Immediate Payment on Handover</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Default Invoice Print Template</span>
                </label>
                <select
                  value={settingsData.invoice.defaultTemplate || 'standard'}
                  onChange={(e) => handleInvoiceSettingChange('defaultTemplate', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="standard">📄 Standard Official GST Tax Invoice (Statutory Layout)</option>
                  <option value="compact">📋 Executive B2B Commercial Invoice (High-Density Corporate)</option>
                  <option value="premium">✨ Luxury Branded Tax Bill (Emblem Banner &amp; Warranty Seal)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Sample Next Invoice:</span>
                <span className="font-mono text-sm font-bold text-emerald-800">
                  {settingsData.invoice.prefix}-{new Date().getFullYear()}-{String(settingsData.invoice.startingSequence).padStart(3, '0')}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Tax Invoice Declaration</h3>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Statutory Invoice Declaration</label>
                <textarea
                  rows={4}
                  value={settingsData.invoice.declaration}
                  onChange={(e) => handleInvoiceSettingChange('declaration', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-900 text-[11px]">
                <strong>Note:</strong> Under GST laws in India, uPVC and Aluminium windows &amp; doors are classified under <strong>HSN 7610</strong> and standard GST is 18% (9% CGST + 9% SGST for intra-state, or 18% IGST for inter-state transactions).
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: PRODUCT & FABRICATION DEFAULTS */}
        {/* ========================================================= */}
        {activeTab === 'product' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Studio &amp; CAD Measurement Defaults</h3>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Default Measurement Unit</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['in', 'mm', 'ft'] as MeasurementUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleProductSettingChange('defaultUnit', u)}
                      className={`h-9 rounded-lg border font-bold text-xs uppercase cursor-pointer transition-all ${
                        settingsData.product.defaultUnit === u
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {u === 'in' ? 'Inches (in)' : u === 'mm' ? 'Millimeters (mm)' : 'Feet (ft)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Default Profile Brand</label>
                <input
                  type="text"
                  value={settingsData.product.defaultProfileBrand}
                  onChange={(e) => handleProductSettingChange('defaultProfileBrand', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Default Glass Specification</label>
                <input
                  type="text"
                  value={settingsData.product.defaultGlassPackage}
                  onChange={(e) => handleProductSettingChange('defaultGlassPackage', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Default Profile Foil Color</label>
                <select
                  value={settingsData.product.defaultColorFoil}
                  onChange={(e) => handleProductSettingChange('defaultColorFoil', e.target.value as ProfileFoilColor)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="white">High Gloss White</option>
                  <option value="wooden">Golden Oak / Walnut Wooden</option>
                  <option value="grey">Anthracite Grey</option>
                </select>
              </div>
            </div>

            {/* Accessory Unit Rates */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Percent className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Standard Add-On Fabrication Surcharges</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">GI Reinforcement (₹/sq.ft)</label>
                  <input
                    type="number"
                    value={settingsData.product.reinforcementRatePerSqFt}
                    onChange={(e) => handleProductSettingChange('reinforcementRatePerSqFt', parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Georgian Bars (₹/sq.ft)</label>
                  <input
                    type="number"
                    value={settingsData.product.georgianBarsRatePerSqFt}
                    onChange={(e) => handleProductSettingChange('georgianBarsRatePerSqFt', parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Site Fitting &amp; Fix (₹/sq.ft)</label>
                  <input
                    type="number"
                    value={settingsData.product.siteFittingRatePerSqFt}
                    onChange={(e) => handleProductSettingChange('siteFittingRatePerSqFt', parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">SS304 Mosquito Mesh (₹/sq.ft)</label>
                  <input
                    type="number"
                    value={settingsData.product.mosquitoMeshRatePerSqFt}
                    onChange={(e) => handleProductSettingChange('mosquitoMeshRatePerSqFt', parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Corner Welding Burn-off Allowance (mm)</label>
                <input
                  type="number"
                  value={settingsData.product.weldAllowanceMm}
                  onChange={(e) => handleProductSettingChange('weldAllowanceMm', parseInt(e.target.value, 10) || 6)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">Standard deduction added to cut-list for mitre welding (typically 6mm: 3mm per side).</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: CUSTOMER DEFAULTS & WHATSAPP */}
        {/* ========================================================= */}
        {activeTab === 'customer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Regional &amp; Customer Defaults</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Default City</label>
                  <input
                    type="text"
                    value={settingsData.customer.defaultCity}
                    onChange={(e) => handleCustomerSettingChange('defaultCity', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Default State</label>
                  <input
                    type="text"
                    value={settingsData.customer.defaultState}
                    onChange={(e) => handleCustomerSettingChange('defaultState', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div>
                  <span className="font-bold text-slate-900 block">Automatic GSTIN Verification</span>
                  <span className="text-[11px] text-slate-500">Auto-detect state, entity type and PAN during customer entry</span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsData.customer.autoVerifyGst}
                  onChange={(e) => handleCustomerSettingChange('autoVerifyGst', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* WhatsApp Template */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="text-base">💬</span>
                <h3 className="text-sm font-bold text-slate-900">WhatsApp Notification Template</h3>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Default Sharing Message</label>
                <textarea
                  rows={4}
                  value={settingsData.customer.whatsappTemplate}
                  onChange={(e) => handleCustomerSettingChange('whatsappTemplate', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-1.5">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">&#123;NAME&#125;</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">&#123;QUOTE_NO&#125;</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">&#123;AMOUNT&#125;</span>
                </div>
              </div>
            </div>

            {/* Local Database & Persistent Storage Card */}
            <div className="col-span-full bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Database &amp; Persistent Offline Storage</h3>
                    <p className="text-[11px] text-slate-500">Quotations, invoices, custom templates, and sequence counters survive browser refreshes</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Persistent Database Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xl font-bold font-mono text-slate-900">{quotations.length}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Quotations in Database</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xl font-bold font-mono text-slate-900">{invoices.length}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Invoices in Database</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xl font-bold font-mono text-slate-900">{customers ? customers.length : '10+'}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Customers in Database</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 max-w-lg">
                  Every quote you save is automatically indexed. When you create your next quotation, the system increments the sequence without duplicate collision.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Export Database Backup (JSON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="h-8 px-3 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Demo Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: SHOP IDENTITY & TAX */}
        {/* ========================================================= */}
        {activeTab === 'shop' && (
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Identity */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Shop Identity &amp; Tax Registration</h3>
              </div>

              <div className="flex flex-col gap-4">
                {/* 1. Official Company Logo (For Print & Invoices) */}
                <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-16 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-blue-300 dark:border-blue-700 flex items-center justify-center overflow-hidden shadow-xs">
                      {profileData.companyLogoUrl ? (
                        <img
                          src={profileData.companyLogoUrl}
                          alt="Company Logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-blue-500 text-center p-1">
                          <Building className="w-5 h-5 opacity-70 mb-0.5" />
                          <span className="text-[9.5px] font-bold uppercase tracking-wider">No Logo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Company Logo / Brand Emblem
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                        Prints on Documents
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                      {profileData.companyLogoUrl
                        ? 'Official company emblem active. Printed on all quotation sheets, bills, and PDF downloads.'
                        : 'Upload your fabrication shop emblem or brand logo. This will be printed on all Quotations, Tax Invoices, and PDFs.'}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <label className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{profileData.companyLogoUrl ? 'Change Company Logo' : 'Upload Company Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCompanyLogoUpload}
                        />
                      </label>

                      {profileData.companyLogoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveCompanyLogo}
                          className="h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 dark:text-slate-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Remove company logo from printed documents"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. User Profile Picture (In-App Only) */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md overflow-hidden border-2 border-white dark:border-slate-700">
                      {profileData.avatarUrl || profileData.logoUrl ? (
                        <img
                          src={profileData.avatarUrl || profileData.logoUrl}
                          alt={profileData.ownerName || 'User Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        profileData.ownerName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'SB'
                      )}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-0.5">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        User Profile Picture
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        In-App Only
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                      {profileData.avatarUrl || profileData.logoUrl
                        ? 'Displays in the top blue navigation circle. Never printed on quotations or bills.'
                        : 'Currently displaying initials (' +
                          (profileData.ownerName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase() || 'SB') +
                          '). Visible only in the app header, never printed on customer documents.'}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <label className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{profileData.avatarUrl || profileData.logoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleUserAvatarUpload}
                        />
                      </label>

                      {(profileData.avatarUrl || profileData.logoUrl) && (
                        <button
                          type="button"
                          onClick={handleRemoveUserAvatar}
                          className="h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 dark:text-slate-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Remove photo and revert to initials in app"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Fabrication Shop Name</label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={profileData.shopName}
                    onChange={(e) => handleProfileChange('shopName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tagline / Business Subtitle</label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={profileData.tagline}
                    onChange={(e) => handleProfileChange('tagline', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Owner / Estimator Name</label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={profileData.ownerName}
                      onChange={(e) => handleProfileChange('ownerName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Role Title</label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={profileData.role}
                      onChange={(e) => handleProfileChange('role', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Mobile / WhatsApp Number</label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={profileData.mobile}
                      onChange={(e) => handleProfileChange('mobile', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Official GSTIN Number</label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={profileData.gstin}
                      onChange={(e) => handleProfileChange('gstin', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Factory / Workshop Address</label>
                  <textarea
                    rows={2}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={profileData.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Banking Details */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Bank Accounts &amp; UPI VPA</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={profileData.bankName}
                    onChange={(e) => handleProfileChange('bankName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Account Number</label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={profileData.accountNo}
                    onChange={(e) => handleProfileChange('accountNo', e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={profileData.ifscCode}
                    onChange={(e) => handleProfileChange('ifscCode', e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">UPI VPA Handle</label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={profileData.upiId}
                    onChange={(e) => handleProfileChange('upiId', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Visual Theme & Appearance Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4 lg:col-span-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <h3 className="text-sm font-bold text-slate-900">Application Theme &amp; Visual Appearance</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Currently active: <strong className="text-blue-600 uppercase">{theme} Mode</strong>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose your preferred workspace display mode. You can also toggle light/dark mode at any time using the button in the top header or the bottom of the sidebar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectTheme && onSelectTheme('light')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Light Mode</span>
                      {theme === 'light' && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Clean high-contrast interface tailored for bright daytime workshop offices and estimation.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTheme && onSelectTheme('dark')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-slate-800 text-white shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-slate-800 text-blue-400 shrink-0 border border-slate-700">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Dark Mode</span>
                      {theme === 'dark' && (
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-1.5 py-0.2 rounded font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Deep navy workspace reducing glare and eye strain during evening fabrication management.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Application Language / भाषा Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4 lg:col-span-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">{t('settings.languageTitle')}</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {language === 'hi' ? 'वर्तमान में सक्रिय: ' : 'Currently active: '}
                  <strong className="text-blue-600 uppercase">{language === 'hi' ? 'हिंदी (Hindi)' : 'English'}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {t('settings.languageDesc')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                    language === 'en'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 font-bold font-mono text-xs">
                    EN
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">English</span>
                      {language === 'en' && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {t('settings.langEnDesc')}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                    language === 'hi'
                      ? 'border-blue-600 bg-amber-50/50 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 font-bold font-mono text-xs">
                    हिं
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">हिंदी (Hindi)</span>
                      {language === 'hi' && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                          सक्रिय (Active)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {t('settings.langHiDesc')}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
