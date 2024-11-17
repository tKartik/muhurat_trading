import React, { useEffect, useRef } from 'react';
import { select, geoPath, geoMercator, geoCentroid, pointer } from 'd3';
import { feature } from 'topojson-client';
import boundaryData from './data/India ADM1 GeoBoundaries.json';

import tradeData from './data/grouped_trades_final_3.json';
import * as d3 from 'd3';

const ExactLocationMap = () => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const [currentTimeState, setCurrentTimeState] = React.useState(null);
  const [currentPosition, setCurrentPosition] = React.useState(null);

  // First useEffect for initialization
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    // Get timeKeys once
    const timeKeys = Object.keys(tradeData).sort();
    const startTime = parseInt(timeKeys[0]);
    const endTime = parseInt(timeKeys[timeKeys.length - 1]);

    if (!currentPosition) {
      const width = wrapperRef.current.clientWidth;
      const padding = 0.15;
      const paddedWidth = width * (1 - padding);
      const timelineWidth = paddedWidth;
      
      // Get a random timestamp
      const randomIndex = Math.floor(Math.random() * timeKeys.length);
      const randomTime = timeKeys[randomIndex];
      
      // Calculate position based on random time
      const initialPosition = ((randomTime - startTime) / (endTime - startTime)) * timelineWidth;
      
      // Set initial states
      setCurrentPosition(initialPosition);
      setCurrentTimeState(randomTime);
    }
  }, []); // Run once on mount

  // Main useEffect for rendering
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    // Directly convert TopoJSON to GeoJSON
    const geojson = feature(
      boundaryData, 
      boundaryData.objects[Object.keys(boundaryData.objects)[0]]
    );
    
    if (!geojson) {
      console.error('Failed to convert TopoJSON to GeoJSON');
      return;
    }

    // Calculate the centroid using the converted GeoJSON
    const centroid = geoCentroid(geojson);

    // Clear previous content
    select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const width = wrapperRef.current.clientWidth;
    const padding = 0.15;
    const timelineHeight = 100;
    const spacingFromMap = 60;

    // Calculate the padded dimensions
    const paddedWidth = width * (1 - padding);
    let paddedHeight = window.innerHeight * 0.9 * (1 - padding);
    const paddingWidth = width * padding;
    let paddingHeight = window.innerHeight * 0.9 * padding;

    // If paddedHeight is smaller than paddedWidth, make them equal
    if (paddedWidth < paddedHeight) {
      paddedHeight = paddedWidth;
      paddingHeight = paddingWidth;
    }

    const totalHeight = paddedHeight + paddingHeight + timelineHeight + spacingFromMap;

    // Create SVG with adjusted height
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", totalHeight)
      .style("background-color", "#02020A");

    // Add shadow filter definition
    const defs = svg.append("defs");
    
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("width", "400%")
      .attr("height", "400%")
      .attr("x", "-100%")
      .attr("y", "-100%");
    
    filter.append("feGaussianBlur")
      .attr("class", "blur")
      .attr("stdDeviation", "6")
      .attr("result", "coloredBlur");
    
    filter.append("feFlood")
      .attr("flood-color", "#FAB726")
      .attr("flood-opacity", "0.5")
      .attr("result", "glowColor");
    
    filter.append("feComposite")
      .attr("in", "glowColor")
      .attr("in2", "coloredBlur")
      .attr("operator", "in")
      .attr("result", "softGlow_colored");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
      .attr("in", "softGlow_colored");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");

    // Create map group with adjusted position
    const mapGroup = svg.append("g")
      .attr("transform", `translate(${(width - paddedWidth) / 2}, ${paddingHeight / 2})`);

    // Create projection and path generator first
    const projection = geoMercator()
      .center(centroid)
      .fitSize([paddedWidth, paddedHeight], geojson);

    const pathGenerator = geoPath().projection(projection);

    // Create groups for paths and circles
    const pathsGroup = mapGroup.append("g")
      .attr("class", "paths-group");

    const circlesGroup = mapGroup.append("g")
      .attr("class", "circles-group");

    // Add tooltip div - make sure it's added to the wrapper
    const tooltip = select(wrapperRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "fixed")
      .style("visibility", "hidden")
      .style("background-color", "rgba(2, 2, 10, 0.95)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("z-index", "9999")
      .style("font-family", "Inter, sans-serif")
      .style("border", "1px solid #2D2D64")
      .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.3)")
      .style("transform", "translate(-50%, -100%)")
      .style("margin-top", "-10px");

    // Add hover interactions to districts
    pathsGroup.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", "#0A0930")
      .attr("stroke", "#2D2D64")
      .attr("stroke-width", 0.5)
      .attr("class", "district")
      .attr("id", d => d.properties.shapeName)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        console.log('Hovering over district:', d.properties.shapeName); // Debug log
        
        // Highlight the district
        select(this)
          .transition()
          .duration(200)
          .attr("fill", "#161552");

        if (currentTimeState && tradeData[currentTimeState]) {
          // Count trades for this district
          const districtTrades = tradeData[currentTimeState].filter(trade => 
            trade.location && trade.location.region === d.properties.shapeName
          );

          const buyTrades = districtTrades.filter(trade => trade.buy_sell === 'B').length;
          const sellTrades = districtTrades.filter(trade => trade.buy_sell === 'S').length;

          console.log('Trade counts:', { buyTrades, sellTrades }); // Debug log

          // Show tooltip regardless of trade count
          tooltip
            .style("visibility", "visible")
            .html(`
              <div style="font-weight: 500; margin-bottom: 4px;">${d.properties.shapeName}</div>
              <div style="display: flex; justify-content: space-between; gap: 16px;">
                <span style="color: #FAB726;">Buy: ${buyTrades}</span>
                <span style="color: #AB89FE;">Sell: ${sellTrades}</span>
              </div>
            `);

          // Position tooltip
          const tooltipX = event.clientX;
          const tooltipY = event.clientY;
          
          console.log('Tooltip position:', { tooltipX, tooltipY }); // Debug log

          tooltip
            .style("left", `${tooltipX}px`)
            .style("top", `${tooltipY}px`);
        }
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", `${event.clientX}px`)
          .style("top", `${event.clientY}px`);
      })
      .on("mouseout", function() {
        // Reset district color
        select(this)
          .transition()
          .duration(200)
          .attr("fill", "#0A0930");
        
        // Hide tooltip
        tooltip.style("visibility", "hidden");
      });

    // Make sure the wrapper has relative positioning
    select(wrapperRef.current)
      .style("position", "relative");

    // Now render the map paths
    pathsGroup.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", "#0A0930")
      .attr("stroke", "#2D2D64")
      .attr("stroke-width", 0.5)
      .attr("class", "district")
      .attr("id", d => d.properties.shapeName);

    // Set up time variables using the new data structure
    const timeKeys = Object.keys(tradeData).sort();
    const startTime = parseInt(timeKeys[0]);
    const endTime = parseInt(timeKeys[timeKeys.length - 1]);
    let currentTime = startTime;

    // Display current time
    const timeDisplay = svg.append("text")
      .attr("x", 20)
      .attr("y", 40)
      .attr("font-size", "24px")
      .attr("fill", "white")
      .attr("font-family", "Inter, sans-serif");

    // Get the actual rendered width of the map
    const mapBBox = mapGroup.node().getBBox();
    const renderedWidth = mapBBox.width;

    // Calculate the center position
    const centerX = width / 2;
    const timelineX = centerX - (renderedWidth / 2);
    
    const timelineWidth = renderedWidth;
    
    // Define renderCircle function
    const renderCircle = (trade) => {
      const { location, buy_sell } = trade;
      if (location && location.latitude && location.longitude) {
        const coordinates = projection([
          parseFloat(location.longitude),
          parseFloat(location.latitude),
        ]);

        if (coordinates) {
          // Set color based on buy/sell
          const circleColor = buy_sell === 'S' ? '#5D43E6' : '#FAB726';

          // Use constant radius of 6px
          const radius = 6;

          // Update the filter color for the glow based on trade type
          filter.select("feFlood")
            .attr("flood-color", circleColor);

          circlesGroup.append("circle")
            .attr("cx", coordinates[0])
            .attr("cy", coordinates[1])
            .attr("r", radius)
            .attr("fill", circleColor)
            .attr("opacity", 1)
            .attr("filter", "url(#glow)")
            .style("mix-blend-mode", "screen");
        }
      }
    };

    // Create timeline group
    const timelineGroup = svg.append("g")
      .attr("transform", `translate(${timelineX}, ${totalHeight-paddingHeight})`);

    // Add timeline background bar
    const timelineBar = timelineGroup.append("rect")
      .attr("width", timelineWidth)
      .attr("height", 8)
      .attr("fill", "#2e2e2e")
      .attr("rx", 4)
      .style("cursor", "pointer");

    // Add slider handle
    const handle = timelineGroup.append("circle")
      .attr("r", 8)
      .attr("fill", "#FFFFFF")
      .attr("cy", 4)
      .attr("cx", 0)
      .style("cursor", "pointer");

    // Add timestamp display group
    const timestampDisplay = timelineGroup.append("g")
      .attr("class", "timestamp-display")
      .attr("transform", "translate(0, -20)");

    // Add white background rectangle for timestamp
    const timeBackground = timestampDisplay.append("rect")
      .attr("fill", "white")
      .attr("opacity",0.1)
      .attr("rx", 8)
      .attr("ry", 8);

    // Add timestamp text
    const timeText = timestampDisplay.append("text")
      .attr("fill", "#ffffff")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-family", "Inter, sans-serif")
      .attr("dominant-baseline", "central")
      .attr("alignment-baseline", "central");

    // Add time labels with Inter font
    timelineGroup.append("text")
      .attr("x", 0)
      .attr("y", 30)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-family", "Inter, sans-serif")
      .attr("text-anchor", "start")
      .text(new Date(startTime).toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));

    timelineGroup.append("text")
      .attr("x", timelineWidth)
      .attr("y", 30)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-family", "Inter, sans-serif")
      .attr("text-anchor", "end")
      .text(new Date(endTime).toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));

    // Add this debounce function near the top of your component
    const debounce = (func, wait) => {
      let timeout;
      function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      }
      executedFunction.cancel = () => {
        clearTimeout(timeout);
      };
      return executedFunction;
    };

    // Split the position update into visual and data updates
    const updateHandlePosition = (position) => {
      handle.attr("cx", position);
    };

    // Define debouncedUpdate for timeline clicks
    const debouncedUpdate = debounce((position) => {
      // Calculate time based on position
      const clickPosition = position / timelineWidth;
      const clickedTime = startTime + (endTime - startTime) * clickPosition;
      
      // Find nearest timestamp
      const nearestTime = timeKeys.reduce((prev, curr) => {
        return Math.abs(curr - clickedTime) < Math.abs(prev - clickedTime) ? curr : prev;
      });

      // Update states
      setCurrentTimeState(nearestTime);
      setCurrentPosition(position);
      
      // Clear and render new circles
      circlesGroup.selectAll("circle").remove();
      if (tradeData[nearestTime]) {
        tradeData[nearestTime].forEach(trade => renderCircle(trade));
      }

      // Update timestamp display
      const timeString = new Date(parseInt(nearestTime)).toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      timeText.attr("x", position).text(timeString);

      // Update timestamp background
      const textBBox = timeText.node().getBBox();
      timeBackground
        .attr("x", position - (textBBox.width / 2) - 12)
        .attr("y", -textBBox.height - 8)
        .attr("width", textBBox.width + 24)
        .attr("height", textBBox.height + 16);

      timeText.attr("y", -(textBBox.height / 2));
    }, 150);

    // Split the visual updates into a separate function
    const updateVisuals = (position) => {
      // Update handle position
      updateHandlePosition(position);

      // Update timestamp display without data calculations
      const clickPosition = position / timelineWidth;
      const currentTime = startTime + (endTime - startTime) * clickPosition;
      const timeString = new Date(currentTime).toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // Update timestamp text and position
      timeText.attr("x", position).text(timeString);

      // Update timestamp background
      const textBBox = timeText.node().getBBox();
      timeBackground
        .attr("x", position - (textBBox.width / 2) - 12)
        .attr("y", -textBBox.height - 8)
        .attr("width", textBBox.width + 24)
        .attr("height", textBBox.height + 16);

      timeText.attr("y", -(textBBox.height / 2));
    };

    // Modify the drag behavior
    const drag = d3.drag()
      .on("start", function() {
        handle.attr("fill", "#cccccc");
      })
      .on("drag", function(event) {
        event.sourceEvent.stopPropagation();
        const position = Math.max(0, Math.min(event.x, timelineWidth));
        // Only update visuals during drag
        updateVisuals(position);
      })
      .on("end", function(event) {
        handle.attr("fill", "#FFFFFF");
        const position = Math.max(0, Math.min(event.x, timelineWidth));
        
        // Cancel any pending updates
        debouncedUpdate.cancel?.();
        
        // Calculate time based on position
        const clickPosition = position / timelineWidth;
        const clickedTime = startTime + (endTime - startTime) * clickPosition;
        
        // Find nearest timestamp
        const nearestTime = timeKeys.reduce((prev, curr) => {
          return Math.abs(curr - clickedTime) < Math.abs(prev - clickedTime) ? curr : prev;
        });

        // Batch state updates together
        React.startTransition(() => {
          setCurrentPosition(position);
          setCurrentTimeState(nearestTime);
        });
      });

    // Update the timeline click behavior
    timelineBar.on("click", function(event) {
      // Only update if clicking directly on the timeline bar
      if (event.target === this) {
        const [x] = pointer(event);
        const position = Math.max(0, Math.min(x, timelineWidth));
        updateHandlePosition(position);
        debouncedUpdate(position);
      }
    });

    // Update the handle behavior
    handle
      .call(drag)
      .style("cursor", "grab")
      .on("mouseover", null)  // Remove any mouseover events
      .on("mouseout", null);  // Remove any mouseout events

    // Disable pointer events on circles to prevent interference
    circlesGroup.style("pointer-events", "none");

    // Initial position update if we have one
    if (currentPosition !== null) {
      updateHandlePosition(currentPosition);
      debouncedUpdate(currentPosition);
    }

    // Add legend to mapGroup
    const legendGroup = mapGroup.append("g")
      .attr("transform", `translate(${paddedWidth - 150}, 0)`);

    // Add background for legend (with fixed smaller height)
    const legendBackground = legendGroup.append("rect")
      .attr("width", 150)
      .attr("height", 60) // Reduced height since we're removing trade amount section
      .attr("fill", "#0F0F15")
      .attr("rx", 20)
      .attr("opacity", 0.9);

    // Add your legend content
    const colorLegend = [
      { label: "Buy", color: "#FAB726" },
      { label: "Sell", color: "#5D43E6" }
    ];

    colorLegend.forEach((item, i) => {
      const g = legendGroup.append("g")
        .attr("transform", `translate( ${30 + i * 60},30)`);

      g.append("circle")
        .attr("r", 6)
        .attr("fill", item.color)
        .attr("filter", "url(#glow)");

      g.append("text")
        .attr("x", 15)
        .attr("y", 4)
        .attr("fill", "white")
        .attr("opacity", 0.8)
        .attr("font-size", "12px")
        .attr("font-family", "Inter, sans-serif")
        .text(item.label);
    });

    // Cleanup
    return () => {
      timelineBar.on("click", null);
      handle.on(".drag", null);
      handle.on("mouseover", null);
      handle.on("mouseout", null);
      tooltip.remove();
    };
  }, [currentTimeState, currentPosition]); // Dependencies

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div 
        ref={wrapperRef} 
        className="relative w-full"
        style={{ position: 'relative' }}
      >
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
