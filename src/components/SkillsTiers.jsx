import React from 'react';
import { Icon } from './Icons.jsx';

export function SkillsTiers({ tiers }) {
  return (
    <div className="skills-grid tw-grid tw-gap-4">
      {tiers.map(tier => (
        <article className="skill-card tw-rounded-2xl tw-border tw-border-solid tw-border-line tw-bg-paper tw-p-6" key={tier.number}>
          <div className="skill-card-top"><span>{tier.eyebrow}</span><span>{tier.number} / 03</span></div>
          <h3>{tier.title}</h3>
          <p className="skill-description">{tier.description}</p>
          <ul className="skill-list">
            {tier.skills.map(skill => <li key={skill.name}><span>{skill.name}</span><small>{skill.context}</small></li>)}
          </ul>
          {tier.link && <a className="skill-source" href={tier.link.href} target="_blank" rel="noopener noreferrer">{tier.link.label} <Icon name="arrowUp" size={13} /></a>}
        </article>
      ))}
    </div>
  );
}
