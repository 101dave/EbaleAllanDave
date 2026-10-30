import React from 'react';
import { Icon } from './Icons.jsx';
import { NowCard } from './NowCard.jsx';
import { SkillsTiers } from './SkillsTiers.jsx';
import { ProjectPreview, ProjectCaseStudy } from './ProjectCaseStudy.jsx';
import { now, skillTiers, projects, archivedCaseStudies, archiveProjects } from '../portfolio-data.js';

function Topbar({ current }) {
  return (
    <div className="portfolio-topbar">
      <span>PORTFOLIO <span className="topbar-slash">/</span> {current}</span>
      <a href="https://github.com/101dave" target="_blank" rel="noopener noreferrer">GITHUB <Icon name="arrowUp" size={13} /></a>
    </div>
  );
}

function SectionHeading({ number, eyebrow, title, description, link }) {
  return (
    <div className="portfolio-section-heading">
      <div><p className="section-eyebrow"><span>{number} /</span> {eyebrow}</p><h2>{title}</h2>{description && <p className="section-description">{description}</p>}</div>
      {link && <a className="section-all-link" href={link.href}>{link.text} <Icon name="arrowRight" size={16} /></a>}
    </div>
  );
}

function FeaturedProjects({ heading = 'h3' }) {
  return <div className="case-list tw-grid tw-gap-6">{projects.map(project => <ProjectPreview project={project} heading={heading} key={project.id} />)}</div>;
}

function ContactBanner() {
  return (
    <section className="contact-banner" aria-labelledby="contact-banner-heading">
      <div><p className="contact-eyebrow"><span className="status-dot" aria-hidden="true" /> WHAT’S NEXT?</p><h2 id="contact-banner-heading">Let’s build something<br /><span>that works.</span></h2><p>Open to internships, junior roles, and thoughtful conversations about building software.</p></div>
      <a href="mailto:davea0153@gmail.com" className="contact-banner-link">Get in touch <Icon name="arrowUp" size={17} /></a>
    </section>
  );
}

export function HomePage() {
  return (
    <div className="portfolio-content">
      <Topbar current="OVERVIEW" />
      <section className="portfolio-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="hero-eyebrow"><span className="hero-eyebrow-mark" /> SOFTWARE ENGINEER <span className="hero-divider">/</span> INDEPENDENT PROJECTS</p>
          <h1 id="hero-title">I build for what happens <span>after the happy path.</span></h1>
          <p className="hero-lead">I’m Allan Dave Ebale, a student developer building lean web apps and practical systems. I focus on performance, resilience, and clean architecture—especially when the connection drops or state gets tricky.</p>
          <div className="hero-actions"><a className="primary-action" href="#work">Explore my work <Icon name="arrowDown" size={16} /></a><a className="secondary-action" href="CONTACT.html">Get in touch <Icon name="arrowUp" size={16} /></a></div>
          <p className="hero-location">Angeles City, Philippines</p>
        </div>
        <NowCard data={now} />
      </section>
      <section className="portfolio-section" id="work">
        <SectionHeading number="01" eyebrow="PROJECTS" title="Selected work." description="A quick look at the projects; each case study goes deeper into the decisions and evidence." link={{ text: 'All projects', href: 'PROJECTS.html' }} />
        <FeaturedProjects />
      </section>
      <section className="portfolio-section" id="stack">
        <SectionHeading number="02" eyebrow="THE TOOLKIT" title="Tools with a purpose." description="The tools I use most, plus what I’m exploring." link={{ text: 'Full stack', href: 'TECHSTACK.html' }} />
        <SkillsTiers tiers={skillTiers} compact />
      </section>
      <ContactBanner />
    </div>
  );
}

function PageIntro({ eyebrow, title, children }) {
  return <div className="portfolio-page-intro"><p className="section-eyebrow"><span> / </span>{eyebrow}</p><h1>{title}</h1><p>{children}</p></div>;
}

function Archive() {
  return (
    <section className="portfolio-section archive-section" aria-labelledby="archive-heading">
      <div className="portfolio-section-heading"><div><p className="section-eyebrow"><span> / </span> THE ARCHIVE</p><h2 id="archive-heading">More experiments.</h2><p className="section-description">Smaller programs, kept here with their source and their rough edges intact.</p></div></div>
      <div className="archive-grid">{archiveProjects.map(item => <article className="archive-card" key={item.name}><img src={item.image} alt="" loading="lazy" decoding="async" /><div><p className="archive-kind">{item.kind}</p><h3>{item.name}</h3><p className="archive-description">{item.description}</p><div className="archive-links"><a href={item.source}>View source <Icon name="arrowUp" size={13} /></a>{item.caseStudy && <a href={item.caseStudy}>Case study <Icon name="arrowRight" size={13} /></a>}</div></div></article>)}</div>
    </section>
  );
}

export function ProjectsPage() {
  return (
    <div className="portfolio-content">
      <Topbar current="PROJECTS" />
      <PageIntro eyebrow="PROJECTS" title="Work in context.">Project summaries and source code, with case studies for the deeper engineering details.</PageIntro>
      <FeaturedProjects heading="h2" />
      <Archive />
    </div>
  );
}

export function StackPage() {
  return (
    <div className="portfolio-content">
      <Topbar current="TECH STACK" />
      <PageIntro eyebrow="THE TOOLKIT" title="Tools with a purpose.">My most-used languages, the tools behind a deployed project, and the questions I’m currently investigating.</PageIntro>
      <SkillsTiers tiers={skillTiers} heading="h2" />
    </div>
  );
}

export function CasePage({ projectId }) {
  const project = [...projects, ...archivedCaseStudies].find(item => item.id === projectId);
  if (!project) throw new Error(`Unknown project: ${projectId}`);
  return (
    <div className="portfolio-content">
      <Topbar current="CASE STUDY" />
      <div className="case-page-intro"><a href="PROJECTS.html"><Icon name="arrowRight" className="back-arrow" size={15} /> All projects</a><p className="section-eyebrow"><span>{project.number} /</span> CASE STUDY</p></div>
      <ProjectCaseStudy project={project} detail />
    </div>
  );
}
