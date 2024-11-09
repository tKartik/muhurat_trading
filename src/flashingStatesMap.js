import React, { useEffect, useRef } from 'react';
import { select, geoPath, geoMercator, geoCentroid, color } from 'd3';
import boundaryData from './data/IndianStateBoundary.json';
import tradeData from './data/data_with_post_office.json';

const FlashingStatesMap = () => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    // Clear previous content
    select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const width = wrapperRef.current.clientWidth; // Full width of the wrapper
    const height = window.innerHeight * 0.8; // 80% of the viewport height
    const padding = 0.05; // 5% padding

    // Calculate the padded dimensions
    const paddedWidth = width * (1 - padding);
    const paddedHeight = height * (1 - padding);

    // Calculate the centroid of the geographical features
    const centroid = geoCentroid(boundaryData);
    // console.log(centroid);

    // Create SVG
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background-color", "#262626");

    // Create projection
    const projection = geoMercator()
      .center(centroid)
      .fitSize([paddedWidth, paddedHeight], boundaryData);

    // Create path generator
    const pathGenerator = geoPath().projection(projection);

    const mapGroup = svg.append("g")
      .attr("transform", `translate(${(width - paddedWidth) / 2}, ${(height - paddedHeight) / 2})`); // Center the map group


    // Draw the boundary and set unique IDs by replacing spaces with hyphens
    mapGroup.selectAll("path")
      .data(boundaryData.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", "#262626")
      .attr("stroke", "#262626")
      .attr("stroke-width", 0.5)
      .attr("id", d => d.properties.st_nm.replace(/\s+/g, '-')) // Replace spaces with hyphens
      .attr("class", "state");

    // Set up time variables
    const startTime = Math.min(...tradeData.map(trade => new Date(trade.exchange_update_time).getTime()));
    const endTime = Math.max(...tradeData.map(trade => new Date(trade.exchange_update_time).getTime()));
    let currentTime = startTime;

    // Display current time
    const timeDisplay = svg.append("text")
      .attr("x", 20)
      .attr("y", 20)
      .attr("font-size", "24px")
      .attr("fill", "white");

      const stateFlashCounts = {};

    // Update function to flash states for each second
    const updateTrades = () => {
      // Display current time
      const currentDate = new Date(currentTime);
      const timeString = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC'});
      timeDisplay.text(`Time: ${timeString}`);

      // Flash states for trades occurring at the current time
      tradeData.forEach(trade => {
        const tradeTime = new Date(trade.exchange_update_time).getTime();
        if (tradeTime === currentTime) {
          flashState(trade);
        }
      });

      // Increment time by 1 second
      currentTime += 1000;

      // Stop updating once we reach the end time
      if (currentTime > endTime) {
        clearInterval(timeInterval);
      }
    };

    const timeInterval = setInterval(updateTrades, 100); // Update every second

    const flashState = (trade) => {
      const stateName = trade.PostOffice?.State;

      // Skip if stateName is undefined or empty
      if (!stateName) return;

      // Replace spaces with hyphens to match the ID format
      const formattedStateName = stateName.replace(/\s+/g, '-');
      const statePath = svg.select(`#${formattedStateName}`);

      if (statePath) {
        const flashColor = trade.buy_sell === 'B' ? '#F4F67E' : '#FA7F26';

 // Increment overlap count for the state
 stateFlashCounts[formattedStateName] = (stateFlashCounts[formattedStateName] || 0) + 1;

console.log(stateFlashCounts[formattedStateName], formattedStateName);

 // Adjust color intensity based on overlap count
 const intensityFactor = Math.min(stateFlashCounts[formattedStateName], 5); // Cap intensity at 5 for visibility
 const adjustedColor = color(flashColor).darker(intensityFactor * 0.2).formatHex();


        statePath
          .style("mix-blend-mode", "normal") // Set blend mode to screen
          .transition()
          .duration(500)
          .attr("fill", adjustedColor)
          .on("end", () => {
            // Decrement overlap count after flash ends
            stateFlashCounts[formattedStateName] = Math.max(stateFlashCounts[formattedStateName] - 1, 0);
            statePath.transition().duration(500).attr("fill", "#262626").style("mix-blend-mode", "normal");
            console.log( formattedStateName,stateFlashCounts[formattedStateName]);
          });
      }
    };

    return () => clearInterval(timeInterval); // Clean up the interval on unmount

  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div ref={wrapperRef} className="relative w-full" >
        <svg
          ref={svgRef}
          className="absolute top-0 left-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
    </div>
  );
};

export default FlashingStatesMap;
