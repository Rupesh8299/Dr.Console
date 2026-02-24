import React from 'react';
import { Clock, Zap, Trash2 } from 'lucide-react';

const SessionSidebar = ({ sessions, currentSessionId, onSessionSelect, onNewChat, onDeleteSession }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" /> History
            </h3>
            <button
                onClick={onNewChat}
                className="w-full mb-4 py-2 px-4 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
                <Zap className="w-4 h-4" /> New Consultation
            </button>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {sessions.map(sess => (
                    <div
                        key={sess.id}
                        className={`group w-full flex items-center justify-between p-3 rounded-lg text-sm transition-colors cursor-pointer ${currentSessionId === sess.id ? 'bg-teal-50 text-teal-700 font-medium border border-teal-100' : 'hover:bg-gray-50 text-gray-600'}`}
                        onClick={() => onSessionSelect(sess.id)}
                    >
                        <div className="truncate flex-1">
                            <div className="truncate">{sess.title}</div>
                            <div className="text-xs text-gray-400 mt-1">{new Date(sess.created_at).toLocaleDateString()}</div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(sess.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Chat"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {sessions.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No recent consultations</p>
                )}
            </div>
        </div>
    );
};

export default SessionSidebar;
