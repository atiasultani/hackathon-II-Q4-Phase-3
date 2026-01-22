import React from 'react';

interface AnimationInspectorProps {
  inspectedElement?: any;
}

/**
 * Detailed inspection of animation properties
 */
const AnimationInspector: React.FC<AnimationInspectorProps> = ({ inspectedElement }) => {
  return (
    <div className="bg-gray-800 p-2 rounded">
      <h4 className="font-semibold text-purple-400 mb-2">Animation Inspector</h4>

      {inspectedElement ? (
        <div className="text-xs">
          <div className="mb-2">
            <span className="text-gray-400">Element:</span>
            <span className="ml-2">{inspectedElement.type || 'unknown'}</span>
          </div>

          <div className="mb-2">
            <span className="text-gray-400">Animation Props:</span>
            <pre className="mt-1 bg-gray-700 p-1 rounded overflow-x-auto">
              {JSON.stringify(inspectedElement.props, null, 2)}
            </pre>
          </div>

          <div className="mb-2">
            <span className="text-gray-400">CSS Properties:</span>
            <div className="mt-1 bg-gray-700 p-1 rounded text-xs">
              {Object.entries(inspectedElement.style || {}).map(([key, value]) => (
                <div key={key} className="truncate">
                  <span className="text-gray-400">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 italic">Click on an element to inspect</div>
      )}
    </div>
  );
};

export default AnimationInspector;