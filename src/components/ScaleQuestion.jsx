function ScaleQuestion({ question, value, onChange, questionNumber, totalQuestions }) {
  return (
    <div>
      <p className="question-number">
        Question {questionNumber} of {totalQuestions}
      </p>
      <h3>{question.question}</h3>
      <div className="scale-container">
        <div className="scale-labels">
          <span>{question.lowLabel}</span>
          <span>{question.highLabel}</span>
        </div>
        <div className="scale-buttons">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              className={`scale-btn ${value === num ? 'selected' : ''}`}
              onClick={() => onChange(num)}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScaleQuestion;
