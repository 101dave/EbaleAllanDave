import React from 'react';
import { Icon } from './Icons.jsx';

const mainLinks = [
  { id: 'home', label: 'Overview', href: 'index.html', icon: 'home' },
  { id: 'projects', label: 'Selected work', href: 'PROJECTS.html', icon: 'work' },
  { id: 'stack', label: 'Tech stack', href: 'TECHSTACK.html', icon: 'stack' },
  { id: 'experience', label: 'Experience', href: 'EXPERIENCE.html', icon: 'experience' },
  { id: 'contact', label: 'Contact', href: 'CONTACT.html', icon: 'mail' }
];
const moreLinks = [
  { id: 'resume', label: 'Résumé', href: 'MOREINFO.html' },
  { id: 'certificates', label: 'Certificates', href: 'CERTIFICATE.html' },
  { id: 'recommendations', label: 'Recommendations', href: 'RECOMMENDATION.html' }
];

export function SiteSidebar({ active }) {
  return (
    <header id="sidebar">
      <div className="sidebar-top">
        <div className="mobile-header-bar">
          <a href="index.html" className="portfolio-brand">
            <span className="portfolio-brand-mark" aria-hidden="true">a.</span>
            <span className="portfolio-brand-copy"><strong>Allan Dave Ebale</strong><small>SOFTWARE ENGINEER</small></span>
          </a>
          <div className="header-actions">
            <button id="themeToggle" className="theme-toggle-btn" aria-label="Toggle dark mode" title="Toggle theme" type="button">
              <Icon name="sun" className="sun-icon" size={16} /><Icon name="moon" className="moon-icon" size={16} />
            </button>
            <button className="hamburger-btn" id="menuToggle" aria-label="Toggle navigation" aria-controls="navMenu" aria-expanded="false" type="button">
              <Icon name="menu" size={22} />
            </button>
          </div>
        </div>
        <nav className="Nav-Links" id="navMenu" aria-label="Main navigation">
          <span className="sidebar-label">MENU</span>
          {mainLinks.map(link => (
            <a key={link.id} href={link.href} className={active === link.id ? 'active' : undefined} aria-current={active === link.id ? 'page' : undefined}>
              <Icon name={link.icon} size={17} /><span>{link.label}</span>{active === link.id && <span className="nav-active-dot" aria-hidden="true" />}
            </a>
          ))}
          <span className="sidebar-label sidebar-label-more">MORE</span>
          {moreLinks.map(link => (
            <a key={link.id} href={link.href} className={`sidebar-secondary${active === link.id ? ' active' : ''}`} aria-current={active === link.id ? 'page' : undefined}>
              <span>{link.label}</span>{active === link.id && <span className="nav-active-dot" aria-hidden="true" />}
            </a>
          ))}
        </nav>
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-availability"><span className="status-dot" aria-hidden="true" /><span>OPEN TO OPPORTUNITIES</span></div>
        <p>Internships &amp; junior roles</p>
        <a className="sidebar-email" href="mailto:davea0153@gmail.com">davea0153@gmail.com <Icon name="arrowUp" size={13} /></a>
        <span className="sidebar-location">ANGELES CITY, PHILIPPINES</span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer portfolio-footer">
      <p>© <span className="year">2026</span> ALLAN DAVE EBALE <span className="footer-sep">/</span> BUILT IN THE OPEN</p>
      <p className="footer-links">
        <a href="MOREINFO.html">Résumé</a>
        <a href="CONTACT.html">Contact</a>
        <a href="https://github.com/101dave" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      </p>
    </footer>
  );
}
