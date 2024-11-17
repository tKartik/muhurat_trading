import { feature } from 'topojson-client';
import React, { useEffect, useRef } from 'react';
import { select, geoPath, geoMercator, geoCentroid } from 'd3';
import boundaryData from './data/India ADM1 GeoBoundaries.json';

const FlashingStatesMap = () => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    // Convert TopoJSON to GeoJSON
    const geojson = feature(
      boundaryData, 
      boundaryData.objects[Object.keys(boundaryData.objects)[0]]
    );

    console.log(geojson);
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
    const centroid = geoCentroid(geojson);
    // console.log(centroid);

    // Create SVG
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background-color", "#262626");

    // Create projection
    const projection = geoMercator()
      .center(centroid)
      .fitSize([paddedWidth, paddedHeight], geojson);

    // Create path generator
    const pathGenerator = geoPath().projection(projection);

    const mapGroup = svg.append("g")
      .attr("transform", `translate(${(width - paddedWidth) / 2}, ${(height - paddedHeight) / 2})`); // Center the map group


    // Draw the boundary and set unique IDs by replacing spaces with hyphens
    mapGroup.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", "#262626")
      .attr("stroke", "#262626")
      .attr("stroke-width", 0.5)
      .attr("id", d => d.properties.shapeName) 
      .attr("class", "state");

    // Display current time
    const timeDisplay = svg.append("text")
      .attr("x", 20)
      .attr("y", 20)
      .attr("font-size", "24px")
      .attr("fill", "white");

    const stateNames = geojson.features.map(feature => 
      feature.properties.shapeName
    );

    // Replace updateTrades function with random flashing
    const updateStates = () => {
      // Update time display
      const currentDate = new Date();
      const timeString = currentDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      timeDisplay.text(`Time: ${timeString}`);

      // Randomly select 1-3 states to flash
      const numberOfStates = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numberOfStates; i++) {
        const randomState = stateNames[Math.floor(Math.random() * stateNames.length)];
        const randomType = Math.random() > 0.5 ? 'B' : 'S';
        flashState({ 
          PostOffice: { State: randomState.replace(/-/g, ' ') },
          buy_sell: randomType
        });
      }
    };

    // Update interval to run faster (e.g., every 500ms)
    const timeInterval = setInterval(updateStates, 500);

    const flashState = (trade) => {
      const stateName = trade.PostOffice?.State;

      // Skip if stateName is undefined or empty
      if (!stateName) return;

      // Replace spaces with hyphens to match the ID format
      const formattedStateName = stateName.replace(/\s+/g, '-');
      const statePath = svg.select(`#${formattedStateName}`);

      if (statePath) {
        statePath
          .style("mix-blend-mode", "normal")
          .transition()
          .duration(500)
          .attr("fill", "#FFFFFF")  // Simple white color
          .on("end", () => {
            statePath.transition()
              .duration(500)
              .attr("fill", "#262626")
              .style("mix-blend-mode", "normal");
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
