# ==========================================
# LTCminer Integration Script for Learnzo.online
# ==========================================

# 1. Configuration
$ComponentPath = "src/components/LTCminerBanner.jsx"
$CommitMessage = "feat: Add LTCminer referral banner ad component"

Write-Host "Starting LTCminer integration..." -ForegroundColor Cyan

# 2. Check if we are in a Git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not a Git repository. Please run this from the root of your Learnzo.online project." -ForegroundColor Red
    exit 1
}

# 3. Define the React Component Code
$ComponentCode = @'
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
'@

# 4. Create the directory if it doesn't exist
$Dir = Split-Path $ComponentPath
if (-not (Test-Path $Dir)) {
    New-Item -ItemType Directory -Force -Path $Dir | Out-Null
    Write-Host "Created directory: $Dir" -ForegroundColor Green
}

# 5. Write the React component to the file
$ComponentCode | Out-File -FilePath $ComponentPath -Encoding utf8
Write-Host "Created component at $ComponentPath" -ForegroundColor Green

# 6. Git Operations
Write-Host "Staging changes..." -ForegroundColor Yellow
git add $ComponentPath

Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "$CommitMessage"

Write-Host "Pushing to remote repository..." -ForegroundColor Yellow
# Note: This assumes your default branch is 'main'. If it's 'master', change 'main' to 'master' below.
git push origin main

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Integration Complete!" -ForegroundColor Green
Write-Host "Next step: Import and use <LTCminerBanner /> in your Dashboard or Layout component." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan