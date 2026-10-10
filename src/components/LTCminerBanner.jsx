import React, { useEffect } from 'react';

const LTCminerBanner = () => {
  useEffect(() => {
    // Create the script element dynamically
    const script = document.createElement('script');
    script.src = "https://ltcminer.com/referral-ad.js?v=0.1.89";
    script.async = true;
    script.setAttribute('data-refid', '676800');
    script.setAttribute('data-size', '728x90');

    // Find the container div
    const adContainer = document.getElementById('ltc-ad-container');
    
    // Append the script to the container
    if (adContainer) {
      adContainer.appendChild(script);
    }

    // Cleanup function: remove the script if the component unmounts
    return () => {
      if (adContainer && adContainer.contains(script)) {
        adContainer.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="flex justify-center items-center my-6 overflow-hidden">
      {/* The script will inject the 728x90 banner inside this div */}
      <div id="ltc-ad-container" style={{ width: '100%', maxWidth: '728px', height: '90px' }}>
        {/* Fallback text while loading */}
        <p className="text-sm text-gray-400">Loading LTCminer Ad...</p>
      </div>
    </div>
  );
};

export default LTCminerBanner;
