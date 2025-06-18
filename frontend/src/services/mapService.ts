import { loadModules } from '@arcgis/core/core/loadModules';
import { LayerConfig, MapConfig } from '../types';

class MapService {
  private mapModules: any = {};
  private isLoaded = false;

  async loadArcGISModules() {
    if (this.isLoaded) return this.mapModules;

    try {
      const [
        Map,
        MapView,
        MapImageLayer,
        FeatureLayer,
        GraphicsLayer,
        Graphic,
        Point,
        SimpleMarkerSymbol,
        PopupTemplate
      ] = await loadModules([
        'esri/Map',
        'esri/views/MapView',
        'esri/layers/MapImageLayer',
        'esri/layers/FeatureLayer',
        'esri/layers/GraphicsLayer',
        'esri/Graphic',
        'esri/geometry/Point',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/PopupTemplate'
      ]);

      this.mapModules = {
        Map,
        MapView,
        MapImageLayer,
        FeatureLayer,
        GraphicsLayer,
        Graphic,
        Point,
        SimpleMarkerSymbol,
        PopupTemplate
      };

      this.isLoaded = true;
      return this.mapModules;
    } catch (error) {
      console.error('Failed to load ArcGIS modules:', error);
      throw new Error('Failed to initialize ArcGIS modules');
    }
  }

  async createMap(config: MapConfig, layers: LayerConfig[] = []): Promise<__esri.Map> {
    const modules = await this.loadArcGISModules();
    const { Map } = modules;

    const mapLayers = await Promise.all(
      layers.map(layerConfig => this.createLayer(layerConfig))
    );

    return new Map({
      basemap: config.basemap,
      layers: mapLayers.filter(layer => layer !== null)
    });
  }

  async createMapView(
    container: HTMLDivElement,
    map: __esri.Map,
    config: MapConfig
  ): Promise<__esri.MapView> {
    const modules = await this.loadArcGISModules();
    const { MapView } = modules;

    const view = new MapView({
      container,
      map,
      center: config.center,
      zoom: config.zoom
    });

    await view.when();
    return view;
  }

  async createLayer(config: LayerConfig): Promise<__esri.Layer | null> {
    const modules = await this.loadArcGISModules();

    try {
      switch (config.type) {
        case 'MapImageLayer': {
          const { MapImageLayer } = modules;
          return new MapImageLayer({
            id: config.id,
            title: config.title,
            url: config.url,
            visible: config.visible,
            opacity: config.opacity || 1.0
          });
        }

        case 'FeatureLayer': {
          const { FeatureLayer } = modules;
          return new FeatureLayer({
            id: config.id,
            title: config.title,
            url: config.url,
            visible: config.visible,
            opacity: config.opacity || 1.0,
            outFields: ['*']
          });
        }

        case 'GraphicsLayer': {
          const { GraphicsLayer } = modules;
          return new GraphicsLayer({
            id: config.id,
            title: config.title,
            visible: config.visible,
            opacity: config.opacity || 1.0
          });
        }

        default:
          console.warn(`Unknown layer type: ${config.type}`);
          return null;
      }
    } catch (error) {
      console.error(`Failed to create layer ${config.id}:`, error);
      return null;
    }
  }

  async addGraphicToLayer(
    map: __esri.Map,
    layerId: string,
    geometry: __esri.Geometry,
    attributes: any = {},
    symbol?: __esri.Symbol,
    popupTemplate?: __esri.PopupTemplate
  ): Promise<__esri.Graphic | null> {
    const modules = await this.loadArcGISModules();
    const { Graphic } = modules;

    const layer = map.findLayerById(layerId) as __esri.GraphicsLayer;
    if (!layer) {
      console.error(`Layer with id ${layerId} not found`);
      return null;
    }

    const graphic = new Graphic({
      geometry,
      attributes,
      symbol,
      popupTemplate
    });

    layer.add(graphic);
    return graphic;
  }

  async createPointGraphic(
    longitude: number,
    latitude: number,
    attributes: any = {},
    symbolOptions: any = {}
  ): Promise<{ geometry: __esri.Point; symbol: __esri.SimpleMarkerSymbol }> {
    const modules = await this.loadArcGISModules();
    const { Point, SimpleMarkerSymbol } = modules;

    const point = new Point({
      longitude,
      latitude
    });

    const symbol = new SimpleMarkerSymbol({
      color: symbolOptions.color || [226, 119, 40],
      outline: {
        color: symbolOptions.outlineColor || [255, 255, 255],
        width: symbolOptions.outlineWidth || 2
      },
      size: symbolOptions.size || '12px'
    });

    return { geometry: point, symbol };
  }

  async clearGraphicsLayer(map: __esri.Map, layerId: string): Promise<void> {
    const layer = map.findLayerById(layerId) as __esri.GraphicsLayer;
    if (layer) {
      layer.removeAll();
    }
  }

  async zoomToGeometry(view: __esri.MapView, geometry: __esri.Geometry, zoomLevel?: number): Promise<void> {
    try {
      await view.goTo({
        target: geometry,
        zoom: zoomLevel
      });
    } catch (error) {
      console.error('Failed to zoom to geometry:', error);
    }
  }

  async zoomToCoordinates(
    view: __esri.MapView,
    longitude: number,
    latitude: number,
    zoomLevel: number = 16
  ): Promise<void> {
    try {
      await view.goTo({
        center: [longitude, latitude],
        zoom: zoomLevel
      });
    } catch (error) {
      console.error('Failed to zoom to coordinates:', error);
    }
  }

  getLayerById(map: __esri.Map, layerId: string): __esri.Layer | null {
    return map.findLayerById(layerId);
  }

  toggleLayerVisibility(map: __esri.Map, layerId: string): boolean {
    const layer = this.getLayerById(map, layerId);
    if (layer) {
      layer.visible = !layer.visible;
      return layer.visible;
    }
    return false;
  }

  setLayerOpacity(map: __esri.Map, layerId: string, opacity: number): void {
    const layer = this.getLayerById(map, layerId);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
    }
  }
}

export const mapService = new MapService();