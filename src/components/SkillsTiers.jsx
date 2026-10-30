import React from 'react';
import { Icon } from './Icons.jsx';

export function SkillsTiers({ tiers, compact = false, heading = 'h3' }) {
  const Heading = heading;
  return (
    <div className="skills-grid tw-grid tw-gap-4">
      {tiers.map(tier => {
        const visibleSkills = compact ? tier.skills.slice(0, 3) : tier.skills;
        const remaining = tier.skills.length - visibleSkills.length;
        return (
          <article className={`skill-card${compact ? ' skill-card-compact' : ''} tw-rounded-2xl tw-border tw-border-solid tw-border-line tw-bg-paper tw-p-6`} key={tier.number}>
            <div className="skill-card-top"><span>{tier.eyebrow}</span><span>{tier.number} / 03</span></div>
            <Heading>{tier.title}</Heading>
            {!compact && <p className="skill-description">{tier.description}</p>}
            <ul className="skill-list">
              {visibleSkills.map(skill => <li key={skill.name}><span>{skill.name}</span>{!compact && <small>{skill.context}</small>}</li>)}
            </ul>
            {compact && remaining > 0 && <a className="skill-source" href="TECHSTACK.html">+{remaining} more tools <Icon name="arrowRight" size={13} /></a>}
            {!compact && tier.link && <a className="skill-source" href={tier.link.href} target="_blank" rel="noopener noreferrer">{tier.link.label} <Icon name="arrowUp" size={13} /></a>}
          </article>
        );
      })}
    </div>
  );
}
