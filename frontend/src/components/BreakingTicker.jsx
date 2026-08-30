import React from 'react';

export const BreakingTicker = ({ breakingStories = [], onSelectStory }) => {
  if (!breakingStories || breakingStories.length === 0) return null;

  // Use up to top 8 stories and duplicate for seamless infinite loop
  const topNews = breakingStories.slice(0, 8);
  const marqueeList = [...topNews, ...topNews];

  return (
    <div className="bbc-breaking-banner">
      <div className="bbc-breaking-container">
        <div className="bbc-breaking-badge">
          <div className="bbc-live-pulse" />
          <span>BREAKING</span>
        </div>

        <div className="bbc-marquee-wrapper">
          <div className="bbc-marquee-track">
            {marqueeList.map((story, index) => (
              <span
                key={`${story.id}-${index}`}
                className="bbc-marquee-item"
                onClick={() => onSelectStory(story)}
                title="Click to read full story"
              >
                <span>{story.canonical_title}</span>
                <span className="bbc-marquee-divider">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
