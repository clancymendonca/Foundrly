import React from "react";

const messages = [
  { name: "Koushik", message: "Niggga", time: "10mo", avatar: "/avatar.jpg" },
  { name: "Ajay", message: "Bvc", time: "1y" },
  { name: "Darshanpoojary", message: "Appanig helll", time: "1y" },
  { name: "Pinterest", message: "Need help with something? Che...", time: "4y", icon: true },
];

const suggested = [
  { name: "Liston", handle: "@listonpais" },
];

const MessagesSidebar = ({ selected, onSelect }) => {
  return (
    <aside className="w-full sm:w-[350px] h-full border-r bg-white flex flex-col">
      <div className="p-4 border-b font-bold text-lg">Messages</div>
      <button className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 transition text-left">+ New message</button>
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 transition rounded-lg ${selected === i ? "bg-blue-50" : ""}`}
              onClick={() => onSelect?.(i)}
            >
              {msg.icon ? (
                <div className="text-red-600 text-xl">📌</div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  {msg.avatar ? <img src={msg.avatar} className="w-full h-full object-cover" /> : <span className="font-bold text-gray-700">{msg.name[0]}</span>}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{msg.name}</div>
                <div className="text-xs text-gray-500 truncate">{msg.message}</div>
              </div>
              <div className="text-xs text-gray-400">{msg.time}</div>
            </div>
          ))}
        </div>
        <div className="px-4 pt-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggested</div>
        <div className="divide-y divide-gray-100">
          {suggested.map((sug, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">{sug.name[0]}</div>
              <div className="text-sm">
                <div>{sug.name}</div>
                <div className="text-xs text-gray-500">{sug.handle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default MessagesSidebar; 