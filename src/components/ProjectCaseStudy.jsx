import React from 'react';
import { Icon } from './Icons.jsx';

// Accept a Loom share or embed URL, but never embed an arbitrary third-party URL.
export function loomEmbedUrl(src) {
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:' || !['loom.com', 'www.loom.com'].includes(url.hostname)) return null;
    const match = url.pathname.match(/^\/(?:share|embed)\/([a-zA-Z0-9_-]+)\/?$/);
    return match ? `https://www.loom.com/embed/${match[1]}` : null;
  } catch {
    return null;
  }
}

export function mp4Url(src) {
  if (typeof src !== 'string') return null;
  const candidate = src.trim();
  if (!candidate || /[\u0000-\u001f\u007f\\]/.test(candidate) || candidate.startsWith('//')) return null;
  // Local relative files and HTTPS URLs only; reject protocol-relative and executable URLs.
  if (/^[a-z][a-z\d+.-]*:/i.test(candidate)) {
    try { return new URL(candidate).protocol === 'https:' ? candidate : null; } catch { return null; }
  }
  return candidate;
}

export function VideoSlot({ video, projectName }) {
  const loom = video?.type === 'loom' ? loomEmbedUrl(video.src) : null;
  const mp4 = video?.type === 'mp4' ? mp4Url(video.src) : null;
  return (
    <section className="case-slot" aria-label={`${projectName} video walkthrough`}>
      <div className="case-slot-label"><span><Icon name="video" size={15} /> 60-SECOND WALKTHROUGH</span><span>01 / 02</span></div>
      <div className="video-frame">
        {loom ? <iframe src={loom} title={`${projectName} video walkthrough`} loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> :
          mp4 ? <video controls preload="metadata" playsInline aria-label={`${projectName} video walkthrough`}><source src={mp4} type="video/mp4" />Your browser does not support embedded video. <a href={mp4}>Download the walkthrough.</a></video> :
            <div className="video-empty"><span className="video-empty-icon"><Icon name="video" size={21} /></span><strong>Walkthrough not published yet.</strong><span>The source and project notes are available above.</span></div>}
      </div>
    </section>
  );
}

export function ArchitectureSlot({ flow, projectName }) {
  return (
    <section className="case-slot" aria-label={`${projectName} system flow`}>
      <div className="case-slot-label"><span><Icon name="diagram" size={15} /> SYSTEM FLOW</span><span>02 / 02</span></div>
      {flow ? (
        <figure className="flow-frame" aria-label={flow.label}>
          <div className="flow-lanes">
            {flow.lanes.map((lane, laneIndex) => (
              <ol className="flow-lane" key={laneIndex}>
                {lane.map((step, stepIndex) => <li className="flow-step" key={`${step.title}-${stepIndex}`}><strong>{step.title}</strong><span>{step.detail}</span></li>)}
              </ol>
            ))}
          </div>
          <figcaption>{flow.note}</figcaption>
        </figure>
      ) : <div className="flow-frame flow-empty">Architecture diagram not published yet.</div>}
    </section>
  );
}

export function ProjectCaseStudy({ project, detail = false }) {
  const Heading = detail ? 'h2' : 'h3';
  return (
    <article id={project.id} className="case-card tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-line tw-bg-paper" aria-labelledby={`${project.id}-title`}>
      <div className="case-feature">
        <figure className={`case-image case-image-${project.imageKind || 'screenshot'}`}>
          <div className="case-image-bar"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>{project.imageCaption}</span><Icon name="arrowUp" size={13} /></div>
          <img src={project.image} alt={project.imageAlt} loading="lazy" decoding="async" />
        </figure>
        <div className="case-overview">
          <div className="case-category"><span>{project.category}</span><span>PROJECT / {project.number}</span></div>
          <Heading id={`${project.id}-title`}>{project.name}<span className="case-title-dot">.</span></Heading>
          <p className="case-summary">{project.summary}</p>
          <p className="case-description">{project.description}</p>
          <ul className="case-tags" aria-label="Technologies">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
          <div className="case-actions">
            {project.live && <a className="case-live-link" href={project.live} target="_blank" rel="noopener noreferrer">Live project <Icon name="arrowUp" size={14} /></a>}
            {project.source && <a className="case-source-link" href={project.source} target="_blank" rel="noopener noreferrer"><Icon name="github" size={15} /> Source <Icon name="arrowUp" size={13} /></a>}
            {!detail && project.caseStudy && <a className="case-more-link" href={project.caseStudy}>Full case study <Icon name="arrowRight" size={14} /></a>}
          </div>
        </div>
      </div>
      <div className="case-breakdown">
        <div className="case-breakdown-item"><p className="case-breakdown-label"><span>01</span> THE TECHNICAL BOTTLENECK</p><p>{project.bottleneck || 'Not documented yet.'}</p></div>
        <div className="case-breakdown-item"><p className="case-breakdown-label"><span>02</span> THE TRADE-OFF</p><p>{project.tradeoff || 'Not documented yet.'}</p></div>
        <div className="case-breakdown-item case-proof"><p className="case-breakdown-label"><span>03</span> THE PROOF</p>
          {project.proof ? <><strong>{project.proof.value}</strong><p>{project.proof.text}</p>{project.proof.href && <a href={project.proof.href} target="_blank" rel="noopener noreferrer">{project.proof.linkText || 'View evidence'} <Icon name="arrowUp" size={12} /></a>}</> : <p>No verified metric published yet.</p>}
        </div>
      </div>
      <details className="case-details" open={detail || undefined}>
        <summary><span><Icon name="diagram" size={16} /> Walkthrough &amp; system flow</span><span className="details-action">EXPLORE <Icon name="plus" size={15} /></span></summary>
        <div className="case-slots"><VideoSlot video={project.video} projectName={project.name} /><ArchitectureSlot flow={project.flow} projectName={project.name} /></div>
      </details>
    </article>
  );
}
