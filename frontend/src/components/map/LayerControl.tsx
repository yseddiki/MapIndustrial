import React from 'react';
import { Layers, Eye, EyeOff, Loader } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { appConfig } from '../../config/app.config';

export const LayerControl: React.FC = () => {
  const { layers, toggleLayer, setLayerOpacity } = useAppStore();

  const handleOpacityChange = (layerId: string, opacity: number) => {
    setLayerOpacity(layerId, opacity / 100);
  };

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-64">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-gray-700" />
        <h3 className="font-semibold text-gray-800">Map Layers</h3>
      </div>
      
      <div className="space-y-4">
        {appConfig.layers.map((layerConfig) => {
          const layerState = layers[layerConfig.id];
          
          if (!layerState) return null;

          return (
            <div key={layerConfig.id} className="space-y-2">
              {/* Layer Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLayer(layerConfig.id)}
                    className={`p-1 rounded transition-colors ${
                      layerState.visible
                        ? 'text-blue-600 hover:bg-blue-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {layerState.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${
                      layerState.visible ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {layerConfig.title}
                    </h4>
                    <p className="text-xs text-gray-500 capitalize">
                      {layerConfig.type.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                </div>

                {layerState.loading && (
                  <Loader className="w-4 h-4 text-blue-500 animate-spin" />
                )}
              </div>

              {/* Opacity Slider */}
              {layerState.visible && layerConfig.type !== 'GraphicsLayer' && (
                <div className="ml-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-600">Opacity</label>
                    <span className="text-xs text-gray-500">
                      {Math.round(layerState.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={layerState.opacity * 100}
                    onChange={(e) => handleOpacityChange(layerConfig.id, Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Error Display */}
              {layerState.error && (
                <div className="ml-6 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {layerState.error}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Click anywhere on the map to search for nearby places
        </p>
      </div>
    </div>
  );
};