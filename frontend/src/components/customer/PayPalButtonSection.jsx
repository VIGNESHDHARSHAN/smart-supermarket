import React, { useEffect, useRef, useState } from 'react';
import { Globe, Loader2, ShieldCheck } from 'lucide-react';
import { mountPayPalButtons, processPayPalSandboxCheckout, convertInrToPayPalAmount } from '../../lib/payment';
import { Button } from '../ui/Button';

/**
 * Reusable PayPal Gateway section for Customer Self-Checkout & Delivery/Takeaway Checkout.
 * Automatically mounts official PayPal Smart Payment Buttons when PAYPAL_CLIENT_ID is configured,
 * or provides a 1-click Sandbox Demo PayPal button when running without live credentials.
 */
export function PayPalButtonSection({
  amountInr,
  description = 'SmartMart Supermarket Order',
  disabled = false,
  onSuccess,
  onFailure,
  onCancel
}) {
  const containerRef = useRef(null);
  const [sdkState, setSdkState] = useState('loading'); // 'loading' | 'live' | 'sandbox'
  const [convertedInfo, setConvertedInfo] = useState({
    amount: convertInrToPayPalAmount(amountInr),
    currency: 'USD',
    rate: 84,
    rateSource: 'fallback'
  });
  const [isSandboxProcessing, setIsSandboxProcessing] = useState(false);

  useEffect(() => {
    let cleanupFn = () => {};
    let active = true;

    const init = async () => {
      setSdkState('loading');
      try {
        const result = await mountPayPalButtons({
          container: containerRef.current,
          amountInr,
          description,
          onSuccess: (paymentResult) => {
            if (active && onSuccess) onSuccess(paymentResult);
          },
          onFailure: (errMsg) => {
            if (active && onFailure) onFailure(errMsg);
          },
          onCancel: (msg) => {
            if (active && onCancel) onCancel(msg);
          }
        });

        if (!active) {
          result?.cleanup?.();
          return;
        }

        cleanupFn = result?.cleanup || (() => {});
        setConvertedInfo({
          amount: result?.convertedAmount || convertInrToPayPalAmount(amountInr),
          currency: result?.currency || 'USD',
          rate: result?.rate || 84,
          rateSource: result?.rateSource || 'fallback'
        });
        setSdkState(result?.mode === 'LIVE' ? 'live' : 'sandbox');
      } catch (err) {
        if (active) {
          setSdkState('sandbox');
        }
      }
    };

    if (Number(amountInr) > 0) {
      init();
    }

    return () => {
      active = false;
      cleanupFn();
    };
  }, [amountInr, description]);

  const handleSandboxPay = async () => {
    if (disabled || isSandboxProcessing) return;
    setIsSandboxProcessing(true);
    await processPayPalSandboxCheckout({
      amountInr,
      description,
      onSuccess: (paymentResult) => {
        setIsSandboxProcessing(false);
        if (onSuccess) onSuccess(paymentResult);
      },
      onFailure: (errMsg) => {
        setIsSandboxProcessing(false);
        if (onFailure) onFailure(errMsg);
      }
    });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-extrabold text-xs">
          <Globe className="w-4 h-4 text-[#0070ba] shrink-0" />
          <span>PayPal Global Payment Gateway</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#003087] dark:text-blue-200 font-mono">
          ₹{Number(amountInr || 0).toFixed(2)} ≈ {convertedInfo.currency} {convertedInfo.amount}
        </span>
      </div>

      <p className="text-[11px] text-blue-800/80 dark:text-blue-300 leading-relaxed">
        Pay securely using your PayPal balance, linked bank account, or international Visa/Mastercard/Amex card
        {convertedInfo.currency !== 'INR'
          ? ` (settled in ${convertedInfo.currency} at ${convertedInfo.rateSource === 'live' ? 'live FX ' : ''}1 ${convertedInfo.currency} = ₹${convertedInfo.rate}).`
          : '.'}
      </p>

      {sdkState === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#0070ba]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading PayPal Checkout...</span>
        </div>
      )}

      {/* Official PayPal Smart Payment Buttons mount point */}
      <div
        ref={containerRef}
        className={sdkState === 'live' ? 'min-h-[46px]' : 'hidden'}
      />

      {sdkState === 'sandbox' && (
        <div className="space-y-2">
          <Button
            type="button"
            disabled={disabled || isSandboxProcessing}
            onClick={handleSandboxPay}
            className="w-full h-12 rounded-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-extrabold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {isSandboxProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing PayPal Sandbox...</span>
              </>
            ) : (
              <>
                <span className="italic font-black tracking-tight">PayPal</span>
                <span>Pay {convertedInfo.currency} {convertedInfo.amount} (Sandbox Demo)</span>
              </>
            )}
          </Button>
          <div className="text-[10px] text-center text-blue-700/80 dark:text-blue-300/80 font-mono">
            Add PAYPAL_CLIENT_ID &amp; PAYPAL_CLIENT_SECRET in backend/.env for live PayPal Smart Buttons
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-blue-900/70 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-900/40 py-1 px-2.5 rounded-lg font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-[#0070ba]" />
        <span>Buyer Protection • REST API v2 Order Capture</span>
      </div>
    </div>
  );
}
