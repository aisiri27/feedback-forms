export default function QuestionCard({
  question,
  updateQuestion,
  dragListeners,
  isSelected,
  onSelect,
}) {

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 ${
        isSelected ? "border-purple-600" : "border-transparent"
      }`}
    >

      <div
        {...dragListeners}
        className="cursor-move text-gray-400 text-center mb-2"
      >
        ⠿
      </div>

      <div className="flex justify-between items-center mb-4">
        <input
          value={question.title}
          onChange={(e) =>
            updateQuestion(question.id, { title: e.target.value })
          }
          className="text-lg w-full outline-none"
        />
      </div>

      <div className="flex justify-end mt-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) =>
              updateQuestion(question.id, {
                required: e.target.checked,
              })
            }
          />
          Required
        </label>
      </div>

    </div>
  );
}
