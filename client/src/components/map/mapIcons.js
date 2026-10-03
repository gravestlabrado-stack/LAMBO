import L from 'leaflet';

/**
 * Custom Tactical Leaflet Pin Icons with health status colors & owner indicator
 */
export const createPinIcon = (color, isOwner = false) => {
  return L.divIcon({
    className: 'custom-tree-pin',
    html: `
      <div style="
        background-color: ${color};
        width: ${isOwner ? '30px' : '26px'};
        height: ${isOwner ? '30px' : '26px'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid ${isOwner ? '#FFFFFF' : '#F0F3E8'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.6)${isOwner ? ', 0 0 10px ' + color : ''};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <span style="
          transform: rotate(45deg);
          color: #1D230E;
          font-size: ${isOwner ? '16px' : '14px'};
          font-weight: bold;
          line-height: 1;
        ">🌱</span>
      </div>
    `,
    iconSize: isOwner ? [30, 30] : [26, 26],
    iconAnchor: isOwner ? [15, 30] : [13, 26],
    popupAnchor: [0, -28],
  });
};

/**
 * User GPS Beacon Pin Icon with pulsing radar animation
 */
export const createUserGpsIcon = () =>
  L.divIcon({
    className: 'user-gps-beacon',
    html: `
      <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #4285F4;
          opacity: 0.4;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4285F4;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 10px #4285F4;
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });

/**
 * Map health status to brand palette colors
 */
export const getHealthColor = (status) => {
  switch (status) {
    case 'Thriving':
    case 'Healthy':
      return '#A4B566';
    case 'Stable / Fair':
    case 'Monitoring':
      return '#D99B26';
    case 'Distressed / At Risk':
    case 'Needs Attention':
      return '#E57373';
    case 'Dead / Mortality':
      return '#757575';
    default:
      return '#A4B566';
  }
};
