import React from 'react';
import { View } from 'react-native';

const MapView = (props) => React.createElement(View, props);
MapView.Marker = (props) => React.createElement(View, props);
MapView.Polyline = (props) => React.createElement(View, props);
MapView.Circle = (props) => React.createElement(View, props);
MapView.Polygon = (props) => React.createElement(View, props);

export const Marker = MapView.Marker;
export const Polyline = MapView.Polyline;
export const Circle = MapView.Circle;
export const Polygon = MapView.Polygon;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

export default MapView;
