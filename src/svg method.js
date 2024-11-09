import React, { useEffect, useRef } from 'react';
import { select, geoPath, geoMercator, geoCentroid } from 'd3';
import { feature } from 'topojson-client';
import boundaryData from './India ADM2 GeoBoundaries.json';
import tradeData from './data/grouped_trades_for_test.json';

const ExactLocationMapNew = () => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    // Convert TopoJSON to GeoJSON
    // We'll use the first available object if there is one
    const objectName = Object.keys(boundaryData.objects)[0];
    const geojson = feature(boundaryData, boundaryData.objects[objectName]);
    
    if (!geojson) {
      console.error('Failed to convert TopoJSON to GeoJSON');
      return;
    }

    const centroid = geoCentroid(geojson);

    // Clear previous content
    select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const width = wrapperRef.current.clientWidth;
    const padding = 0.15;
    const timelineHeight = 100;
    const spacingFromMap = 60;
    const maxBarHeight = 50;

    // Calculate the padded dimensions
    const paddedWidth = width * (1 - padding);
    const paddedHeight = window.innerHeight * 0.9 * (1 - padding);
    const paddingHeight = window.innerHeight * 0.9 * padding;

    const totalHeight = window.innerHeight * 0.9 + timelineHeight + spacingFromMap;

    // Create SVG first
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", totalHeight)
      .style("background-color", "#181818");

    // Create map group with adjusted position
    const mapGroup = svg.append("g")
      .attr("transform", `translate(${(width - paddedWidth) / 2}, ${paddingHeight / 2})`);

    // Set up time variables
    const timeKeys = Object.keys(tradeData).sort();
    const startTime = parseInt(timeKeys[0]);
    const endTime = parseInt(timeKeys[timeKeys.length - 1]);
    let currentTime = startTime;

    // Create projection and render map first
    const projection = geoMercator()
      .center(centroid)
      .fitSize([paddedWidth, paddedHeight], geojson);

    // Create path generator and render map paths
    const pathGenerator = geoPath().projection(projection);
    mapGroup.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", "#262626")
      .attr("stroke", "#565656")
      .attr("stroke-width", 0.5)
      .attr("class", "district");

    // Calculate timeline dimensions after map is rendered
    const mapBBox = mapGroup.node().getBBox();
    const timelineWidth = mapBBox.width;
    const timelineX = (width - timelineWidth) / 2;

    // Calculate total minutes and bar width
    const totalMinutes = Math.ceil((endTime - startTime) / 60000);
    const barWidth = timelineWidth / totalMinutes;

    // Create timeline group
    const timelineGroup = svg.append("g")
      .attr("transform", `translate(${timelineX}, ${totalHeight - timelineHeight})`);

    // Add timeline background bar
    timelineGroup.append("rect")
      .attr("width", timelineWidth)
      .attr("height", 8)
      .attr("fill", "#2e2e2e")
      .attr("rx", 4);

    // Add progress bar
    const progressBar = timelineGroup.append("rect")
      .attr("width", 0)
      .attr("height", 8)
      .attr("fill", "#FFFFFF")
      .attr("rx", 4);

    // Add time labels
    timelineGroup.append("text")
      .attr("x", 0)
      .attr("y", 20)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("text-anchor", "start")
      .text(new Date(startTime).toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));

    timelineGroup.append("text")
      .attr("x", timelineWidth)
      .attr("y", 20)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("text-anchor", "end")
      .text(new Date(endTime).toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));

    // Group trades by minute for histogram
    const tradesByMinute = {};
    timeKeys.forEach(timeKey => {
      const minute = Math.floor(parseInt(timeKey) / 60000) * 60000;
      tradesByMinute[minute] = (tradesByMinute[minute] || 0) + tradeData[timeKey].length;
    });

    // Calculate max trades per minute for scaling
    const maxTradesPerMinute = Math.max(...Object.values(tradesByMinute));

    const updateTrades = () => {
      // Display current time
      const currentDate = new Date(currentTime);
      const timeString = currentDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        timeZone: 'UTC'
      });

      // Update progress bar
      const progress = (currentTime - startTime) / (endTime - startTime);
      progressBar.attr("width", timelineWidth * progress);

      // Calculate which minute we're currently in
      const currentMinute = Math.floor(currentTime / 60000) * 60000;
      
      // Render histogram bar for the current minute
      const trades = tradesByMinute[currentMinute] || 0;
      
      if (trades > 0) {
        const barHeight = (trades / maxTradesPerMinute) * maxBarHeight;
        const minutePosition = ((currentMinute - startTime) / (endTime - startTime)) * timelineWidth;
        
        timelineGroup.append("rect")
          .attr("x", minutePosition)
          .attr("y", -barHeight)
          .attr("width", Math.max(1, barWidth - 1))  // Ensure minimum width of 1px
          .attr("height", barHeight)
          .attr("fill", "#565656")
          .attr("opacity", 0)
          .transition()
          .duration(500)
          .attr("opacity", 0.5);
      }

      // Render circles for all trades in the current second
      if (tradeData[currentTime]) {
        tradeData[currentTime].forEach(trade => {
          renderCircle(trade);
        });
      }

      // Increment time to next available timestamp
      const currentIndex = timeKeys.indexOf(currentTime.toString());
      if (currentIndex < timeKeys.length - 1) {
        currentTime = parseInt(timeKeys[currentIndex + 1]);
      } else {
        clearInterval(timeInterval);
      }
    };

    const timeInterval = setInterval(updateTrades, 200); // Update every 200

    const renderCircle = (trade) => {
      const { location, buy_sell } = trade;
      if (location && location.latitude && location.longitude) {
        const coordinates = projection([
          parseFloat(location.longitude),
          parseFloat(location.latitude),
        ]);

        // Create circles with specific colors based on buy_sell property
        const circleColor = buy_sell === 'B' ? '#FAB726' : '#B749CA';

        // Add a filter for the shadow if it doesn't exist
        if (!mapGroup.select("#circleShadow").node()) {
          const filter = mapGroup.append("defs")
            .append("filter")
            .attr("id", "circleShadow")
            .attr("filterUnits", "userSpaceOnUse");

          filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 12)  // blur value
            .attr("result", "blur");

          filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 0)
            .attr("dy", 0);

          filter.append("feFlood")
            .attr("flood-color", circleColor)
            .attr("flood-opacity", 1);

          filter.append("feComposite")
            .attr("in2", "blur")
            .attr("operator", "in");

          const feMerge = filter.append("feMerge");
          feMerge.append("feMergeNode");
          feMerge.append("feMergeNode").attr("in", "SourceGraphic");
        }

        const circle = mapGroup.append("circle")
          .attr("cx", coordinates[0])
          .attr("cy", coordinates[1])
          .attr("r", 4) // Circle radius
          .attr("fill", circleColor)
          .attr("opacity", 1)
          .attr("filter", "url(#circleShadow)")  // Apply the shadow filter
          .style("mix-blend-mode", "screen")
          .transition()
          .duration(1000) // Fade out duration
          .attr("r", 0) // Fade out to 0
          .remove(); // Remove after fade out
      }
    };

    return () => clearInterval(timeInterval); // Clean up the interval on unmount

  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div ref={wrapperRef} className="relative w-full">
        <svg
          ref={svgRef}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
    </div>
  );
};

export default ExactLocationMapNew;
