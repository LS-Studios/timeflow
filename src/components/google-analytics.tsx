
"use client";

import Script from "next/script";

type GoogleAnalyticsProps = {
  gaId: string;
};

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Initialize consent mode
            gtag('consent', 'default', {
              analytics_storage: 'denied'
            });
            
            gtag('config', '${gaId}');
            
            // Check for existing consent
            const consent = localStorage.getItem('timeflow_analytics_consent');
            if (consent === 'accepted') {
              gtag('consent', 'update', {
                analytics_storage: 'granted'
              });
            }
          `,
        }}
      />
    </>
  );
}
