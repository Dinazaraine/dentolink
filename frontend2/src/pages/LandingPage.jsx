import React, { useEffect } from 'react';

/**
 * LandingPage component renders the public marketing site for Dentolink.
 * The static files for the site live under the public/dentolink directory.
 * We embed the HTML via an iframe so that the original JavaScript and CSS continue to work.
 * On mount we update the "connexion" link inside the iframe to point to the login page (/login).
 */
const LandingPage = () => {
  useEffect(() => {
    const iframe = document.getElementById('dentolink-iframe');
    if (!iframe) return;
    const onLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        const links = doc.querySelectorAll('a.nav-link');
        links.forEach((link) => {
          if (link.textContent.trim().toLowerCase() === 'connexion') {
            link.setAttribute('href', '/login');
            link.removeAttribute('onclick');
          }
        });
      } catch (err) {
        console.error(err);
      }
    };
    iframe.addEventListener('load', onLoad);
    return () => {
      iframe.removeEventListener('load', onLoad);
    };
  }, []);
  return (
    <div style={{ flex: 1, width: '100%', height: '100vh', border: 'none' }}>
      <iframe
        id="dentolink-iframe"
        title="Dentolink Landing"
        src="../public/dentolink/index.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
};

export default LandingPage;
