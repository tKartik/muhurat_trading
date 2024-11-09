import React, { useEffect, useRef } from 'react';
import { select, geoPath, geoMercator, geoCentroid } from 'd3';
import boundaryData from './data/IndiaSeats.json'; // Boundary GeoJSON data
import tradeData from './data/data_with_post_office.json'; // Trade data with lat/long coordinates and timestamps

const ExactLocationMap = () => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    // Clear previous content
    select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const width = wrapperRef.current.clientWidth;
    const padding = 0.15;
    const timelineHeight = 100;
    const spacingFromMap = 60; // Spacing between map and timeline

    // Calculate the padded dimensions
    const paddedWidth = width * (1 - padding);
    const paddedHeight = window.innerHeight * 0.9 * (1 - padding);
    const paddingHeight = window.innerHeight * 0.9 * padding;

    const totalHeight = window.innerHeight * 0.9 + timelineHeight + spacingFromMap; // Total height including space for timeline

    // Calculate the centroid of the geographical features
    const centroid = geoCentroid(boundaryData);
    // console.log(centroid);

    // Create SVG
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", totalHeight)
      .style("background-color", "#181818");

    // Create map group with adjusted position
    const mapGroup = svg.append("g")
      .attr("transform", `translate(${(width - paddedWidth) / 2}, ${paddingHeight / 2})`); // Center the map group

    // Create projection
    const projection = geoMercator()
      .center(centroid)
      .fitSize([paddedWidth, paddedHeight], boundaryData);

    // Create path generator
    const pathGenerator = geoPath().projection(projection);

    mapGroup.selectAll("path")
      .data(boundaryData.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", "#262626") // Map fill color
      .attr("stroke", "#565656") // Boundary color
      .attr("stroke-width", 0.5)
      .attr("class", "district")
      .attr("id", d => d.properties.NAME_2)
      .attr("class", "district");  // Assign a unique ID based on district name

    // Set up time variables
    const startTime = Math.min(...tradeData.map(trade => new Date(trade.exchange_update_time).getTime()));
    const endTime = Math.max(...tradeData.map(trade => new Date(trade.exchange_update_time).getTime()));
    let currentTime = startTime;

    // Display current time
    const timeDisplay = svg.append("text")
      .attr("x", 20)
      .attr("y", 40)
      .attr("font-size", "24px")
      .attr("fill", "white");

    // Get the actual rendered width of the map
    const mapBBox = mapGroup.node().getBBox();
    const renderedWidth = mapBBox.width;

    // Calculate the center position
    const centerX = width / 2;
    const timelineX = centerX - (renderedWidth / 2);
    
    const timelineWidth = renderedWidth;
    
    const timelineGroup = svg.append("g")
      .attr("transform", `translate(${timelineX}, ${totalHeight-paddingHeight})`);

    // Add timeline background bar
    timelineGroup.append("rect")
      .attr("width", timelineWidth)
      .attr("height", 8)
      .attr("fill", "#2e2e2e")
      .attr("rx", 4);

    // Add progress bar and store reference
    const progressBar = timelineGroup.append("rect")
      .attr("width", 0)
      .attr("height", 8)
      .attr("fill", "#FFFFFF")
      .attr("rx", 4);

    // Add time labels with AM/PM format
    timelineGroup.append("text")
      .attr("x", 0)
      .attr("y", 20)  // Position below the timeline
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("text-anchor", "start")
      .text(new Date(startTime).toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true  // This ensures AM/PM format
      }));

    timelineGroup.append("text")
      .attr("x", timelineWidth)
      .attr("y", 20)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("text-anchor", "end")  // Align text to the right
      .text(new Date(endTime).toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true  // This ensures AM/PM format
      }));

    // Group trades by minute
    const tradesByMinute = {};
    tradeData.forEach(trade => {
      const tradeTime = new Date(trade.exchange_update_time);
      // Round to nearest minute
      tradeTime.setSeconds(0);
      const timeKey = tradeTime.getTime();
      tradesByMinute[timeKey] = (tradesByMinute[timeKey] || 0) + 1;
    });

    // Calculate max trades per minute for scaling
    const maxTradesPerMinute = Math.max(...Object.values(tradesByMinute));
    
    // Calculate number of minutes between start and end
    const totalMinutes = Math.ceil((endTime - startTime) / (60 * 1000));
    const barWidth = timelineWidth / totalMinutes;
    const maxBarHeight = timelineHeight - 24; // Leave space for time labels

    // Instead of rendering all bars at once, move the bar rendering to updateTrades function
    const updateTrades = () => {
      // Display current time
      const currentDate = new Date(currentTime);
      const timeString = currentDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        timeZone: 'UTC'
      });
      // timeDisplay.text(`Time: ${timeString}`);

      // Update progress bar
      const progress = (currentTime - startTime) / (endTime - startTime);
      progressBar.attr("width", timelineWidth * progress);

      // Calculate which minute we're currently in
      const currentMinute = Math.floor((currentTime - startTime) / (60 * 1000));
      
      // Render histogram bar for the current minute
      const minuteTime = new Date(startTime + currentMinute * 60 * 1000);
      minuteTime.setSeconds(0);
      const timeKey = minuteTime.getTime();
      const trades = tradesByMinute[timeKey] || 0;
      
      if (trades > 0) {  // Only render if there are trades
        const barHeight = (trades / maxTradesPerMinute) * maxBarHeight;
        
        timelineGroup.append("rect")
          .attr("x", currentMinute * barWidth)
          .attr("y", -barHeight)
          .attr("width", barWidth - 1)
          .attr("height", barHeight)
          .attr("fill", "#565656")
          .attr("opacity", 0)  // Start invisible
          .transition()
          .duration(500)  // Fade in over 500ms
          .attr("opacity", 0.5);
      }

      // Render circles for trades
      tradeData.forEach(trade => {
        const tradeTime = new Date(trade.exchange_update_time).getTime();
        if (tradeTime === currentTime) {
          renderCircle(trade);
        }
      });

      // Increment time
      currentTime += 1000;

      // Stop updating once we reach the end time
      if (currentTime > endTime) {
        clearInterval(timeInterval);
      }
    };

    const timeInterval = setInterval(updateTrades, 200); // Update every second

    const renderCircle = (trade) => {
      const { location, buy_sell } = trade;
      if (location && location.latitude && location.longitude) {
        const coordinates = projection([
          parseFloat(location.longitude),
          parseFloat(location.latitude),
        ]);

        // Create circles with specific colors based on buy_sell property
        const circleColor = buy_sell === 'B' ? '#FAB726' : '#FAB726';

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
          .duration(5000) // Fade out duration
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

export default ExactLocationMap;
