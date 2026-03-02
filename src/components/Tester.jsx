import { useState, useEffect } from 'react';
import { testCouples } from '../testData';
import { categories as baseCategories, questionsByCategory } from '../questions';

// Extended categories for tester - includes both infidelity scenarios
const testerCategories = [
  {
    id: 'infidelity_her',
    name: 'Infidelity (She Cheated)',
    description: 'Rachel (unfaithful) & Daniel (betrayed)',
    icon: '💔',
    questionsKey: 'infidelity', // Use same questions
  },
  {
    id: 'infidelity',
    name: 'Infidelity (He Cheated)',
    description: 'Sarah (betrayed) & Michael (unfaithful)',
    icon: '💔',
    questionsKey: 'infidelity',
  },
  ...baseCategories.filter(c => c.id !== 'infidelity'),
];

function Tester() {
  const [activeCategory, setActiveCategory] = useState('infidelity_her');
  const [activeTab, setActiveTab] = useState('advice'); // 'advice', 'partnerA', 'partnerB'
  const [advice, setAdvice] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [aiModel, setAiModel] = useState('openai'); // 'openai' or 'gemini'

  const couple = testCouples[activeCategory];
  const categoryInfo = testerCategories.find(c => c.id === activeCategory);
  const questionsKey = categoryInfo?.questionsKey || activeCategory;
  const questions = questionsByCategory[questionsKey];

  const generateAdvice = async (category, partner, model = aiModel) => {
    const key = `${category}_${partner}_${model}`;
    if (advice[key]) return; // Already generated

    setLoading(prev => ({ ...prev, [key]: true }));
    setError(prev => ({ ...prev, [key]: null }));

    try {
      const coupleData = testCouples[category];

      // Format responses for API
      const formatResponses = (partnerData) => {
        const scaleResponses = partnerData.scale.map(s => ({
          questionId: s.id,
          type: 'scale',
          answer: s.answer
        }));
        const textResponses = partnerData.text.map(t => ({
          questionId: t.id,
          type: 'text',
          answer: t.answer
        }));
        return [...scaleResponses, ...textResponses];
      };

      // Get the actual category key for questions/AI (e.g., infidelity_her -> infidelity)
      const catInfo = testerCategories.find(c => c.id === category);
      const actualCategory = catInfo?.questionsKey || category;

      const response = await fetch('/api/test/generate-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: actualCategory,
          targetPartner: partner,
          partnerAName: coupleData.partnerA.name,
          partnerBName: coupleData.partnerB.name,
          partnerARole: coupleData.partnerA.role,
          partnerBRole: coupleData.partnerB.role,
          partnerAResponses: formatResponses(coupleData.partnerA),
          partnerBResponses: formatResponses(coupleData.partnerB),
          aiModel: model,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate advice');
      }

      const data = await response.json();
      setAdvice(prev => ({ ...prev, [key]: data.advice }));
    } catch (err) {
      setError(prev => ({ ...prev, [key]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Generate advice for partner A when category or model changes
  useEffect(() => {
    generateAdvice(activeCategory, 'A', aiModel);
  }, [activeCategory, aiModel]);

  const renderResponses = (partnerData, partnerLabel) => {
    return (
      <div>
        <h3 style={{ marginBottom: '1.5rem' }}>
          {partnerData.name}'s Responses
          {partnerData.role && <span style={{ fontWeight: 'normal', opacity: 0.7 }}> ({partnerData.role} partner)</span>}
        </h3>

        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Scale Questions</h4>
          {partnerData.scale.map((response) => {
            const question = questions.scale.find(q => q.id === response.id);
            return (
              <div key={response.id} style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: 'var(--background)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {question?.question}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{question?.lowLabel}</span>
                  <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    flex: 1,
                    justifyContent: 'center'
                  }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: parseInt(response.answer) === n ? 'var(--primary)' : 'var(--border)',
                        color: parseInt(response.answer) === n ? 'white' : 'var(--text-secondary)',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}>
                        {n}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{question?.highLabel}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Open-Ended Questions</h4>
          {partnerData.text.map((response) => {
            const question = questions.text.find(q => q.id === response.id);
            return (
              <div key={response.id} style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'var(--background)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {question?.question}
                </div>
                <div style={{
                  fontStyle: 'italic',
                  color: 'var(--text-primary)',
                  lineHeight: '1.6'
                }}>
                  "{response.answer}"
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const adviceKeyA = `${activeCategory}_A_${aiModel}`;
  const adviceKeyB = `${activeCategory}_B_${aiModel}`;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Tester</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Preview AI responses for sample couples in each category
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI Model:</label>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '2px solid var(--border)',
              background: 'var(--surface)',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            <option value="openai">GPT-4o (OpenAI)</option>
            <option value="gemini">Gemini Pro (Google)</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {testerCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setActiveTab('advice');
            }}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeCategory === cat.id ? 'var(--primary)' : 'var(--surface)',
              color: activeCategory === cat.id ? 'white' : 'var(--text-primary)',
              fontWeight: activeCategory === cat.id ? '600' : '400',
              boxShadow: activeCategory === cat.id ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              fontSize: '0.9rem'
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Couple Info */}
      <div style={{
        background: 'var(--surface)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ marginBottom: '0.5rem' }}>{categoryInfo?.icon} {categoryInfo?.name}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          <strong>{couple.partnerA.name}</strong>
          {couple.partnerA.role && ` (${couple.partnerA.role})`}
          {' & '}
          <strong>{couple.partnerB.name}</strong>
          {couple.partnerB.role && ` (${couple.partnerB.role})`}
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => {
            setActiveTab('advice');
            generateAdvice(activeCategory, 'A', aiModel);
          }}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'advice' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'advice' ? '600' : '400',
            borderBottom: activeTab === 'advice' ? '2px solid var(--primary)' : 'none',
            marginBottom: '-0.6rem'
          }}
        >
          AI Response for {couple.partnerA.name}
        </button>
        <button
          onClick={() => {
            setActiveTab('adviceB');
            generateAdvice(activeCategory, 'B', aiModel);
          }}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'adviceB' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'adviceB' ? '600' : '400',
            borderBottom: activeTab === 'adviceB' ? '2px solid var(--primary)' : 'none',
            marginBottom: '-0.6rem'
          }}
        >
          AI Response for {couple.partnerB.name}
        </button>
        <button
          onClick={() => setActiveTab('partnerA')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'partnerA' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'partnerA' ? '600' : '400',
            borderBottom: activeTab === 'partnerA' ? '2px solid var(--primary)' : 'none',
            marginBottom: '-0.6rem'
          }}
        >
          {couple.partnerA.name}'s Answers
        </button>
        <button
          onClick={() => setActiveTab('partnerB')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'partnerB' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'partnerB' ? '600' : '400',
            borderBottom: activeTab === 'partnerB' ? '2px solid var(--primary)' : 'none',
            marginBottom: '-0.6rem'
          }}
        >
          {couple.partnerB.name}'s Answers
        </button>
      </div>

      {/* Content */}
      <div style={{
        background: 'var(--surface)',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        minHeight: '400px'
      }}>
        {activeTab === 'advice' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>Advice for {couple.partnerA.name}</h3>
            {loading[adviceKeyA] && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <div className="waiting-spinner" style={{ marginBottom: '1rem' }}></div>
                Generating advice...
              </div>
            )}
            {error[adviceKeyA] && (
              <div className="error-message">{error[adviceKeyA]}</div>
            )}
            {advice[adviceKeyA] && (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                {advice[adviceKeyA]}
              </div>
            )}
            {!loading[adviceKeyA] && !error[adviceKeyA] && !advice[adviceKeyA] && (
              <button
                className="btn btn-primary"
                onClick={() => generateAdvice(activeCategory, 'A', aiModel)}
              >
                Generate Advice
              </button>
            )}
          </div>
        )}

        {activeTab === 'adviceB' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>Advice for {couple.partnerB.name}</h3>
            {loading[adviceKeyB] && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <div className="waiting-spinner" style={{ marginBottom: '1rem' }}></div>
                Generating advice...
              </div>
            )}
            {error[adviceKeyB] && (
              <div className="error-message">{error[adviceKeyB]}</div>
            )}
            {advice[adviceKeyB] && (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                {advice[adviceKeyB]}
              </div>
            )}
            {!loading[adviceKeyB] && !error[adviceKeyB] && !advice[adviceKeyB] && (
              <button
                className="btn btn-primary"
                onClick={() => generateAdvice(activeCategory, 'B', aiModel)}
              >
                Generate Advice
              </button>
            )}
          </div>
        )}

        {activeTab === 'partnerA' && renderResponses(couple.partnerA, 'A')}
        {activeTab === 'partnerB' && renderResponses(couple.partnerB, 'B')}
      </div>
    </div>
  );
}

export default Tester;
