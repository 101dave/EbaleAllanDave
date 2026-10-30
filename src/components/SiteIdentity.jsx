import React from 'react';

// Absolute Open Graph URLs point to the published GitHub Pages site so social
// crawlers can find the image when a page is shared outside the site.
const shareImage = 'https://101dave.github.io/EbaleAllanDave/images/portrait-share.jpg';

export function SiteIdentity() {
  return (
    <>
      <link rel="icon" type="image/png" sizes="48x48" href="images/portrait-icon-48.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="images/portrait-icon-192.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="images/portrait-touch-180.png" />
      <meta property="og:image" content={shareImage} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Portrait of Allan Dave Ebale" />
      <meta name="twitter:image" content={shareImage} />
      <meta name="twitter:image:alt" content="Portrait of Allan Dave Ebale" />
    </>
  );
}
