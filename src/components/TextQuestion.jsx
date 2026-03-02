function TextQuestion({ question, value, onChange, questionNumber, totalQuestions }) {
  const charCount = (value || '').length;

  return (
    <div>
      <p className="question-number">
        Question {questionNumber} of {totalQuestions}
      </p>
      <h3>{question.question}</h3>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={5}
      />
      <p className="text-question-hint">
        {charCount < 50 ? (
          <>💡 <em>The more detail you share, the better your guidance will be.</em></>
        ) : charCount < 150 ? (
          <>✨ Good start! Feel free to add more detail.</>
        ) : (
          <>✓ Great depth — this helps us give you better insights.</>
        )}
      </p>
    </div>
  );
}

export default TextQuestion;
