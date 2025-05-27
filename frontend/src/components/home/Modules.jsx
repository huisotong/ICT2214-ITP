import { useNavigate } from "react-router-dom";

export default function Modules({ modules }) {
  const navigate = useNavigate();

  return (
    <div className="w-11/12 flex flex-wrap gap-4 justify-start mt-8">
      {modules.map((module) => (
        <div
          key={module.id}
          className="bg-white shadow-lg rounded-lg p-4 w-64 flex flex-col items-start border-2 border-gray-300"
        >
          <h2 className="text-lg font-bold mb-2">{module.moduleName}</h2>
          <p className="mb-4">{module.moduleDesc}</p>
          <button
            className="mt-auto cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            onClick={() => navigate(`/chat/${module.id}`)}
          >
            Open Chatbot
          </button>
        </div>
      ))}
    </div>
  );
}
