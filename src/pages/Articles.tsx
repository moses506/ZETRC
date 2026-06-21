import { useMemo, useState } from 'react';
import kundaLesson01 from '../assets/kunda_lesson-01.jpeg';
import kundaLesson02 from '../assets/kunda_lesson -02.jpeg';
import kundaLesson03 from '../assets/kunda_lesson-03.jpeg';
import { PageReveal, RevealItem } from '../components/PageReveal';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/news-feed.css';

type NewsCategory = 'all' | 'training' | 'field' | 'youth' | 'research';

type ArticleComment = {
  id: string;
  name: string;
  text: string;
  date: string;
};

type NewsArticle = {
  id: string;
  title: string;
  author: string;
  date: string;
  content: string;
  image: string;
  category: Exclude<NewsCategory, 'all'>;
  categoryLabel: string;
  readTime: string;
  comments: ArticleComment[];
  reactions: Record<string, number>;
};

const REACTION_TYPES: { emoji: string; label: string }[] = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '💡', label: 'Insightful' },
  { emoji: '👏', label: 'Clap' },
];

const FILTER_OPTIONS: { id: NewsCategory; label: string }[] = [
  { id: 'all', label: 'All stories' },
  { id: 'training', label: 'Training' },
  { id: 'field', label: 'Field stories' },
  { id: 'youth', label: 'Youth & agri' },
  { id: 'research', label: 'Research' },
];

const seedArticles: NewsArticle[] = [
  {
    id: 'seed-1',
    title: 'Why Post-Harvest Loss Is Costing Zambian Farmers More Than They Think',
    author: 'ZETRC Team',
    date: 'Jun 12, 2026',
    content:
      "Across our pilot districts, we've seen firsthand how much value is lost between harvest and market. In this piece, we break down the most common causes of post-harvest loss and the simple, low-cost practices that are helping farmers in our training program cut waste and increase income.",
    image: kundaLesson01,
    category: 'field',
    categoryLabel: 'Field stories',
    readTime: '4 min read',
    comments: [
      { id: 'c1', name: 'Mwansa B.', text: "This matches exactly what we're seeing in Mkushi. Would love a follow-up on storage solutions.", date: 'Jun 13, 2026' },
    ],
    reactions: { '👍': 18, '❤️': 7, '💡': 9, '👏': 4 },
  },
  {
    id: 'seed-2',
    title: 'Inside Our First Climate-Smart Agriculture Cohort',
    author: 'ZETRC Team',
    date: 'May 28, 2026',
    content:
      'Forty participants, six provinces, one shared goal — building resilience into how Zambia farms. We sat down with three graduates of our first climate-smart agriculture cohort to hear how the training is already changing the way they plan their seasons.',
    image: kundaLesson02,
    category: 'training',
    categoryLabel: 'Training',
    readTime: '6 min read',
    comments: [
      { id: 'c2', name: 'Chanda M.', text: 'Proud to have been part of this cohort. Already applying the soil moisture techniques on my plot.', date: 'May 29, 2026' },
      { id: 'c3', name: 'Bwalya K.', text: 'Is there a waitlist for the next intake?', date: 'May 30, 2026' },
    ],
    reactions: { '👍': 24, '❤️': 12, '💡': 6, '👏': 11 },
  },
  {
    id: 'seed-3',
    title: 'Youth, Agribusiness, and the Case for Starting Small',
    author: 'ZETRC Team',
    date: 'May 14, 2026',
    content:
      'Not every agribusiness needs to start big. In this article, we look at how some of our youngest trainees turned small demonstration plots into viable side incomes — and what that means for youth employment across rural Zambia.',
    image: kundaLesson03,
    category: 'youth',
    categoryLabel: 'Youth & agri',
    readTime: '5 min read',
    comments: [],
    reactions: { '👍': 9, '❤️': 3, '💡': 5, '👏': 2 },
  },
  {
    id: 'seed-4',
    title: 'What Six Provinces Taught Us About Climate Adaptation',
    author: 'Research Desk',
    date: 'Apr 30, 2026',
    content:
      'Our field research team synthesised lessons from six provinces into a practical adaptation checklist — covering planting dates, water harvesting, and crop diversification strategies that performed best under real farm conditions.',
    image: kundaLesson02,
    category: 'research',
    categoryLabel: 'Research',
    readTime: '7 min read',
    comments: [],
    reactions: { '👍': 14, '❤️': 5, '💡': 11, '👏': 3 },
  },
];

function totalReactions(reactions: Record<string, number>) {
  return Object.values(reactions).reduce((sum, n) => sum + n, 0);
}

function Articles() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<NewsArticle[]>(seedArticles);
  const [activeFilter, setActiveFilter] = useState<NewsCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, { name: string; text: string }>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string | null>>({});

  const filteredArticles = useMemo(
    () => (activeFilter === 'all' ? articles : articles.filter((a) => a.category === activeFilter)),
    [articles, activeFilter],
  );

  const featured = filteredArticles[0] ?? null;
  const gridArticles = filteredArticles.slice(1);
  const expanded = articles.find((a) => a.id === expandedId) ?? null;

  const filterCounts = useMemo(() => {
    const counts: Record<NewsCategory, number> = {
      all: articles.length,
      training: 0,
      field: 0,
      youth: 0,
      research: 0,
    };
    articles.forEach((a) => {
      counts[a.category] += 1;
    });
    return counts;
  }, [articles]);

  const trending = useMemo(
    () => [...articles].sort((a, b) => totalReactions(b.reactions) - totalReactions(a.reactions)).slice(0, 4),
    [articles],
  );

  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const openArticle = (id: string) => {
    setExpandedId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleReaction = (articleId: string, emoji: string) => {
    setArticles((prev) =>
      prev.map((a) => {
        if (a.id !== articleId) return a;
        const current = myReactions[articleId];
        const reactions = { ...a.reactions };
        if (current === emoji) {
          reactions[emoji] = Math.max(0, (reactions[emoji] || 0) - 1);
        } else {
          if (current) reactions[current] = Math.max(0, (reactions[current] || 0) - 1);
          reactions[emoji] = (reactions[emoji] || 0) + 1;
        }
        return { ...a, reactions };
      }),
    );
    setMyReactions((prev) => ({
      ...prev,
      [articleId]: prev[articleId] === emoji ? null : emoji,
    }));
  };

  const updateCommentDraft = (articleId: string, field: 'name' | 'text', value: string) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [articleId]: { name: prev[articleId]?.name || '', text: prev[articleId]?.text || '', [field]: value },
    }));
  };

  const handleAddComment = (articleId: string) => {
    const draft = commentDrafts[articleId];
    if (!draft?.text?.trim()) return;
    const newComment: ArticleComment = {
      id: `c-${Date.now()}`,
      name: draft.name.trim() || 'Anonymous',
      text: draft.text.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, comments: [...a.comments, newComment] } : a)),
    );
    setCommentDrafts((prev) => ({ ...prev, [articleId]: { name: draft.name, text: '' } }));
  };

  const renderByline = (article: NewsArticle) => (
    <div className="news-byline">
      <span className="news-author-avatar">{article.author.charAt(0)}</span>
      <span className="news-byline-name">{article.author}</span>
      <span className="news-byline-sep">·</span>
      <span>{article.date}</span>
      <span className="news-byline-sep">·</span>
      <span>{article.readTime}</span>
    </div>
  );

  return (
    <PageReveal className="news-feed-page">
      <header className="news-masthead">
        <div className="news-masthead-inner">
          <div className="news-masthead-brand">
            <span className="news-masthead-mark">ZETRC</span>
            <span className="news-masthead-divider" aria-hidden="true" />
            <span className="news-masthead-section">{t('newsFeedsTitle')}</span>
          </div>
          <div className="news-masthead-meta">
            <span className="news-live-badge">
              <span className="news-live-dot" />
              Live
            </span>
            <span>{todayLabel}</span>
          </div>
        </div>
      </header>

      <section className="news-hero">
        <RevealItem index={0}>
          <div className="news-hero-inner">
            <h1 className="news-hero-title">{t('newsFeedsTitle')}</h1>
            <p className="news-hero-sub">{t('newsFeedsSubtitle')}</p>
          </div>
        </RevealItem>
      </section>

      <nav className="news-toolbar" aria-label="Filter news stories">
        <div className="news-toolbar-inner">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`news-filter-chip${activeFilter === filter.id ? ' news-filter-chip--active' : ''}`}
              onClick={() => {
                setActiveFilter(filter.id);
                setExpandedId(null);
              }}
            >
              {filter.label}
              <span className="news-filter-count">{filterCounts[filter.id]}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="news-layout">
        <main className="news-main">
          {expanded ? (
            <RevealItem index={1}>
              <article className="news-expanded">
                <div className="news-expanded-hero">
                  <img src={expanded.image} alt={expanded.title} />
                  <button
                    type="button"
                    className="news-expanded-close"
                    onClick={() => setExpandedId(null)}
                    aria-label="Close article"
                  >
                    ×
                  </button>
                </div>
                <div className="news-expanded-body">
                  <span className={`news-category news-category--${expanded.category}`}>
                    {expanded.categoryLabel}
                  </span>
                  <h2 className="news-expanded-title">{expanded.title}</h2>
                  {renderByline(expanded)}
                  <p className="news-expanded-content">{expanded.content}</p>

                  <div className="news-reactions">
                    {REACTION_TYPES.map((r) => {
                      const active = myReactions[expanded.id] === r.emoji;
                      return (
                        <button
                          key={r.emoji}
                          type="button"
                          className={`news-reaction-btn${active ? ' news-reaction-btn--active' : ''}`}
                          onClick={() => handleToggleReaction(expanded.id, r.emoji)}
                          title={r.label}
                        >
                          <span>{r.emoji}</span>
                          <span>{expanded.reactions[r.emoji] || 0}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="news-comments-section">
                    <h4>
                      {expanded.comments.length} {expanded.comments.length === 1 ? 'Comment' : 'Comments'}
                    </h4>
                    {expanded.comments.map((c) => (
                      <div key={c.id} className="news-comment">
                        <span className="news-author-avatar">{c.name.charAt(0)}</span>
                        <div>
                          <span className="news-byline-name">{c.name}</span>
                          <span className="news-byline-sep"> · </span>
                          <span style={{ fontSize: '0.75rem', color: '#8fad9a' }}>{c.date}</span>
                          <p className="news-comment-text">{c.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="news-comment-form">
                      <input
                        type="text"
                        className="news-comment-input"
                        placeholder="Your name"
                        value={commentDrafts[expanded.id]?.name || ''}
                        onChange={(e) => updateCommentDraft(expanded.id, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="news-comment-input"
                        placeholder="Share your thoughts..."
                        value={commentDrafts[expanded.id]?.text || ''}
                        onChange={(e) => updateCommentDraft(expanded.id, 'text', e.target.value)}
                      />
                      <button type="button" className="news-comment-submit" onClick={() => handleAddComment(expanded.id)}>
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </RevealItem>
          ) : (
            <>
              {featured && (
                <RevealItem index={1} variant="scale">
                  <button type="button" className="news-featured" onClick={() => openArticle(featured.id)}>
                    <div className="news-featured-image-wrap">
                      <img src={featured.image} alt={featured.title} className="news-featured-image" />
                      <span className="news-featured-badge">Top story</span>
                    </div>
                    <div className="news-featured-body">
                      <span className={`news-category news-category--${featured.category}`}>
                        {featured.categoryLabel}
                      </span>
                      <h2 className="news-featured-title">{featured.title}</h2>
                      <p className="news-excerpt">{featured.content}</p>
                      {renderByline(featured)}
                      <span className="news-read-link">Read full story →</span>
                    </div>
                  </button>
                </RevealItem>
              )}

              {gridArticles.length > 0 && (
                <div className="news-grid">
                  {gridArticles.map((article, index) => (
                    <RevealItem key={article.id} index={index + 2} variant="scale">
                      <button type="button" className="news-card" onClick={() => openArticle(article.id)}>
                        <div className="news-card-image-wrap">
                          <img src={article.image} alt={article.title} className="news-card-image" />
                        </div>
                        <div className="news-card-body">
                          <span className={`news-category news-category--${article.category}`}>
                            {article.categoryLabel}
                          </span>
                          <h3 className="news-card-title">{article.title}</h3>
                          <p className="news-card-excerpt">{article.content}</p>
                          <div className="news-card-footer">
                            <span>{article.date}</span>
                            <div className="news-engagement">
                              <span>👍 {article.reactions['👍'] || 0}</span>
                              <span>💬 {article.comments.length}</span>
                              <span>{article.readTime}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </RevealItem>
                  ))}
                </div>
              )}

              {filteredArticles.length === 0 && (
                <p className="news-empty">No stories in this category yet. Check back soon.</p>
              )}
            </>
          )}
        </main>

        {!expanded && (
          <aside className="news-sidebar">
            <RevealItem index={5}>
              <div className="news-sidebar-card">
                <h3 className="news-sidebar-title">Trending now</h3>
                {trending.map((article, index) => (
                  <button
                    key={article.id}
                    type="button"
                    className="news-trending-item"
                    onClick={() => openArticle(article.id)}
                  >
                    <span className="news-trending-num">{index + 1}</span>
                    <div>
                      <div className="news-trending-title">{article.title}</div>
                      <div className="news-trending-meta">
                        {article.categoryLabel} · {totalReactions(article.reactions)} reactions
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </RevealItem>

            <RevealItem index={6}>
              <div className="news-sidebar-card">
                <h3 className="news-sidebar-title">Topics</h3>
                <div className="news-topic-list">
                  {['Climate-smart farming', 'Post-harvest', 'Youth agri', 'Cooperatives', 'Soil health', 'Water use'].map((topic) => (
                    <span key={topic} className="news-topic-tag">{topic}</span>
                  ))}
                </div>
              </div>
            </RevealItem>

            <RevealItem index={7}>
              <div className="news-sidebar-card news-subscribe">
                <h3 className="news-sidebar-title">Stay updated</h3>
                <p>Get field stories and training updates delivered to your inbox.</p>
                <input type="email" className="news-subscribe-input" placeholder="your@email.com" />
                <button type="button" className="news-subscribe-btn">Subscribe</button>
              </div>
            </RevealItem>
          </aside>
        )}
      </div>
    </PageReveal>
  );
}

export default Articles;
