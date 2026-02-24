function TextQuestion({ question, value, onChange, questionNumber, totalQuestions }) {
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
    </div>
  );
}

export default TextQuestion;
