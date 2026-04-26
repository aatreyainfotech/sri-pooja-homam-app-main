/**
 * RazorpayCheckout – cross-platform payment sheet
 *
 * On native (Android / iOS): renders a full-screen WebView that loads
 * Razorpay Standard Checkout and posts messages back via postMessage.
 *
 * On web: dynamically injects Razorpay's checkout.js and opens the
 * standard popup directly.
 */

import { useEffect, useRef } from 'react';
import {
  Modal, View, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export interface RazorpayOptions {
  orderId?: string;    // optional – only pass if created by Razorpay API
  amount: number;      // in rupees (not paise)
  currency?: string;
  name: string;        // merchant / app name
  description?: string;
  prefillName?: string;
  prefillContact?: string;
  prefillEmail?: string;
  razorpayKeyId: string;
}

interface Props {
  visible: boolean;
  options: RazorpayOptions;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onFailure: (error: string) => void;
  onDismiss: () => void;
}

function buildHtml(opts: RazorpayOptions): string {
  const amountPaise = Math.round(opts.amount * 100);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <title>Payment</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f5f5f5; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; font-family: sans-serif; }
    .loader { text-align: center; color: #555; }
    .loader svg { width: 48px; height: 48px; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader">
    <svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#8B1515"
      stroke-width="4" stroke-dasharray="60 20"/></svg>
    <p style="margin-top:12px;color:#8B1515;font-size:14px">Opening payment...</p>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function postMsg(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }
    // Intercept native alert() so Razorpay errors route to our handler
    window.alert = function(msg) {
      postMsg({ type: 'failure', error: String(msg) });
    };
    window.onerror = function(msg) {
      postMsg({ type: 'failure', error: String(msg) });
    };
    window.onload = function() {
      if (typeof Razorpay === 'undefined') {
        postMsg({ type: 'failure', error: 'Failed to load Razorpay checkout' });
        return;
      }
      var options = {
        key: "${opts.razorpayKeyId}",
        amount: ${amountPaise},
        currency: "${opts.currency || 'INR'}",
        name: "${opts.name.replace(/"/g, '\\"')}",
        description: "${(opts.description || '').replace(/"/g, '\\"')}",
        ${opts.orderId ? `order_id: "${opts.orderId}",` : ''}
        prefill: {
          name: "${(opts.prefillName || '').replace(/"/g, '\\"')}",
          contact: "${opts.prefillContact || ''}",
          email: "${opts.prefillEmail || ''}"
        },
        config: {
          display: {
            preferences: { show_default_blocks: true }
          }
        },
        theme: { color: "#8B1515" },
        modal: { ondismiss: function() { postMsg({ type: 'dismiss' }); } },
        handler: function(response) {
          postMsg({
            type: 'success',
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
        }
      };
      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function(response) {
          postMsg({ type: 'failure', error: (response.error && response.error.description) || 'Payment failed' });
        });
        rzp.open();
      } catch(e) {
        postMsg({ type: 'failure', error: e.message || 'Failed to open payment' });
      }
    };
  </script>
</body>
</html>`;
}

// ---- Web platform: use window.Razorpay directly ----
function WebRazorpay({ options, onSuccess, onFailure, onDismiss }: Omit<Props, 'visible'>) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const amountPaise = Math.round(options.amount * 100);
      const rzp = new (window as any).Razorpay({
        key: options.razorpayKeyId,
        amount: amountPaise,
        currency: options.currency || 'INR',
        name: options.name,
        description: options.description || '',
        ...(options.orderId ? { order_id: options.orderId } : {}),
        prefill: {
          name: options.prefillName || '',
          contact: options.prefillContact || '',
          email: options.prefillEmail || '',
        },
        config: { display: { preferences: { show_default_blocks: true } } },
        theme: { color: '#8B1515' },
        modal: { ondismiss: onDismiss },
        handler: (response: any) => {
          onSuccess(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature || '');
        },
      });
      rzp.on('payment.failed', (response: any) => {
        onFailure(response.error?.description || 'Payment failed');
      });
      rzp.open();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}

// ---- Native platform: WebView ----
export default function RazorpayCheckout({ visible, options, onSuccess, onFailure, onDismiss }: Props) {
  if (!visible) return null;

  if (Platform.OS === 'web') {
    return <WebRazorpay options={options} onSuccess={onSuccess} onFailure={onFailure} onDismiss={onDismiss} />;
  }

  const html = buildHtml(options);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'success') {
        onSuccess(data.razorpay_payment_id, data.razorpay_order_id, data.razorpay_signature || '');
      } else if (data.type === 'failure') {
        onFailure(data.error || 'Payment failed');
      } else if (data.type === 'dismiss') {
        onDismiss();
      }
    } catch {}
  };

  // Handle UPI / payment-app deep links that WebView can't open natively
  const handleShouldStartLoad = (request: any) => {
    const url: string = request.url || '';
    const deepLinkSchemes = ['intent://', 'upi://', 'phonepe://', 'paytm://',
      'gpay://', 'tez://', 'bhim://', 'credpay://', 'mobikwik://', 'freecharge://'];
    if (deepLinkSchemes.some((s) => url.startsWith(s))) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        {WebView ? (
          <WebView
            source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            originWhitelist={['*']}
            thirdPartyCookiesEnabled
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#8B1515" />
              </View>
            )}
            style={{ flex: 1 }}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  closeBtn: {
    position: 'absolute', top: 48, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center',
  },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
