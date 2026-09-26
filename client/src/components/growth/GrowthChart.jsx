import React, { useState, useMemo } from 'react';
import { formatDate } from '../../utils/formatters';

export default function GrowthChart({ logs = [], initialTree = null }) {
  const [timeframe, setTimeframe] = useState('All Time');
  const [activePoint, setActivePoint] = useState(null);

  // Compile chronological series including initial planting baseline if available
  const sortedLogs = useMemo(() => {
    let raw = [...logs];

    // Filter by timeframe
    const now = new Date();
    if (timeframe === '6 Months') {
      const cutoff = new Date(now.setMonth(now.getMonth() - 6));
      raw = raw.filter((l) => new Date(l.loggedAt) >= cutoff);
    } else if (timeframe === '1 Year') {
      const cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
      raw = raw.filter((l) => new Date(l.loggedAt) >= cutoff);
    }

    raw.sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));
    return raw;
  }, [logs, timeframe]);

  // Points for SVG calculation
  const chartData = useMemo(() => {
    if (sortedLogs.length === 0) return [];

    return sortedLogs.map((log) => ({
      id: log._id,
      date: new Date(log.loggedAt),
      formattedDate: formatDate(log.loggedAt),
      height: parseFloat(log.height) || 0,
      dbh: parseFloat(log.stemDiameter) || 0,
      stage: log.growthStage || 'Vegetative',
      health: log.healthStatus || 'Healthy',
      notes: log.notes || '',
    }));
  }, [sortedLogs]);

  // Compute SVG viewBox coordinates
  const svgDimensions = useMemo(() => {
    const width = 360;
    const height = 180;
    const paddingX = 35;
    const paddingY = 30;

    if (chartData.length === 0) {
      return { width, height, heightPoints: '', dbhPoints: '', nodes: [] };
    }

    const heights = chartData.map((d) => d.height);
    const dbhs = chartData.map((d) => d.dbh).filter((d) => d > 0);

    const minHeight = Math.min(...heights) * 0.9;
    const maxHeight = Math.max(...heights) * 1.1 || 10;

    const minDbh = dbhs.length > 0 ? Math.min(...dbhs) * 0.9 : 0;
    const maxDbh = dbhs.length > 0 ? Math.max(...dbhs) * 1.1 : 50;

    const stepX =
      chartData.length > 1
        ? (width - paddingX * 2) / (chartData.length - 1)
        : (width - paddingX * 2) / 2;

    const nodes = chartData.map((d, idx) => {
      const x = chartData.length > 1 ? paddingX + idx * stepX : width / 2;
      // Invert Y: 0 is top, height is bottom
      const yRatio = (d.height - minHeight) / (maxHeight - minHeight || 1);
      const y = height - paddingY - yRatio * (height - paddingY * 2);

      // DBH Y
      let dbhY = height - paddingY;
      if (maxDbh > minDbh && d.dbh > 0) {
        const dbhRatio = (d.dbh - minDbh) / (maxDbh - minDbh);
        dbhY = height - paddingY - dbhRatio * (height - paddingY * 2) * 0.6; // Scale down DBH line
      }

      return {
        ...d,
        x,
        y,
        dbhY,
      };
    });

    // Build SVG path strings
    let heightPath = '';
    let dbhPath = '';
    let areaPath = '';

    if (nodes.length === 1) {
      heightPath = `M ${nodes[0].x - 30},${nodes[0].y} L ${nodes[0].x + 30},${nodes[0].y}`;
      dbhPath = `M ${nodes[0].x - 30},${nodes[0].dbhY} L ${nodes[0].x + 30},${nodes[0].dbhY}`;
    } else {
      heightPath = `M ${nodes[0].x},${nodes[0].y}`;
      dbhPath = `M ${nodes[0].x},${nodes[0].dbhY}`;

      for (let i = 1; i < nodes.length; i++) {
        // Curve between points
        const prev = nodes[i - 1];
        const curr = nodes[i];
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (curr.x - prev.x) / 2;
        const cp2y = curr.y;
        heightPath += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;

        // DBH line
        const dbhCp1y = prev.dbhY;
        const dbhCp2y = curr.dbhY;
        dbhPath += ` C ${cp1x},${dbhCp1y} ${cp2x},${dbhCp2y} ${curr.x},${curr.dbhY}`;
      }

      const lastNode = nodes[nodes.length - 1];
      const firstNode = nodes[0];
      areaPath = `${heightPath} L ${lastNode.x},${height - 15} L ${firstNode.x},${height - 15} Z`;
    }

    return {
      width,
      height,
      heightPath,
      dbhPath,
      areaPath,
      nodes,
      minHeight,
      maxHeight,
    };
  }, [chartData]);

  const latestNode =
    svgDimensions.nodes.length > 0
      ? svgDimensions.nodes[svgDimensions.nodes.length - 1]
      : null;

  return (
    <div className="bg-[#262C14] p-5 rounded-2xl shadow-md border border-[#4F5A2D] space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#A4B566]">
              ssid_chart
            </span>
            <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Morphometric Progression Curves
            </h3>
          </div>
          <span className="font-body-sm text-body-sm text-[#CCD6B8]">
            Vertical height trajectory vs. stem DBH girth expansion
          </span>
        </div>

        {/* Timeframe Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {['6 Months', '1 Year', 'All Time'].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-full font-mono text-[11px] font-semibold transition-all active:scale-95 ${
                timeframe === tf
                  ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                  : 'bg-[#1D230E] text-[#CCD6B8] border border-[#4F5A2D] hover:bg-[#30371A]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-44 bg-[#1D230E] rounded-xl border border-[#3E4723] flex flex-col items-center justify-center p-6 text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-[#525E31]">query_stats</span>
          <p className="font-mono text-xs text-[#CCD6B8]">
            No growth observation logs available for this timeframe.
          </p>
          <span className="text-[11px] text-[#8B9B70]">
            Log field measurements to visualize phenological growth curves.
          </span>
        </div>
      ) : (
        <>
          {/* Tactical Olive Drab SVG Graph Canvas */}
          <div className="relative w-full h-52 bg-[#1D230E] rounded-xl p-2.5 flex flex-col justify-between overflow-hidden border border-[#3E4723]">
            {/* SVG Canvas for curves */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="curveAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A4B566" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#A4B566" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line stroke="#3A441F" strokeDasharray="3,3" strokeWidth="1" x1="20" x2="340" y1="35" y2="35" />
              <line stroke="#3A441F" strokeDasharray="3,3" strokeWidth="1" x1="20" x2="340" y1="85" y2="85" />
              <line stroke="#3A441F" strokeDasharray="3,3" strokeWidth="1" x1="20" x2="340" y1="135" y2="135" />

              {/* Area Gradient Fill */}
              {svgDimensions.areaPath && (
                <path d={svgDimensions.areaPath} fill="url(#curveAreaGrad)" />
              )}

              {/* DBH Secondary Dotted Curve */}
              {svgDimensions.dbhPath && (
                <path
                  d={svgDimensions.dbhPath}
                  fill="none"
                  stroke="#8B9B4C"
                  strokeDasharray="4,4"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              )}

              {/* Height Primary Solid Curve */}
              {svgDimensions.heightPath && (
                <path
                  d={svgDimensions.heightPath}
                  fill="none"
                  stroke="#A4B566"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              )}

              {/* Interactive Point Nodes */}
              {svgDimensions.nodes.map((node, i) => {
                const isLatest = i === svgDimensions.nodes.length - 1;
                const isSelected = activePoint?.id === node.id;

                return (
                  <g
                    key={node.id}
                    onClick={() => setActivePoint(node)}
                    className="cursor-pointer"
                  >
                    {isLatest && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="8"
                        fill="#A4B566"
                        opacity="0.3"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected || isLatest ? '5.5' : '4'}
                      fill="#1D230E"
                      stroke={isSelected ? '#F0F3E8' : '#A4B566'}
                      strokeWidth="2.5"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Floating Value Pin on latest or active point */}
            {latestNode && (
              <div className="relative z-10 self-end mr-3 mt-1 bg-[#8B9B4C] text-[#1F240F] px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1.5 pointer-events-none font-mono text-[11px] font-bold">
                <span>
                  {activePoint ? activePoint.height : latestNode.height} cm
                </span>
                <span className="uppercase text-[9px] opacity-80">
                  {activePoint ? 'Selected' : 'Latest'}
                </span>
              </div>
            )}

            {/* Bottom X-Axis Date Nodes */}
            <div className="relative z-10 w-full flex justify-between px-2 text-[#AAB596] font-mono text-[10px] mt-auto border-t border-[#3A441F]/60 pt-1">
              {svgDimensions.nodes.map((n, idx) => {
                if (
                  svgDimensions.nodes.length > 5 &&
                  idx !== 0 &&
                  idx !== Math.floor(svgDimensions.nodes.length / 2) &&
                  idx !== svgDimensions.nodes.length - 1
                ) {
                  return null;
                }
                return (
                  <span
                    key={n.id}
                    className={
                      idx === svgDimensions.nodes.length - 1
                        ? 'font-bold text-[#A4B566]'
                        : ''
                    }
                  >
                    {n.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Active Point Card Details if tapped */}
          {activePoint && (
            <div className="p-3 rounded-xl bg-[#1D230E] border border-[#525E31] flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#8B9B4C] text-[20px]">
                  info
                </span>
                <div>
                  <span className="font-mono text-xs font-bold text-[#F0F3E8]">
                    {activePoint.formattedDate} • {activePoint.stage}
                  </span>
                  <p className="text-[11px] text-[#CCD6B8]">
                    Height: <span className="text-[#A4B566] font-bold">{activePoint.height}cm</span>
                    {activePoint.dbh > 0 && ` • DBH: ${activePoint.dbh}mm`}
                    {activePoint.notes ? ` — "${activePoint.notes}"` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePoint(null)}
                className="text-[#AAB596] hover:text-[#F0F3E8] p-1"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-between text-xs font-mono pt-1 text-[#CCD6B8]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 rounded-full bg-[#A4B566]" />
                <span className="font-semibold text-[#F0F3E8]">Height (cm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 border-b-2 border-dashed border-[#8B9B4C]" />
                <span>DBH (mm)</span>
              </div>
            </div>
            <span className="text-[#8B9B70] text-[11px]">Field-Calibrated</span>
          </div>
        </>
      )}
    </div>
  );
}
