import React from 'react';

interface AnimationTimelineProps {
  events?: Array<{
    timestamp: number;
    type: string;
    data: any;
  }>;
}

/**
 * Timeline visualization for animation events
 */
const AnimationTimeline: React.FC<AnimationTimelineProps> = ({ events = [] }) => {
  return (
    <div className="bg-gray-800 p-2 rounded">
      <h4 className="font-semibold text-blue-400 mb-2">Animation Timeline</h4>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {events.length > 0 ? (
          events.slice(-10).map((event, index) => (
            <div key={index} className="flex items-center text-xs">
              <span className="w-16 text-gray-400">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`ml-2 px-1 rounded ${
                event.type.includes('expression') ? 'bg-yellow-900' :
                event.type.includes('typing') ? 'bg-blue-900' :
                event.type.includes('response') ? 'bg-green-900' :
                'bg-gray-700'
              }`}>
                {event.type}
              </span>
              <span className="ml-2 text-gray-300 truncate flex-1">
                {JSON.stringify(event.data)}
              </span>
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic">No events recorded</div>
        )}
      </div>
    </div>
  );
};

export default AnimationTimeline;