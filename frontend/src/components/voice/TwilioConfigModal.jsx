import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  X, 
  Key, 
  Smartphone, 
  Send, 
  RefreshCw,
  Volume2,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  apiGetVoiceStatus, 
  apiSaveTwilioConfig, 
  apiTestTwilioDispatch 
} from '../../services/api';
import { soundEffects } from '../../lib/audio';

export default function TwilioConfigModal({ isOpen, onClose, onConfigSaved, onConfigUpdated }) {
  const [status, setStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Form Inputs
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // Live Test Dispatch
  const [testToPhone, setTestToPhone] = useState('+919876500000');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // In-Browser Audio Player
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await apiGetVoiceStatus();
      setStatus(data);
      if (data?.fromPhone && !phoneNumber) {
        setPhoneNumber(data.fromPhone);
      }
    } catch (e) {
      console.warn('Error fetching status:', e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setSaveSuccessMsg('');
      setSaveErrorMsg('');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Save Credentials
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    if (!accountSid.trim().startsWith('AC')) {
      setSaveErrorMsg('Twilio Account SID must start with "AC" (found on console.twilio.com).');
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiSaveTwilioConfig({
        accountSid: accountSid.trim(),
        authToken: authToken.trim(),
        phoneNumber: phoneNumber.trim()
      });

      soundEffects.playSuccessChime();
      setSaveSuccessMsg(res.message || 'Twilio credentials verified and connected successfully!');
      fetchStatus();
      if (onConfigSaved) onConfigSaved();
      if (onConfigUpdated) onConfigUpdated();
    } catch (err) {
      soundEffects.playErrorBuzzer();
      setSaveErrorMsg(err.message || 'Failed to verify Twilio credentials. Check your SID and Token.');
    } finally {
      setIsSaving(false);
    }
  };

  // Test Live Dispatch (Call or SMS)
  const handleTestDispatch = async (channelType) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await apiTestTwilioDispatch({
        to: testToPhone,
        type: channelType
      });
      setTestResult(res);
      if (res.success) {
        soundEffects.playSuccessChime();
      } else {
        soundEffects.playErrorBuzzer();
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message
      });
      soundEffects.playErrorBuzzer();
    } finally {
      setIsTesting(false);
    }
  };

  // Play Voicemail via browser speech synthesis
  const handlePlaySampleVoicemail = () => {
    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support audio speech synthesis.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const text = 'Hello Valued Shopper, this is SmartMart Supermarket with an exciting announcement! Weekend Harvest 30 percent discount is now live with code FRESH30. Order online with 15-minute doorstep delivery or visit our express store. Thank you and have a wonderful day!';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Pick Indian English voice if available, else standard English
    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India') || v.lang === 'en-GB');
    if (indVoice) utterance.voice = indVoice;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-amber-400 border border-indigo-500/30">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Twilio Voice &amp; SMS Setup &amp; Diagnostics
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  status?.isLiveConfigured 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-amber-400 text-slate-950'
                }`}>
                  {status?.isLiveConfigured ? 'Live Carrier Active' : 'Simulation Mode'}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Configure real carrier phone calls and SMS notifications via Twilio Cloud Telephony.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-900 dark:text-gray-100 flex-1">

          {/* Current Connection Status Box */}
          <div className={`p-4 rounded-2xl border ${
            status?.isLiveConfigured
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {status?.isLiveConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-extrabold text-sm flex items-center gap-2">
                    {status?.isLiveConfigured ? 'Twilio Connected & Ready' : 'Running in Simulation Mode (No Real Calls Yet)'}
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {status?.isLiveConfigured ? (
                      <>Connected to account: <strong>{status.verification?.accountName}</strong> ({status.verification?.accountType}). Outbound caller: <strong>{status.fromPhone}</strong>.</>
                    ) : (
                      <>You can simulate audio deals and test the app without spending balance. To make physical phone calls ring on actual mobile devices and send live SMS, connect your Twilio keys below.</>
                    )}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={fetchStatus}
                className="text-[11px] font-bold h-7 px-2 shrink-0 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>

          {/* In-Browser Voicemail Audio Demonstration */}
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-600 text-white">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-purple-900 dark:text-purple-200 block">
                  Listen to Automated Voicemail Speech
                </span>
                <span className="text-[11px] text-purple-700 dark:text-purple-300">
                  Hear the actual voice script spoken by the AI assistant right now in your browser.
                </span>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handlePlaySampleVoicemail}
              className={`text-xs font-black h-9 px-4 rounded-xl shadow-xs flex items-center gap-1.5 transition-all ${
                isPlayingAudio 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingAudio ? '⏹ Stop Speaking' : '▶️ Play Voicemail Audio'}</span>
            </Button>
          </div>

          {/* Credentials Setup Form */}
          <form onSubmit={handleSaveConfig} className="space-y-4 p-5 bg-gray-50 dark:bg-slate-800/60 rounded-3xl border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-primary-600" />
                Connect Your Twilio Account
              </div>
              <a
                href="https://console.twilio.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-primary-600 hover:underline flex items-center gap-1"
              >
                <span>Twilio Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Find these in your Twilio Console home dashboard under <strong>"Account Info"</strong>. Entering them here automatically validates and updates <code className="font-mono font-bold bg-gray-200 dark:bg-slate-700 px-1 py-0.5 rounded">backend/.env</code>.
            </p>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {saveErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold text-xs flex items-center gap-2 animate-in zoom-in-95">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Account SID */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Twilio Account SID (Starts with AC...)
                </label>
                <Input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={accountSid}
                  onChange={(e) => setAccountSid(e.target.value)}
                  className="font-mono text-xs h-10 font-bold rounded-xl"
                  required
                />
              </div>

              {/* Auth Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Twilio Auth Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAuthToken(!showAuthToken)}
                    className="text-[10px] font-bold text-primary-600 hover:underline"
                  >
                    {showAuthToken ? 'Hide Token' : 'Show Token'}
                  </button>
                </div>
                <Input
                  type={showAuthToken ? 'text' : 'password'}
                  placeholder="Your 32-character Auth Token"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="font-mono text-xs h-10 font-bold rounded-xl"
                  required
                />
              </div>

              {/* Twilio Phone Number */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Twilio Outbound Phone Number (E.164, e.g. +1800... or +1...)
                </label>
                <Input
                  type="text"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="font-mono text-xs h-10 font-bold rounded-xl"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Purchased in Twilio Console under Phone Numbers &gt; Manage &gt; Active Numbers.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-primary-600 hover:bg-primary-700 text-white font-black text-xs h-10 px-5 rounded-xl shadow-md flex items-center gap-1.5"
              >
                {isSaving ? 'Verifying with Twilio...' : 'Verify & Save Credentials'}
              </Button>
            </div>
          </form>

          {/* Quick Live Network Test */}
          <div className="p-5 bg-gray-50 dark:bg-slate-800/60 rounded-3xl border border-gray-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Test Live Call or SMS on Your Device
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Enter your personal mobile number below to trigger an immediate live test.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Input
                type="tel"
                placeholder="+919876543210"
                value={testToPhone}
                onChange={(e) => setTestToPhone(e.target.value)}
                className="font-mono text-xs h-10 font-bold rounded-xl flex-1 w-full"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  size="sm"
                  disabled={isTesting || !testToPhone.trim()}
                  onClick={() => handleTestDispatch('VOICEMAIL')}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-10 px-3.5 rounded-xl flex items-center gap-1 flex-1 sm:flex-none justify-center"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call My Phone
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isTesting || !testToPhone.trim()}
                  onClick={() => handleTestDispatch('SMS')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10 px-3.5 rounded-xl flex items-center gap-1 flex-1 sm:flex-none justify-center"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Send Me SMS
                </Button>
              </div>
            </div>

            {/* Test Result Feedback */}
            {testResult && (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 animate-in zoom-in-95 ${
                testResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200' 
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="font-extrabold flex items-center gap-1.5">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{testResult.message}</span>
                </div>

                {/* Important Twilio Trial Hint */}
                {testResult.diagnostics && (
                  <div className="text-[11px] pt-1 border-t border-black/10 dark:border-white/10 space-y-1 font-mono">
                    {testResult.diagnostics.voice?.error && (
                      <p className="text-rose-700 dark:text-rose-300">
                        Voice Error: {testResult.diagnostics.voice.error}
                      </p>
                    )}
                    {testResult.diagnostics.sms?.error && (
                      <p className="text-rose-700 dark:text-rose-300">
                        SMS Error: {testResult.diagnostics.sms.error}
                      </p>
                    )}
                    {(testResult.diagnostics.voice?.isUnverifiedTrialNumber || testResult.diagnostics.sms?.isUnverifiedTrialNumber) && (
                      <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-sans text-xs mt-2 border border-amber-300">
                        <strong>⚠️ Twilio Trial Account Action Required:</strong> Twilio free trial accounts require adding recipient numbers as <em>"Verified Caller IDs"</em> before sending calls or SMS.
                        <div className="mt-1">
                          <a
                            href="https://console.twilio.com/develop/phone-numbers/manage/verified"
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold underline text-primary-700 dark:text-primary-300 flex items-center gap-1"
                          >
                            Click here to add your phone number in Twilio Verified Caller IDs <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-500">
            Powered by Twilio Programmable Voice &amp; Messaging API
          </span>
          <Button
            size="sm"
            onClick={onClose}
            className="text-xs font-bold"
          >
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}
